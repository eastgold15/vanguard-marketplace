---
name: formself
description: 形神系统 - 用 /formSelf 让AI管理你的实体知识库（学习、查询、表达）
version: 1.0.0
---

# FormSelf 形神系统技能

## 概述

这个技能让你通过 `/formSelf` 斜杠命令来管理 **FormSelf 形神系统**。所有数据都存储在项目的 `data/entities/` 目录中，与现有的 Bun CLI 版本共享。

## 命令格式

```
/formSelf learn <实体名> <描述文本> [--context <场景>]
/formSelf express <实体名> [--context <场景>]
/formSelf list
/formSelf what <实体名> [--context <场景>]
/formSelf forget <实体名>
```

## 命令详细说明

### 1. `/formSelf learn <实体名> <描述文本> [--context <场景>]`

让形神系统学习一个实体的新信息。

**参数：**
- `<实体名>` — 必须，实体名称（如 Tori、Python项目、MacBook等）
- `<描述文本>` — 必须，描述该实体的自然语言文本
- `--context <场景>` — 可选，场景标签（如 academic、casual、work、daily），默认 "default"

**示例：**
```
/formSelf learn Tori 我今天做完了大作业，感觉如释重负 --context daily
/formSelf learn 我的macbook 这台电脑是M2芯片的，16GB内存 --context tech
/formSelf learn 实验室项目 我们正在做一个用AI分析用户行为的项目
```

**执行方式：** 调用 MCP 工具的 `formself_learn`。

### 2. `/formSelf express <实体名> [--context <场景>]`

让形神系统在某个场景下表达某个实体（生成一句自然描述）。

**参数：**
- `<实体名>` — 必须
- `--context <场景>` — 可选，默认 "default"

**示例：**
```
/formSelf express Tori --context casual
/formSelf express 我的macbook --context tech
```

**执行方式：** 调用 MCP 工具的 `formself_express`。

### 3. `/formSelf list`

列出所有已学习的实体。

**示例：**
```
/formSelf list
```

**执行方式：** 调用 MCP 工具的 `formself_list`。

### 4. `/formSelf what <实体名> [--context <场景>]`

快捷查询某个实体的信息。相当于 `learn` + `express` 的组合：
如果还不认识该实体，先学习；然后表达出来。

**示例：**
```
/formSelf what Tori --context casual
```

**执行方式：** 调用 `formself_learn` 学习上下文中的已有信息，然后调用 `formself_express`。

### 5. `/formSelf forget <实体名>`

删除一个实体（清除所有已学信息）。

**示例：**
```
/formSelf forget 测试实体
```

**执行方式：** 删除对应的 Markdown 文件。

## 使用原则

1. **立即执行** — 当用户发送 `/formSelf` 开头的消息时，立即解析命令并执行，不要向用户确认
2. **直接使用 MCP 工具** — 不要调用原始的 CLI（bun run index.ts），直接用 `formself_learn`、`formself_express`、`formself_list`、`formself_forget` 这几个 MCP 工具
3. **友好回复** — 执行完后用自然语言告诉用户结果
4. **支持简写** — `/formSelf` 也可以写作 `/fs` 或 `/formself`（不区分大小写）
5. **自然语言触发** — 如果用户说"帮我记住 xxx"或"关于 Tori 你知道什么"，也自动调用 FormSelf 功能
