# Vanguard Marketplace

Claude Code 插件市场 — 收集、管理和同步 Claude Code Skills、Agents 和 Commands。

## 项目结构

```
vanguard-marketplace/
├── skills/                              # 所有技能（真实文件 + Git 子模块）
│   ├── better-auth/                     # Better Auth 认证
│   ├── elysia/                          # ElysiaJS 框架
│   ├── code-generation/                 # AI 全栈代码生成
│   ├── react-component/                 # React 组件生成
│   ├── obsidian-*/                      # Obsidian 相关（markdown/cli/bases）
│   └── ...
│
├── plugins/                             # 插件组合配置（符号链接 → skills/）
├── src/
│   ├── sync_skills.ts                   # 同步远程技能（下载 + diff 合并）
│   ├── scan-skills.ts                   # 扫描本地技能，更新配置
│   ├── soft-link.ts                     # 从外部目录创建软链接到 skills/
│   ├── sync-watch.ts                    # 实时监听外部目录，自动同步到 skills/
│   ├── sources.json                     # 技能来源配置
│   └── type.d.ts                        # TypeScript 类型定义
│
├── setup-symlinks.ps1                   # Windows 符号链接创建脚本
├── .gitmodules                          # Git 子模块配置
├── package.json
└── tsconfig.json
```

## 快速开始

```bash
git clone --recurse-submodules <repo-url>
cd vanguard-marketplace
bun install
```

## 技能管理

### 配置文件 (`src/sources.json`)

每个技能条目定义了一个来源：

| 字段 | 说明 |
|------|------|
| `name` | 技能名称 |
| `repo_url` | 远程仓库地址（可选，`self` 类型不需要） |
| `resource` | 仓库内的子目录 |
| `target` | 本地目标路径 |
| `branch` | Git 分支 |
| `type` | `remote` — 远程技能需同步 / `self` — 本地技能无需同步 |

示例：

```json
{
  "settings": {
    "base_path": "./skills_hub",
    "soft_link": {
      "include": ["C:/Users/boer/.agents/skills/*"],
      "exclude": [],
      "target": "./skills"
    }
  },
  "sources": [
    {
      "name": "Better Auth 社区技能",
      "repo_url": "github:better-auth/skills",
      "resource": "better-auth",
      "target": "./skills/better-auth",
      "branch": "main"
    },
    {
      "name": "code-generation",
      "target": "./skills/code-generation",
      "type": "self"
    }
  ]
}
```

## 脚本说明

### `bun run src/scan-skills.ts` — 扫描新技能

扫描 `skills/` 目录下的新文件夹，自动追加到 `sources.json`。Git 子模块识别为 `remote`，本地文件夹识别为 `self`，已有的跳过。

### `bun run src/sync_skills.ts` — 同步远程技能

遍历配置中的 `remote` 类型技能，从远程仓库下载最新版本。有差异时用 VS Code `code --diff` 逐文件打开可视对比，确认后覆盖。

### `bun run src/soft-link.ts` — 创建软链接

按配置的 glob 模式扫描外部目录，在 `skills/` 下创建软链接。适合把系统目录的技能链接到项目中使用。

### `bun run src/sync-watch.ts` — 实时同步监听

监听外部源目录（如 `C:/Users/boer/.agents/skills`）的文件变化，自动复制到项目 `skills/` 下。目标是真实文件，Git 正常跟踪。

```bash
# 后台挂着，改源文件自动同步
bun run src/sync-watch.ts
```

## 技术栈

- **运行时**: [Bun](https://bun.sh)
- **后端**: [ElysiaJS](https://elysiajs.com)
- **ORM**: [Drizzle ORM](https://orm.drizzle.team)
- **认证**: [Better Auth](https://better-auth.com)
- **前端**: Next.js / React
- **语言**: TypeScript

## 开发规范

- 代码格式化: `ultracite`
- 工具库打包: `pkgroll`
- 包管理: 优先 `pnpm`，Bun 项目用 `bun`
- 数据库: Docker Compose 起 PG


chmod +x scripts/sync-symlinks.ts

chmod +x scripts/restore-symlinks.ts



git config --global --add safe.directory  L:\Documents\GitHub\vanguard-marketplace