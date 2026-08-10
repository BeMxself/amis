---
doc_type: feature-qa
feature: 2026-07-25-overlay-theme-scope-propagation
status: passed
runner_state: not-started
runner_reason: ""
runner_id: ""
tested: 2026-07-26
round: 1
---

# overlay-theme-scope-propagation QA 报告

## 1. Scope And Inputs

- Design: `.codestable/features/2026-07-25-overlay-theme-scope-propagation/overlay-theme-scope-propagation-design.md`
- Checklist: `.codestable/features/2026-07-25-overlay-theme-scope-propagation/overlay-theme-scope-propagation-checklist.yaml`
- Review: `.codestable/features/2026-07-25-overlay-theme-scope-propagation/overlay-theme-scope-propagation-review.md`
- Evidence pack: `.codestable/features/2026-07-25-overlay-theme-scope-propagation/overlay-theme-scope-propagation-evidence-pack.md`
- Gate results: `.codestable/features/2026-07-25-overlay-theme-scope-propagation/overlay-theme-scope-propagation-scope-gate.json`
- DoD results: `.codestable/features/2026-07-25-overlay-theme-scope-propagation/overlay-theme-scope-propagation-dod-results.json`
- Diff basis: 当前工作区 diff + 本 feature untracked artifacts。
- Baseline dirty files: none outside this feature scope。
- Feature type: mixed。
- Core evidence gate: Overlay / Modal / Drawer portal scope 是运行时 DOM 行为，必须有 targeted Jest DOM 断言；full `Dialog` / `Tooltip` / `Select` suites 已由 `approval-report.md#overlay-dod-baseline-narrowing` 批准为 non-core baseline warnings。

## 2. Verification Matrix

| ID | 来源 | 核心性 | 场景 / 风险 | 证据类型 | 命令或动作 | 期望 | 结果 |
|---|---|---|---|---|---|---|---|
| QA-001 | helper | core-functional | helper nearest/apply/custom container scope | unit | `npm test --workspace amis-core -- theme` | helper invariant 通过 | pass |
| QA-002 | Overlay | core-functional | body/custom/custom-scope/multi-root/iframe scope | unit / DOM assertion | `npm test --workspace amis-core -- Overlay` | portal wrapper scope 正确 | pass |
| QA-003 | Dialog/Modal | core-functional | body/custom/null container modal scope | integration / DOM assertion | `npm test --workspace amis -- renderers/Dialog.test.tsx` | modal root scope 正确，null 不 fallback body | pass |
| QA-004 | Drawer | core-functional | Drawer body/custom/null container scope | integration / DOM assertion | `npm test --workspace amis -- DrawerThemeScope` | drawer root scope 正确，null 不 fallback body | pass |
| QA-005 | 多 root renderer | core-functional | 真实 `amisRender` 多 root + shared env + body portal | integration / DOM assertion | `npm test --workspace amis -- OverlayThemeScope` | root scope 不串线 | pass |
| QA-006 | DoD/supporting | supporting | SCSS 未改坏、YAML 有效、workflow 可恢复 | lint / YAML / workflow | stylelint、validate-yaml、workflow-next | 全部通过 | pass |
| QA-007 | baseline warnings | supporting | full Dialog/Tooltip/Select 旧 selector/snapshot 红灯 | DoD evidence | `overlay-dod-results.json` | 作为 approved non-core warnings 记录 | pass |
| QA-008 | 清洁度 | supporting | debug/TODO/FIXME/out-of-scope | grep / diff | `rg` + `git diff --check` | 无新增清洁度问题 | pass |

## 3. Command Results

- `npm test --workspace amis-core -- theme` -> exit 0：7 tests passed。
- `npm test --workspace amis-core -- Overlay` -> exit 0：6 tests passed，覆盖 body/custom/custom-scope/target DOM priority/multi-root/iframe。
- `npm test --workspace amis -- renderers/Dialog.test.tsx` -> exit 0：5 tests passed，覆盖 Dialog body/custom/null container。
- `npm test --workspace amis -- DrawerThemeScope` -> exit 0：3 tests passed，覆盖 Drawer body/custom/null container。
- `npm test --workspace amis -- OverlayThemeScope` -> exit 0：1 test passed，覆盖真实 `amisRender` 多 root + shared env。
- `npm run stylelint` -> exit 0：通过。
- `validate-yaml.py --file overlay-theme-scope-propagation-checklist.yaml --yaml-only` -> exit 0：通过。
- `git diff --check` -> exit 0：通过。
- `codestable-workflow-next.py epic --roadmap .codestable/roadmap/theme-system-refactor --json` -> exit 0：`status: dispatch_goal`，两项 goal authorization refs 可见。
- `rg -n "console\.(log|error|warn)|TODO|FIXME|XXX" ...` -> existing baseline only：`Dialog.test.tsx` 既有 console.error 注释、`Overlay.tsx` 既有 FIXME；本 feature 未新增。
- `git diff --name-only -- packages/amis-editor-core packages/amis-theme-editor-helper packages/amis-ui/scss packages/amis-editor` -> no output：未触碰 editor/theme-editor/helper/SCSS。

## 4. Scenario Results

- [x] QA-001 helper invariant：pass。
  - Evidence: `theme.test.ts` 覆盖 nearest scope、apply idempotent、custom container scope。
- [x] QA-002 Overlay portal scope：pass。
  - Evidence: `Overlay.test.tsx` 覆盖 scoped ancestor、target DOM priority、multi-root、iframe container。
- [x] QA-003 Dialog/Modal scope：pass。
  - Evidence: `Dialog.test.tsx` 覆盖 body portal、custom container scope、custom container unavailable 不 fallback。
- [x] QA-004 Drawer scope：pass。
  - Evidence: `DrawerThemeScope.test.tsx` 覆盖 body portal、custom container scope、custom container unavailable 不 fallback。
- [x] QA-005 真实 renderer 多 root：pass。
  - Evidence: `OverlayThemeScope.test.tsx` 覆盖 shared env 下 `cxd` / `dark` root body portal。
- [x] QA-006 范围反向核对：pass。
  - Evidence: editor/helper/SCSS diff 为空；scope gate passed。
- [x] QA-007 full suite baseline warning：pass。
  - Evidence: DoD runner passed with approved warnings CMD-002 / CMD-003 / CMD-004；这些失败交给后续 `core-component-selector-migration`。

## 5. Findings

### failed

none

### blocked

none

### residual-risk

- 本轮 code review 是 owner 批准的 local-only fallback，缺 round 2 独立 reviewer / OCR 视角；acceptance 需复核关键 DOM invariant 和 baseline warnings。
- full `Dialog` / `Tooltip` / `Select` suites 当前仍红，按 `overlay-dod-baseline-narrowing` 仅作为本 feature non-core baseline risk；最终 roadmap audit 仍需后续 selector migration 清理。
- 真实浏览器 CSS 层叠与 editor preview 时序未用浏览器肉眼验证；本 feature 的核心可观察行为由 jsdom DOM invariant 覆盖。

## 6. Cleanliness

- Debug output: pass；仅命中既有 `Dialog.test.tsx` console.error 注释。
- Temporary TODO/FIXME/XXX: pass；仅命中既有 `Overlay.tsx` FIXME。
- Commented-out code: pass。
- Unused imports / dead code from this feature: pass。
- Out-of-scope files: pass；editor/helper/SCSS diff 为空。

## 7. Verdict

- Status: passed
- Next: `cs-feat` acceptance 阶段，以 roadmap `approval-report.md#goal-acceptance` 作为 Goal acceptance authorization。
