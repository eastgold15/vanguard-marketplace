---
name: orm
description: >-
  为 Drizzle ORM 后端项目生成并强制执行标准文件结构、表 schema 定义、关系映射和 TypeBox 类型契约。
  当用户提及 drizzle、drizzle-orm、数据库表设计、TypeBox schema 生成或 Drizzle 项目结构时触发。
  配合 Better Auth 使用。
---

# ORM 规范

后端使用 **Drizzle ORM + Better Auth** 的标准代码规范。

## 触发条件

当用户执行以下操作时自动应用此技能：

- 创建或修改数据库表 schema
- 设置 Drizzle ORM 项目结构
- 从 Drizzle 表生成 TypeBox 契约类型
- 定义数据库表之间的关联关系
- 任何涉及 `drizzle`、`drizzle-orm`、`数据库表`、`schema`、`typebox`、`pg-core` 的后端操作

**不使用此技能的场景：** 非 Drizzle ORM 项目（如 Prisma、Kysely）、纯前端数据库操作、NoSQL 数据库。

## 工作流

### 创建新表时的步骤

**Step 1**: 在 `src/drizzle/table.schema.ts` 中定义表，遵循下方 [table.schema.ts 规范](#tableschemats-的规范)

**Step 2**: 在 `src/drizzle/table.relation.ts` 中定义表关系（如需要），遵循下方 [关系规范](#关系的规范)

**Step 3**: 在 `src/typebox/core.ts` 中生成对应的 TypeBox 契约类型，遵循下方 [TypeBox 规范](#typebox生成类型的规范)

**Step 4**: 在所有 `index.ts` 文件中添加集中导出

### 修改现有表时的步骤

1. 找到 `src/drizzle/table.schema.ts` 中的表定义
2. 修改字段，确保仍符合下方规范
3. 同步更新 `src/typebox/core.ts` 中的 TypeBox 类型
4. 更新 `src/drizzle/table.relation.ts` 中受影响的关系

---

## 核心规则

**CRITICAL** — 以下规则必须严格遵守：

- 所有 `index.ts` 文件只用于集中导出，**不得包含业务逻辑**
- **导入 pg-core 必须以数据库首字母作为命名空间**：`import * as p from "drizzle-orm/pg-core"`（PG 用 `p`，MySQL 用 `m`，SQLite 用 `s`）
- 表变量使用**小驼峰命名**，后缀 `Table`：如 `userTable`、`roleTable`
- 文档中 `[xxx]` 表示占位符需要替换，`X` 表示大写字母

文件结构如下：

```text
src
├── drizzle
│   ├── index.ts              # 集中导出所有表和关系
│   ├── table.relation.ts     # 所有 Drizzle 表关系
│   └── table.schema.ts       # 所有数据库 schema 定义
├── index.ts
├── typebox
│   └── core.ts               # 由数据库 schema 转化的 TypeBox schema 和 TS 类型
└── utils
    ├── constants
    │   ├── index.ts           # 集中导出
    │   └── [xxx-xxx].constants.ts  # 使用连字符命名的常量文件
    ├── index.ts
    ├── query-types.model.ts
    ├── utils.ts               # 固定工具文件（不可变）
    └── utils.types.ts
```

---

### table.schema.ts 的规范

**CRITICAL**：导入 pg-core 必须以数据库首字母命名。

<details>
<summary>📖 占位符约定说明</summary>

- `[xxx]` — 替换为你的实体名（小写）：如 `user`、`role`
- `[Xxx]` — 替换为实体名（首字母大写）：如 `User`、`Role`
- `[xXX]` — 替换为枚举名（小驼峰）：如 `userRole`、`deptCategory`

</details>

```ts
import { sql } from "drizzle-orm";
import * as p from "drizzle-orm/pg-core"; // 命名必须以数据库首字母

// --- Helper Fields ---
const idUuid = p.uuid("id").primaryKey().default(sql`gen_random_uuid()`);
const createdAt = p
  .timestamp("created_at", { withTimezone: true })
  .notNull()
  .defaultNow();
const updatedAt = p
  .timestamp("updated_at", { withTimezone: true })
  .notNull()
  .defaultNow()
  .$onUpdate(() => new Date());

const Audit = { id: idUuid, createdAt, updatedAt };

// --- Enums ---
// 枚举名使用小驼峰
export const [xXX]Enum = p.pgEnum("data_scope", [
  "xxxx",
  "xxx",
]);

// --- 表定义 ---
export const [xxx]Table = p.pgTable("[xxx]", {
  ...Audit,
  [xxx]: p.uuid("[xxx]"),
  [xxx]: p.varchar("[xxx]", { length: 50 }),
  [xxx]: deptCategoryEnum("[xxx]").default("[xxx]").notNull(),
  [xxx]: p.json("[xxx]"),
  [xxx]: p.boolean("is_[xxx]").default(false),
}, (table) => [
  p.index("[xxx]_idx").on(table.organizationId),
]);
```

**真实示例** — 以 `userTable` 为例：

```ts
export const userRoleEnum = p.pgEnum("user_role", ["admin", "member", "viewer"]);

export const userTable = p.pgTable("user", {
  ...Audit,
  name: p.varchar("name", { length: 100 }).notNull(),
  email: p.varchar("email", { length: 255 }).notNull().unique(),
  role: userRoleEnum("role").default("member").notNull(),
  avatarUrl: p.text("avatar_url"),
  isActive: p.boolean("is_active").default(true),
}, (table) => [
  p.index("user_email_idx").on(table.email),
  p.index("user_role_idx").on(table.role),
]);
```

---

### 关系的规范

```ts
/**
 * 核心系统数据库关系定义
 * 适配 Better Auth Organizations 架构
 */
import { defineRelations } from "drizzle-orm";
import * as schema from "./table.schema";

export const relations = defineRelations(schema, (r) => ({
  [xxx]Table: {
    // 一对多
    [xxx]: r.many.userTable({
      from: r.[xxx]Table.id,
      to: r.[xxx]Table.deptId,
    }),
    // 一对一（可选）
    [xxx]: r.one.siteTable({
      from: r.[xxx]Table.id,
      to: r.[xxx]Table.boundDeptId,
      optional: true,
    }),
    // 多对多（通过中间表）
    [xxx]: r.many.roleTable({
      from: r.[xxx]Table.id.through(r.[xxx]Table.userId),
      to: r.[xxx]Table.id.through(r.[xxx]Table.roleId),
    }),
  },
}));
```

**真实示例**：

```ts
export const relations = defineRelations(schema, (r) => ({
  departmentTable: {
    members: r.many.userTable({
      from: r.departmentTable.id,
      to: r.userTable.deptId,
    }),
    boundSite: r.one.siteTable({
      from: r.departmentTable.id,
      to: r.siteTable.boundDeptId,
      optional: true,
    }),
    roles: r.many.roleTable({
      from: r.departmentTable.id.through(r.userDepartmentTable.userId),
      to: r.userDepartmentTable.id.through(r.userDepartmentTable.roleId),
    }),
  },
  userTable: {
    posts: r.many.postTable({
      from: r.userTable.id,
      to: r.postTable.authorId,
    }),
  },
}));
```

---

### utils 文件（固定文件，不需要修改）

```ts
/**
 * @lastModified 2025-02-04
 * @see https://elysiajs.com/recipe/drizzle.html#utility
 */

import {
  Kind,
  type Static,
  type TObject,
  type TSchema,
} from "@sinclair/typebox";
import type { Table } from "drizzle-orm";
import {
  type BuildSchema,
  createInsertSchema,
  createSelectSchema,
} from "drizzle-typebox";

type Spread<
  T extends TObject | Table,
  Mode extends "select" | "insert" | undefined,
> =
  T extends TObject<infer Fields>
    ? {
        [K in keyof Fields]: Fields[K];
      }
    : T extends Table
      ? Mode extends "select"
        ? BuildSchema<"select", T["_"]["columns"], undefined>["properties"]
        : Mode extends "insert"
          ? BuildSchema<"insert", T["_"]["columns"], undefined>["properties"]
          : {}
      : {};

/**
 * 将 Drizzle 模式展开为一个普通对象
 */
export const spread = <
  T extends TObject | Table,
  Mode extends "select" | "insert" | undefined,
>(
  schema: T,
  mode?: Mode,
): Spread<T, Mode> => {
  const newSchema: Record<string, unknown> = {};
  let table;

  switch (mode) {
    case "insert":
    case "select":
      if (Kind in schema) {
        table = schema;
        break;
      }

      table =
        mode === "insert"
          ? createInsertSchema(schema)
          : createSelectSchema(schema);

      break;

    default:
      if (!(Kind in schema)) throw new Error("期望是一个模式");
      table = schema;
  }

  for (const key of Object.keys(table.properties))
    newSchema[key] = table.properties[key];

  return newSchema as any;
};

/**
 * 将 Drizzle 表展开为一个普通对象
 *
 * 如果 `mode` 是 'insert'，则模式将经过插入优化
 * 如果 `mode` 是 'select'，则模式将经过选择优化
 * 如果 `mode` 是未定义，模式将按原样展开，模型需要手动优化
 */
export const spreads = <
  T extends Record<string, TObject | Table>,
  Mode extends "select" | "insert" | undefined,
>(
  models: T,
  mode?: Mode,
): {
  [K in keyof T]: Spread<T[K], Mode>;
} => {
  const newSchema: Record<string, unknown> = {};
  const keys = Object.keys(models);

  for (const key of keys) newSchema[key] = spread(models[key]!, mode);

  return newSchema as any;
};

/**
 * 自动 DTO 推导工具
 * 提取 Contract 中所有 TSchema 字段的静态类型
 */
export type InferDTO<T> = {
  [K in keyof T]: T[K] extends TSchema ? Static<T[K]> : never;
};

export function pick<T, K extends keyof T>(obj: T, keys: K[]): Pick<T, K> {
  const result = {} as Pick<T, K>;
  for (const key of keys) {
    result[key] = obj[key];
  }
  return result;
}

// 使用
// const picked = pick(original, ['id', 'name', 'email']);
// 类型自动推导为 { id: string; name: string; email: string; }
```

---

### TypeBox 生成类型的规范

```ts
import { t } from "elysia";
import { [xxx]Table } from "../drizzle/table.schema";
import type { InferDTO } from "../utils";
import { spread } from "../utils";

export const [Xxx]InsertFields = spread([xxx]Table, "insert"); // 可选的
export const [Xxx]Fields = spread([xxx]Table, "select");       // 几乎都是不可选的

export const [Xxx]Contract = {
  Response: t.Object({
    ...[Xxx]Fields,
  }),

  Create: t.Object({
    ...t.Omit(t.Object([Xxx]InsertFields), [
      "id",
      "createdAt",
      "updatedAt",
      "startDate",
      "endDate",
      "[xxx]", // 根据业务需求排除不需要客户端传入的字段
    ]).properties,
    startDate: t.String(),
    endDate: t.String(),
  }),

  Update: t.Partial(
    t.Object({
      ...t.Omit(t.Object([Xxx]InsertFields), [
        "id",
        "createdAt",
        "updatedAt",
        "startDate",
        "endDate",
        "[xxx]", // 不允许修改的字段
      ]).properties,
      startDate: t.String(),
      endDate: t.String(),
    }),
  ),

  ListQuery: t.Object({
    ...t.Partial(t.Object([Xxx]InsertFields)).properties,
    search: t.Optional(t.String()),
  }),

  ListResponse: t.Object({
    data: t.Array(t.Object({ ...[Xxx]Fields })),
    total: t.Number(),
  }),
} as const;

// 类型和常量可以同名，TypeScript 能自动区分
export type [Xxx]Contract = InferDTO<typeof [Xxx]Contract>;
```

**真实示例** — 以 `AdContract` 为例：

```ts
import { t } from "elysia";
import { adTable } from "../drizzle/table.schema";
import type { InferDTO } from "../utils";
import { spread } from "../utils";

export const AdInsertFields = spread(adTable, "insert");
export const AdFields = spread(adTable, "select");

export const AdContract = {
  Response: t.Object({
    ...AdFields,
  }),

  Create: t.Object({
    ...t.Omit(t.Object(AdInsertFields), [
      "id",
      "createdAt",
      "updatedAt",
      "startDate",
      "endDate",
      "siteId",
    ]).properties,
    startDate: t.String(),
    endDate: t.String(),
  }),

  Update: t.Partial(
    t.Object({
      ...t.Omit(t.Object(AdInsertFields), [
        "id",
        "createdAt",
        "updatedAt",
        "startDate",
        "endDate",
        "siteId", // 不允许修改所属站点
      ]).properties,
      startDate: t.String(),
      endDate: t.String(),
    }),
  ),

  ListQuery: t.Object({
    ...t.Partial(t.Object(AdInsertFields)).properties,
    search: t.Optional(t.String()),
  }),

  ListResponse: t.Object({
    data: t.Array(t.Object({ ...AdFields })),
    total: t.Number(),
  }),
} as const;

export type AdContract = InferDTO<typeof AdContract>;
```

---

## 故障排除

### `drizzle-typebox` 导入失败

**原因**：未安装 `drizzle-typebox` 依赖。

**解决**：
```bash
pnpm add drizzle-typebox
```

### 关系定义报类型错误

**原因**：`defineRelations` 中的表名或字段名与 `table.schema.ts` 不一致。

**解决**：
1. 检查所有表名是否以 `Table` 结尾并已从 `table.schema.ts` 导出
2. 确认外键字段名与 schema 中定义的一致
3. 确保中间表在 schema 中已定义

### `spread()` 返回类型不正确

**原因**：传入了非 Drizzle Table 的普通对象。

**解决**：`spread()` 只接受 `drizzle-orm` 的 `Table` 对象或 `@sinclair/typebox` 的 `TObject`。检查传入参数是否为实际的表定义。

### `index.ts` 集中导出遗漏

**原因**：新增表或工具后忘记在 `index.ts` 中导出。

**解决**：每新增一个模块，立即在对应的 `index.ts` 中添加 `export` 语句。建议在 CI 中添加 `ultracite check` 来捕获未使用的导出。
