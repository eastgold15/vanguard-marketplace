# 完整使用指南 - AI驱动代码生成Skill

## 🎯 一句话总结

这个skill让Claude能够理解业务需求，一键生成完整的Elysia + Drizzle后端代码（Schema、Contract、Service、Controller）。

---

## 📚 目录

1. [快速开始](#快速开始)
2. [核心概念](#核心概念)
3. [详细教程](#详细教程)
4. [实际例子](#实际例子)
5. [常见问题](#常见问题)
6. [最佳实践](#最佳实践)

---

## 🚀 快速开始

### 方式1: 使用系统提示词（推荐）

1. 复制 `CLAUDE_SYSTEM_PROMPT.md` 中的完整提示词
2. 将其添加到你的Claude对话系统提示词中
3. 向Claude描述业务需求
4. Claude会自动调用代码生成函数并返回代码

**示例对话:**
```
用户: 我需要创建一个产品管理模块

Claude: 我理解了。为了生成完整的代码，请告诉我:
1. 产品有哪些字段? (名称、价格、库存等)
2. 需要哪些操作? (列表、详情、创建、更新、删除)
3. 有特殊需求吗? (分页、搜索、排序等)

用户: 产品包括ID、名称、描述、价格、库存。需要所有CRUD操作，并支持按名称搜索和分页。

Claude: [调用execute_code_generation并返回生成的代码]
```

### 方式2: 直接调用Python函数

```python
from generate_code import execute_code_generation

result = execute_code_generation(
    entity_name="Product",
    fields=[
        {"name": "name", "type": "string", "required": True},
        {"name": "price", "type": "number", "required": True},
    ],
    operations=["list", "detail", "create", "update", "delete"],
)

print(result["schema"])      # 查看Schema代码
print(result["contract"])    # 查看Contract代码
print(result["service"])     # 查看Service代码
print(result["controller"])  # 查看Controller代码
```

### 方式3: 使用TypeScript CLI

```bash
# 从业务需求生成
npx ts-node cli-runner.ts --from-requirement "创建产品管理模块，包含名称、价格、库存"

# 从JSON配置生成
npx ts-node cli-runner.ts --config '{
  "entityName": "Product",
  "fields": [
    {"name": "name", "type": "string", "required": true}
  ],
  "operations": ["list", "create"]
}'

# 运行完整示例
npx ts-node cli-runner.ts --example
```

---

## 🧠 核心概念

### 三层架构

```
┌─────────────────────────────────────────┐
│  API客户端 (Frontend / Third-party)     │
└──────────────────┬──────────────────────┘
                   │ HTTP Request/Response
                   ↓
┌─────────────────────────────────────────────────┐
│  Controller 层 (HTTP API定义)                   │
│  - 路由定义: GET /products, POST /products      │
│  - 参数验证: 使用Contract中的DTO               │
│  - 错误处理: HTTP状态码和错误信息              │
└──────────────────┬──────────────────────────────┘
                   │
                   ↓
┌─────────────────────────────────────────────────┐
│  Service 层 (业务逻辑)                          │
│  - 数据查询: list, findById, create等           │
│  - 业务规则: 验证、转换、聚合逻辑              │
│  - 数据访问: 使用Drizzle ORM操作数据库         │
└──────────────────┬──────────────────────────────┘
                   │
                   ↓
┌─────────────────────────────────────────────────┐
│  Contract 层 (数据契约)                         │
│  - DTO定义: ProductInsertFields, ProductResponse│
│  - 验证器: TypeBox T.Object() 定义              │
│  - 类型定义: TypeScript types和interfaces      │
└──────────────────┬──────────────────────────────┘
                   │
                   ↓
┌─────────────────────────────────────────────────┐
│  Schema 层 (数据结构)                           │
│  - 表定义: Drizzle sqliteTable()定义            │
│  - 字段约束: 类型、not null、主键等             │
│  - 索引定义: 性能优化                          │
└──────────────────┬──────────────────────────────┘
                   │
                   ↓
┌─────────────────────────────────────────────────┐
│  数据库 (SQLite / PostgreSQL)                   │
└─────────────────────────────────────────────────┘
```

### 工作流程

```
业务需求 (自然语言)
    │
    ↓
Claude 理解和分析
    │
    ├─ 识别实体 → Product
    ├─ 提取字段 → [name, price, stock, ...]
    ├─ 确定操作 → [list, detail, create, update, delete]
    └─ 识别特需 → [分页, 搜索, 排序]
    │
    ↓
调用 execute_code_generation()
    │
    ├─ generate_schema() → productTable定义
    ├─ generate_contract() → ProductFields, ProductQuery, ProductResponse
    ├─ generate_service() → ProductService.list(), create()等
    └─ generate_controller() → ProductController.get(), post()等
    │
    ↓
返回生成的代码 + 集成指导
    │
    ↓
开发者集成到项目中
    │
    └─ 复制文件
      └─ 注册路由
         └─ 手动调整业务逻辑
            └─ 添加权限和错误处理
```

---

## 📖 详细教程

### 步骤1: 准备业务需求

清晰地定义你的业务需求。最好包含:

```
【业务名称】
订单管理系统

【实体说明】
Order - 订单实体

【字段列表】
- orderId: 订单号 (string, required)
- customerId: 客户ID (uuid, required)
- totalAmount: 总金额 (number, required)
- orderDate: 订单日期 (date, required)
- status: 订单状态 (string, required) - 枚举: pending/completed/cancelled
- description: 订单描述 (string, optional)

【所需操作】
- list: 查看订单列表（分页、按状态过滤、按日期排序）
- detail: 查看订单详情
- create: 创建新订单
- update: 更新订单状态
- delete: 取消订单（逻辑删除）

【特殊需求】
- 分页: 每页10条
- 搜索: 按订单号模糊搜索
- 排序: 按订单日期倒序
- 软删除: 使用status而非硬删除
```

### 步骤2: 向Claude描述需求

直接告诉Claude你的业务需求。Claude会：
1. 确认理解
2. 提出澄清问题
3. 调用代码生成函数

**对话示例:**
```
用户: 我需要一个订单管理模块。订单包含订单号、客户ID、总金额、订单日期和状态。
需要支持列表、详情、创建、更新和删除。列表要支持分页、搜索和排序。

Claude: 我已经理解了。让我为您生成完整的代码：

[调用 execute_code_generation(
    entity_name="Order",
    fields=[
        {"name": "orderId", "type": "string", "required": True},
        {"name": "customerId", "type": "uuid", "required": True},
        {"name": "totalAmount", "type": "number", "required": True},
        {"name": "orderDate", "type": "date", "required": True},
        {"name": "status", "type": "string", "required": True},
        {"name": "description", "type": "string", "required": False},
    ],
    operations=["list", "detail", "create", "update", "delete"],
    special_requirements=["分页", "搜索", "排序"]
)]

已为您生成Order模块的完整代码...
```

### 步骤3: 集成生成的代码

生成的代码包含4个文件：

#### 3.1 order.schema.ts
```typescript
// 1. 复制到 packages/contract/src/schema/
// 2. 定义数据库表结构
// 3. 包含所有字段和约束
```

#### 3.2 order.contract.ts
```typescript
// 1. 复制到 packages/contract/src/contract/
// 2. 定义DTO和验证规则
// 3. 包含TypeBox验证器定义
```

#### 3.3 order.service.ts
```typescript
// 1. 复制到 apps/b2badmin/server/services/
// 2. 实现业务逻辑
// 3. 处理数据查询和操作
```

#### 3.4 order.controller.ts
```typescript
// 1. 复制到 apps/b2badmin/server/controllers/
// 2. 定义HTTP路由端点
// 3. 处理请求和响应
```

### 步骤4: 注册路由

在 `app-router.ts` 中注册新的控制器：

```typescript
import { OrderController } from './order.controller';

export const appRouter = new Elysia()
  .use(OrderController)
  // ... 其他控制器
  ;
```

### 步骤5: 手动调整

根据实际需求调整以下部分：

```typescript
// 1. Service中的业务逻辑
// 特别是list()方法中的查询过滤逻辑

// 2. 错误处理
// 添加try-catch和错误日志

// 3. 权限检查
// 在Controller中添加权限验证

// 4. 数据验证
// 增加更复杂的业务规则验证

// 5. 中间件集成
// 集成认证、日志、请求追踪等
```

---

## 💼 实际例子

### 例子1: 产品管理系统

**用户需求:**
```
我需要一个产品管理系统。产品有ID、名称、详细描述、价格、库存数量、
分类、是否在售和创建时间。
支持：
- 获取所有产品（分页、按分类过滤、按价格范围过滤、按名称搜索、按热度排序）
- 获取单个产品详情
- 添加新产品
- 编辑产品信息
- 下架产品（软删除）
```

**Claude处理:**

```python
execute_code_generation(
    entity_name="Product",
    fields=[
        {"name": "id", "type": "uuid", "required": True},
        {"name": "name", "type": "string", "required": True},
        {"name": "description", "type": "string", "required": True},
        {"name": "price", "type": "number", "required": True},
        {"name": "stock", "type": "integer", "required": True},
        {"name": "category", "type": "string", "required": True},
        {"name": "isActive", "type": "boolean", "required": False},
    ],
    operations=["list", "detail", "create", "update", "delete"],
    special_requirements=["分页", "搜索", "排序", "软删除"]
)
```

**生成的Contract示例:**
```typescript
export const ProductQuery = t.Object({
  ...PaginationParams,
  ...SortParams,
  nameSearch: t.Optional(t.String()),
  category: t.Optional(t.String()),
  priceMin: t.Optional(t.Number()),
  priceMax: t.Optional(t.Number()),
});
```

**需要手动调整的Service代码:**
```typescript
async list(query: ProductQuery) {
  const { skip, take, sortBy, order, nameSearch, category, priceMin, priceMax } = query;
  
  let queryBuilder = db.select().from(productsTable);
  
  // 搜索
  if (nameSearch) {
    queryBuilder = queryBuilder.where(
      like(productsTable.name, `%${nameSearch}%`)
    );
  }
  
  // 分类过滤
  if (category) {
    queryBuilder = queryBuilder.where(eq(productsTable.category, category));
  }
  
  // 价格范围
  if (priceMin !== undefined && priceMax !== undefined) {
    queryBuilder = queryBuilder.where(
      and(
        gt(productsTable.price, priceMin),
        lt(productsTable.price, priceMax)
      )
    );
  }
  
  // 排序
  if (sortBy === 'price') {
    queryBuilder = queryBuilder.orderBy(
      order === 'asc' ? asc(productsTable.price) : desc(productsTable.price)
    );
  }
  
  return queryBuilder.limit(take).offset(skip);
}
```

### 例子2: 用户认证系统

**用户需求:**
```
创建用户系统。用户表包含ID、邮箱、用户名、密码哈希、头像URL、
是否验证邮箱、上次登录时间。需要：
- 用户注册
- 用户登录  
- 获取用户列表（分页、可搜索）
- 获取用户详情
- 更新用户信息
- 删除用户账户
```

**注意事项:**

1. **密码安全**
   - 生成的代码将密码作为普通字符串
   - 需要手动添加密码加密逻辑
   - 使用bcrypt或类似库

2. **认证逻辑**
   - 需要添加JWT token生成
   - 添加登录验证逻辑
   - 添加邮箱验证流程

3. **权限控制**
   - 用户只能修改自己的信息
   - 管理员可以修改任何用户
   - 需要添加权限检查中间件

**改进的Service代码片段:**
```typescript
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

export class UserService {
  async register(data: UserInsert) {
    // 检查邮箱是否已存在
    const existing = await db.select().from(usersTable)
      .where(eq(usersTable.email, data.email));
    
    if (existing.length > 0) {
      throw new Error('邮箱已被注册');
    }
    
    // 加密密码
    const hashedPassword = await bcrypt.hash(data.password, 10);
    
    // 创建用户
    return db.insert(usersTable).values({
      ...data,
      password: hashedPassword,
    });
  }
  
  async login(email: string, password: string) {
    const user = await db.select().from(usersTable)
      .where(eq(usersTable.email, email))
      .get();
    
    if (!user) {
      throw new Error('用户不存在');
    }
    
    // 验证密码
    const passwordMatch = await bcrypt.compare(password, user.password);
    if (!passwordMatch) {
      throw new Error('密码错误');
    }
    
    // 生成JWT token
    const token = jwt.sign(
      { id: user.id, email: user.email },
      process.env.JWT_SECRET!
    );
    
    // 更新登录时间
    await this.update(user.id, { lastLoginAt: new Date() });
    
    return { user, token };
  }
}
```

### 例子3: 订单系统（复杂场景）

**用户需求:**
```
创建订单和订单项系统。
订单表: ID、订单号、客户ID、总金额、订单状态、创建时间、更新时间
订单项表: ID、订单ID、产品ID、购买数量、单价、小计
需要：
- 创建订单及其订单项（事务处理）
- 获取订单列表（分页、按状态过滤）
- 获取订单详情（包含订单项）
- 更新订单状态
- 取消订单及其订单项
```

**需要手动实现的关键部分:**

1. **事务处理**
```typescript
async createOrder(orderData: OrderInsert, items: OrderItemInsert[]) {
  // 需要使用数据库事务
  return db.transaction(async (trx) => {
    const order = await trx.insert(ordersTable).values(orderData);
    for (const item of items) {
      await trx.insert(orderItemsTable).values({
        ...item,
        orderId: order.id,
      });
    }
    return order;
  });
}
```

2. **级联操作**
```typescript
async cancelOrder(orderId: string) {
  return db.transaction(async (trx) => {
    await trx.update(ordersTable)
      .set({ status: 'cancelled' })
      .where(eq(ordersTable.id, orderId));
    
    await trx.update(orderItemsTable)
      .set({ status: 'cancelled' })
      .where(eq(orderItemsTable.orderId, orderId));
  });
}
```

3. **复杂查询**
```typescript
async findByIdWithItems(id: string) {
  const order = await db.select().from(ordersTable)
    .where(eq(ordersTable.id, id))
    .get();
  
  const items = await db.select().from(orderItemsTable)
    .where(eq(orderItemsTable.orderId, id));
  
  return { ...order, items };
}
```

---

## ❓ 常见问题

### Q1: 生成的代码如何处理错误?

**A:** 生成的基础代码没有错误处理。你需要手动添加：

```typescript
// Controller中
.post("/", async ({ body }) => {
  try {
    const service = new ProductService();
    return await service.create(body);
  } catch (error) {
    if (error.message.includes("duplicate")) {
      return { error: "产品已存在", status: 409 };
    }
    throw error; // Elysia会返回500
  }
})
```

### Q2: 如何处理关联数据（一对多、多对多）?

**A:** 目前生成器不支持关联关系。需要手动处理：

1. 在Schema中添加外键
2. 在Service中编写JOIN查询
3. 在Contract中定义嵌套类型

```typescript
// Schema中添加外键
export const ordersTable = sqliteTable('orders', {
  id: text('id').primaryKey(),
  customerId: text('customerId').notNull().references(() => customersTable.id),
  // ...
});

// Service中的JOIN查询
async findByIdWithItems(id: string) {
  return db.select().from(ordersTable)
    .leftJoin(orderItemsTable, eq(ordersTable.id, orderItemsTable.orderId))
    .where(eq(ordersTable.id, id));
}
```

### Q3: 如何添加权限控制?

**A:** 使用Elysia中间件：

```typescript
export const ProductController = new Elysia({ prefix: "/products" })
  .derive(({ request }) => {
    // 从请求头获取用户信息
    const token = request.headers.get('authorization');
    const user = verifyToken(token);
    
    if (!user) {
      throw new Error('未授权');
    }
    
    return { user };
  })
  .post("/", async ({ user, body }) => {
    // user信息已经可用
    const service = new ProductService();
    return service.create(body);
  });
```

### Q4: 生成的代码支持软删除吗?

**A:** 支持。需要手动实现：

```typescript
// Schema中添加deletedAt字段
export const productsTable = sqliteTable('products', {
  // ...
  deletedAt: numeric('deletedAt'),
});

// Service中修改list()
async list(query: any) {
  return db.select().from(productsTable)
    .where(isNull(productsTable.deletedAt)) // 只查询未删除
    .limit(query.take)
    .offset(query.skip);
}

// Service中修改delete()
async delete(id: string) {
  return db.update(productsTable)
    .set({ deletedAt: Date.now() })
    .where(eq(productsTable.id, id));
}
```

### Q5: 如何自定义生成的代码?

**A:** 修改 `generate_code.py` 中的生成函数：

```python
def generate_service(req: CodeGenerationRequest) -> str:
    """自定义Service生成逻辑"""
    # 编辑这个函数以改变生成的Service代码
    lines = [...]
    return "\n".join(lines)
```

### Q6: 可以生成前端代码吗?

**A:** 目前不支持。但生成的TypeScript类型可以直接在前端使用：

```typescript
// 前端中导入后端生成的类型
import type { Product, ProductQuery, ProductResponse } from '@/server/contract/product.contract';

// 使用类型进行API调用
async function fetchProducts(query: ProductQuery) {
  const response = await fetch('/api/products', { 
    method: 'GET',
    body: JSON.stringify(query)
  });
  return response.json() as Promise<ProductResponse[]>;
}
```

---

## 🎯 最佳实践

### 1. 清晰定义需求

```
❌ 不好:
"我需要一个产品表"

✅ 好:
"产品表需要: ID(UUID), 名称(string, 必填), 
描述(string, 可选), 价格(number), 库存(integer)。
支持列表(分页、搜索)、详情、创建、更新、删除"
```

### 2. 遵循命名规范

```
实体: PascalCase
  ✅ Product, UserAccount, OrderItem
  ❌ product, PRODUCT, productData

字段: camelCase
  ✅ productName, isActive, createdAt
  ❌ ProductName, product_name, PRODUCT_NAME

函数: camelCase + 动词
  ✅ getProductList, findById, createProduct
  ❌ GetProductList, get_product_list
```

### 3. 分离关注点

```typescript
// ❌ 不好: Service中混入HTTP逻辑
export class ProductService {
  async list(query: any) {
    return new Response(JSON.stringify(data)); // 错误！
  }
}

// ✅ 好: Service只处理业务逻辑
export class ProductService {
  async list(query: any) {
    // 纯业务逻辑，返回数据
    return data;
  }
}

// Controller处理HTTP
.get("/", async ({ query }) => {
  const service = new ProductService();
  return await service.list(query); // Elysia自动转换为HTTP响应
});
```

### 4. 逐步测试

```
1. 先生成基础模块（list和detail）
2. 测试是否正确集成
3. 再添加create、update
4. 最后添加delete和特殊需求
```

### 5. 重视类型安全

```typescript
// ❌ 不好: any类型
async list(query: any) {
  return db.select().from(table).limit(query.take);
}

// ✅ 好: 完整的类型定义
async list(query: ProductQuery): Promise<Product[]> {
  return db.select().from(table).limit(query.take);
}
```

### 6. 添加适当的验证

```typescript
// ✅ Contract中定义验证规则
export const ProductInsertFields = t.Object({
  name: t.String({ minLength: 1, maxLength: 255 }),
  price: t.Number({ minimum: 0 }),
  stock: t.Integer({ minimum: 0 }),
});

// Controller中使用验证
.post("/", async ({ body }) => {
  // body已经通过ProductInsertFields验证
  return await service.create(body);
}, { body: ProductInsertFields })
```

---

## 📞 获取帮助

1. 查看 `README.md` 了解更多技术细节
2. 查看 `SKILL.md` 了解skill定义
3. 查看 `CLAUDE_SYSTEM_PROMPT.md` 了解如何与Claude交互
4. 运行示例: `python generate_code.py`

---

## 📝 总结

这个skill提供了从业务需求到生成代码的完整流程：

1. **描述需求** → 清晰的业务描述
2. **Claude理解** → 提取关键信息
3. **自动生成** → 调用execute_code_generation()
4. **获取代码** → Schema、Contract、Service、Controller
5. **集成项目** → 复制文件、注册路由
6. **手动调整** → 添加业务逻辑、错误处理、权限控制

通过这个skill，开发效率可以提升2-3倍！
