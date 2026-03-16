---
name: create-skill
description: 创建 Claude Code Skill - 扩展 Claude Code 的功能。Skill 是包含系统提示的文件，定义了 AI 助手在特定任务中的行为和专业知识。
---

# 创建 Claude Code Skill

> 创建和配置 Claude Code Skills 以扩展 AI 助手的功能。

**Skill** 是包含系统提示的文件，定义了 Claude Code 在特定任务中的行为、专业知识和工作流程。Skills 可以让 Claude Code 成为特定领域的专家，提供一致的专业级输出。

## 概述

创建 Skill 涉及：

1. **确定 Skill 范围**：定义 Skill 要解决的具体问题或领域
2. **创建 SKILL.md**：编写包含 frontmatter 和系统提示的文件
3. **配置 Plugin**：将 Skill 添加到 plugin 或直接使用
4. **测试和迭代**：验证 Skill 行为并优化

## Skill 文件结构

### 基本结构

```markdown
---
name: my-skill
description: 简短描述技能的功能
disable-model-invocation: false
---

# Skill 标题

这里是 skill 的详细说明...
```

### Frontmatter 字段

| 字段 | 类型 | 必需 | 描述 |
|:-----|:-----|:----:|:-----|
| `name` | string | 是 | Skill 标识符（kebab-case）|
| `description` | string | 是 | 简短描述，用于 skill 发现和选择 |
| `disable-model-invocation` | boolean | 否 | 是否禁用模型调用（默认：false）|

## 创建 Skill 的步骤

### 步骤 1：确定 Skill 用途

明确 Skill 要解决的具体问题：

- ✅ 好的 Skill：代码审查、API 生成、测试编写
- ❌ 不好的 Skill：通用编程、做所有事情

### 步骤 2：创建目录结构

```bash
# 在 plugin 中创建 skill
mkdir -p my-plugin/.claude-plugin
mkdir -p my-plugin/skills/my-skill

# 或创建独立的 skill 文件
mkdir -p skills/my-skill
```

### 步骤 3：编写 SKILL.md

```markdown
---
name: code-reviewer
description: Review code for bugs, security issues, and best practices
---

# Code Review Skill

Review code changes for:
- Potential bugs and edge cases
- Security vulnerabilities
- Performance issues
- Code style and consistency
- Best practices violations

## Review Process

1. **Understand Context**: Analyze the code's purpose
2. **Check Issues**: Look for problems in priority order
3. **Provide Feedback**: Give actionable suggestions
4. **Explain Why**: Help developers understand the reasoning

## Output Format

Provide feedback in this format:

### Critical Issues
- [Issue description]

### Suggestions
- [Suggestion with reasoning]

### Positive Notes
- [What was done well]
```

### 步骤 4：配置 Plugin（如果使用）

创建 `.claude-plugin/plugin.json`：

```json
{
  "name": "my-plugin",
  "description": "My awesome plugin",
  "version": "1.0.0",
  "skills": ["./skills/my-skill"]
}
```

## Skill 最佳实践

### 1. 明确的触发条件

在描述中说明何时应该使用此 Skill：

```markdown
## When to Use

Trigger this skill when:
- User asks to review code
- User mentions "security audit"
- User wants to check for bugs
```

### 2. 结构化的内容

使用清晰的标题和章节：

```markdown
## Overview
Brief explanation

## Step-by-Step
1. First step
2. Second step

## Examples
Concrete examples
```

### 3. 具体的指令

避免模糊的指示，给出明确的方向：

❌ 不好的指令：
```
Make the code better.
```

✅ 好的指令：
```
Review the code for:
1. Memory leaks
2. Unhandled promises
3. Missing error handling
4. Type safety issues
```

### 4. 包含示例

提供具体的使用示例：

```markdown
## Example

Input:
```typescript
function getData(url: string) {
  return fetch(url)
}
```

Output:
The function should:
- Add error handling
- Specify return type
- Add timeout handling
- Add request validation
```

## Skill 类型和模式

### 1. 分析型 Skill

用于审查、分析和评估：

```markdown
---
name: security-auditor
description: Analyze code for security vulnerabilities
---

# Security Auditor

Analyze code for:
- SQL injection risks
- XSS vulnerabilities
- Authentication issues
- Authorization flaws
- Crypto implementation errors
```

### 2. 生成型 Skill

用于创建代码、文档、测试：

```markdown
---
name: test-generator
description: Generate comprehensive unit tests
---

# Test Generator

Generate tests that cover:
- Happy path scenarios
- Edge cases
- Error conditions
- Boundary values
```

### 3. 转换型 Skill

用于重构、迁移、格式化：

```markdown
---
name: js-to-ts-migrator
description: Migrate JavaScript code to TypeScript
---

# JS to TS Migrator

Migrate code by:
1. Adding type annotations
2. Creating interfaces for objects
3. Using generics for flexibility
4. Handling any types properly
```

### 4. 交互型 Skill

用于引导用户完成复杂任务：

```markdown
---
name: project-scaffolder
description: Guide through project setup
---

# Project Scaffolder

Guide the user through:
1. Choosing project type
2. Selecting dependencies
3. Setting up structure
4. Configuring tooling
5. Writing initial code
```

## 高级功能

### 禁用模型调用

对于不需要调用其他工具的 Skill：

```markdown
---
disable-model-invocation: true
---
```

这在以下场景有用：
- 纯分析任务
- 生成标准输出
- 提供静态建议

### 引用其他 Skills

创建 Skill 链：

```markdown
For complex projects, also use:
- /database-design - for schema planning
- /api-generator - for endpoint creation
```

### 动态内容

使用条件逻辑：

```markdown
If the code is React:
- Check for proper hooks usage
- Verify component structure
- Look for performance issues

If the code is Node.js:
- Check async handling
- Verify error management
- Look for memory leaks
```

## 完整示例：Elysia 开发 Skill

```markdown
---
name: elysia-developer
description: Expert ElysiaJS framework assistant for building type-safe backends
---

# ElysiaJS Developer

Expert assistance for building backend applications with ElysiaJS framework.

## Core Competencies

- Type-safe route definitions
- Schema validation with TypeBox
- Plugin development
- Error handling patterns
- Testing strategies

## Project Structure

```
src/
├── modules/
│   ├── feature-a/
│   │   ├── feature-a.model.ts
│   │   ├── feature-a.service.ts
│   │   └── feature-a.ts
│   └── feature-b/
└── index.ts
```

## Common Patterns

### Basic Route

```typescript
import { Elysia, t } from 'elysia'

.get('/users', () => User.findMany())
.post('/user', ({ body }) => User.create({
  data: body
}), {
  body: t.Object({
    name: t.String(),
    email: t.String({ format: 'email' })
  })
})
```

### Error Handling

```typescript
import { status } from 'elysia'

.get('/user/:id', async ({ params: { id } }) => {
  const user = await User.findUnique({ where: { id } })
  
  if (!user) {
    return status(404, 'User not found')
  }
  
  return user
})
```

## Best Practices

1. Always define response schemas
2. Use guards for shared validation
3. Implement proper error handling
4. Write tests for all routes
5. Use命名空间 for model organization

## When to Use

Trigger this skill when:
- Creating ElysiaJS routes
- Setting up validation
- Implementing authentication
- Adding plugins
- Writing Elysia tests
```

## 测试你的 Skill

### 本地测试

1. 将 Skill 放入 plugin 目录
2. 安装 plugin：`/plugin install my-plugin`
3. 触发 skill：`/my-skill` 或通过对话触发

### 验证清单

- [ ] 描述清晰说明 Skill 用途
- [ ] 触发条件明确
- [ ] 输出格式一致
- [ ] 包含具体示例
- [ ] 处理边缘情况
- [ ] 提供可操作的建议

## 调试技巧

### Skill 未触发

1. 检查 description 是否清晰
2. 确认 skill 已安装
3. 尝试更明确的触发词

### 输出不理想

1. 添加更具体的指令
2. 包含更多示例
3. 明确输出格式
4. 添加约束条件

## 发布你的 Skill

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
2. 包含清晰的 README
3. 添加使用示例
4. 发布到 marketplace
```

## 资源

- [Claude Code Plugins 文档](https://code.claude.com/docs/plugins)
- [Plugin Marketplace](https://code.claude.com/docs/discover-plugins)
- [最佳实践指南](https://code.claude.com/docs/best-practices)
