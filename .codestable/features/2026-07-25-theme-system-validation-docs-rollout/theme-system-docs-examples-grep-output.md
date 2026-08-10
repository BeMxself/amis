---
doc_type: feature-artifact
artifact_type: docs_examples_grep_output
feature: 2026-07-25-theme-system-validation-docs-rollout
status: current
updated: 2026-07-28
---

# Docs / Examples Grep Output

## 1. Command

```bash
rg -n "#\\{\\$ns\\}|\\.cxd-|\\.antd-|\\.dark-|classPrefix" docs examples -g '!examples/docs.json' -g '!examples/components/Form/css_properties*' -g '!examples/components/EChartsEditor/**'
```

## 2. Result Classification

| Bucket | Representative Paths | Classification |
|---|---|---|
| docs migration warnings | `docs/zh-CN/start/getting-started.md`, `docs/zh-CN/style/index.md`, `docs/zh-CN/extend/contribute.md` | retained only to warn against old prefix usage |
| component-specific non-theme prop | `docs/zh-CN/components/office-viewer.md` | not theme system public API |
| examples shell legacy selectors | `examples/style.scss` | risk accepted and tracked in ExamplesThemeInventory |
| examples runtime compatibility plumbing | `examples/components/App.tsx`, `examples/components/Doc.tsx`, `examples/components/CssDocs.tsx`, `examples/components/Components.tsx` | follow-up migration, not user docs recommendation |
| generated / large third-party docs data | `examples/docs.json`, `examples/components/Form/css_properties*`, `examples/components/EChartsEditor/**` | excluded from source grep; regenerate from source if needed |

## 3. Source Docs Grep

```bash
rg -n "#\\{\\$ns\\}|\\.cxd-|\\.antd-|\\.dark-|classPrefix" docs/zh-CN -g '!**/docs.json'
```

Remaining docs hits are classified in `theme-system-docs-migration-map.md`; no source docs now recommend `#{$ns}` or `.cxd-*` as the component styling path.
