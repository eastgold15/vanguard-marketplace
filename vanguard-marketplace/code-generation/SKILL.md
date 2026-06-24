---
name: code-generation-skill
description: AI驱动的全栈代码生成Skill - 使用ts-morph AST引擎，根据业务需求自动生成Elysia + Drizzle完整后端代码（Contract、Service、Controller）
---

# AI 驱动代码生成 Skill v2.0

> **使用TypeScript + ts-morph AST引擎的正确实现**

这个Skill通过纯TypeScript函数调用，使AI能够自动理解业务需求，生成生产级别的完整后端代码框架。

## 核心概念

### 三层架构

1. **Contract 层** (数据契约)
   - 定义数据结构和验证规则
   - 使用 TypeBox 生成 DTO
   - 包含查询、分页、排序参数

2. **Service 层** (业务逻辑)
   - 实现业务逻辑和数据操作
   - 与数据库交互
   - 处理复杂的业务规则

3. **Controller 层** (API端点)
   - 定义HTTP路由和端点
   - 请求验证和响应处理
   - 错误处理和日志

4. **Router 层** (路由聚合)
   - 聚合所有控制器的路由
   - 注册到Elysia应用

## 使用流程

### 1. 定义业务需求（用户输入）

```
业务描述：
- 实体名称: Product
- 字段:
  - id (UUID, 自增)
  - name (字符串, 必填)
  - description (文本, 可选)
  - price (数字, 必填)
  - stock (整数, 必填)
  - status (枚举: active/inactive, 默认active)
- 操作: 列表、详情、创建、更新、删除
- 特殊需求: 带分页、排序、软删除
```

### 2. AI 代码生成过程

AI会按以下步骤生成代码：

#### Step 1: 解析业务需求
- 提取实体名称
- 识别字段及其类型
- 确定所需的CRUD操作
- 识别特殊需求（分页、排序、软删除等）

#### Step 2: 生成Schema定义
- 创建Drizzle table schema
- 添加字段验证和约束
- 配置索引和关系

#### Step 3: 生成Contract层
- 生成base字段类型（SELECT）
- 生成insert字段类型（INSERT）
- 生成API请求/响应类型
- 生成查询过滤器类型

#### Step 4: 生成Service层
- 创建Service类
- 实现CRUD方法
- 添加查询构建器
- 实现分页和排序

#### Step 5: 生成Controller层
- 创建Controller类
- 定义路由端点
- 添加参数验证
- 实现错误处理

#### Step 6: 生成Router聚合
- 注册所有路由
- 配置路由前缀
- 添加中间件

## 生成的文件结构

```
packages/contract/src/modules/
├── {entityName}.schema.ts      # Drizzle schema定义
├── {entityName}.contract.ts    # 数据契约和DTO类型
└── index.ts                     # 导出聚合

apps/b2badmin/server/
├── services/
│   └── {entityName}.service.ts # 业务逻辑层
├── controllers/
│   └── {entityName}.controller.ts # API路由控制层
└── controllers/
    └── app-router.ts           # 路由聚合
```

## 代码示例

### 输入业务需求
```
创建一个产品管理模块，包括：
- 基本信息：ID、名称、描述、价格、库存
- 状态管理：激活/禁用
- 查询功能：分页、按名称搜索、按价格范围过滤
- 操作：创建、修改、删除、列表、详情
```

### 生成的Contract
```typescript
export const ProductFields = spread(productsTable, "select");
export const ProductInsertFields = spread(productsTable, "insert");

export const ProductQuery = t.Object({
  search: t.Optional(t.String()),
  priceMin: t.Optional(t.Number()),
  priceMax: t.Optional(t.Number()),
  status: t.Optional(t.String()),
  ...PaginationParams,
  ...SortParams,
});

export const ProductResponse = t.Object({
  id: t.String({ format: "uuid" }),
  name: t.String(),
  description: t.Optional(t.String()),
  price: t.Number(),
  stock: t.Integer(),
  status: t.String(),
  createdAt: t.Date(),
  updatedAt: t.Date(),
});
```

### 生成的Service
```typescript
export class ProductService {
  async list(query: ProductQuery) {
    const { skip, take, sortBy, order, search, priceMin, priceMax, status } = query;
    // 构建查询，支持搜索、过滤、分页、排序
  }

  async findById(id: string) {
    // 根据ID查询单条记录
  }

  async create(data: ProductInsert) {
    // 创建新产品
  }

  async update(id: string, data: Partial<ProductInsert>) {
    // 更新产品
  }

  async delete(id: string) {
    // 删除产品
  }
}
```

### 生成的Controller
```typescript
export const ProductController = new Elysia({ prefix: "/products" })
  .get("/", async ({ query }) => {
    const service = new ProductService();
    return service.list(query);
  })
  .get("/:id", async ({ params }) => {
    const service = new ProductService();
    return service.findById(params.id);
  })
  .post("/", async ({ body }) => {
    const service = new ProductService();
    return service.create(body);
  })
  .put("/:id", async ({ params, body }) => {
    const service = new ProductService();
    return service.update(params.id, body);
  })
  .delete("/:id", async ({ params }) => {
    const service = new ProductService();
    return service.delete(params.id);
  });
```

## AI 指令格式

当与Claude交互时，使用以下格式：

```
执行代码生成任务：
实体名: [EntityName]
字段定义: [Field1 Type, Field2 Type, ...]
操作类型: [list, detail, create, update, delete]
特殊需求: [分页, 排序, 搜索, 软删除, ...]
输出路径: {
  schema: [path/to/schema],
  contract: [path/to/contract],
  service: [path/to/service],
  controller: [path/to/controller],
  router: [path/to/router]
}
```

## 集成点

### 与TypeScript AST的集成
- 使用ts-morph解析和生成TypeScript代码
- 自动处理导入导出
- 保持代码风格一致

### 与Drizzle ORM的集成
- 生成Drizzle table schema
- 自动类型推导
- 支持关系定义

### 与Elysia框架的集成
- 生成Elysia路由定义
- 自动类型验证
- 支持中间件集成

## 可扩展点

1. **字段类型支持**
   - 基础类型：string, number, boolean, date
   - 关系类型：one-to-many, many-to-many
   - 嵌套对象和数组

2. **业务逻辑生成**
   - 自定义验证规则
   - 业务流程编排
   - 权限和认证集成

3. **生成选项**
   - 代码风格配置
   - 命名规范选项
   - 测试代码生成

