# Elysia Next.js Marketplace - Claude Code 插件市场

一个为 Claude Code 提供的插件市场，专注于 ElysiaJS + Next.js 全栈开发的 AI 辅助工具集合。

## 🚀 快速开始

### 安装插件市场

在你的项目目录下运行 `claude`，然后添加此市场：

```bash
# 通过 GitHub 仓库添加
/plugin marketplace add boer-power/elysia-nextjs-marketplace

# 或者通过本地路径添加（如果你克隆了此仓库）
/plugin marketplace add /path/to/elysia-nextjs-marketplace
```

### 安装插件

添加市场后，你可以浏览并安装任何插件：

```bash
# 列出可用插件
/plugin list

# 安装特定插件
/plugin install elysia-plugin
/plugin install code-generation-skill
/plugin install elysia-drizzle-fullstack-Nexus
/plugin install claude-marketplace

# 安装后重启 Claude Code 会话使插件生效
```

## 📦 可用插件

### 1. **elysia-plugin** - Elysia 框架核心插件

> 提供一些常用的 Elysia 用法

**功能特性：**
- ElysiaJS 框架最佳实践指南
- 路由、验证、错误处理模式
- TypeBox 验证示例
- Guards 和 Macro 用法
- 项目结构推荐（MVC 模式）

**适用场景：**
- 创建或修改 ElysiaJS 路由、处理器或服务器
- 设置验证（TypeBox、Zod、Valibot）
- 实现认证（JWT、基于会话）
- 添加插件（CORS、OpenAPI、静态文件）
- 集成外部服务（Drizzle ORM、Better Auth、Next.js）
- 创建单元测试

**集成支持：**
- AI SDK (Vercel)
- Astro
- Better Auth
- Cloudflare Workers
- Deno
- Drizzle ORM
- Expo
- Next.js
- Node.js
- Nuxt
- Prisma
- React Email
- SvelteKit
- TanStack Start
- Vercel

**版本：** 1.0.0

---

### 2. **code-generation-skill** - AI 驱动代码生成

> 使用 ts-morph AST 引擎，根据业务需求自动生成 Elysia + Drizzle 完整后端代码

**功能特性：**
- 自动生成 Contract 层（数据契约和验证）
- 自动生成 Service 层（业务逻辑）
- 自动生成 Controller 层（API 端点）
- 自动生成 Router 层（路由聚合）
- 支持复杂业务需求理解和代码生成

**核心概念：**
- 三层架构：Contract → Service → Controller → Router
- 使用 TypeBox 进行类型安全验证
- 遵循 Elysia 最佳实践
- 生成生产级别的代码框架

**使用流程：**
1. 定义业务需求（实体、字段、操作）
2. AI 自动理解并生成完整代码框架
3. 生成符合项目规范的文件结构

**版本：** 1.0.0

---

### 3. **elysia-drizzle-fullstack-Nexus** - Drizzle ORM 类型安全生成器

> 从 Drizzle ORM 表定义生成 TypeBox 契约模式

**功能特性：**
- 将 Drizzle table.schema.ts 转换为 TypeBox Contract 文件
- 生成 API 验证模式
- 创建结构化的 model 文件
- 自动推断 TypeScript 类型

**标准契约结构包含：**
1. **Response** - 单实体响应
2. **Create** - 创建新实体
3. **Update** - 完整更新
4. **Patch** - 部分更新
5. **ListQuery** - 列表查询参数
6. **ListResponse** - 分页列表响应
7. **Entity** - 完整实体（含计算字段）
8. **BusinessQuery** - 领域特定查询过滤器

**适用场景：**
- 创建新的数据库表后生成对应的 TypeBox 验证 schema
- 编写 Elysia API 接口的路由定义
- 组织 model 文件结构并组合数据库类型
- 生成完整的 schema 导出

**版本：** 1.0.0

---

### 4. **react-component-plugin** - React 组件生成器

> 按照 React Hooks 最佳实践生成组件

**功能特性：**
- 遵循 React Hooks 最佳实践
- 生成符合现代 React 标准的组件代码
- 支持函数式组件和 Hooks 模式
- 类型安全（TypeScript）

**版本：** 1.0.0

---

### 5. **claude-marketplace** - Claude Code 插件开发指南

> 创建 Claude Code 插件市场和 Skills 的完整指南

**包含 Skills：**

#### create-marketplace
创建和分发 Claude Code 插件市场（Plugin Marketplace）

**功能特性：**
- 构建、托管和管理 plugins 的集中式目录
- 支持团队和社区分发 Claude Code 扩展
- 集中式发现、版本跟踪、自动更新
- 支持多种源类型（git 存储库、本地路径、npm 包等）

**适用场景：**
- 创建团队内部的插件市场
- 向社区分发你的插件
- 管理多个插件的版本和更新
- 配置私有或公开的插件仓库

**核心内容：**
- Marketplace 文件结构和配置
- Plugin 源类型（相对路径、GitHub、Git、npm）
- 托管和分发策略
- 验证和测试方法

#### create-skill
创建 Claude Code Skill - 扩展 Claude Code 的功能

**功能特性：**
- 定义 AI 助手在特定任务中的行为和专业知识
- 创建领域专家级的一致输出
- Skill 开发最佳实践
- 完整的开发、测试和发布流程

**适用场景：**
- 为特定领域创建专家 Skill
- 标准化代码审查流程
- 自动化复杂任务
- 创建交互式向导

**核心内容：**
- Skill 文件结构和 Frontmatter 配置
- 不同类型 Skill 的模式（分析型、生成型、转换型、交互型）
- 最佳实践和调试技巧
- 完整的 Elysia 开发 Skill 示例

**版本：** 1.0.0

---

### 6. **elysia-skills** - ElysiaJS 官方 Skills（子模块）

> 来自 elysiajs/skills 仓库的官方 AI 技能集合

**功能特性：**
- 自动同步 elysiajs/skills 仓库更新
- 提供官方文档和最佳实践
- 包含完整的 ElysiaJS 开发指南
- 插件、集成和模式参考

**包含内容：**
- **参考资料：** 路由、验证、插件、测试、WebSocket、Eden Treaty 等
- **插件文档：** Bearer、CORS、Cron、GraphQL、HTML、JWT、OpenAPI、Static 等
- **集成指南：** AI SDK、Astro、Better Auth、Cloudflare、Deno、Drizzle、Next.js、Prisma 等
- **代码示例：** 基础示例、复杂示例、文件上传、Cookie、错误处理等
- **设计模式：** MVC 模式详细指南

**更新方式：**
```bash
# 更新子模块到最新版本
git submodule update --remote plugins/elysia-skills
```

**版本：** 1.0.1（跟随 elysiajs/skills 仓库）

---

## 🛠️ 开发指南

### 添加新插件到市场

1. 在 `plugins/` 目录下创建新插件文件夹
2. 创建 `.claude-plugin/plugin.json` 配置文件
3. 添加必要的技能文档（SKILL.md）
4. 提交并推送到仓库

### 插件配置示例

```json
{
  "name": "your-plugin-name",
  "description": "插件描述",
  "version": "1.0.0",
  "author": {
    "name": "Your Name"
  }
}
```

## 📚 相关资源

- [ElysiaJS 官方文档](https://elysiajs.com/)
- [ElysiaJS llms.txt](https://elysiajs.com/llms.txt) - AI 友好的文档
- [Claude Code 文档](https://github.com/anthropics/claude-code)
- [Drizzle ORM](https://orm.drizzle.team/)

