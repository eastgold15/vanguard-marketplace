---
name: new-feature
description: 按项目既有模式生成新功能页面（路由 +  Feature + 侧边栏）
---

# new-feature

为该 shadcn-admin 项目生成新功能页面的脚手架。项目有三种页面模板可选：

## 模板类型

| 类型 | 说明 | 参考例子 |
|------|------|----------|
| `simple` | 简单的列表/卡片页面 | Apps, Chats |
| `datatable` | 带 CRUD 对话框的数据表格 | Tasks, Users |
| `settings` | 嵌套子页面的设置页 | Settings |

## 用法

用自然语言描述想要的页面即可，skill 会自动选择最合适的模板。也可以明确指定：

> 帮我生成一个 "products" 页面，用 datatable 模板

## 文件生成清单

根据模板类型，生成以下文件：

### simple 模板

```
src/features/<name>/
  index.tsx          # 主页面组件
  data/
    <name>.ts        # 模拟数据
src/routes/_authenticated/<name>/
  index.tsx          # 路由定义（含 Zod search schema）
```

### datatable 模板

```
src/features/<name>/
  index.tsx                    # 主页面组件（Provider 包装）
  data/
    <name>.ts                  # 模拟数据
    data.ts                    # 筛选选项常量
    schema.ts                  # Zod schema + 类型推导
  components/
    <name>-columns.tsx         # 表格列定义
    <name>-table.tsx           # 表格组件（DataTableToolbar + DataTablePagination）
    <name>-dialogs.tsx         # 对话框聚合组件
    <name>-primary-buttons.tsx # 顶部操作按钮
    <name>-provider.tsx        # 对话框状态 Context Provider
    <name>-action-dialog.tsx   # 新增/编辑对话框（React Hook Form + Zod）
    <name>-delete-dialog.tsx   # 单个删除确认对话框
    <name>-multi-delete-dialog.tsx # 批量删除确认对话框
    data-table-row-actions.tsx # 行操作按钮（编辑/删除）
    data-table-bulk-actions.tsx # 批量操作栏
src/routes/_authenticated/<name>/
  index.tsx          # 路由定义（含 Zod search schema）
```

### settings 模板

```
src/features/<name>/
  index.tsx                    # 主布局（侧边栏导航 + Outlet）
  components/
    sidebar-nav.tsx            # 侧边栏导航组件
```

## 生成规则

1. **文件名**：feature name 统一用 kebab-case
2. **组件名**：PascalCase（如 `ProductsTable`, `ProductsActionDialog`）
3. **路径**：`@/` 别名指向 `src/`
4. **路由**：放在 `_authenticated` 路由组下
5. **sidebar-data.ts**：自动在 "General" 分组下追加新导航项
6. **搜索 schema**：`simple` 和 `datatable` 模板包含 `page`、`pageSize`、`filter` 等标准参数
7. **表单**：`datatable` 模板使用 `react-hook-form` + `zod` + `@hookform/resolvers`
8. **图标**：用 `lucide-react` 图标（`npm ls lucide-react` 查看可用图标）

## 生成后

1. 运行 `pnpm dev` 确保路由树自动生成
2. 更新侧边栏导航项后可能需要重启 dev server
3. 如果用了新 icon，确保从 `lucide-react` import

## CRUD 对话框状态管理

`datatable` 模板的对话框状态通过 Provider 模式管理（参考 UsersProvider）：

```tsx
// Provider 管理所有对话框的 open/close 状态
type DialogsState =
  | { type: 'create' }
  | { type: 'edit'; row: T }
  | { type: 'delete'; row: T }
  | { type: 'multiDelete'; rows: T[] }
  | { type: null }
```

## 注意事项

- 不要生成测试文件（项目已有覆盖测试模式，但 skill 不处理）
- `simple` 模板的 route schema：`page`, `pageSize`, `filter` 为可选
- `datatable` 模板的 route schema：额外包含 facet filter 字段
- sidebar-data.ts 编辑时，找到 `navGroups` 数组中 `title: 'General'` 的组，在 `items` 末尾追加
- 如果生成 settings 模板，sidebar 添加为 `title: 'Other'` 组下的子菜单项
