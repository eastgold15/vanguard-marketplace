/**
 * Service 层代码生成器
 * 使用 ts-morph 的纯函数实现
 * 
 * 职责：根据Contract生成业务逻辑Service类
 * 
 * 生成的结构：
 * export class UsersService {
 *   async create(body: UsersContract["Create"], ctx: ServiceContext) { ... }
 *   async findAll(query: UsersContract["ListQuery"], ctx: ServiceContext) { ... }
 *   async findById(id: string, ctx: ServiceContext) { ... }
 *   async update(id: string, body: UsersContract["Update"], ctx: ServiceContext) { ... }
 *   async delete(id: string, ctx: ServiceContext) { ... }
 * }
 */

import * as path from "node:path";
import { Project, SourceFile } from "ts-morph";
import { ensureImport, upsertMethod, normalizePath } from "./ast-utils";
import type { GenContext } from "./types";

/**
 * 生成Service文件的纯函数
 * 
 * 流程：
 * 1. 读取/创建 .service.ts 文件
 * 2. 添加导入（Contract、db工具、Schema等）
 * 3. 生成Service类
 * 4. 向类中添加CRUD方法
 * 
 * @param project - ts-morph Project
 * @param ctx - 生成上下文
 * @returns 生成的文件对象
 */
export function generateServiceFile(
  project: Project,
  ctx: GenContext
): SourceFile {
  // 🔥 Step 1: 读取或创建文件
  let file: SourceFile;
  try {
    const existing = project.getSourceFile(ctx.paths.service);
    if (existing) {
      existing.forget();
    }
    file = project.addSourceFileAtPath(ctx.paths.service);
  } catch {
    file = project.createSourceFile(ctx.paths.service, "", { overwrite: false });
  }

  // 🔥 Step 2: 添加必要的导入
  // 计算相对路径 (从 services/ 到 ../contract/)
  const contractRelativePath = normalizePath(
    path.relative(
      path.dirname(ctx.paths.service),
      path.dirname(ctx.paths.contract)
    )
  );

  ensureImport(file, "drizzle-orm", ["eq", "and", "or", "like"]);
  ensureImport(file, "@/db", ["db"]);
  ensureImport(file, "@/types", ["ServiceContext"]);
  ensureImport(
    file,
    `${contractRelativePath}/index`,
    [`${ctx.pascalName}Contract`],
    true
  );
  ensureImport(file, "../schema/index", [ctx.schemaKey], true);

  // 🔥 Step 3: 生成Service类
  const serviceClassName = `${ctx.pascalName}Service`;
  let serviceClass = file.getClass(serviceClassName);

  if (!serviceClass) {
    serviceClass = file.addClass({
      name: serviceClassName,
      isExported: true,
    });
  }

  // 🔥 Step 4: 添加CRUD方法
  addCreateMethod(serviceClass, ctx);
  addFindAllMethod(serviceClass, ctx);
  addFindByIdMethod(serviceClass, ctx);
  addUpdateMethod(serviceClass, ctx);
  addDeleteMethod(serviceClass, ctx);

  return file;
}

/**
 * 添加 create 方法
 * async create(body: UsersContract["Create"], ctx: ServiceContext)
 */
function addCreateMethod(
  serviceClass: any,
  ctx: GenContext
): void {
  const { pascalName, schemaKey } = ctx;
  const tableName = schemaKey.replace("Table", ""); // usersTable -> users

  const methodBody = `
const insertData = {
  ...body,
  tenantId: ctx.user.tenantId,
  createdBy: ctx.user.id,
};

const [res] = await ctx.db
  .insert(${schemaKey})
  .values(insertData)
  .returning();

return res;
`;

  upsertMethod(
    serviceClass,
    "create",
    methodBody,
    [
      {
        name: "body",
        type: `${pascalName}Contract["Create"]`,
      },
      {
        name: "ctx",
        type: "ServiceContext",
      },
    ],
    "Promise<any>"
  );
}

/**
 * 添加 findAll 方法（支持分页、搜索、排序）
 * async findAll(query: UsersContract["ListQuery"], ctx: ServiceContext)
 */
function addFindAllMethod(
  serviceClass: any,
  ctx: GenContext
): void {
  const { pascalName, schemaKey } = ctx;

  const methodBody = `
const { page = 1, limit = 10, sortBy = "createdAt", order = "desc", search, ...filters } = query;

// 构建查询条件
const whereConditions = [
  eq(${schemaKey}.tenantId, ctx.user.tenantId),
];

// 搜索条件
if (search) {
  whereConditions.push(
    or(
      like(${schemaKey}.name, \`%\${search}%\`),
      like(${schemaKey}.description, \`%\${search}%\`)
    )
  );
}

// 执行查询
const data = await ctx.db
  .select()
  .from(${schemaKey})
  .where(and(...whereConditions))
  .limit(limit)
  .offset((page - 1) * limit)
  .orderBy(${schemaKey}[sortBy], order === "asc" ? "ASC" : "DESC");

// 获取总数
const countResult = await ctx.db
  .\$count(${schemaKey}, and(...whereConditions));

return {
  data,
  total: countResult,
};
`;

  upsertMethod(
    serviceClass,
    "findAll",
    methodBody,
    [
      {
        name: "query",
        type: `${pascalName}Contract["ListQuery"]`,
      },
      {
        name: "ctx",
        type: "ServiceContext",
      },
    ],
    "Promise<any>"
  );
}

/**
 * 添加 findById 方法
 * async findById(id: string, ctx: ServiceContext)
 */
function addFindByIdMethod(
  serviceClass: any,
  ctx: GenContext
): void {
  const { schemaKey } = ctx;

  const methodBody = `
const [res] = await ctx.db
  .select()
  .from(${schemaKey})
  .where(eq(${schemaKey}.id, id));

return res;
`;

  upsertMethod(
    serviceClass,
    "findById",
    methodBody,
    [
      {
        name: "id",
        type: "string",
      },
      {
        name: "ctx",
        type: "ServiceContext",
      },
    ],
    "Promise<any>"
  );
}

/**
 * 添加 update 方法
 * async update(id: string, body: UsersContract["Update"], ctx: ServiceContext)
 */
function addUpdateMethod(
  serviceClass: any,
  ctx: GenContext
): void {
  const { pascalName, schemaKey } = ctx;

  const methodBody = `
const [res] = await ctx.db
  .update(${schemaKey})
  .set({
    ...body,
    updatedAt: new Date(),
  })
  .where(eq(${schemaKey}.id, id))
  .returning();

return res;
`;

  upsertMethod(
    serviceClass,
    "update",
    methodBody,
    [
      {
        name: "id",
        type: "string",
      },
      {
        name: "body",
        type: `${pascalName}Contract["Update"]`,
      },
      {
        name: "ctx",
        type: "ServiceContext",
      },
    ],
    "Promise<any>"
  );
}

/**
 * 添加 delete 方法
 * async delete(id: string, ctx: ServiceContext)
 */
function addDeleteMethod(
  serviceClass: any,
  ctx: GenContext
): void {
  const { schemaKey } = ctx;

  const methodBody = `
const [res] = await ctx.db
  .delete(${schemaKey})
  .where(eq(${schemaKey}.id, id))
  .returning();

return res;
`;

  upsertMethod(
    serviceClass,
    "delete",
    methodBody,
    [
      {
        name: "id",
        type: "string",
      },
      {
        name: "ctx",
        type: "ServiceContext",
      },
    ],
    "Promise<any>"
  );
}

/**
 * 向Service中添加自定义方法的辅助函数
 * 
 * 场景：某个Service需要额外的业务方法
 * 使用方式：
 * addCustomMethod(serviceClass, {
 *   name: "searchByCategory",
 *   params: [{ name: "category", type: "string" }],
 *   returnType: "Promise<any[]>",
 *   body: "..."
 * });
 */
export function addCustomMethod(
  serviceClass: any,
  options: {
    name: string;
    params: Array<{ name: string; type: string }>;
    returnType: string;
    body: string;
  }
): void {
  upsertMethod(
    serviceClass,
    options.name,
    options.body,
    options.params,
    options.returnType
  );
}

/**
 * 组合多个Service的方法
 * 
 * 场景：某个Service需要调用其他Service的方法
 * 示例：OrderService.create() 需要调用 ProductService.checkStock()
 */
export function composeServiceMethods(
  primaryService: string,
  dependencies: Array<{ name: string; methods: string[] }>
): string {
  let code = `import { ${dependencies.map((d) => `${d.name}`).join(", ")} } from "./index";\n\n`;

  code += `export class ${primaryService} {
  private productService = new ProductService();
  private userService = new UserService();

  // 使用依赖的Service方法
  async createWithValidation(data, ctx) {
    // 先验证
    const product = await this.productService.findById(data.productId, ctx);
    if (!product) throw new Error("Product not found");

    // 再创建
    return this.create(data, ctx);
  }
}`;

  return code;
}
