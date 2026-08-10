---
doc_type: feature-artifact
artifact_type: manual_validation_notes
feature: 2026-07-25-theme-system-validation-docs-rollout
status: current
updated: 2026-07-28
---

# Manual Validation Notes

## 1. Reviewed Paths

| Path | Result |
|---|---|
| `docs/zh-CN/start/getting-started.md` | Theme setup explains CSS package names, `.amis-*` stable DOM classes and `[data-amis-theme]`. |
| `docs/zh-CN/style/index.md` | Theme override guide now prioritizes token, stable class, theme scope and user layer / load order. |
| `docs/zh-CN/style/css-vars.md` | CSS variable guide now explains `--amis-*` token layers and legacy alias boundary. |
| `docs/zh-CN/extend/contribute.md` | New component SCSS example uses `.amis-Avatar`, not `#{$ns}`. |
| `docs/zh-CN/components/form/transfer.md` | `popOverContainerSelector` examples use `.amis-Panel--form`. |

## 2. Manual Reasoning

- The retained `cxd.css` / `antd.css` strings are file names for package selection, not component selector guidance.
- The retained `.cxd-*` strings in source docs appear only in warnings that explicitly say not to use them as new selectors.
- examples old-prefix selectors are not silently accepted; they are classified in `theme-system-examples-inventory.md`.
- IE11 language is static fallback only and does not promise CSS variable dynamic switching.

## 3. Residual Risks

- No browser screenshot pass was run at implementation time.
- `examples/docs.json` is generated and may still contain old wording until the docs bundle is regenerated.
- examples shell visual migration remains follow-up scope.
