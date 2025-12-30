// 6. 调度引擎 scripts / core / pipeline.ts
// 负责读取 Schema，解析 JSDoc 开关，并运行任务。

import * as fs from "node:fs";
import * as path from "node:path";
import { Project } from "ts-morph";
import { generateIndexFile } from "../tasks/index.task";
import { generateRouterFile } from "../tasks/router.task";
import { getLeadingJSDocText } from "./ast-utils";
import type { GenConfig, GenContext, Task } from "./types";

export class Pipeline {
  private readonly project: Project;
  private readonly tasks: Task[];

  constructor(tasks: Task[]) {
    this.tasks = tasks;
    this.project = new Project({
      tsConfigFilePath: path.resolve(process.cwd(), "tsconfig.json"),
      skipAddingFilesFromTsConfig: true,
    });
  }

  // 解析 @skipGen, @onlyGen
  private parseConfig(jsDocs: string[]): GenConfig {
    const docText = jsDocs.join("\n");
    if (docText.includes("@skipGen")) {
      return { skip: true, stages: new Set() };
    }

    const stages = new Set<"contract" | "service" | "controller">([
      "contract",
      "service",
      "controller",
    ]);

    if (docText.includes("@onlyGen contract")) {
      stages.delete("service");
      stages.delete("controller");
    }

    return { skip: false, stages };
  }

  async run(
    schemaPath: string,
    dirs: {
      contractDir: string;
      serviceDir: string;
      controllerDir: string;
      routerFile: string;
    }
  ) {
    // 读取 Schema 文件
    const schemaFile = this.project.addSourceFileAtPath(schemaPath);
    const exportedVars = schemaFile
      .getVariableDeclarations()
      .filter((v) => v.isExported());

    // 确保目标目录存在
    [dirs.contractDir, dirs.serviceDir, dirs.controllerDir].forEach((d) => {
      if (!fs.existsSync(d)) fs.mkdirSync(d, { recursive: true });
    });
    // 确保 router 文件的目录存在
    const routerDir = path.dirname(dirs.routerFile);
    if (!fs.existsSync(routerDir)) {
      fs.mkdirSync(routerDir, { recursive: true });
    }

    for (const v of exportedVars) {
      const varName = v.getName();
      if (!varName.endsWith("Table")) continue;

      // 使用工具函数获取JSDoc注释
      const jsDocText = getLeadingJSDocText(v);

      const jsDocs = jsDocText ? [jsDocText] : [];
      const config = this.parseConfig(jsDocs);

      if (config.skip) {
        console.log(`🚫 Skipping ${varName}`);
        continue;
      }

      const rawName = varName.replace("Table", ""); // "users"
      const tableName = rawName.toLowerCase();
      const pascalName = rawName.charAt(0).toUpperCase() + rawName.slice(1);

      // 🔥 核心修改：文件名平铺，不再拼接 /tableName/ 文件夹
      const ctx: GenContext = {
        tableName,
        pascalName,
        schemaKey: varName,
        config,
        paths: {
          root: dirs.contractDir, // 默认以契约目录为基准
          contract: path.join(dirs.contractDir, `${tableName}.contract.ts`),
          service: path.join(dirs.serviceDir, `${tableName}.service.ts`),
          controller: path.join(
            dirs.controllerDir,
            `${tableName}.controller.ts`
          ),
          index: path.join(dirs.contractDir, "index.ts"),
        },
        artifacts: {},
      };
      console.log(`\n📦 Processing [${pascalName}]`);

      for (const task of this.tasks) {
        await task.run(this.project, ctx);
      }
    }

    // 🔥 生成统一的 index.ts 导出文件
    generateIndexFile(this.project, path.join(dirs.contractDir, "index.ts"));

    // 🔥 生成统一的 app-router.ts 导出文件
    generateRouterFile(this.project, dirs.routerFile);

    await this.project.save();
    console.log("\n✅ Pipeline Finished!");
  }
}
