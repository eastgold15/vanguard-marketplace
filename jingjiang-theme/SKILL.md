---
name: jingjiang-theme
description: >
  锦江 Slidev 主题（@eastgold15/slidev-theme-jingjiang）的完整使用指南和内容生成器。
  深紫哑光磨砂政务风，适配高校专业申报、述职汇报、学术答辩场景。
  只要用户提到做 PPT、写 Slidev 演示文稿、做汇报幻灯片、述职页面、专业申报材料、
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
| 左上右下圆 | `circle-tl-br` | 双透明圆装饰背景，适合正文内容页 |
| 右上左下圆 | `circle-tr-bl` | 双透明圆装饰背景（对称变体），适合正文内容页 |

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

正文页面默认使用基础布局。推荐配合 `circle-tl-br` 或 `circle-tr-bl` 获得装饰性圆背景：

```yaml
---
layout: circle-tl-br
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

### 3.2 ScrollView — 无滚动条滚动容器

整个容器隐藏滚动条，滚轮垂直翻页，Shift+滚轮水平平移。适合放超长内容。

```markdown
<ScrollView max-height="400px">
超长内容...
</ScrollView>
```

| 属性 | 类型 | 默认 | 说明 |
|------|------|------|------|
| `max-height` | string | `100%` | 容器最大高度 |
| `max-width` | string | `100%` | 容器最大宽度 |

---

### 3.3 Card — 磨砂质感卡片

内容的基本承载容器，直角矩形、不透光哑光磨砂质感、无阴影无渐变。

```markdown
<Card title="标题" accent="#F9D240">
卡片内容
</Card>
```

| 属性 | 类型 | 默认 | 说明 |
|------|------|------|------|
| `accent` | string | `#F9D240` | 左侧装饰条颜色 |
| `show-accent` | boolean | `true` | 是否显示装饰条 |
| `padding` | number | `6` | 内边距（UnoCSS p-X） |
| `size` | `normal` / `full` / `sm` | `normal` | 卡片尺寸 |
| `title` | string | — | 卡片标题（带底部分割线） |
| `mb` | number | `0` | 底部外边距 |

常用布局示例：

```markdown
<Card title="默认卡片" accent="#F9D240" padding="6">
  标准磨砂卡片
</Card>

<Card :show-accent="false" size="full">
  底部通栏大卡片，无装饰条
</Card>

<!-- 双栏并列 -->
<div class="grid grid-cols-2 gap-4">
  <Card title="左栏" padding="4" />
  <Card title="右栏" padding="4" />
</div>
```

---

### 3.4 表格规范

表格始终内嵌在磨砂卡片中使用，遵循以下规则：

```markdown
<Card title="数据总览">
| 专业名称 | 在校人数 | 备注 |
|---------|---------|------|
| 体育教育 | <span class="text-data">320</span> | 正常招生 |
| 社会体育 | <span class="text-data">180</span> | <span class="text-desc">暂停招生</span> |
| **全院总计** | <span class="text-total">500</span> | |
</Card>
```

表格特性：
- 表头底色 `#4C2668`（加深紫），白色加粗文字
- 仅保留水平浅紫分割线，无竖边框
- 文字宽松内边距

## 四、色彩系统

### 4.1 深紫主主题（默认，class 不指定）

| CSS 变量 | 色值 | 用途 |
|----------|------|------|
| `--theme-main-bg` | `#42205C` | 页面背景，哑光深紫 |
| `--theme-card-bg` | `#532B73` | 卡片底色，磨砂紫 |
| `--theme-card-header-bg` | `#4C2668` | 表头/通栏底色，加深紫 |
| `--theme-divider-line` | `#9D78C2` | 分割线，浅紫 |
| `--theme-text-white` | `#FFFFFF` | 一级标题/表头文字，纯白 |
| `--theme-text-yellow` | `#F9D240` | 数据高亮，金黄 |
| `--theme-text-gray` | `#D1C4E0` | 辅助说明文字，浅灰紫 |
| `--theme-text-red-total` | `#9E2B42` | 总计/强调文字，暗酒红 |
| `--theme-accent-line` | `#F9D240` | 侧边装饰条颜色，金黄 |

### 4.2 浅紫备用主题

在页面根元素添加 `class="theme-light"` 即可切换：

```yaml
---
layout: circle-tl-br
class: "theme-light"
---
```

适用于对外宣讲、答辩等需要更明亮视觉的场景。所有色值自动切换为浅紫系。

### 4.3 文字层级工具类（四色体系）

| UnoCSS 类 | 适用文字 | 色值 |
|-----------|---------|------|
| —（默认纯白） | 大章节标题、卡片模块标题、表格表头 | `#FFFFFF` |
| `text-data` | 关键数据、数字高亮（加粗金黄） | `#F9D240` |
| `text-desc` | 正文说明、备注、数据来源 | `#D1C4E0` |
| `text-total` | 总计/汇总行（加粗暗酒红大号） | `#9E2B42` |

核心原则：金黄只用于数字和关键论据，小面积点缀；暗酒红只用于总计，不与金色同屏。

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

# 体育学院专业设置调整方案

四川大学锦江学院 · 教务处

<div class="cover-divider" />

<div class="cover-footer">
<span>四川大学锦江学院 体育学院</span>
<span>2025年01月</span>
</div>
```

### 5.4 推荐内容结构（专业申报场景）

```
封面页 (cover) → 目录 (intro) → 现状与背景 → 
数据总览 → 专业详情（卡片双栏）→ 调整方案 → 
师资与资源 → 总结（通栏重点高亮）
```

### 5.5 推荐内容结构（述职汇报场景）

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

述职人：张三

<div class="cover-divider" />

<div class="cover-footer">
<span>四川大学锦江学院 体育学院</span>
<span>2024年12月</span>
</div>

---

# 工作概述

<Card title="年度关键指标" padding="4">
<div class="grid grid-cols-3 gap-4 text-center">
  <div>
    <div class="text-4xl text-data font-bold">128</div>
    <div class="text-desc">授课课时</div>
  </div>
  <div>
    <div class="text-4xl text-data font-bold">96%</div>
    <div class="text-desc">学生满意度</div>
  </div>
  <div>
    <div class="text-4xl text-data font-bold">3</div>
    <div class="text-desc">科研项目</div>
  </div>
</div>
</Card>

---

layout: circle-tl-br
---

# 专业建设数据

<Card title="各专业在校人数">
| 专业 | 人数 | 趋势 |
|------|------|------|
| 体育教育 | <span class="text-data">320</span> | 稳定 |
| 社会体育 | <span class="text-data">180</span> | <span class="text-desc">缩减中</span> |
| 运动康复 | <span class="text-data">95</span> | 新增 |
| **合计** | <span class="text-total">595</span> | |
</Card>

---

layout: circle-tr-bl
---

# 系统架构

<MermaidView :max-height="480">

```mermaid
graph TB
    subgraph "前端"
    A[Slidev 演示]
    end
    subgraph "数据层"
    B[表格数据]
    C[图表数据]
    end
    A --> B
    A --> C
```

</MermaidView>

---

layout: cover
---

# 感谢聆听

敬请指正

<div class="cover-divider" />

<div class="cover-footer">
<span>四川大学锦江学院 体育学院</span>
<span>2024年12月</span>
</div>
```

## 七、生成内容时的行为准则

1. **先理解场景** — 判断用户是要做专业申报、述职汇报还是学术答辩，据此推荐不同的结构
2. **善用布局组合** — cover 做首尾页，正文交替使用 circle-tl-br / circle-tr-bl，intro 做章节过渡
3. **数据可视化优先** — 有数据的页面优先用 Card 承载表格，关键数字用 `text-data` 高亮
4. **保持风格一致** — 全文深紫底 + 磨砂卡片 + 浅紫分割线，不要引入其他颜色
5. **长内容用 ScrollView** — 超过一屏的文字内容放入 ScrollView
6. **架构图用 MermaidView** — 复杂流程/架构图用 Mermaid + MermaidView 包裹
7. **完整输出** — 给出可直接复制使用的完整 `slides.md` 内容
