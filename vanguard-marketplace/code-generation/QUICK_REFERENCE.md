# 🎴 快速参考卡 - AI代码生成

**打印此页保留在手边！**

---

## 🚀 30秒快速开始

```
1. Claude系统提示词 ← CLAUDE_SYSTEM_PROMPT.md
2. 向Claude描述需求
3. Claude调用 execute_code_generation()
4. 获取4个代码文件
5. 集成到项目
```

---

## 📋 核心函数签名

```python
execute_code_generation(
    entity_name: str,              # "Product"
    fields: List[dict],            # [{"name":"name","type":"string",...}]
    operations: List[str],         # ["list","create","update"]
    special_requirements: List[str] # ["分页","搜索"]
) -> dict  # 返回: {schema, contract, service, controller, router, status}
```

---

## 📊 支持的字段类型

| 类型 | Drizzle | TypeBox | 示例 |
|------|---------|---------|------|
| string | text | t.String() | 名称、邮箱 |
| number | real | t.Number() | 价格、评分 |
| integer | integer | t.Integer() | 库存、数量 |
| boolean | boolean | t.Boolean() | 激活状态 |
| date | timestamp | t.Date() | 生日 |
| datetime | timestamp | t.Date() | 创建时间 |
| uuid | text | t.String({format:'uuid'}) | ID |
| json | json | t.Record(...) | 配置 |

---

## 🔧 支持的操作

```
✅ list     → GET /entity (分页、排序、搜索)
✅ detail   → GET /entity/:id
✅ create   → POST /entity
✅ update   → PUT /entity/:id
✅ delete   → DELETE /entity/:id
```

---

## ⚙️ 支持的特殊需求

```
📄 分页      → offset/limit
🔍 搜索      → 模糊搜索
↕️ 排序      → 多字段排序
🗑️ 软删除   → deletedAt字段
⏰ 时间戳    → createdAt/updatedAt (自动)
```

---

## 🎯 命名规范

```
实体名:        PascalCase    Product, UserAccount
字段名:        camelCase     productName, isActive
函数名:        camelCase     getProductList, findById
常量名:        UPPER_SNAKE   MAX_PAGE_SIZE
表名:          snake_case    products, user_accounts
```

---

## 📁 生成的文件

```
product.schema.ts      → Drizzle表定义
product.contract.ts    → DTO和验证器
product.service.ts     → 业务逻辑(CRUD)
product.controller.ts  → API路由(HTTP)

集成步骤:
1. schema   → packages/contract/src/schema/
2. contract → packages/contract/src/contract/
3. service  → apps/b2badmin/server/services/
4. controller → apps/b2badmin/server/controllers/
5. 在 app-router.ts 注册控制器
```

---

## 💬 与Claude交互模板

```
我需要 [实体] 管理模块

包含字段:
- [字段1]: [类型], [必填/可选]
- [字段2]: [类型], [必填/可选]

所需操作:
- [list/detail/create/update/delete]

特殊需求:
- [分页/搜索/排序/软删除]

示例:
我需要产品管理模块
包含字段: name(string,必填), price(number,必填), stock(integer,必填)
所需操作: list, detail, create, update, delete
特殊需求: 分页, 搜索, 排序
```

---

## 🔍 常见检查清单

### 生成后的集成检查
- [ ] 文件已复制到正确的目录
- [ ] 导入路径已更新为项目路径
- [ ] 在 app-router.ts 中注册了控制器
- [ ] TypeScript编译无错误
- [ ] 测试基本的CRUD操作

### Service常见需要手动添加
- [ ] 错误处理 (try-catch)
- [ ] 权限检查 (用户是否有权限)
- [ ] 业务规则验证
- [ ] 日志记录
- [ ] 数据库事务 (如需要)

### Controller常见需要手动添加
- [ ] 认证中间件
- [ ] 错误响应格式
- [ ] 请求日志
- [ ] 速率限制
- [ ] CORS配置

---

## 🐛 常见问题速查

| 问题 | 解决方案 |
|------|---------|
| 密码字段安全 | 手动添加 bcrypt 加密 |
| 关联数据 | 手动编写 JOIN 查询 |
| 权限控制 | 添加 Elysia 中间件 |
| 软删除 | Schema 添加 deletedAt，Service 过滤 |
| 事务处理 | 使用 db.transaction() |
| 复杂验证 | 修改 Contract 中的验证器 |

---

## 🎬 5分钟快速演示流程

```
1. 打开 Claude (2秒)
2. 粘贴系统提示词 (10秒)
3. 输入业务需求 (30秒)
4. 等待代码生成 (20秒)
5. 复制代码到项目 (2分钟)
6. 测试CRUD操作 (1分钟)

总耗时: ~5分钟
```

---

## 📈 预期生成代码量

```
字段数  生成代码行数  人工编写时间
3       150行         45分钟
5       250行         90分钟
8       400行         2-3小时
10+     500+行        3小时+

使用此Skill的时间: 5分钟 ✨
```

---

## 🎯 最佳实践速记

```
1. 清晰定义需求
   ❌ "我需要一个产品表"
   ✅ "产品表: ID, 名称, 价格, 库存; 操作: CRUD; 需求: 分页搜索"

2. 遵循命名规范
   ✅ Product, productName, getProductList

3. 分离关注点
   ✅ Service: 业务逻辑  Controller: HTTP处理

4. 循序渐进
   第1步: 生成 list + detail
   第2步: 测试验证
   第3步: 添加 create + update
   第4步: 添加 delete

5. 重视类型
   ✅ 完整的TypeScript类型定义
   ❌ 避免 any 类型
```

---

## 🔗 文件导航

```
code-generation/
├─ SKILL.md                 → Skill定义和规范
├─ README.md                → 技术文档和API
├─ GETTING_STARTED.md       → 完整使用指南 ⭐
├─ CLAUDE_SYSTEM_PROMPT.md  → Claude提示词 ⭐
├─ generate_code.py         → 核心函数实现
├─ cli-runner.ts            → TypeScript包装
└─ COMPLETION_SUMMARY.md    → 项目总结

⭐ = 必读文件
```

---

## 💻 命令速查

```bash
# Python直接运行
python generate_code.py

# TypeScript CLI
npx ts-node cli-runner.ts --example
npx ts-node cli-runner.ts --from-requirement "..."
npx ts-node cli-runner.ts --config '{...}'
```

---

## 📞 求助指南

遇到问题的顺序:
1. 查看 GETTING_STARTED.md 的FAQ部分
2. 检查 SKILL.md 的规范定义
3. 审查 README.md 的API文档
4. 运行示例测试代码

---

## 🚦 状态指示

✅ **已完成**
- 纯函数代码生成
- TypeScript集成
- Claude系统提示词
- 完整文档

🟡 **可扩展**
- 新字段类型支持
- 新特殊需求
- 自定义模板

🔴 **暂不支持**
- 自动关联关系（FK）
- 单元测试生成
- 前端代码生成

---

## 🎓 学习路径

```
初级 (5分钟)
  └─ GETTING_STARTED.md 的快速开始部分

中级 (30分钟)
  ├─ 阅读SKILL.md理解规范
  └─ 看3个实际例子

高级 (2小时)
  ├─ 研究 generate_code.py 的实现
  ├─ 扩展自定义字段类型
  └─ 修改代码生成模板
```

---

## 🎁 核心价值

```
输入:  业务需求(自然语言) + 100字
       ↓
处理:  Claude理解 + 函数调用 (5分钟)
       ↓
输出:  生产级代码 + 4个文件 + 完整集成指导
       ↓
节省:  1.5-3小时的手动编写时间
```

---

**记住: 生成的代码是起点，业务逻辑需要手动完善！**

Good luck! 🚀
