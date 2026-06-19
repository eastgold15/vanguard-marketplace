/**
 * Contract 层代码生成器
 * 使用 ts-morph 的纯函数实现
 * 
 * 职责：根据Schema生成TypeBox契约定义、DTO类型、验证器
 * 
 * 生成的结构：
 * export const UsersContract = {
 *   Response: t.Object({ id, name, ... }),
 *   Create: t.Object({ name, ... }),  // 去除 id, createdAt, updatedAt
 *   Update: t.Partial({ name, ... }), // 全部可选
 *   ListQuery: t.Object({ ...PaginationParams, search, ... }),
 *   ListResponse: t.Object({ data: t.Array(...), total: t.Number() })
 * } as const;
 */

import * as path from "node:path";
import {
  Project,
  SourceFile,
  SyntaxKind,
  ClassDeclaration,
  PropertyDeclaration,
} from "ts-morph";
import { ensureImport, upsertExportedConst, normalizePath } from "./ast-utils";
import type { GenContext } from "./types";

/**
 * 生成Contract文件的纯函数
 * 
 * 流程：
 * 1. 读取/创建 .contract.ts 文件
 * 2. 添加导入（elysia, PaginationParams等）
 * 3. 生成四个字段变量（Fields, InsertFields, UpdateFields, QueryFields）
 * 4. 生成 Contract 对象（包含5个DTO类型）
 * 5. 导出 TypeScript 类型
 * 
 * @param project - ts-morph Project
 * @param ctx - 生成上下文（包含表名、路径等）
 * @returns 生成的文件对象
 */
export function generateContractFile(
  project: Project,
  ctx: GenContext
): SourceFile {
  // 🔥 Step 1: 读取或创建文件
  let file: SourceFile;
  try {
    // 尝试从磁盘加载现有文件
    const existing = project.getSourceFile(ctx.paths.contract);
    if (existing) {
      existing.forget(); // 清除缓存
    }
    file = project.addSourceFileAtPath(ctx.paths.contract);
  } catch {
    // 文件不存在，创建新文件
    file = project.createSourceFile(ctx.paths.contract, "", { overwrite: false });
  }

  // 🔥 Step 2: 添加必要的导入
  ensureImport(file, "elysia", ["t"]);
  ensureImport(file, "../helper/utils", ["spread", "type InferDTO"], true);
  ensureImport(file, "../helper/query-types.model", [
    "PaginationParams",
    "SortParams",
  ]);
  ensureImport(file, "../table.schema", [ctx.schemaKey]);

  // 🔥 Step 3: 生成基础字段变量
  // UsersFields = spread(usersTable, "select")
  upsertExportedConst(file, `${ctx.pascalName}Fields`, `spread(${ctx.schemaKey}, "select")`);

  // UsersInsertFields = spread(usersTable, "insert")
  upsertExportedConst(file, `${ctx.pascalName}InsertFields`, `spread(${ctx.schemaKey}, "insert")`);

  // 🔥 Step 4: 生成 Contract 对象
  // 这是AI需要理解的核心结构
  const contractObjectCode = generateContractObject(ctx);
  upsertExportedConst(file, `${ctx.pascalName}Contract`, contractObjectCode);

  // 🔥 Step 5: 生成类型导出
  // export type UsersContract = InferDTO<typeof UsersContract>;
  const typeExportCode = `InferDTO<typeof ${ctx.pascalName}Contract>`;
  upsertExportedType(file, `${ctx.pascalName}Contract`, typeExportCode);

  return file;
}

/**
 * 生成Contract对象代码
 * 这是最关键的部分 - AI需要理解的结构
 * 
 * 返回类似：
 * {
 *   Response: t.Object({ ... 所有字段 ... }),
 *   Create: t.Object({ ... 插入需要的字段 ... }),
 *   Update: t.Partial({ ... 可更新的字段 ... }),
 *   ListQuery: t.Object({ ...PaginationParams, ...SortParams, search: ... }),
 *   ListResponse: t.Object({ data: t.Array(...), total: t.Number() })
 * } as const
 */
function generateContractObject(ctx: GenContext): string {
  const { pascalName } = ctx;

  return `{
  // 完整响应类型 - 包含所有字段
  Response: t.Object({
    ...${pascalName}Fields
  }),

  // 创建时需要的字段 - 去除 id, createdAt, updatedAt
  Create: t.Omit(t.Object({
    ...${pascalName}InsertFields
  }), ["id", "createdAt", "updatedAt"]),

  // 更新时的字段 - 全部可选
  Update: t.Partial(t.Object({
    ...${pascalName}InsertFields
  })),

  // 列表查询参数
  ListQuery: t.Object({
    ...PaginationParams,
    ...SortParams,
    search: t.Optional(t.String()),
  }),

  // 列表响应 - 包含分页信息
  ListResponse: t.Object({
    data: t.Array(t.Object({
      ...${pascalName}Fields
    })),
    total: t.Number(),
  })
} as const`;
}

/**
 * 向文件中插入/更新类型导出声明
 * export type XXX = ...
 */
function upsertExportedType(
  file: SourceFile,
  typeName: string,
  typeExpression: string
): void {
  // 检查是否已存在
  const existing = file
    .getTypeAliases()
    .find((t) => t.getName() === typeName);

  if (existing) {
    existing.remove();
  }

  // 添加新的类型声明
  file.addTypeAlias({
    name: typeName,
    type: typeExpression,
    isExported: true,
  });
}

/**
 * 合并多个Entity的Contract（关键功能！）
 * 
 * 场景：某些API需要同时接收多个实体的数据
 * 例如：创建订单时，需要 Order + OrderItem 的组合数据
 * 
 * 使用方式：
 * const CombinedContract = mergeContracts(
 *   { name: "Order", contract: OrderContract },
 *   { name: "OrderItem", contract: OrderItemContract }
 * );
 * 
 * 生成：
 * {
 *   order: OrderContract.Create,
 *   items: t.Array(OrderItemContract.Create)
 * }
 */
export function mergeContracts(
  ...entities: Array<{ name: string; contractVarName: string }>
): string {
  const mergedObject = entities
    .map(
      ({ name, contractVarName }) =>
        `${name.toLowerCase()}: ${contractVarName}.Create`
    )
    .join(",\n  ");

  return `t.Object({
  ${mergedObject}
}) as const`;
}

/**
 * 从现有Contract中提取特定的DTO类型
 * 
 * 场景：Controller中某个端点只需要Response类型
 * 
 * 使用方式：
 * const responseType = extractDTOType("UsersContract", "Response");
 * // 返回: "UsersContract['Response']"
 */
export function extractDTOType(
  contractVarName: string,
  dtoKey: "Response" | "Create" | "Update" | "ListQuery" | "ListResponse"
): string {
  return `${contractVarName}['${dtoKey}']`;
}
