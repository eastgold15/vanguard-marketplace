---
name: create-marketplace
description: 创建和分发 Claude Code 插件市场（Plugin Marketplace）。用于构建、托管和管理 plugins 的集中式目录，支持团队和社区分发 Claude Code 扩展。
---

# 创建 Plugin Marketplace

> 构建和托管 plugin marketplace，以在团队和社区中分发 Claude Code 扩展。

**plugin marketplace** 是一个目录，让你能够将 plugins 分发给他人。Marketplace 提供集中式发现、版本跟踪、自动更新以及对多种源类型（git 存储库、本地路径等）的支持。

## 概述

创建和分发 marketplace 涉及以下步骤：

1. **创建 plugins**：使用命令、agents、hooks、MCP servers 或 LSP servers 构建一个或多个 plugins
2. **创建 marketplace 文件**：定义 `marketplace.json`，列出 plugins 及其位置
3. **托管 marketplace**：推送到 GitHub、GitLab 或其他 git 主机
4. **与用户共享**：用户使用 `/plugin marketplace add` 添加你的 marketplace 并安装单个 plugins

## 快速开始

### 步骤 1：创建目录结构

```bash
mkdir -p my-marketplace/.claude-plugin
mkdir -p my-marketplace/plugins/quality-review-plugin/.claude-plugin
mkdir -p my-marketplace/plugins/quality-review-plugin/skills/quality-review
```

### 步骤 2：创建 skill

创建 `SKILL.md` 文件：

```markdown
---
description: Review code for bugs, security, and performance
disable-model-invocation: true
---

Review the code I've selected or the recent changes for:
- Potential bugs or edge cases
- Security concerns
- Performance issues
- Readability improvements

Be concise and actionable.
```

### 步骤 3：创建 plugin manifest

创建 `.claude-plugin/plugin.json` 文件：

```json
{
  "name": "quality-review-plugin",
  "description": "Adds a /quality-review skill for quick code reviews",
  "version": "1.0.0"
}
```

### 步骤 4：创建 marketplace 文件

创建 `.claude-plugin/marketplace.json` 文件：

```json
{
  "name": "my-plugins",
  "owner": {
    "name": "Your Name"
  },
  "plugins": [
    {
      "name": "quality-review-plugin",
      "source": "./plugins/quality-review-plugin",
      "description": "Adds a /quality-review skill for quick code reviews"
    }
  ]
}
```

### 步骤 5：添加和安装测试

```bash
/plugin marketplace add ./my-marketplace
/plugin install quality-review-plugin@my-plugins
```

## Marketplace 文件结构

```
my-marketplace/
├── .claude-plugin/
│   └── marketplace.json          # Marketplace 配置文件
├── plugins/
│   ├── plugin-a/
│   │   ├── .claude-plugin/
│   │   │   └── plugin.json       # Plugin A 的 manifest
│   │   ├── skills/
│   │   │   └── my-skill/
│   │   │       └── SKILL.md
│   │   └── commands/
│   └── plugin-b/
│       └── ...
└── README.md
```

## Marketplace 架构

### 必需字段

| 字段 | 类型 | 描述 |
|:-----|:-----|:-----|
| `name` | string | Marketplace 标识符（kebab-case，无空格）|
| `owner` | object | Marketplace 维护者信息 |
| `plugins` | array | 可用 plugins 列表 |

### 所有者字段

| 字段 | 类型 | 必需 | 描述 |
|:-----|:-----|:----:|:-----|
| `name` | string | 是 | 维护者或团队的名称 |
| `email` | string | 否 | 维护者的联系电子邮件 |

### 可选元数据

| 字段 | 类型 | 描述 |
|:-----|:-----|:-----|
| `metadata.description` | string | 简短的 marketplace 描述 |
| `metadata.version` | string | Marketplace 版本 |
| `metadata.pluginRoot` | string | 前置到相对 plugin 源路径的基目录 |

## Plugin 条目配置

每个 plugin 条目描述一个 plugin 及其位置。

### 必需字段

| 字段 | 类型 | 描述 |
|:-----|:-----|:-----|
| `name` | string | Plugin 标识符（kebab-case，无空格）|
| `source` | string\|object | 从哪里获取 plugin |

### 可选字段

| 字段 | 类型 | 描述 |
|:-----|:-----|:-----|
| `description` | string | 简短的 plugin 描述 |
| `version` | string | Plugin 版本 |
| `author` | object | Plugin 作者信息 |
| `homepage` | string | Plugin 主页或文档 URL |
| `repository` | string | 源代码存储库 URL |
| `license` | string | SPDX 许可证标识符 |
| `keywords` | array | 用于 plugin 发现和分类的标签 |
| `category` | string | Plugin 类别以供组织 |
| `tags` | array | 用于可搜索性的标签 |
| `strict` | boolean | 控制 plugin.json 是否是组件定义的权威 |

## Plugin 源类型

### 相对路径

对于同一存储库中的 plugins：

```json
{
  "name": "my-plugin",
  "source": "./plugins/my-plugin"
}
```

### GitHub 存储库

```json
{
  "name": "github-plugin",
  "source": {
    "source": "github",
    "repo": "owner/plugin-repo"
  }
}
```

可以固定到特定分支、标签或提交：

```json
{
  "name": "github-plugin",
  "source": {
    "source": "github",
    "repo": "owner/plugin-repo",
    "ref": "v2.0.0",
    "sha": "a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0"
  }
}
```

### Git 存储库

```json
{
  "name": "git-plugin",
  "source": {
    "source": "url",
    "url": "https://gitlab.com/team/plugin.git"
  }
}
```

### Git 子目录

使用稀疏克隆从 monorepo 获取特定子目录：

```json
{
  "name": "my-plugin",
  "source": {
    "source": "git-subdir",
    "url": "https://github.com/acme-corp/monorepo.git",
    "path": "tools/claude-plugin"
  }
}
```

### npm 包

```json
{
  "name": "my-npm-plugin",
  "source": {
    "source": "npm",
    "package": "@acme/claude-plugin"
  }
}
```

## 托管和分发

### 在 GitHub 上托管（推荐）

1. 创建存储库
2. 添加 `.claude-plugin/marketplace.json`
3. 用户使用 `/plugin marketplace add owner/repo` 添加

### 私有存储库

Claude Code 支持从私有存储库安装。使用你的 git 凭证助手或设置环境变量：

| 提供商 | 环境变量 |
|:-----|:-----|
| GitHub | `GITHUB_TOKEN` 或 `GH_TOKEN` |
| GitLab | `GITLAB_TOKEN` 或 `GL_TOKEN` |
| Bitbucket | `BITBUCKET_TOKEN` |

### 为团队要求 marketplaces

在 `.claude/settings.json` 中配置：

```json
{
  "extraKnownMarketplaces": {
    "company-tools": {
      "source": {
        "source": "github",
        "repo": "your-org/claude-plugins"
      }
    }
  },
  "enabledPlugins": {
    "code-formatter@company-tools": true
  }
}
```

## 验证和测试

### 验证 JSON 语法

```bash
claude plugin validate .
# 或
/plugin validate .
```

### 本地测试

```bash
/plugin marketplace add ./path/to/marketplace
/plugin install test-plugin@marketplace-name
```

## 完整示例

```json
{
  "name": "company-tools",
  "owner": {
    "name": "DevTools Team",
    "email": "devtools@example.com"
  },
  "metadata": {
    "description": "Company internal plugins",
    "version": "1.0.0"
  },
  "plugins": [
    {
      "name": "code-formatter",
      "source": "./plugins/formatter",
      "description": "Automatic code formatting on save",
      "version": "2.1.0",
      "category": "productivity"
    },
    {
      "name": "deployment-tools",
      "source": {
        "source": "github",
        "repo": "company/deploy-plugin"
      },
      "description": "Deployment automation tools"
    }
  ]
}
```

## 注意事项

1. **保留名称**：以下名称为 Anthropic 官方保留：`claude-code-marketplace`、`claude-code-plugins`、`claude-plugins-official`、`anthropic-marketplace`、`anthropic-plugins`、`agent-skills`、`life-sciences`

2. **Plugin 缓存**：Plugins 被复制到 `~/.claude/plugins/cache`，无法使用 `../shared-utils` 等路径引用目录外的文件

3. **版本管理**：避免在 plugin.json 和 marketplace.json 中同时设置版本，plugin.json 总是获胜

4. **相对路径限制**：相对路径仅在通过 Git 添加 marketplace 时有效，不适用于基于 URL 的 marketplaces
