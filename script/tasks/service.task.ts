import * as path from "node:path";
import type { Project } from "ts-morph";
import { ensureImport, normalizePath, upsertMethod } from "../core/ast-utils";
import type { GenContext, Task } from "../core/types";

export const ServiceTask: Task = {
  name: "Generating Service",
  run(project: Project, ctx: GenContext) {
    if (!ctx.config.stages.has("service")) return;
    if (!ctx.artifacts.contractName) return;

    // 🔥 先从 project 中移除旧文件（如果存在），确保重新加载最新内容
    const existingFile = project.getSourceFile(ctx.paths.service);
    if (existingFile) {
      existingFile.forget();
    }

    // 重新加载文件（从磁盘读取最新内容）
    let file;
    try {
      file = project.addSourceFileAtPath(ctx.paths.service);
    } catch {
      // 文件不存在，创建新文件（不覆盖）
      file = project.createSourceFile(ctx.paths.service, "", {
        overwrite: false,
      });
    }

    // 1. 计算相对路径引用 Contract，使用 normalizePath 修复 Windows 路径
    let relativePath = path.relative(
      path.dirname(ctx.paths.service),
      ctx.paths.contract
    );
    // 去掉 .ts 后缀
    relativePath = relativePath.replace(/\.ts$/, "");
    // 如果在同级目录，path.relative 返回的是文件名，需要加 ./
    if (!relativePath.startsWith(".")) {
      relativePath = `./${relativePath}`;
    }
    // 🔥 修复 Windows 路径
    const contractImportPath = normalizePath(relativePath);

    // 2. Imports - 聚合相同路径的导入
    ensureImport(file, "drizzle-orm", ["eq", "and", "desc"]);
    // 🔥 @repo/contract 路径的导入聚合（table.schema 是普通导入，Contract 是 type 导入）
    ensureImport(file, "@repo/contract", [ctx.schemaKey]);
    ensureImport(file, "@repo/contract", [ctx.artifacts.contractName], true);
    ensureImport(file, "../lib/type", ["ServiceContext"], true);

    // 2. Class 定义
    const className = `${ctx.pascalName}Service`;
    let classDec = file.getClass(className);
    if (!classDec) {
      classDec = file.addClass({ name: className, isExported: true });
    }

    const contract = ctx.artifacts.contractName;

    // 3. 生成方法
    upsertMethod(
      classDec,
      "create",
      `const insertData = {
        ...body,
        // 自动注入租户信息
        ...(ctx.user ? { tenantId: ctx.user.tenantId, createdBy: ctx.user.id } : {})
      };
      const [res] = await ctx.db.insert(${ctx.schemaKey}).values(insertData).returning();
      return res;`,
      [
        { name: "body", type: `${contract}["Create"]` },
        { name: "ctx", type: "ServiceContext" },
      ]
    );

    upsertMethod(
      classDec,
      "findAll",
      `const { limit = 10, page = 0, sort, ...filters } = query;
      const whereConditions = [];
      // 租户隔离
      if (ctx.user?.tenantId) whereConditions.push(eq(${ctx.schemaKey}.tenantId, ctx.user.tenantId));

      const data = await ctx.db.select().from(${ctx.schemaKey})
        .where(and(...whereConditions))
        .limit(limit).offset((page - 1) * limit);
      const total = await ctx.db.$count(${ctx.schemaKey}, and(...whereConditions));
      return { data, total };`,
      [
        { name: "query", type: `${contract}["ListQuery"]` },
        { name: "ctx", type: "ServiceContext" },
      ]
    );

    upsertMethod(
      classDec,
      "update",
      `const updateData = { ...body, updatedAt: new Date() };
       const [res] = await ctx.db.update(${ctx.schemaKey})
         .set(updateData)
         .where(eq(${ctx.schemaKey}.id, id))
         .returning();
       return res;`,
      [
        { name: "id", type: "string" },
        { name: "body", type: `${contract}["Update"]` },
        { name: "ctx", type: "ServiceContext" },
      ]
    );

    upsertMethod(
      classDec,
      "delete",
      `const [res] = await ctx.db.delete(${ctx.schemaKey}).where(eq(${ctx.schemaKey}.id, id)).returning();
       return res;`,
      [
        { name: "id", type: "string" },
        { name: "ctx", type: "ServiceContext" },
      ]
    );

    // 4. 更新上下文
    ctx.artifacts.serviceName = `${ctx.pascalName}Service`;
    console.log(`     ✅ Service: ${ctx.paths.service}`);
  },
};
