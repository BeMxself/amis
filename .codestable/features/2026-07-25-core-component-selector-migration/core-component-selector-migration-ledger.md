---
doc_type: migration-ledger
feature: 2026-07-25-core-component-selector-migration
roadmap: theme-system-refactor
roadmap_item: core-component-selector-migration
status: ready-for-review
updated: 2026-07-26
source_inventory: packages/amis-ui/scripts/theme-selectors/policy.json
---

# core-component-selector-migration 迁移清单

## 1. Inventory 基线

本 ledger 只消费 `stylesheet-stable-selector-build` 产出的 selector policy，不另起第二套 selector 数据源。当前 policy 已在本 feature DOM selector 与目标 SCSS wave 迁移后收窄：

| 指标 | 当前值 | 说明 |
|---|---:|---|
| total legacy baseline matches | 1507 | `node packages/amis-ui/scripts/checkThemeSelectors.js --update` 后的允许基线 |
| `scss-ns-selector` | 1465 | 非目标组件 / 后续迁移 SCSS `#{$ns}` 债务 |
| `theme-prefix-selector` | 42 | 现有 `.cxd-*` / `.antd-*` / `.dark-*` 历史命中 |
| `classprefix-dom-selector` | 0 | 本 feature 已迁移 6 个 DOM selector dependency |
| `migration-target` | 1448 | 剩余非本 wave 迁移目标 |
| `internal-legacy` | 37 | editor/theme-editor helper 输入，不属于本 feature |
| `docs-historical` | 22 | 历史注释/文档命中 |

第一波已迁移的 DOM selector dependency 与本地 review 补齐项：

| 组件/路径 | 旧依赖 | 新路径 | 验证 |
|---|---|---|---|
| `FormRenderer.jumpToErrorComponent` | `.${classPrefix}Form-feedback` | `getStableClassSelector(classnames, 'Form-feedback')` | `npm run check:theme-selectors --workspace amis-ui` 无 `classprefix-dom-selector` 命中 |
| `Dialog.getPopOverContainer` | `.${classPrefix}Modal-content` | `getStableClassSelector(classnames, 'Modal-content')` | 同上 |
| `Drawer.getPopOverContainer` | `.${classPrefix}Drawer-content` | `getStableClassSelector(classnames, 'Drawer-content')` | 同上 |
| `Modal` draggable handle | `.${classPrefix}Modal-header` | `getStableClassSelector(cx, 'Modal-header')` | 同上 |
| `Modal` root outside-close / stack class | `.${classPrefix}Modal` / `${classPrefix}Modal--nth` | `getStableClassSelector(cx, 'Modal')` / `getStableClassName(cx, 'Modal--nth')` | `npm test --workspace amis -- Dialog` |
| `Drawer` root / overlay / content / close / stack class | `${classPrefix}Drawer*` / `${classPrefix}Modal--nth` | `cx('Drawer*')` / `getStableClassName(cx, 'Modal--nth')` | `npm test --workspace amis -- drawer` |
| `Drawer` overlay outside-close | `.${classPrefix}Drawer-overlay` | `getStableClassSelector(cx, 'Drawer-overlay')` | `npm test --workspace amis -- drawer` |
| `VirtualTableBody` root/fixed header | `.${classPrefix}Table` / `.${classPrefix}Table-fixedTop` | `getStableClassSelector(cx, ...)` | 同上 |
| `VirtualTableBody` auto fill state | `${classPrefix}Table--autoFillHeight` | `getStableClassName(cx, 'Table--autoFillHeight')` | 同上 |

## 2. Target Wave Ledger

| Wave | 目标组件 | SCSS 剩余命中 | DOM query 状态 | Token / scope 状态 | 验证入口 | 当前结论 |
|---|---|---:|---|---|---|---|
| A | Button | 0 | 无 `classprefix-dom-selector` 命中；Button pilot DOM 输出 `.amis-Button` | 已有 `--amis-Button-*` proof，Button variant / icon / loading mixin 已走 stable selector | `npm test --workspace amis -- button` | done |
| A | ButtonGroup | 0 | 普通 props passthrough / Form renderer 组合，不是 DOM selector dependency | ButtonGroup SCSS 已迁到 `.amis-*`；未新增 token taxonomy | `npm test --workspace amis -- button` | done |
| A | Form basics | 0 public selector；1 条 `.cxd-*` docs-historical 注释 | `Form-feedback` DOM selector 已迁移；大量 `classPrefix` 保留为 legacy props passthrough | `_form.scss` 已迁到 `.amis-*`；基础 Form 样式继续消费既有 token/vars | `npm test --workspace amis -- button` / `Select` / `Table` | done |
| A/B | Select | 0 | `SelectControl` / `ChainedSelectControl` wrapper 已迁到 `.amis-*`；内部 `classPrefix` 透传保留 | `_select.scss` 与 CustomStyle select option suffix 已迁到 stable class | `npm test --workspace amis -- Select` | done |
| B | Dialog / Modal | 0 | `Dialog` content query、`Modal` drag handle、outside-close root match、stack class 已迁移 | Modal scope 由 overlay feature 负责；SCSS 已迁到 `.amis-*` | `npm test --workspace amis -- Dialog` | done |
| B | Drawer | 0 | `Drawer` content query、root/overlay/content/close class、outside-close overlay match、stack class 已迁移 | Drawer scope 由 overlay feature 负责；SCSS 已迁到 `.amis-*` | `npm test --workspace amis -- drawer` | done |
| B | Dropdown | 0 | DropDownButton 的 `classPrefix` passthrough 保留给 overlay/menu 兼容入口，不是 DOM selector debt | Dropdown SCSS 已迁到 `.amis-*` | `npm test --workspace amis -- DropDownButton` | done |
| B | Tooltip | 0 | 当前无 policy 级 DOM selector dependency；测试查询已切到 `.amis-*` | Tooltip SCSS 已迁到 `.amis-*`，overlay scope 已覆盖 | `npm test --workspace amis -- Tooltip` | done |
| B | Popover / Popoverable | 0 | `PopOver` closeOnOutside 的 `classPrefix` match 分类为 legacy behavior dependency，留给 teardown 评估 | Popover/Popoverable SCSS 已迁到 `.amis-*` | Tooltip / DropDownButton targeted tests | done |
| C | Table | 0 | `VirtualTableBody` root/fixed header/state 已迁移；Table props passthrough 保留 | Table SCSS 已迁到 `.amis-*` | `npm test --workspace amis -- Table` | done |
| C | Table2 | 0 | 当前主要为 props passthrough / head dropdown 参数，不是 policy 级 DOM selector debt | Table2 SCSS 已迁到 `.amis-*` | `npm test --workspace amis -- Table` | done |
| C | Page | 0 | 当前无 policy 级 DOM selector dependency | Page SCSS 已迁到 `.amis-*` | `npm test --workspace amis -- Select` / `Table` snapshots | done |
| C | Layout | 0 | 当前无 policy 级 DOM selector dependency | Layout SCSS 已迁到 `.amis-*` | `npm test --workspace amis -- Select` / `Table` snapshots | done |

## 3. SelectorDependencyKind 分类

| Kind | 范围 | 当前处理 |
|---|---|---|
| `dom-query` | `querySelector` / `closest` / draggable handle / classList 等行为依赖 | 已将 policy 中 6 个 `classprefix-dom-selector` 命中迁到 stable helper |
| `scss-selector` | `#{$ns}`、`.cxd-*`、`.antd-*`、`.dark-*` 样式选择器 | 目标 Wave A/B/C 已迁移并同步收窄 policy baseline；剩余非目标命中留给后续 roadmap item |
| `legacy-props-passthrough` | 传给旧组件或第三方封装的 `classPrefix` 参数 | 不在本 feature 删除；只在 ledger 中分类 |
| `runtime-alias` | 显式 `legacyDomClassAlias: 'cxd'` 的 DOM-only alias 输出 | 不关闭；由 `legacy-prefix-teardown` 评估 |
| `editor-out-of-scope` | editor/theme-editor helper、`.AMISCSSWrapper`、历史 schema/generated CSS | 不迁移；交给 `editor-theme-helper-migration` |

## 4. 反向核对

- 未迁移 editor/theme-editor helper、`.AMISCSSWrapper`、历史 schema 或 generated CSS。
- 未删除 `classPrefix` 字段。
- 未关闭 DOM-only `.cxd-*` alias。
- 未新增 `.cxd-*` / `.antd-*` / `.dark-*` SCSS 兼容输出。
- 未对 Table/Select/Dialog/Drawer 做业务结构重构。

## 5. 当前交接风险

- 目标 Wave A/B/C 已清零；剩余 SCSS `#{$ns}` 主要来自非本项组件，交给 ledger / legacy-prefix-teardown 后续评估。
- `classPrefix` 广义 grep 仍包含大量 legacy props passthrough；不得把这些直接当作 DOM selector debt 批量删除。
- `PopOver` closeOnOutside 的 `classPrefix` 用途不是 policy 级模板字符串 DOM query，本项分类为 legacy behavior dependency，后续由 teardown 决定是否移除。
