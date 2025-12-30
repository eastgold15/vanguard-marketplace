import * as path from "node:path";
import { type Project, VariableDeclarationKind } from "ts-morph";
import { ensureImport, normalizePath } from "../core/ast-utils";
import type { GenContext, Task } from "../core/types";

const GEN_HEADER = `/**
 * 🤖 【B2B Controller - 自动生成基类】
 * --------------------------------------------------------
 * ⚠️ 请勿手动修改此文件，下次运行会被覆盖。
 * 💡 如需自定义，请删除下方的 @generated 标记，或新建一个 controller。
 * --------------------------------------------------------
 */`;

const GEN_TAG = "@generated";

/**
 * 将表名转换为权限前缀
 * templateTable -> TEMPLATE
 * productMediaTable -> PRODUCTMEDIA
 */
function toPermissionPrefix(tableName: string): string {
  let tableNameUpper = tableName.toUpperCase();
  if (tableNameUpper.includes("TABLE")) {
    tableNameUpper = tableName.replace("TABLE", "");
  }
  return tableNameUpper;
}

/**
 * 生成权限名称
 */
function getPermission(tableName: string, action: string): string {
  const prefix = toPermissionPrefix(tableName);
  return `${prefix}:${action.toUpperCase()}`;
}

export const ControllerTask: Task = {
  name: "Generating Controller",
  run(project: Project, ctx: GenContext) {
    if (!ctx.config.stages.has("controller")) return;

    if (!(ctx.artifacts.serviceName && ctx.artifacts.contractName)) {
      return;
    }

    // 🔥 先从 project 中移除旧文件（如果存在），确保重新加载最新内容
    const existingFile = project.getSourceFile(ctx.paths.controller);
    if (existingFile) {
      existingFile.forget();
    }

    // 重新加载文件（从磁盘读取最新内容）
    let file;
    try {
      file = project.addSourceFileAtPath(ctx.paths.controller);
    } catch {
      // 文件不存在，创建新文件（不覆盖）
      file = project.createSourceFile(ctx.paths.controller, "", {
        overwrite: false,
      });
    }

    // 1. Header 注入
    if (file.getText().trim().length === 0) {
      file.insertText(0, `${GEN_HEADER}\n\n`);
    }

    // 2. 路径计算 (修复 Windows 反斜杠)
    const dir = path.dirname(ctx.paths.controller);
    const getRelativeImport = (targetPath: string) => {
      let rel = path.relative(dir, targetPath).replace(/\.ts$/, "");
      if (!rel.startsWith(".")) rel = `./${rel}`;
      return normalizePath(rel);
    };

    const contractPath = getRelativeImport(ctx.paths.contract);
    const servicePath = getRelativeImport(ctx.paths.service);

    // 3. Imports
    ensureImport(file, "elysia", ["Elysia", "t"]);
    ensureImport(file, "~/db/connection", ["dbPlugin"]);
    ensureImport(file, "~/middleware/auth", ["authGuardMid"]);
    ensureImport(file, contractPath, [ctx.artifacts.contractName]);
    ensureImport(file, servicePath, [ctx.artifacts.serviceName]);

    // 4. 实例化 Service
    const serviceInstanceName = `${ctx.tableName}Service`;
    const serviceClassName = ctx.artifacts.serviceName;

    const serviceVar = file.getVariableDeclaration(serviceInstanceName);
    if (!serviceVar) {
      file.addVariableStatement({
        declarationKind: VariableDeclarationKind.Const,
        declarations: [
          {
            name: serviceInstanceName,
            initializer: `new ${serviceClassName}()`,
          },
        ],
      });
    }

    // 5. 权限配置
    const readPermission = getPermission(ctx.tableName, "read");
    const createPermission = getPermission(ctx.tableName, "create");
    const updatePermission = getPermission(ctx.tableName, "update");
    const deletePermission = getPermission(ctx.tableName, "delete");

    // 6. Controller 定义 - 带权限和 OpenAPI 文档
    const controllerName = `${ctx.tableName}Controller`;
    const contract = ctx.artifacts.contractName;
    const pascalName = ctx.pascalName;
    const prefix = `/${ctx.tableName.toLowerCase()}`;

    // 构造带权限和文档的代码
    const controllerCode = `new Elysia({ prefix: "${prefix}" })
  .use(dbPlugin)
  .use(authGuardMid)
  .get("/", ({ query, user, db }) => ${serviceInstanceName}.findAll(query, { db, user }), {
    allPermissions: ["${readPermission}"],
    query: ${contract}.ListQuery,
    detail: {
      summary: "获取${pascalName}列表",
      description: "分页查询${pascalName}数据，支持搜索和排序",
      tags: ["${pascalName}"],
    },
  })
  .post("/", ({ body, user, db }) => ${serviceInstanceName}.create(body, { db, user }), {
    allPermissions: ["${createPermission}"],
    body: ${contract}.Create,
    detail: {
      summary: "创建${pascalName}",
      description: "新增一条${pascalName}记录",
      tags: ["${pascalName}"],
    },
  })
  .put("/:id", ({ params, user, db }) => ${serviceInstanceName}.update(params.id, { db, user }), {
    params: t.Object({ id: t.String() }),
    body: ${contract}.Update,
    allPermissions: ["${updatePermission}"],
    detail: {
      summary: "更新${pascalName}",
      description: "根据ID更新${pascalName}信息",
      tags: ["${pascalName}"],
    },
  })
  .delete("/:id", ({ params, user, db }) => ${serviceInstanceName}.delete(params.id, { db, user }), {
    params: t.Object({ id: t.String() }),
    allPermissions: ["${deletePermission}"],
    detail: {
      summary: "删除${pascalName}",
      description: "根据ID删除${pascalName}记录",
      tags: ["${pascalName}"],
    },
  })`;

    const controllerVar = file.getVariableDeclaration(controllerName);

    if (controllerVar) {
      // 存在：检查是否自动生成
      const stmt = controllerVar.getVariableStatement();
      const docs = stmt?.getJsDocs() || [];
      // 使用 some 检查，兼容性更好
      const isGenerated = docs.some((d) => d.getInnerText().includes(GEN_TAG));

      if (isGenerated) {
        // 去空格对比，避免格式化导致的无限更新
        const oldCode = controllerVar
          .getInitializer()
          ?.getText()
          .replace(/\s/g, "");
        const newCode = controllerCode.replace(/\s/g, "");

        if (oldCode !== newCode) {
          controllerVar.setInitializer(controllerCode);
          console.log(`     🔄 Updated: ${controllerName}`);
        }
      } else {
        console.log(`     🛡️ Skipped (Custom): ${controllerName}`);
      }
    } else {
      // 不存在：新建
      const stmt = file.addVariableStatement({
        declarationKind: VariableDeclarationKind.Const,
        isExported: true,
        declarations: [
          {
            name: controllerName,
            initializer: controllerCode,
          },
        ],
      });
      // 🔥 关键：在 Statement 层面添加 JSDoc，而不是 Declaration
      stmt.addJsDoc({ description: `\n${GEN_TAG}` });
      console.log(`     ➕ Controller: ${controllerName}`);
    }
  },
};
