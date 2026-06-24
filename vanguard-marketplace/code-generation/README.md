# AI驱动代码生成 Skill

> 通过自然语言业务需求，AI自动生成Elysia + Drizzle的完整后端代码层

## 概述

这个skill将代码生成逻辑拆解为纯函数，使Claude能够：

1. **理解业务需求** - 解析自然语言业务描述
2. **生成完整代码** - 自动生成Schema、Contract、Service、Controller层
3. **处理依赖** - 自动管理导入导出和类型关系
4. **支持扩展** - 可扩展的字段类型和操作支持

## 架构设计

```
┌─────────────────────────────────────────────────────────────┐
│                    Claude AI (思考层)                        │
│  - 理解业务需求                                              │
│  - 规划代码生成策略                                          │
│  - 验证生成结果                                              │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│              Code Generation Layer (代码层)                  │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ generate_code.py (核心函数)                         │   │
│  │ - generate_schema() - 生成数据库Schema              │   │
│  │ - generate_contract() - 生成DTO和验证器             │   │
│  │ - generate_service() - 生成业务逻辑层               │   │
│  │ - generate_controller() - 生成API控制层             │   │
│  │ - execute_code_generation() - 统一入口              │   │
│  └─────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│           CLI Integration Layer (集成层)                     │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ cli-runner.ts (Node.js包装)                        │   │
│  │ - generateCode() - 调用Python函数                   │   │
│  │ - generateFullStack() - AI友好接口                 │   │
│  │ - generateFromRequirement() - 自然语言接口          │   │
│  └─────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

## 文件结构

```
skills/code-generation/
├── SKILL.md                # Skill定义和规则
├── generate_code.py        # Python纯函数实现
├── cli-runner.ts           # TypeScript CLI包装器
└── README.md               # 本文件
```

## 核心函数

### 1. execute_code_generation (Python)

AI可以直接调用此函数生成代码。

**签名:**
```python
def execute_code_generation(
    entity_name: str,
    fields: List[dict],
    operations: List[str],
    special_requirements: List[str] = None,
    output_dir: str = None,
) -> GeneratedFiles
```

**示例:**
```python
result = execute_code_generation(
    entity_name="Product",
    fields=[
        {"name": "name", "type": "string", "required": True},
        {"name": "price", "type": "number", "required": True},
        {"name": "stock", "type": "integer", "required": True},
    ],
    operations=["list", "detail", "create", "update", "delete"],
    special_requirements=["分页", "排序"]
)

# 返回:
# {
#   "schema": "...",      # Schema代码
#   "contract": "...",    # Contract代码
#   "service": "...",     # Service代码
#   "controller": "...",  # Controller代码
#   "router": "...",      # Router代码
#   "status": "success"
# }
```

### 2. generateFullStack (TypeScript)

Node.js环境中的包装函数，可生成并保存文件。

**签名:**
```typescript
async function generateFullStack(
  request: GenerationRequest
): Promise<{
  success: boolean;
  message: string;
  files?: string[];
  error?: string;
}>
```

**示例:**
```typescript
const result = await generateFullStack({
  entityName: "Product",
  fields: [
    { name: "name", type: "string", required: true },
    { name: "price", type: "number", required: true },
  ],
  operations: ["list", "create", "update", "delete"],
  outputDir: "./src/modules"
});
```

### 3. generateFromRequirement (TypeScript)

从自然语言需求直接生成代码。

**签名:**
```typescript
async function generateFromRequirement(
  requirementText: string,
  outputDir?: string
): Promise<{
  success: boolean;
  message: string;
  requirement?: Partial<GenerationRequest>;
}>
```

**示例:**
```typescript
const result = await generateFromRequirement(
  "创建产品管理模块，包含ID、名称、价格、库存字段，支持列表、详情、创建、更新、删除",
  "./src/modules"
);
```

## 使用流程

### 场景1: Claude生成业务需求代码

```
用户: "我需要创建一个产品管理系统，包括产品的基本信息（名称、描述、价格、库存），
     支持按名称搜索，支持分页和排序。"

Claude思考过程:
1. 解析需求
   - 实体: Product
   - 字段: id, name, description, price, stock
   - 操作: list(带搜索), detail, create, update, delete
   - 特殊需求: 分页, 排序, 搜索

2. 调用生成函数
   execute_code_generation(
     entity_name="Product",
     fields=[
       {"name": "id", "type": "uuid", "required": True},
       {"name": "name", "type": "string", "required": True},
       {"name": "description", "type": "string", "required": False},
       {"name": "price", "type": "number", "required": True},
       {"name": "stock", "type": "integer", "required": True},
     ],
     operations=["list", "detail", "create", "update", "delete"],
     special_requirements=["分页", "排序", "搜索"]
   )

3. 生成结果
   - product.schema.ts
   - product.contract.ts
   - product.service.ts
   - product.controller.ts

4. 返回给用户
   已为您生成完整的产品管理模块代码...
```

### 场景2: 修改现有代码

```
用户: "在Product模块中添加一个'分类'字段"

Claude思考过程:
1. 读取现有的product.schema.ts
2. 添加category字段
3. 重新生成所有相关层的代码
4. 自动更新类型定义
```

## 支持的字段类型

| 业务类型 | Drizzle类型 | TypeBox验证器 |
|---------|-----------|------------|
| string | text | t.String() |
| number | real | t.Number() |
| integer | integer | t.Integer() |
| boolean | boolean | t.Boolean() |
| date | timestamp | t.Date() |
| datetime | timestamp | t.Date() |
| uuid | text | t.String({format:'uuid'}) |
| json | json | t.Record(...) |
| array | text | t.Array(...) |

## 支持的操作

- `list` - 获取列表（支持分页、排序、过滤）
- `detail` - 获取单个记录
- `create` - 创建新记录
- `update` - 更新记录
- `delete` - 删除记录

## 特殊需求

- `分页` - 支持offset/limit分页
- `排序` - 支持多字段排序
- `搜索` - 按文字字段模糊搜索
- `软删除` - 添加deletedAt时间戳而非硬删除
- `时间戳` - 自动添加createdAt/updatedAt
- `验证` - 添加业务规则验证

## 生成的代码示例

### 1. Schema (Database)
```typescript
export const productTable = sqliteTable('product', {
  id: text('id').primaryKey().default(sql`uuid()`),
  name: text('name').notNull(),
  description: text('description'),
  price: real('price').notNull(),
  stock: integer('stock').notNull(),
  createdAt: numeric('createdAt').default(sql`CURRENT_TIMESTAMP`),
  updatedAt: numeric('updatedAt').default(sql`CURRENT_TIMESTAMP`),
});
```

### 2. Contract (DTO & Validation)
```typescript
export const ProductFields = t.Object({
  id: t.String({ format: 'uuid' }),
  name: t.String(),
  description: t.Optional(t.String()),
  price: t.Number(),
  stock: t.Integer(),
});

export const ProductQuery = t.Object({
  ...PaginationParams,
  ...SortParams,
  nameSearch: t.Optional(t.String()),
  priceMin: t.Optional(t.Number()),
  priceMax: t.Optional(t.Number()),
});
```

### 3. Service (Business Logic)
```typescript
export class ProductService {
  async list(query: any) {
    // 列表查询，支持分页、排序、过滤
  }

  async findById(id: string) {
    // 查询单个
  }

  async create(data: ProductInsert) {
    // 创建
  }

  async update(id: string, data: Partial<ProductInsert>) {
    // 更新
  }

  async delete(id: string) {
    // 删除
  }
}
```

### 4. Controller (API Routes)
```typescript
export const ProductController = new Elysia({ prefix: "/product" })
  .get("/", async ({ query }) => {
    // 列表端点
  })
  .get("/:id", async ({ params }) => {
    // 详情端点
  })
  .post("/", async ({ body }) => {
    // 创建端点
  })
  .put("/:id", async ({ params, body }) => {
    // 更新端点
  })
  .delete("/:id", async ({ params }) => {
    // 删除端点
  });
```

## 集成到Claude提示词

### 系统提示词示例

```
你是一个专业的全栈开发者。当用户描述业务需求时，你需要：

1. 理解需求
   - 识别实体及其属性
   - 确定所需的CRUD操作
   - 识别特殊需求（分页、排序、搜索等）

2. 生成代码
   使用code-generation skill中的 execute_code_generation() 函数：
   
   ```python
   execute_code_generation(
     entity_name="...",
     fields=[...],
     operations=[...],
     special_requirements=[...]
   )
   ```

3. 生成路由聚合
   自动在app-router.ts中注册新的控制器

4. 返回总结
   告诉用户已生成的文件位置和使用方法

遇到问题时，检查以下几点：
- 字段类型是否在支持列表中
- 操作是否有效
- 是否有命名冲突
```

## 本地测试

### 运行Python示例

```bash
cd skills/code-generation
python generate_code.py
```

### 运行TypeScript示例

```bash
# 安装依赖
npm install

# 运行示例
npx ts-node cli-runner.ts --example

# 从需求生成
npx ts-node cli-runner.ts --from-requirement "创建产品管理模块..."

# 从JSON配置生成
npx ts-node cli-runner.ts --config '{"entityName":"Product",...}'
```

## 扩展指南

### 添加新的字段类型

1. 在 `map_type_to_drizzle()` 中添加映射
2. 在 `map_type_to_typebox()` 中添加验证器
3. 更新SKILL.md文档

### 添加新的特殊需求

1. 在 `generate_schema()` 中处理新需求
2. 在 `generate_contract()` 中添加相关DTO
3. 在 `generate_service()` 中实现逻辑
4. 更新SKILL.md文档

### 自定义代码生成

修改 `generate_*()` 函数中的模板代码即可自定义生成逻辑。

## 限制与注意

1. **目前的简单实现** - 生成的Service和Controller仅包含基本CRUD框架，复杂业务逻辑需要手动编写

2. **类型推导** - 某些复杂的TypeScript类型可能需要手动调整

3. **关系映射** - 暂不支持自动生成一对多、多对多关系

4. **中间件** - 暂不支持自动集成认证、日志等中间件

5. **错误处理** - 生成的代码需要添加更完善的错误处理

## 下一步改进

- [ ] 支持关系定义（外键、一对多、多对多）
- [ ] 支持自定义验证规则生成
- [ ] 支持生成单元测试
- [ ] 支持生成数据库迁移脚本
- [ ] 支持生成文档和API定义（OpenAPI/Swagger）
- [ ] 支持生成前端请求客户端代码
- [ ] 更智能的自然语言解析

## 许可

MIT

## 联系方式

如有问题或建议，欢迎提出Issues或Pull Requests。
