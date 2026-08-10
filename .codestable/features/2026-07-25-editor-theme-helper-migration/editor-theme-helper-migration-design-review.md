---
doc_type: feature-design-review
feature: 2026-07-25-editor-theme-helper-migration
status: passed
review_state: passed
review_reason: ""
reviewer_id: "local-only:user-approved-2026-07-25"
reviewed: 2026-07-25
round: 1
---

# editor-theme-helper-migration feature design 审查报告

## 1. Scope And Inputs

- Design: `.codestable/features/2026-07-25-editor-theme-helper-migration/editor-theme-helper-migration-design.md`
- Checklist: `.codestable/features/2026-07-25-editor-theme-helper-migration/editor-theme-helper-migration-checklist.yaml`
- Roadmap: `.codestable/roadmap/theme-system-refactor/theme-system-refactor-roadmap.md`
- Roadmap item: `editor-theme-helper-migration`
- ADR: `.codestable/requirements/adrs/001-tokenized-theme-system.md`
- Prior features: `token-contract-css-layers`, `stylesheet-stable-selector-build`, `overlay-theme-scope-propagation`, `core-component-selector-migration`
- Code facts checked: `packages/amis-theme-editor-helper/src/helper/ParseThemeData.ts`, `packages/amis-theme-editor-helper/src/style/**`, `packages/amis-editor-core/src/util.ts`, `packages/amis-editor-core/src/manager.ts`, `packages/amis-editor-core/src/component/Preview.tsx`, `packages/amis-editor-core/src/component/IFramePreview.tsx`, `packages/amis-editor-core/src/component/ScaffoldModal.tsx`, `packages/amis-editor-core/scss/**`, `packages/amis-editor/src/plugin/**`

### Independent Review

- Status: local-only
- Detection: local-only
- Provider / agent: none
- Raw output summary: reviewer tool attempts were rejected before an agent id was created because the tool wrapper still injected empty optional fields or treated `message` and `items` as mixed.
- Merge policy: 本地逐项核验 design、checklist、roadmap、ADR、前置 feature 和关键代码事实。
- Gate effect: owner 已批准 local-only 降级，允许本轮 design review 给出最终 verdict。

## 2. Design Summary

- Goal: 迁移 editor preview 与 theme-editor helper 到 ThemeScope、stable selector 和 TokenContract。
- Key contracts: EditorThemeCss、ThemeCssGenerationOptions、GeneratedThemeCss、PreviewThemeScope、HistoricalThemeCssMigration、HelperScssInventory。
- Steps: 7 步；从依赖 done 准入、helper SCSS inventory、generated CSS migration、preview scope、historical schema migration，到范围收口和交接材料。
- Checks: 12 项；覆盖实现准入、主题身份唯一性、ParseThemeData 输出、preview/iframe scope、CSS var 读取、旧 schema fixture、helper SCSS inventory、selector guard 和 acceptance 四线核验。
- Baseline / validation: 设计列出 helper/editor 构建、theme selector guard、generated CSS grep、preview scope grep、schema migration fixture 和 checklist YAML 校验。

## 3. Findings

### blocking

- none

### important

- none

### nit

- none

### suggestion

- [ ] FDR-001 实现阶段建议把 HelperScssInventory 做成固定格式清单，至少包含命中 selector、文件、分类、owner、保留原因和退出条件。
  - Evidence: design 第 0 节和第 2.1 节已把 HelperScssInventory 定义为 helper/editor 内置 SCSS 迁移边界；checklist 也要求剩余命中均有分类、owner 和退出条件。
  - Impact: 不阻塞 design；固定格式能让后续 `legacy-prefix-teardown` 直接消费，减少再次人工解释。
- [ ] FDR-002 `.AMISCSSWrapper` 的保留语义必须在实现报告中反复核对：它只能是 preview / 用户 CSS 容器别名，不能继续作为主题身份来源。
  - Evidence: design 第 1 节关键决策已明确 Theme identity 必须来自 `data-amis-theme`，`getAllCssVar()` 也不能只读 `:root, .AMISCSSWrapper`。
  - Impact: 不阻塞 design；这是实现和 QA 最容易回退到旧心智的点。
- [ ] FDR-003 historical schema migration 需要至少覆盖 `style2ThemeCss` 和 `JSONPipeIn` 两条路径，不能只靠 generated CSS 新路径证明完成。
  - Evidence: design 将 historical schema migration 列为四条核心验收线之一，checklist 要求 fixture 和 migration warning 证据。
  - Impact: 不阻塞 design；旧 schema 是用户存量页面最可能继续泄露 `.cxd-*` 的入口。

### learning

- 这个 design 正确把 editor/helper 迁移拆成 generated CSS、preview scope、historical schema、helper SCSS inventory 四条线，避免只修 `ParseThemeData` 造成“新生成正确、旧数据继续泄露”的假完成。
- `.AMISCSSWrapper` 不是必须立刻删除的类名，但它必须从“主题身份”降级为“容器别名”；这个边界和 roadmap 对干净迁移的共识一致。

### praise

- design 明确把 core component SCSS、DOM-only alias 退出和 legacy teardown 排除在本项之外，范围边界清晰。
- implementation admission 明确要求前置三项依赖 `done`，没有把 design-review passed 误当成可实现依赖。

## 4. User Review Focus

- 用户需要重点拍板：是否认可 editor/helper 迁移以四条验收线为完成标准，且 `.AMISCSSWrapper` 只保留为容器别名。
- implement 需要重点遵守：先确认前置依赖 `done`；`ParseThemeData`、preview/iframe root、`style2ThemeCss` / `JSONPipeIn`、helper SCSS inventory 必须同时推进。
- code review / QA / acceptance 需要重点复核：generated CSS 是否不含 `.cxd-`，preview/iframe 是否有 `data-amis-theme`，旧 schema fixture 是否有迁移或 warning，helper/editor SCSS 剩余命中是否可解释。

## 5. Evidence Confidence Ledger

| Check | Verdict | Evidence Class | Basis | Follow-up |
|---|---|---|---|---|
| Acceptance Coverage Matrix | pass | E | design 第 3.2 节覆盖依赖 done、generated CSS、preview root、iframe preview、historical schema、helper SCSS inventory 和范围守护 | implementation / QA 落命令与 fixture 证据 |
| DoD Contract | pass | E | design 第 3.3 节与 checklist `dod.commands` 覆盖 helper/editor 构建、selector guard、grep、preview/schema 证据和 YAML 校验 | none |
| Steps and checks traceability | pass | E | checklist 7 steps / 12 checks 均可追溯到 design 第 1-3 节 | none |
| Roadmap contract compliance | pass | E/C | roadmap 要求迁移编辑器、预览容器、theme-editor helper、历史 schema 和内置 SCSS 的 `.cxd-*` / `AMISCSSWrapper` 主题身份依赖；design 全部覆盖且保留 `.AMISCSSWrapper` 容器别名边界 | none |
| Module interface design | pass | E/C | EditorThemeCss、GeneratedThemeCss、PreviewThemeScope、HistoricalThemeCssMigration、HelperScssInventory 的 seam 清晰，分别落在生成、预览、迁移、inventory 边界 | 实现阶段避免把 helper options 变成第二套 theme identity |
| Validation and artifacts | pass | E | checklist YAML 与 roadmap items YAML 待本轮命令复验；local-only 授权已记录在 approval-report | 跑 YAML / workflow / diff check |

Summary: E=6, C=2, H=0, H-only core checks=none。

## 6. Residual Risk

- local-only design review 缺少独立 reviewer 视角；用户 review 应重点看旧 schema 和 preview/iframe scope 是否需要更多 fixture。
- helper/editor SCSS 存量命中可能很大，本项用 inventory 收口而不是承诺一次性清零；后续 legacy-prefix-teardown 必须消费该 inventory。
- 如果前置 selector guard 或 TokenContract 还未真正实现，本项 implementation 会被阻塞；这是设计刻意保留的 fail-closed 边界。

## 7. Verdict

- Status: passed
- Next: 交回 epic child design batch；所有子 feature design-review passed 后再统一进入 owner design confirmation。

## 8. Focused Closure

- none
