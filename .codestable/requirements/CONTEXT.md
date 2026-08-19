# amis Theme Styling Context

本 context 记录 amis 主题与样式系统相关术语。它只定义概念，不描述具体实现步骤。

## Language

**主题作用域**:
承载当前主题身份的 DOM 范围，例如未来的 `[data-prismui-theme="cxd"]`。它决定作用域内 token 值和主题特定覆写规则。
_Avoid_: theme prefix root, scoped theme wrapper

**稳定组件类名**:
不包含主题名的组件选择器，稳定前缀确定为 `prismui-`，例如 `.prismui-Button`。它表达组件身份，而不是主题身份。
_Avoid_: cxd-Button, antd-Button, theme-prefixed component class

**Legacy DOM 类名别名**:
迁移期显式开启后附加到 DOM 上的旧类名，例如 `.cxd-Button`。它只用于让老定制页面自己的 `.cxd-*` CSS 继续命中，不代表 amis 库继续提供 `.cxd-*` CSS 或把 `.cxd-*` 作为新的公共样式 API。
_Avoid_: legacy SCSS compatibility, public cxd API

**Design Token**:
描述样式值的命名变量，按 palette、semantic、component、state 分层管理。
_Avoid_: raw CSS variable, global style variable

**双通道主题系统**:
标准化样式值走 token，非标准结构或形态差异走主题作用域下的选择器覆写。
_Avoid_: pure token theme, class-prefix theme

**主题行为对象**:
承载 CSS 无法表达的主题差异，例如组件默认配置、图表主题、编辑器主题或浮层策略。
_Avoid_: CSS-only theme
