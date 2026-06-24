---
name: jingjiang-theme
description: >
  锦江 Slidev 主题（@eastgold15/slidev-theme-jingjiang）的完整使用指南和内容生成器。
  深紫哑光磨砂政务风，适配述职汇报、方案评审、项目分析、学术答辩等正式汇报场景。
  只要用户提到做 PPT、写 Slidev 演示文稿、做汇报幻灯片、述职页面、商业计划书、
  学术答辩 Slidev，或者说要"用锦江主题"、"用这个紫色主题"、"用 jingjiang 主题"，
  就应该触发此技能。即使用户只是含糊地说"帮我做个汇报 slides"，也优先考虑使用此技能。
compatibility:
  - slidev
  - nodejs
  - markdown
---

# 锦江 Slidev 主题技能

你是一个 Slidev 演示文稿的**内容构建 + 主题使用专家**，专精于 `@eastgold15/slidev-theme-jingjiang` 深紫哑光磨砂政务风主题。

你的核心能力：
1. **查询能力** — 回答用户关于该主题布局、组件、配色、样式的任何问题
2. **内容生成** — 根据用户需求，直接写出完整的 `slides.md` 演示文稿

---

## 一、快速开始

主题安装：在 `slides.md` 的 frontmatter 中声明：

```yaml
---
theme: "@eastgold15/slidev-theme-jingjiang"
---
```

然后启动 Slidev，它会自动提示安装。

## 二、布局 Layouts

共有 4 种布局，在 frontmatter 中通过 `layout:` 指定。

| 布局名 | frontmatter 值 | 用途 |
|--------|---------------|------|
| 封面页 | `cover` | 演示文稿首页。居中对称大标题 + 副标题 + 分割线 + 页脚，极简政务风 |
| 简介页 | `intro` | 同封面风格，适合章节过渡页 |
| 左上右下圆 | `circletl-br` | 双透明圆装饰背景，适合正文内容页 |
| 右上左下圆 | `circletr-bl` | 双透明圆装饰背景（对称变体），适合正文内容页 |

### cover / intro 布局结构

```yaml
---
layout: cover
---
# 主标题（大号白色加粗）

副标题文字（浅灰紫小字）

<div class="cover-divider" />

<div class="cover-footer">
<span>单位全称</span>
<span>2025年01月</span>
</div>
```

- `h1` — 纯白、6xl、加粗、居中的主标题
- `h1 + p` — 紧接标题的段落自动变为浅灰紫副标题
- `.cover-divider` — 浅紫细水平分割线
- `.cover-footer` — 左右两栏页脚文字（左侧单位、右侧日期）

### 内容页布局

正文页面默认使用基础布局。推荐配合 `circletl-br` 或 `circletr-bl` 获得装饰性圆背景：

```yaml
---
layout: circletl-br
---
```

## 三、组件 Components

### 3.1 MermaidView — 可缩放流程图/图表容器

鼠标滚轮缩放（以光标为中心），拖拽平移。

```markdown
<MermaidView :max-height="480">

```mermaid
graph TB
    A[开始] --> B[结束]
```

</MermaidView>
```

| 属性 | 类型 | 默认 | 说明 |
|------|------|------|------|
| `max-height` | string | `400px` | 容器最大高度 |

操作：滚轮缩放 | 拖拽平移 | 右上角 +/- 缩放 | ⟲ 重置

---

### 3.3 Card — 磨砂容器（通用）

整个主题唯一的容器组件。默认是**磨砂底无装饰条**的盒子，通过属性控制装饰条方向、颜色、背景开关。不传 `accent` 就无装饰条，传了 `accent` 才有。

```markdown
<!-- 默认：磨砂底，无装饰条 -->
<Card>
内容
</Card>

<!-- 左侧金色装饰条（经典 Card） -->
<Card accent="#F9D240">
内容
</Card>

<!-- 顶部装饰条 -->
<Card accent="#F9D240" accent-side="top">
内容
</Card>

<!-- 无背景，仅左侧色条（替代旧版 section-accent） -->
<Card :matte="false" accent="#F9D240">
内容
</Card>
```

| 属性 | 类型 | 默认 | 说明 |
|------|------|------|------|
| `accent` | string | — | 装饰条颜色，不传则不显示装饰条 |
| `accent-side` | `left` / `right` / `top` / `bottom` | `left` | 装饰条方向 |
| `matte` | boolean | `true` | 是否显示磨砂背景 |
| `padding` | number | `6` | 内边距（UnoCSS p-X） |
| `title` | string | — | 标题（带底部分割线） |
| `mb` | number | `0` | 底部外边距 |
| `maxHeight` | string | — | 最大高度，传了则内容超出后滚动（如 `"460px"`） |

**四种形态对比：**

| 形态 | 等价于旧的 | 写法 |
|------|-----------|------|
| 磨砂底 + 无装饰条 | `highlight-box` | `<Card>` |
| 磨砂底 + 左装饰条 | `Card` | `<Card accent="#F9D240">` |
| 磨砂底 + 顶部装饰条 | — | `<Card accent="#F9D240" accent-side="top">` |
| 无背景 + 左装饰条 | `section-accent` | `<Card :matte="false" accent="#F9D240">` |

---

### 3.4 Outline — 目录导航

结构化展示演示文稿的章节/内容列表。适合在 intro 页或第一页正文做导航。

```markdown
<Outline :items="[
  {icon: '🎯', number: '①', title: '项目概述', desc: '要做什么', tag: '🌟 所有人'},
  {icon: '📱', number: '②', title: '功能模块', desc: '四个端', tag: '🌟 所有人'},
  {icon: '💰', number: '③', title: '成本估算', desc: '详细费用', tag: '🟡 老板重点'},
]" />
```

| 属性 | 类型 | 说明 |
|------|------|------|
| `items[].icon` | string | 图标 emoji |
| `items[].number` | string | 序号（如 ① ② ③） |
| `items[].title` | string | 章节标题 |
| `items[].desc` | string | 补充说明 |
| `items[].tag` | string | 受众标签（如 🌟 所有人） |

---

### 3.5 Timeline — 开发时间/阶段线

横向排列的阶段块，每块带顶部色条和 icon。适合展示项目阶段、时间排期。

```markdown
<Timeline :steps="[
  {icon: '📄', label: '需求分析', period: '第1-2周', accent: '#F9D240'},
  {icon: '☁️', label: '后端开发', period: '第3-6周', accent: '#7EC8E3'},
  {icon: '📱', label: '前端开发', period: '第4-8周', accent: '#6BCB9C'},
  {icon: '🧪', label: '联调测试', period: '第7-9周', accent: '#FFB74D'},
  {icon: '🚀', label: '上线发布', period: '第10周', accent: '#C792EA'},
]" />
```

| 属性 | 类型 | 说明 |
|------|------|------|
| `steps[].icon` | string | 图标 emoji |
| `steps[].label` | string | 阶段名称 |
| `steps[].period` | string | 时间周期 |
| `steps[].desc` | string | 补充描述 |
| `steps[].accent` | string | 顶部色条颜色 |

---

### 3.6 表格规范

表格始终内嵌在磨砂卡片中使用，遵循以下规则：

```markdown
<Card title="数据总览">
| 项目 | 数值 | 备注 |
|------|------|------|
| 项目A | <span class="text-data">320</span> | 正常 |
| 项目B | <span class="text-data">180</span> | <span class="text-desc">暂停中</span> |
| **合计** | <span class="text-total">500</span> | |
</Card>
```

表格特性：
- 表头底色 `#4C2668`（加深紫），白色加粗文字
- 仅保留水平浅紫分割线，无竖边框
- 文字宽松内边距

---

### 3.7 原子组件（已全局注册）

原子组件是最小颗粒的视觉单元，已全局注册，幻灯片中直接用标签，无需 import。

| 组件 | 作用 | 关键 Props |
|------|------|-----------|
| `<AtomBox>` | 容器盒子 | `bordered` — 边框 |
| `<AtomFlex>` | 弹性布局 | 无，全靠 UnoCSS class 控制 |
| `<AtomText>` | 主题文字 | `type="primary\|muted\|data\|total"` |
| `<AtomBadge>` | 角标标签 | `type="primary\|success\|warning\|info\|default"` |
| `<AtomBtn>` | 按钮 | `type="primary\|default"`，`@click` 事件 |
| `<AtomDivider>` | 分割线 | 无 |

**核心组合示例：**
```markdown
<AtomFlex class="gap-4 justify-center">
  <AtomBox class="p-4" style="background:var(--bg-card)">
    <AtomFlex justify-between>
      <AtomText type="primary" class="text-lg">标题</AtomText>
      <AtomBadge type="success">进行中</AtomBadge>
    </AtomFlex>
    <AtomText type="muted">说明文字</AtomText>
    <AtomDivider class="my-3" />
    <AtomBtn type="primary" @click="$slidev.nav.next()">下一页</AtomBtn>
  </AtomBox>
</AtomFlex>
```

**设计原则：**
- 所有原子开启 `$attrs` 透传，外部可加任意 UnoCSS class、原生事件
- 纯展示无内部状态，状态由幻灯片页面管理
- 颜色全用主题 CSS 变量，不写死固定色值
- 全局注册后幻灯片中直接用，零 import

## 四、色彩系统

### 4.1 深紫主主题（默认，class 不指定）

所有变量均为**语义名**，改一组值即可换整套主题。

| CSS 变量 | 色值 | 用途 |
|----------|------|------|
| `--bg-page` | `#42205C` | 页面背景，哑光深紫 |
| `--bg-card` | `#532B73` | 卡片底色，磨砂紫 |
| `--bg-card-header` | `#4C2668` | 表头/通栏底色，加深紫 |
| `--border` | `#9D78C2` | 分割线/边框，浅紫 |
| `--text-primary` | `#FFFFFF` | 主要文字，纯白 |
| `--text-emphasis` | `#F9D240` | 数据高亮，金黄 |
| `--text-muted` | `#D1C4E0` | 辅助说明文字，浅灰紫 |
| `--text-danger` | `#9E2B42` | 总计/强调文字，暗酒红 |
| `--accent` | `#F9D240` | 装饰条颜色，金黄 |

### 4.2 浅紫备用主题（对外宣讲/答辩）

```yaml
---
layout: circletl-br
class: "theme-light"
---
```

适用于对外宣讲、答辩等需要明亮视觉的场景。所有色值自动切换为浅紫系。

### 4.3 浅色项目分析主题（方案评审/商业计划）

```yaml
---
layout: circletl-br
class: "theme-project"
---
```

| CSS 变量 | 色值 | 说明 |
|----------|------|------|
| 页面背景 | `#f5f7fa` | 浅灰白底 |
| 卡片底色 | `#ffffff` | 纯白卡片 |
| 分割线 | `#d0d7de` | 浅灰 |
| 文字 | `#1f2328` | 深灰近黑 |
| 高亮数据 | `#b6571a` | 暖橙 |
| 辅助文字 | `#656d76` | 中灰 |

适用于项目分析、方案评审、商业计划书等需要正式但不过于暗沉的场景。

### 4.4 文字层级工具类（四色体系）

| UnoCSS 类 | 对应变量 | 适用文字 |
|-----------|---------|---------|
| `text-primary`（默认） | `--text-primary` | 大章节标题、卡片模块标题、表格表头 |
| `text-data` | `--text-emphasis` | 关键数据、数字高亮（加粗金黄） |
| `text-desc` | `--text-muted` | 正文说明、备注、数据来源 |
| `text-total` | `--text-danger` | 总计/汇总行（加粗暗酒红大号） |

核心原则：金黄只用于数字和关键论据，小面积点缀；暗酒红只用于总计，不与金色同屏。

### 4.5 数据展示工具类

纯文字数字展示，无需容器背景。适合数据指标的高亮展示：

| 类名 | 作用 |
|------|------|
| `.data-block` | 数据指标容器（纯文字，无背景） |
| `.data-value` | 数据值（金黄大号加粗） |
| `.data-label` | 数据标签（浅灰小字） |

```markdown
<div class="data-block">
  <div class="data-value">1,200万+</div>
  <div class="data-label">目标用户数</div>
</div>
```

> **注意：** 旧版 `.section-accent` 和 `.highlight-box` 已合并到 Card 组件中：
> - 原 `.section-accent` → `<Card :matte="false" accent="#颜色">`
> - 原 `.highlight-box` → `<Card>`

## 五、排版与内容指南

### 5.1 风格核心原则

1. **简约克制** — 零冗余特效、全扁平哑光设计，依靠色块+线条分层
2. **专业政务学术风** — 深紫基底+规整模块化卡片，稳重正式
3. **信息优先** — 所有色彩、卡片、线条均服务内容，仅用于分层和高亮
4. **直角矩形** — 所有卡片直角无圆角、无阴影、无玻璃高光

### 5.2 页面元素层次

```markdown
# 一级标题（h1，默认纯白 3xl）

## 二级标题（h2，纯白，自动上方留白 10）

### 三级标题（h3，纯白 2xl 半粗）

正文用 text-desc 类的文字颜色（浅灰紫）
```

### 5.3 封面页组装模版

```yaml
---
layout: cover
---

# 主标题

副标题 / 部门名称

<div class="cover-divider" />

<div class="cover-footer">
<span>单位全称</span>
<span>2025年01月</span>
</div>
```

### 5.4 推荐内容结构（述职汇报场景）

```
封面页 (cover) → 工作概述 → 核心成果（数据卡片）→
重点项目（时间线/架构图）→ 问题与反思 →
下一步计划 → 结语
```

## 六、完整示例

```yaml
---
theme: "@eastgold15/slidev-theme-jingjiang"
layout: cover
---

# 2024年度工作总结汇报

汇报人：姓名

<div class="cover-divider" />

<div class="cover-footer">
<span>部门/单位全称</span>
<span>2024年12月</span>
</div>

---

# 工作概述

<Card title="年度关键指标" padding="4">
<div class="grid grid-cols-3 gap-4 text-center">
  <div>
    <div class="text-4xl text-data font-bold">128</div>
    <div class="text-desc">指标A</div>
  </div>
  <div>
    <div class="text-4xl text-data font-bold">96%</div>
    <div class="text-desc">指标B</div>
  </div>
  <div>
    <div class="text-4xl text-data font-bold">3</div>
    <div class="text-desc">指标C</div>
  </div>
</div>
</Card>

---

layout: circletl-br
---

# 数据总览

<Card title="各项目数据">
| 项目 | 数值 | 趋势 |
|------|------|------|
| 项目A | <span class="text-data">320</span> | 稳定 |
| 项目B | <span class="text-data">180</span> | <span class="text-desc">缩减中</span> |
| 项目C | <span class="text-data">95</span> | 新增 |
| **合计** | <span class="text-total">595</span> | |
</Card>

---

layout: circletr-bl
---

# 系统架构

<MermaidView :max-height="480">

```mermaid
graph TB
    subgraph "模块一"
    A[前端应用]
    end
    subgraph "模块二"
    B[后端服务]
    C[数据库]
    end
    A --> B
    B --> C
```

</MermaidView>

---

layout: cover
---

# 感谢聆听

敬请指正

<div class="cover-divider" />

<div class="cover-footer">
<span>部门/单位全称</span>
<span>2024年12月</span>
</div>
```

## 七、生成内容时的行为准则

1. **先理解场景** — 判断用户是要做述职汇报、方案评审、学术答辩还是项目分析，据此推荐不同的结构和主题
2. **善用布局组合** — cover 做首尾页，正文交替使用 circletl-br / circletr-bl，intro 做章节过渡
3. **数据可视化优先** — 有数据的页面优先用 Card 承载表格，关键数字用 `text-data` 高亮
4. **保持风格一致** — 全文深紫底 + 磨砂卡片 + 浅紫分割线，不要引入其他颜色
5. **长内容用 maxHeight** — 超过一屏的文字内容给 Card 加 `maxHeight` 属性使其滚动
6. **架构图用 MermaidView** — 复杂流程/架构图用 Mermaid + MermaidView 包裹
7. **完整输出** — 给出可直接复制使用的完整 `slides.md` 内容

### Card 使用规则

1. **Card 标签必须上下空一行** — 否则 Markdown 不会正确渲染：
   ```markdown
   <!-- ❌ 错误 -->
   <Card>内容</Card>

   <!-- ✅ 正确 -->
   <Card>
   内容
   </Card>
   ```
   > 空行会多出间距？已经用 CSS 把 `<p>` 的 margin 压到最小，肉眼几乎看不出。

2. **不要嵌套 Card** — Card 内不要再放 Card。需要分层时，外层用 Card，内层用 `:matte="false"` 变体：
   ```markdown
   <!-- ❌ 错误：Card 嵌套 -->
   <Card>
     <Card>内层</Card>
   </Card>

   <!-- ✅ 正确：外层 Card + 内层无背景 Card -->
   <Card title="总览">
     <Card :matte="false" accent="#F9D240">分区内容</Card>
   </Card>
   ```

3. **不要每页都用磨砂 Card** — 纯文字内容用 `:matte="false"` 切换为无背景模式，纯数字用 `data-block`，视觉更轻盈

### Mermaid 使用规则

1. **Mermaid 单独占页** — 一页只放一个 MermaidView，不要在同一页里放表格 + Mermaid
2. **饼图/柱状图和表格共存时** — 表格放上一页，Mermaid 放下一页，不要在同一个 `---` 分隔块内

### 容器选择指南

| 要放什么 | 用什么 | 说明 |
|---------|--------|------|
| 标题 + 多行内容 + 表格 | `<Card>` | 默认磨砂底承托内容 |
| 纯文字段落 | `<Card :matte="false" accent="#色值">` | 无背景，仅左侧色条区分 |
| 结论/强调 | `<Card>` | 默认就是磨砂底无装饰条，正好做结论框 |
| 数字/指标展示 | `.data-block` | 纯文字，无需容器 |
| 自由组合布局 | `<AtomBox>` + `<AtomFlex>` | 原子组件自由拼接，零 UI 库 |
| 目录列表 | `<Outline>` | 自带序号和标签样式 |
| 时间阶段 | `<Timeline>` | 横向阶段条，适合项目排期 |
| 流程图/图表 | `<MermaidView>` | 可缩放，拖拽平移 |
| 超长内容 | `<Card maxHeight>` | 隐藏滚动条，触控板友好 |
