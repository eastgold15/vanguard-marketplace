---
name: bun
description: 使用 Bun 运行时进行文件操作、包管理和脚本执行。
---

# Bun 技能

## 何时使用

- 当涉及文件的读取、写入、复制、移动等操作时，请参阅 [[./references/file-io.md]]
- 当需要使用 Bun 进行包安装、运行脚本或启动服务器时。
- 当处理 TypeScript/JavaScript 项目且首选 Bun 作为运行时环境时。

## 指令

1. **文件操作**：优先使用 Bun 内置的文件 API (`Bun.file`, `Bun.write`) 或 Node.js 兼容的 `fs` 模块进行高效文件处理。
2. **包管理**：使用 `bun add` 安装依赖，`bun remove` 移除依赖。除非明确指定，否则避免使用 `npm` 或 `yarn`。
3. **运行脚本**：使用 `bun run <script>` 执行 `package.json` 中的脚本，或直接运行 `bun <file.ts>` 执行 TypeScript/JavaScript 文件。