---
doc_type: feature-artifact
artifact_type: ThemeSystemValidationMatrix
feature: 2026-07-25-theme-system-validation-docs-rollout
status: current
updated: 2026-07-28
---

# ThemeSystemValidationMatrix

## 1. 结论

本矩阵把 ADR-001 的主题系统契约映射到已验收 feature、验证命令和本轮文档收口证据。它不替代各 feature 的测试，只作为发布前的整体核对面。

## 2. Matrix

| Contract | Owner Feature | Evidence | Rollout Status |
|---|---|---|---|
| Runtime 默认输出稳定 `.amis-*` 组件类名 | `theme-runtime-button-pilot` / `legacy-prefix-teardown` | `npm test --workspace amis-core -- theme`；`packages/amis-core/src/theme.tsx`；`packages/amis-core/__tests__/theme.test.ts` | ready |
| 主题身份通过 `[data-amis-theme]` 表达 | `theme-runtime-button-pilot` / `overlay-theme-scope-propagation` | overlay acceptance；`getThemeScopeProps()`；docs/zh-CN/start 与 docs/zh-CN/style 更新 | ready |
| 标准化样式值使用 `--amis-*` token | `token-contract-css-layers` | `packages/amis-ui/scss/tokens/*`；docs/zh-CN/style/css-vars.md | ready |
| CSS layer 顺序固定 | `token-contract-css-layers` | `packages/amis-ui/scss/tokens/_layers.scss`；docs/zh-CN/style/index.md | ready |
| 行为 DOM selector 不依赖 `classPrefix` | `core-component-selector-migration` / `legacy-prefix-teardown` | `npm run check:theme-selectors --workspace amis-ui`；bad/good fixture | ready |
| Overlay / portal / modal container 继承 theme scope | `overlay-theme-scope-propagation` | overlay QA / acceptance；runtime theme helpers | ready |
| Editor / preview 主题身份不依赖 `.cxd-*` 公共 API | `editor-theme-helper-migration` | editor helper inventory；editor migration acceptance | ready |
| DOM-only `.cxd-*` alias 默认关闭，仅显式 `cxd` | `legacy-prefix-teardown` | `legacy-prefix-teardown-alias-retention-record.md`；`theme.test.ts` | ready |
| 文档主路径不再推荐 `#{$ns}` / `.cxd-*` | `theme-system-validation-docs-rollout` | docs/zh-CN/extend/contribute.md；docs/zh-CN/style/index.md；docs grep output | ready |
| examples 中旧前缀命中可审计 | `theme-system-validation-docs-rollout` | `theme-system-examples-inventory.md` | risk-accepted |
| IE11 只保留静态 CSS 降级边界 | `theme-system-validation-docs-rollout` | docs/zh-CN/start/getting-started.md；docs/zh-CN/style/css-vars.md；`theme-system-ie11-static-fallback-notes.md` | ready |

## 3. Core Validation Commands

| Command | Purpose | Expected |
|---|---|---|
| `npm run check:theme-selectors --workspace amis-ui` | selector guard | pass |
| `npm test --workspace amis-core -- theme` | runtime / alias policy | pass |
| `npm test --workspace amis -- button` | stable class rendering smoke | pass |
| `npm run stylelint` | SCSS integrity | pass |
| `npm run typecheck` | broad typecheck | known baseline may fail; must be documented |
| `rg -n "#\\{\\$ns\\}|\\.cxd-|\\.antd-|\\.dark-|classPrefix" docs examples` | docs/examples old-prefix audit | document-baseline with classification |

## 4. Manual Path Checklist

| Path | Verification |
|---|---|
| 用户查主题覆写 | docs/zh-CN/style/index.md first path is token / stable selector / theme scope |
| 用户查 CSS 变量 | docs/zh-CN/style/css-vars.md explains `--amis-*` token layers |
| 新贡献者写组件样式 | docs/zh-CN/extend/contribute.md uses `.amis-Avatar` |
| SDK / React 快速开始 | docs/zh-CN/start/getting-started.md explains theme file names vs selector policy |
| 老定制页迁移 | release risk record points to DOM-only alias and manual review window |
