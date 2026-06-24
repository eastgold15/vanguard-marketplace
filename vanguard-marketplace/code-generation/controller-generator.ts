/**
 * Controller 层代码生成器
 * 使用 ts-morph 的纯函数实现
 * 
 * 职责：根据Contract和Service生成Elysia HTTP控制器
 * 
 * 生成的结构：
 * export const usersController = new Elysia({ prefix: "/users" })
 *   .get("/", handler, { query: UsersContract.ListQuery })
 *   .post("/", handler, { body: UsersContract.Create })
 *   .put("/:id", handler, { body: UsersContract.Update })
 *   .delete("/:id", handler)
 *   // ... 其他路由
 */

import * as path from "node:path";
import { Project, SourceFile } from "ts-morph";
import { ensureImport, upsertExportedConst, normalizePath } from "./ast-utils";
import type { GenContext } from "./types";

/**
 * 生成Controller文件的纯函数
 * 
 * 流程：
 * 1. 读取/创建 .controller.ts 文件
 * 2. 添加导入（Elysia、Service、Contract等）
 * 3. 生成Service实例
 * 4. 生成Elysia控制器
 * 5. 添加路由处理器
 * 
 * @param project - ts-morph Project
 * @param ctx - 生成上下文
 * @returns 生成的文件对象
 */
export function generateControllerFile(
  project: Project,
  ctx: GenContext
): SourceFile {
  // 🔥 Step 1: 读取或创建文件
  let file: SourceFile;
  try {
    const existing = project.getSourceFile(ctx.paths.controller);
    if (existing) {
      existing.forget();
    }
    file = project.addSourceFileAtPath(ctx.paths.controller);
  } catch {
    file = project.createSourceFile(ctx.paths.controller, "", {
      overwrite: false,
    });
  }

  // 🔥 Step 2: 添加导入
  const serviceRelativePath = normalizePath(
    path.relative(
      path.dirname(ctx.paths.controller),
      path.dirname(ctx.paths.service)
    )
  );

  const contractRelativePath = normalizePath(
    path.relative(
      path.dirname(ctx.paths.controller),
      path.dirname(ctx.paths.contract)
    )
  );

  ensureImport(file, "elysia", ["Elysia"]);
  ensureImport(file, "@/middleware", ["authGuard", "dbPlugin"]);
  ensureImport(
    file,
    `${serviceRelativePath}/index`,
    [`${ctx.pascalName}Service`]
  );
  ensureImport(
    file,
    `${contractRelativePath}/index`,
    [`${ctx.pascalName}Contract`],
    true
  );

  // 🔥 Step 3: 生成Controller代码
  const controllerCode = generateControllerCode(ctx);
  upsertExportedConst(file, `${ctx.pascalName.toLowerCase()}Controller`, controllerCode);

  return file;
}

/**
 * 生成完整的Elysia控制器代码
 * 这是AI需要理解和交互的核心结构
 */
function generateControllerCode(ctx: GenContext): string {
  const { pascalName } = ctx;
  const serviceName = `${pascalName}Service`;
  const contractName = `${pascalName}Contract`;
  const controllerVar = `${pascalName.toLowerCase()}Service`;

  return `new Elysia({ prefix: "/${pascalName.toLowerCase()}" })
  .use(dbPlugin)
  .use(authGuard)
  .decorate("service", new ${serviceName}())

  // GET /:id - 获取单个
  .get("/:id", ({ params, service, db, user }) => 
    service.findById(params.id, { db, user }), 
    {
      params: t.Object({ id: t.String() }),
      detail: {
        summary: "获取${pascalName}详情",
        tags: ["${pascalName}"],
        security: [{ bearerAuth: [] }],
      },
    }
  )

  // GET / - 列表查询
  .get("/", ({ query, service, db, user }) => 
    service.findAll(query, { db, user }), 
    {
      query: ${contractName}.ListQuery,
      detail: {
        summary: "获取${pascalName}列表",
        tags: ["${pascalName}"],
        security: [{ bearerAuth: [] }],
      },
    }
  )

  // POST / - 创建
  .post("/", ({ body, service, db, user }) => 
    service.create(body, { db, user }), 
    {
      body: ${contractName}.Create,
      detail: {
        summary: "创建${pascalName}",
        tags: ["${pascalName}"],
        security: [{ bearerAuth: [] }],
      },
    }
  )

  // PUT /:id - 更新
  .put("/:id", ({ params, body, service, db, user }) => 
    service.update(params.id, body, { db, user }), 
    {
      params: t.Object({ id: t.String() }),
      body: ${contractName}.Update,
      detail: {
        summary: "更新${pascalName}",
        tags: ["${pascalName}"],
        security: [{ bearerAuth: [] }],
      },
    }
  )

  // DELETE /:id - 删除
  .delete("/:id", ({ params, service, db, user }) => 
    service.delete(params.id, { db, user }), 
    {
      params: t.Object({ id: t.String() }),
      detail: {
        summary: "删除${pascalName}",
        tags: ["${pascalName}"],
        security: [{ bearerAuth: [] }],
      },
    }
  )`;
}

/**
 * 向Controller中添加自定义路由
 * 
 * 场景：某个API需要特定的路由处理
 * 
 * 使用方式：
 * addCustomRoute(controller, {
 *   method: "post",
 *   path: "/batch-create",
 *   handler: "service.batchCreate",
 *   contractKey: "BatchCreate"
 * });
 */
export function addCustomRoute(
  controllerCode: string,
  options: {
    method: "get" | "post" | "put" | "delete" | "patch";
    path: string;
    handler: string;
    contractKey?: string;
    params?: string;
    summary?: string;
  }
): string {
  const { method, path, handler, contractKey, summary } = options;

  let routeCode = `.${method}("${path}", ({ ${extractParamNames(path, handler)} }) => ${handler}`;

  // 添加OpenAPI文档
  if (contractKey || summary) {
    routeCode += `, {
    ${contractKey ? `body: Contract.${contractKey},` : ""}
    detail: {
      summary: "${summary || `${method.toUpperCase()} ${path}`}",
      tags: ["Custom"],
    },
  }`;
  }

  routeCode += ")";
  return routeCode;
}

/**
 * 合并多个Contract到一个API端点
 * 
 * 场景：某个API需要接收多个实体的组合数据
 * 例如：创建订单时，需要同时传入Order和OrderItem数据
 * 
 * 使用方式：
 * const combinedBody = combinedContractBody([
 *   { name: "order", contract: "OrderContract.Create" },
 *   { name: "items", contract: "t.Array(OrderItemContract.Create)" }
 * ]);
 * 
 * 生成：
 * body: t.Object({
 *   order: OrderContract.Create,
 *   items: t.Array(OrderItemContract.Create)
 * })
 */
export function combinedContractBody(
  fields: Array<{ name: string; contract: string }>
): string {
  const fieldDefs = fields.map((f) => `${f.name}: ${f.contract}`).join(",\n    ");

  return `t.Object({
    ${fieldDefs}
  })`;
}

/**
 * 为Controller生成权限检查代码
 * 
 * 场景：某些路由需要特定权限
 * 
 * 使用方式：
 * const guard = generatePermissionGuard("USERS", "CREATE");
 * // 返回中间件代码
 */
export function generatePermissionGuard(
  resource: string,
  action: string
): string {
  return `.guard(
    { allPermissions: ["${resource}:${action}"] },
    ({ set, error, user }) => {
      // 权限检查由authGuard中间件处理
      if (!user.permissions.includes("${resource}:${action}")) {
        set.status = 403;
        return error(403, "Forbidden");
      }
    }
  )`;
}

/**
 * 从路径提取参数名称
 * /users/:id/:type -> ['id', 'type']
 */
function extractParamNames(path: string, handler: string): string {
  const paramMatch = path.match(/:(\w+)/g) || [];
  const params = paramMatch
    .map((p) => p.substring(1))
    .concat(["service", "db", "user", "body", "query"]);

  return params.join(", ");
}

/**
 * 生成路由文档注释
 * 
 * 场景：为Controller路由添加JSDoc文档
 */
export function generateRouteDoc(options: {
  summary: string;
  description?: string;
  tags?: string[];
  params?: string[];
  example?: string;
}): string {
  let doc = `/**\n * ${options.summary}\n`;

  if (options.description) {
    doc += ` * ${options.description}\n`;
  }

  if (options.tags && options.tags.length > 0) {
    doc += ` * @tags ${options.tags.join(", ")}\n`;
  }

  if (options.params && options.params.length > 0) {
    doc += ` * @param ${options.params.join(", ")}\n`;
  }

  if (options.example) {
    doc += ` * @example\n * ${options.example}\n`;
  }

  doc += ` */`;
  return doc;
}
