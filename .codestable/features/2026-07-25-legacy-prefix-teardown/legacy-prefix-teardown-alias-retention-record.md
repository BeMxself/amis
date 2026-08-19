---
doc_type: alias-retention-record
feature: 2026-07-25-legacy-prefix-teardown
roadmap: theme-system-refactor
roadmap_item: legacy-prefix-teardown
status: current
updated: 2026-07-28
---

# DOM-only AliasRetentionRecord

## 1. Capability

| Field | Value |
|---|---|
| Capability | DOM-only `.cxd-*` class alias |
| Runtime option | `legacyDomClassAlias` |
| Default | `false` |
| Explicit values | `cxd` only |
| Unsupported values | `antd` / `dark` / arbitrary `classPrefix` |
| Library CSS compatibility | `false` |
| SCSS/CSS dual output | forbidden |
| Theme identity | `[data-prismui-theme]`, not `.cxd-*` |

## 2. Retention Policy

DOM-only alias 只服务迁移期老定制页面：如果页面自己写了 `.cxd-*` 覆写，可以在显式开启后继续命中 DOM；amis 库 CSS、theme-editor 生成 CSS、官方文档主路径都不得把 `.cxd-*` 当成新的样式契约。

复审机制是人工评估：在可用迁移路径形成后不晚于 1 年触发一次 architecture owner 评估。评估结论可以是继续保留、收窄适用范围或退出；不绑定固定版本卡点，不自动退出。

## 3. Decision Owner And Review Inputs

| Item | Value |
|---|---|
| Decision owner | theme architecture owner |
| Review trigger | stable `.prismui-*` / token migration docs and examples are available |
| Review window | not later than 1 year after migration path is available |
| Required inputs | selector guard trend, docs migration guide, known legacy consumer feedback, release risk notes |
| Allowed outcomes | retain, narrow, deprecate with schedule, remove after explicit owner decision |

## 4. Exit Evidence

- selector guard continues to report 0 new public prefix violations.
- docs rollout provides stable `.prismui-*` / `[data-prismui-theme]` / token migration path.
- legacy consumers have migration notes or explicit risk acceptance.
- no core UI path requires `.cxd-*` for library CSS styling.
- file-name compatibility such as `cxd.css` is documented separately from selector compatibility.

## 5. Verification Hooks

- `packages/amis-core/__tests__/theme.test.ts` covers default stable class output and explicit `cxd` alias.
- This feature adds a non-`cxd` alias regression so runtime does not silently generate `antd-*` or `dark-*`.
- `packages/amis-ui/scripts/checkThemeSelectors.js` blocks new source `.cxd-*` selectors and `${classPrefix}` DOM selector strings.
