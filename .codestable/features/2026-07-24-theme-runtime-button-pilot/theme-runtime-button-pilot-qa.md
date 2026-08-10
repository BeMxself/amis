---
doc_type: feature-qa
feature: 2026-07-24-theme-runtime-button-pilot
status: passed
runner_state: not-started
runner_reason: ""
runner_id: ""
tested: 2026-07-25
round: 1
---

# theme-runtime-button-pilot QA 报告

## 1. Scope And Inputs

- Design: `.codestable/features/2026-07-24-theme-runtime-button-pilot/theme-runtime-button-pilot-design.md`
- Checklist: `.codestable/features/2026-07-24-theme-runtime-button-pilot/theme-runtime-button-pilot-checklist.yaml`
- Review: `.codestable/features/2026-07-24-theme-runtime-button-pilot/theme-runtime-button-pilot-review.md`
- Evidence pack: `.codestable/features/2026-07-24-theme-runtime-button-pilot/theme-runtime-button-pilot-implementation.md`
- Gate results: none
- DoD results: none
- Diff basis: current workspace diff, plus untracked feature package and `packages/amis-core/__tests__/theme.test.ts`; no staged diff
- Baseline dirty files: none outside this feature package / roadmap item / implementation files
- Feature type: mixed
- Core evidence gate: runtime + frontend DOM behavior is covered by targeted Jest render tests; Button style proof and selector boundary are covered by stylelint and selector grep. Browser manual verification is not required for this pilot because the design’s acceptance matrix names jsdom / targeted Jest as the core observable path.

## 2. Verification Matrix

| ID | 来源 | 核心性 | 场景 / 风险 | 证据类型 | 命令或动作 | 期望 | 结果 |
|---|---|---|---|---|---|---|---|
| QA-001 | design S2/S5 | core-functional | 默认 classnames 输出 `.amis-*`，不输出 `.cxd-*` | unit | `npm test --workspace amis-core -- theme` | 4 个 theme runtime tests 通过 | pass |
| QA-002 | design S2/S5 | core-functional | 显式 alias 输出 `.amis-* + .cxd-*`，且缓存更新不陈旧 | unit | `npm test --workspace amis-core -- theme` | alias test 通过 | pass |
| QA-003 | design S3 | core-functional | Root DOM 可观察 `data-amis-theme="cxd"`，Button DOM 使用同一稳定类名主路径 | render test | `npm test --workspace amis -- button` | 5 suites / 19 tests / 20 snapshots 通过 | pass |
| QA-004 | review focus | core-functional | Button modifier / state 类语义保持，DropDownButton / ButtonGroup 查询更新后仍可交互 | render test | `npm test --workspace amis -- button` | 目标 Button 回归通过 | pass |
| QA-005 | design S4/S6 | supporting | `.amis-Button` 最小 token proof 符合 SCSS 风格 | lint | `npm run stylelint` | exit 0 | pass |
| QA-006 | design S4/S6 | core-boundary | 不新增 `.cxd-Button` 库 SCSS selector，不做 SCSS legacy selector 双轨 | command | selector grep | 新增命中均可解释；`_button.scss` 无 `.cxd-Button` | pass |
| QA-007 | design S7 | supporting | typecheck 不因 pilot 新增触碰文件错误 | typecheck | `npm run typecheck` | 若红灯则归因为既有基线 | baseline |
| QA-008 | cleanliness | supporting | 无调试输出、临时 TODO、空白错误或 staged 污染 | command | `rg console/TODO` + `git diff --check` + `git diff --cached --stat` | 无命中 / exit 0 / 无 staged diff | pass |

## 3. Command Results

- `npm test --workspace amis-core -- theme` → exit 0：1 suite / 4 tests passed。
- `npm test --workspace amis -- button` → exit 0：5 suites / 19 tests / 20 snapshots passed。
- `npm run stylelint` → exit 0：`npx stylelint 'packages/**/*.scss'` 通过。
- `rg -n "\\.cxd-Button|#\\{\\$ns\\}Button|legacyDomClassAlias|componentClassPrefix|data-amis-theme" packages/amis-core packages/amis-ui packages/amis` → exit 0：新增命中集中在 Theme Runtime、测试、snapshots、`_button.scss` 的 `[data-amis-theme]` / `.amis-Button` proof；历史命中包括 `_condition-builder.scss` 的旧 `.cxd-Button` 和未迁移测试查询。
- `npm run typecheck` → exit 1：错误仍集中在既有 `packages/amis-editor/**`、`packages/amis/src/renderers/Table/**`、`packages/amis/src/renderers/QuickEdit.tsx`、`scripts/build-schemas.ts` 等非本 feature 触碰文件；未出现 `packages/amis-core/src/theme.tsx`、`Root.tsx`、`index.tsx`、`_button.scss` 或新增 `theme.test.ts` 错误。
- `git diff --check` → exit 0：无 whitespace / patch cleanliness 错误。
- `git diff --cached --stat` → exit 0 with empty output：无 staged diff。
- `rg -n "console\\.log|TODO|FIXME|XXX" <本轮 touched files>` → exit 1 with empty output：本轮 touched 文件无新增调试输出或临时标记。

## 4. Scenario Results

- [x] QA-001 默认稳定类名：pass
  - Evidence: `theme.test.ts` 断言 `Button` / `Button--primary` 输出 `amis-Button` / `amis-Button--primary`，且默认无 `cxd-Button`。
- [x] QA-002 alias 显式开启：pass
  - Evidence: `theme.test.ts` 覆盖先 `getTheme('cxd')` 再 `theme('cxd', {legacyDomClassAlias: 'cxd'})`，后续输出含 stable + legacy alias。
- [x] QA-003 Root 主题作用域：pass
  - Evidence: Button render test 断言容器内存在 `[data-amis-theme="cxd"]`，snapshots 同步记录 Root scope wrapper。
- [x] QA-004 Button modifier / state：pass
  - Evidence: Button render test 断言 default / primary / size-sm 等 stable modifier；Button / DropDownButton / ButtonGroup 目标回归均通过。
- [x] QA-005 样式 proof：pass
  - Evidence: `_button.scss` 新增 `[data-amis-theme='cxd']` token vars 与 `.amis-Button` 最小 selector，stylelint 通过。
- [x] QA-006 selector 边界：pass
  - Evidence: selector grep 未发现本 feature 在 `_button.scss` 新增 `.cxd-Button`；历史 `.cxd-Button` 命中归属后续 roadmap。
- [x] QA-007 typecheck 基线：baseline
  - Evidence: `npm run typecheck` 红灯未落在本 feature 触碰文件；按 design 要求记录为既有全仓库基线风险。
- [x] QA-008 清洁度：pass
  - Evidence: `git diff --check` 通过，touched files 无 `console.log` / `TODO` / `FIXME` / `XXX` 命中，无 staged diff。

## 5. Findings

### failed

- none

### blocked

- none

### residual-risk

- `npm run typecheck` 仍是全仓库基线红灯；本 QA 将其归因为既有 editor/schema/table/scripts 类型债，不扩大本 pilot 修复范围。
- code review 使用 owner 批准的 local-only fallback，缺独立 reviewer / OCR 视角；acceptance 需再次复核 selector guard、Root scope 与 alias 场景。
- Root scope 不覆盖 overlay / portal，属于 design 明确不做项和后续 `overlay-theme-scope-propagation` 范围。

## 6. Cleanliness

- Debug output: pass
- Temporary TODO/FIXME/XXX: pass
- Commented-out code: pass
- Unused imports / dead code from this feature: pass by targeted tests / typecheck touched-file absence / local review
- Out-of-scope files: pass; no editor/theme-editor/overlay implementation diff

## 7. Verdict

- Status: passed
- Next: `cs-feat` acceptance 阶段；Goal acceptance must mechanically verify `approval-report.md#goal-acceptance` before completion.
