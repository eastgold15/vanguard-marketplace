---
name: create-skill
description: 创建高质量 Claude Code Skills。从实际专业知识出发，编写精炼、可迭代的技能文件。
---

# 创建 Claude Code Skill

编写高质量的 Skills，让 Claude Code 成为特定领域的专家助手。

## 核心原则

### 从真实专业知识出发

❌ **不要**：仅依赖 LLM 的通用知识创建技能
✅ **应该**：从实际任务中提取可复用的模式

**来源渠道：**
1. **实际任务执行** - 在对话中完成任务，记录成功步骤、修正点、输入输出格式
2. **项目文档综合** - 从内部文档、API 规范、代码审查评论、版本控制历史中提取
3. **失败案例分析** - 从真实的失败案例和解决方案中学习

### 用真实执行来优化

创建 → 执行 → 修订的循环：

```bash
# 第一次执行真实任务
/skill-trigger "执行实际任务"

# 分析执行追踪，找出问题
# - 哪些步骤浪费了时间？
# - 哪些指令太模糊？
# - 哪些内容不相关？

# 修订 skill 并再次执行
```

### 节省上下文

**添加 Agent 缺乏的，省略 Agent 已知的：**

- ✅ 项目特定约定、领域特定流程、非显而易见的边缘情况
- ❌ 什么是 PDF、HTTP 如何工作、数据库迁移是什么

**设计连贯单元：**
- 技能范围应封装一个连贯的工作单元
- 太窄：多个技能加载，开销大且指令冲突
- 太宽：难以精确触发

**渐进式披露：**
- `SKILL.md` 保持在 500 行、5000 token 以下
- 详细参考材料放入 `references/` 目录
- 告诉 Agent **何时**加载每个文件

````markdown
<!-- 好：按需加载 -->
读取 `references/api-errors.md` **当** API 返回非 200 状态码时

<!-- 差：通用指示 -->
详见 references/ 目录
````

## 基本结构

```markdown
---
name: my-skill
description: 具体描述技能功能和使用场景
disable-model-invocation: false
---

# Skill 标题

[核心指令 - Agent 在每次运行时都需要的内容]
```

### Frontmatter 字段

| 字段 | 类型 | 必需 | 描述 |
|:-----|:-----|:----:|:-----|
| `name` | string | 是 | Skill 标识符（kebab-case）|
| `description` | string | 是 | 简短描述，用于 skill 发现和选择 |
| `disable-model-invocation` | boolean | 否 | 是否禁用模型调用（默认：false）|

## 校准控制

### 匹配具体性与脆弱性

**给 Agent 自由**（多种方法有效时）：

````markdown
## 代码审查流程

1. 检查所有数据库查询的 SQL 注入（使用参数化查询）
2. 验证每个端点的认证检查
3. 查找并发代码路径中的竞态条件
4. 确认错误消息不泄露内部细节
````

**精确指令**（操作脆弱、一致性重要时）：

````markdown
## 数据库迁移

**严格按以下顺序执行：**

```bash
python scripts/migrate.py --verify --backup
```

不要修改命令或添加额外标志。
````

### 提供默认值，而非菜单

````markdown
<!-- 差：太多选项 -->
你可以使用 pypdf、pdfplumber、PyMuPDF 或 pdf2image...

<!-- 好：清晰的默认值 + 逃生路径 -->
使用 pdfplumber 进行文本提取：

```python
import pdfplumber
```

**例外**：对于需要 OCR 的扫描 PDF，改用 pdf2image + pytesseract。
````

### 优先程序而非声明

````markdown
<!-- 差：特定答案 - 仅适用于此特定任务 -->
连接 `orders` 表到 `customers`，条件 `customer_id`，
过滤 `region = 'EMEA'`，求和 `amount` 列。

<!-- 好：可复用方法 - 适用于任何分析查询 -->
1. 从 `references/schema.yaml` 读取 schema 找到相关表
2. 使用 `_id` 外键约定连接表
3. 将用户请求的过滤器应用为 WHERE 子句
4. 聚合数值列并格式化为 markdown 表格
````

## 有效指令模式

### 输出格式模板

````markdown
## 报告结构

使用此模板，根据具体分析调整章节：

```markdown
# [分析标题]

## 执行摘要
[关键发现的一段概述]

## 主要发现
- 支持数据的发现 1
- 支持数据的发现 2

## 建议
1. 具体可操作的建议
2. 具体可操作的建议
```
````

### 多步骤工作流检查清单

````markdown
## 表单处理工作流

进度：
- [ ] 步骤 1：分析表单（运行 `scripts/analyze_form.py`）
- [ ] 步骤 2：创建字段映射（编辑 `fields.json`）
- [ ] 步骤 3：验证映射（运行 `scripts/validate_fields.py`）
- [ ] 步骤 4：填充表单（运行 `scripts/fill_form.py`）
- [ ] 步骤 5：验证输出（运行 `scripts/verify_output.py`）
````

### 验证循环

````markdown
## 编辑工作流

1. 进行编辑
2. 运行验证：`python scripts/validate.py output/`
3. 如果验证失败：
   - 审查错误消息
   - 修复问题
   - 再次运行验证
4. 仅在验证通过后继续
````

### 计划-验证-执行

````markdown
## PDF 表单填充

1. 提取表单字段：`python scripts/analyze_form.py input.pdf` → `form_fields.json`
   （列出每个字段名称、类型和是否必填）

2. 创建 `field_values.json`，将每个字段名映射到其预期值

3. 验证：`python scripts/validate_fields.py form_fields.json field_values.json`
   （检查每个字段名存在于表单中、类型兼容、必填字段不缺失）

4. 如果验证失败，修订 `field_values.json` 并重新验证

5. 填充表单：`python scripts/fill_form.py input.pdf field_values.json output.pdf`
````

**关键成分**：步骤 3 的验证脚本，检查计划（`field_values.json`）与真实源（`form_fields.json`）。

### 打包可复用脚本

在技能迭代中，比较 Agent 的执行追踪。如果注意到 Agent 每次都独立重新发明相同的逻辑 —— 构建图表、解析特定格式、验证输出 —— 这是信号：编写一次测试脚本并打包到 `scripts/`。

## 创建流程

### 1. 确定技能范围

明确技能要解决的具体问题：

```
✅ 好的技能：代码审查、API 生成、测试编写
❌ 不好的技能：通用编程、做所有事情
```

### 2. 创建目录结构

```bash
# 在 plugin 中创建 skill
mkdir -p my-plugin/.claude-plugin
mkdir -p my-plugin/skills/my-skill
mkdir -p my-plugin/skills/my-skill/references
mkdir -p my-plugin/skills/my-skill/scripts
mkdir -p my-plugin/skills/my-skill/assets
```

### 3. 编写 SKILL.md

```markdown
---
name: code-reviewer
description: 审查代码的 bug、安全问题和最佳实践
---

# 代码审查技能

## 审查要点

按优先级检查：
1. **安全问题** - SQL 注入、XSS、认证漏洞
2. **关键 bug** - 空指针、竞态条件、资源泄漏
3. **性能问题** - N+1 查询、内存泄漏、阻塞调用
4. **代码质量** - 可读性、可维护性、测试覆盖

## 输出格式

```markdown
## 🔴 关键问题
[必须修复的问题]

## ⚠️ 建议
[改进建议]

## ✅ 做得好的地方
[正面反馈]
```
```

### 4. 配置 Plugin

创建 `.claude-plugin/plugin.json`：

```json
{
  "name": "my-plugin",
  "description": "My awesome plugin",
  "version": "1.0.0",
  "skills": ["./skills/my-skill"]
}
```

## 技能类型模式

### 分析型

用于审查、分析、评估：

```markdown
---
name: security-auditor
description: 分析代码安全漏洞
---

# 安全审计器

分析以下内容：
- SQL 注入风险（检查字符串拼接查询）
- XSS 漏洞（检查未转义的输出）
- 认证问题（检查缺少的权限检查）
- 授权缺陷（检查不正确的角色验证）
- 加密实现错误（检查不安全的加密算法）
```

### 生成型

用于创建代码、文档、测试：

```markdown
---
name: test-generator
description: 生成全面的单元测试
---

# 测试生成器

为以下场景生成测试：
1. **正常路径** - 预期输入和成功场景
2. **边缘情况** - 空值、边界值、极限值
3. **错误条件** - 无效输入、网络错误、超时
4. **集成场景** - 与其他组件的交互
```

### 转换型

用于重构、迁移、格式化：

```markdown
---
name: elysia-migrator
description: 将 Express 路由迁移到 Elysia
---

# Elysia 迁移器

## 迁移步骤

1. **提取请求处理逻辑**
   - 将 `(req, res)` 参数改为 `({ body, params, query, headers })`
   - 将 `res.json()` 改为 `return` 语句

2. **添加 TypeBox 验证**
   - 为 request body 创建 schema
   - 为 response 创建 schema

3. **错误处理**
   - 将 `next(err)` 改为 `throw new Error()`
   - 使用 Elysia 的错误处理插件

## 模板转换

```typescript
// Express
app.post('/users', (req, res) => {
  res.json({ id: 1, name: req.body.name })
})

// Elysia
.post('/users', ({ body }) => ({ id: 1, name: body.name }), {
  body: t.Object({ name: t.String() }),
  response: t.Object({
    id: t.Number(),
    name: t.String()
  })
})
```
```

### 交互型

用于引导完成复杂任务：

```markdown
---
name: elysia-module-scaffolder
description: 引导创建 Elysia 模块
---

# Elysia 模块脚手架

引导用户完成以下步骤：

## 步骤 1：确定模块范围

提问：
- 模块名称是什么？
- 需要哪些数据库表？
- 需要哪些 API 端点？

## 步骤 2：生成文件结构

```
src/modules/<module-name>/
├── <module-name>.schema.ts    # Drizzle 表定义
├── <module-name>.model.ts     # TypeScript 类型
├── <module-name>.service.ts   # 业务逻辑
└── <module-name>.ts           # 路由控制器
```

## 步骤 3：生成代码

根据步骤 1 的答案，生成每个文件的内容。

## 步骤 4：验证

运行以下命令验证：
- `bun run typecheck` - 检查类型
- `bun run lint` - 检查代码风格
```

## 测试和迭代

### 本地测试

```bash
# 1. 安装 plugin
/plugin install my-plugin

# 2. 触发 skill
/skill-name "执行实际任务"

# 3. 检查执行追踪
# 寻找：
# - 浪费时间的步骤
# - 不适用的指令
# - 缺失的关键信息

# 4. 修订并重试
```

### 验证清单

- [ ] 描述清晰说明技能用途和触发场景
- [ ] 包含具体的输入/输出示例
- [ ] 指令具体（避免"适当处理"之类的模糊语言）
- [ ] 处理边缘情况和错误条件
- [ ] 输出格式一致
- [ ] 代码示例可运行
- [ ] 文件路径准确
- [ ] 依赖明确列出

### 调试技巧

| 问题 | 可能原因 | 解决方案 |
|:-----|:---------|:---------|
| Skill 未触发 | description 不清晰 | 添加具体触发场景关键词 |
| 输出不符合预期 | 指令太模糊 | 添加具体示例和约束 |
| Agent 忽略指令 | 指令不适用 | 添加条件判断 |
| 上下文溢出 | 内容太长 | 移动详细内容到 references/ |

## 发布

### 作为 Plugin 的一部分

```json
{
  "name": "my-plugin",
  "skills": ["./skills/my-skill"],
  "description": "Plugin containing my awesome skill"
}
```

### 独立分发

1. 创建 GitHub 仓库
2. 包含清晰的 README（使用案例、示例）
3. 添加测试用例
4. 发布到 marketplace

## 资源

- [Claude Code Plugins 文档](https://code.claude.com/docs/plugins)
- [Skill 评估指南](https://agentskills.io/skill-creation/evaluating-skills)
- [优化 Skill 描述](https://agentskills.io/skill-creation/optimizing-descriptions)
