---
doc_type: feature-artifact
artifact_type: ExamplesThemeInventory
feature: 2026-07-25-theme-system-validation-docs-rollout
status: current
updated: 2026-07-28
---

# ExamplesThemeInventory

## 1. 结论

examples 中仍有旧主题前缀命中，主要来自文档站自身的 layout / drawer / aside 样式和示例组件的历史 `classPrefix` 透传。本 feature 不强行重构 examples 视觉实现，但将所有命中分类为风险接受或后续迁移项，避免静默遗留。

## 2. Inventory

| Path | Signal | Classification | Release Decision |
|---|---|---|---|
| `examples/style.scss` | `.cxd-Layout` / `.antd-Layout` / `.dark-Layout` / `.cxd-Drawer` 等文档站壳样式 | examples shell legacy selector | risk accepted for this feature; follow-up should migrate to `.amis-*` + `[data-amis-theme]` |
| `examples/index.html` / `examples/app/index.html` / `examples/mobile.html` | `cxd.css` / `dark.css` / `antd.css` / `cxd-ie11.css` theme package links | file-name compatibility | keep; document as theme package names and IE11 static fallback |
| `examples/embed.tsx` | `.amis-scope` container and modal selector | stable host scope | keep; not a legacy theme prefix |
| `examples/components/App.tsx` and docs render wrappers | `classPrefix: theme.ns` passthrough | examples runtime compatibility plumbing | keep until examples shell migration; not recommended in user docs |
| `examples/components/Test.jsx` | explicit `classPrefix="cxd-"` Button demo | legacy test/demo | risk accepted; follow-up should convert or mark historical |
| `examples/components/MdRenderer.jsx` | `getTheme(...).classPrefix` and `classPrefix="cxd-"` | historical docs renderer behavior | risk accepted; follow-up should migrate with docs shell |
| `examples/docs.json` | generated docs bundle with old text | generated artifact | ignore source edit; regenerate after docs build if required |
| `examples/components/Form/css_properties*` / `examples/components/EChartsEditor/**` | huge generated CSS / ECharts metadata | generated third-party docs data | ignore for theme refactor |

## 3. Follow-Up Recommendation

Examples shell migration should be a separate cleanup because it touches visual layout, mobile drawer behavior and docs renderer plumbing. Target state:

- layout/drawer/aside selectors use `.amis-*`;
- theme-specific differences use `[data-amis-theme='dark']`;
- historical `classPrefix` demos are removed or explicitly marked as legacy migration examples;
- generated docs bundle is regenerated from source docs.
