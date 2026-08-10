---
doc_type: feature-review
feature: 2026-07-25-editor-theme-helper-migration
roadmap: theme-system-refactor
roadmap_item: editor-theme-helper-migration
status: passed
review_state: passed
reviewer: self
reviewed: 2026-07-26
round: 1
local_only_authorization: .codestable/attention.md#项目碎片知识
ocr_status: not-available
---

# editor-theme-helper-migration code review

## 1. Scope And Inputs

- Design: `.codestable/features/2026-07-25-editor-theme-helper-migration/editor-theme-helper-migration-design.md`
- Checklist: `.codestable/features/2026-07-25-editor-theme-helper-migration/editor-theme-helper-migration-checklist.yaml`
- Implementation: `.codestable/features/2026-07-25-editor-theme-helper-migration/editor-theme-helper-migration-implementation.md`
- Inventory: `.codestable/features/2026-07-25-editor-theme-helper-migration/editor-theme-helper-migration-helper-scss-inventory.md`
- Evidence pack: `.codestable/features/2026-07-25-editor-theme-helper-migration/editor-theme-helper-migration-evidence-pack.md`
- Scope gate: `.codestable/features/2026-07-25-editor-theme-helper-migration/editor-theme-helper-migration-scope-gate.json`
- DoD results: `.codestable/features/2026-07-25-editor-theme-helper-migration/editor-theme-helper-migration-dod-results.json`
- Review packet: `.codestable/features/2026-07-25-editor-theme-helper-migration/editor-theme-helper-migration-review-packet.md`
- Code reviewed: `packages/amis-theme-editor-helper/src/helper/ParseThemeData.ts`, `packages/amis-editor-core/src/themeScope.ts`, `packages/amis-editor-core/src/util.ts`, preview components, `manager.ts`, `Collapse.tsx`, and added tests.

### Independent Review

- Lane A: unavailable after launch attempts; no reviewer run id was created. The tool wrapper rejected the payload before agent start with schema errors around `items` / `message` handling.
- Lane B OCR: unavailable; `which ocr` returned exit 1 (`ocr not found`).
- Fallback: owner standing authorization in `.codestable/attention.md` allows local-only review when independent reviewer / Task agent cannot start. This report records `reviewer: self` and does not skip review.
- Gate effect: local-only fallback used for this round; review still performed against design, checklist, evidence pack, real diff, tests, and line-level code.

## 2. Findings

### blocking

- none

### important

- none

### fixed during review

- [x] F-001 `getCssVarById()` 的 `[data-amis-theme]` 匹配面变宽后，可能把 scoped component selector 里的普通 CSS 属性读进 `cssVars`。
  - Evidence: `packages/amis-editor-core/src/util.ts` now matches `[data-amis-theme` for `themeCss`; generated selector CSS may include `[data-amis-theme="custom"] .amis-Button--accent { color: ... }`.
  - Impact: theme editor 的 cssVars map 可能混入 `color` / `background` 等非 custom property，影响后续 token 读取语义。
  - Fix: `getCssVarById()` 已改为通过 CSSStyleDeclaration 只收集 `--*` custom properties，并兼容 jsdom `ownerNode` 缺失；`themeCssMigration.test.ts` 增加 scoped rule 污染回归测试。

### nit

- none

### residual-risk

- IFrame preview 的 `initialContent` 仍只在 constructor 中生成；`contentDidMount` 会按当前 props 重新 apply body / `.ae-IFramePreview` scope，但如果运行中动态切换 editor theme，仍建议 QA 观察 iframe body、`.ae-IFramePreview`、`.ae-PageWrapper` 三处是否同步更新。
- `.AMISCSSWrapper` 仍存在于多个 editor/plugin container className 中；本轮已降级为容器别名，但最终删除/保留策略仍需 `legacy-prefix-teardown` 和 docs rollout 接管。

## 3. Spec Fit

- Generated CSS: `ParseThemeData` custom Button / size selector 已从 `.cxd-*` 改为 `[data-amis-theme] .amis-Button--*`，并通过 `GeneratedThemeCss` 暴露 tokenCss / selectorCss / customCss / migrationWarnings。
- Preview scope: `Preview`、`IFramePreview`、`ScaffoldModal`、`RightPanels` 都写入 `data-amis-theme`；`.AMISCSSWrapper` 没有继续作为 theme identity source-of-truth。
- Historical schema migration: `JSONPipeIn -> style2ThemeCss -> clearDirtyCssKey` 路径对旧 `.cxd-*` dirty selector key 记录 migration warning，并清理旧 key。
- Helper SCSS inventory: 剩余 helper/editor `.cxd-*` / `.AMISCSSWrapper` 命中已落 inventory，含分类、owner、保留原因和退出条件。
- Scope guard: 没有迁移 core component SCSS，没有删除 DOM-only alias，没有提前执行 legacy-prefix-teardown。

## 4. Validation Reviewed

- `npm run build --workspace amis-theme-editor-helper` -> pass，exit 0；仍有既有 Sass / TypeScript warning。
- `npm run build --workspace amis-editor-core` -> pass，exit 0；仍有既有 i18n / Sass / TypeScript warning。
- `npm run build --workspace amis-editor` -> pass，exit 0；仍有既有 i18n / TypeScript warning。
- `npm run check:theme-selectors --workspace amis-ui` -> pass，1503 legacy baseline match(es)，0 new violation(s)。
- `npx jest packages/amis-theme-editor-helper/__tests__/ParseThemeData.test.ts` -> pass。
- `npx jest packages/amis-editor-core/__tests__/themeScope.test.ts` -> pass。
- `npx jest packages/amis-editor-core/__tests__/themeCssMigration.test.ts` -> pass，2 tests。
- checklist YAML validation -> pass。
- `git diff --check` -> pass。
- scope gate -> pass；changed files all under feature dir / `amis-editor-core` / `amis-editor` / `amis-theme-editor-helper`.
- evidence pack -> pass。

## 5. Test And QA Focus

- 在真实 editor preview 中切换自定义 theme，确认 root `#editor-preview-body`、iframe body、`.ae-IFramePreview`、`.ae-PageWrapper` 和 scaffold modal body 都带正确 `data-amis-theme`。
- 使用 theme-editor 自定义 Button 类型和尺寸，确认生成 CSS 不含 `.cxd-Button`，且 scoped selector 是 `[data-amis-theme] .amis-Button--*`。
- 用含旧 `.cxd-*` dirty selector key 的历史 schema 进入 `JSONPipeIn`，确认旧 key 被删除、warning 可追踪、style 仍迁入 `themeCss`。
- 复核 inventory 中剩余 editor/plugin themeCss selector 由后续 `legacy-prefix-teardown` 接走，不在本轮继续扩大范围。

## 6. Verdict

- Status: passed
- Blocking findings: none
- Important findings: none
- Review mode: local-only fallback, authorized by `.codestable/attention.md`
- Next: proceed to QA / acceptance for `editor-theme-helper-migration`.
