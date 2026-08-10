---
doc_type: feature-qa
feature: 2026-07-25-core-component-selector-migration
status: passed
runner_state: not-started
runner_reason: ""
runner_id: ""
tested: 2026-07-26
round: 1
---

# core-component-selector-migration QA 报告

## 1. Scope And Inputs

- Design: `.codestable/features/2026-07-25-core-component-selector-migration/core-component-selector-migration-design.md`
- Checklist: `.codestable/features/2026-07-25-core-component-selector-migration/core-component-selector-migration-checklist.yaml`
- Review: `.codestable/features/2026-07-25-core-component-selector-migration/core-component-selector-migration-review.md`
- Evidence pack: `.codestable/features/2026-07-25-core-component-selector-migration/core-component-selector-migration-evidence-pack.md`
- Gate results: `.codestable/features/2026-07-25-core-component-selector-migration/core-component-selector-migration-scope-gate.json`
- DoD results: `.codestable/features/2026-07-25-core-component-selector-migration/core-component-selector-migration-dod-results.json`
- Diff basis: 当前 workspace unstaged + untracked diff，均属于本 feature scope；scope gate passed。
- Baseline dirty files: none outside current feature scope。
- Feature type: mixed。
- Core evidence gate: 本 feature 改变核心组件 DOM class / SCSS selector / DOM query 行为边界，必须用 targeted Jest DOM/snapshot、selector guard、stylelint、grep baseline、review focus 复核作为核心证据；真实浏览器视觉 QA 不在本 gate 内，但 acceptance 需保留 residual risk。

## 2. Verification Matrix

| ID | 来源 | 核心性 | 场景 / 风险 | 证据类型 | 命令或动作 | 期望 | 结果 |
|---|---|---|---|---|---|---|---|
| QA-001 | DoD CMD-001 | supporting | SCSS 大批 stable selector 替换后基础 lint 不破坏 | lint | `npm run stylelint` | exit 0 | pass |
| QA-002 | DoD CMD-002 / guard | core-functional | selector policy 收窄到 1507，且无新增 legacy selector violation | command | `npm run check:theme-selectors --workspace amis-ui` | exit 0，0 new violation | pass |
| QA-003 | Button/Form wave | core-functional | Button/Form 默认 DOM 主路径不回退，Dialog snapshot 中 stack class 稳定 | Jest / snapshot | `npm test --workspace amis -- button` | 5 suites / 19 tests / 20 snapshots passed | pass |
| QA-004 | Dialog/Modal review focus | core-functional | Dialog/Modal content query、drag handle、outside-close root、stack class 使用 `.amis-*` | Jest / DOM assertion / snapshot | `npm test --workspace amis -- Dialog` | 2 suites / 12 tests / 14 snapshots passed | pass |
| QA-005 | Drawer review focus | core-functional | Drawer root/overlay/content/close/stack class 与 outside-close overlay 使用 `.amis-*` | Jest / DOM assertion / snapshot | `npm test --workspace amis -- drawer` | 2 suites / 7 tests / 14 snapshots passed | pass |
| QA-006 | Tooltip/Overlay wave | core-functional | Tooltip wrapper / overlay selector 迁移后行为与 snapshots 不破 | Jest / snapshot | `npm test --workspace amis -- Tooltip` | 1 suite / 9 tests / 6 snapshots passed | pass |
| QA-007 | Select wave | core-functional | Select/ChainedSelect wrapper 与 option custom style suffix 使用 stable class | Jest / snapshot | `npm test --workspace amis -- Select` | 7 suites / 31 tests / 25 snapshots passed | pass |
| QA-008 | Dropdown wave | supporting | DropDownButton closeOnClick / closeOnOutside 与 menu selector 不破 | Jest / snapshot | `npm test --workspace amis -- DropDownButton` | 1 suite / 10 tests / 8 snapshots passed | pass |
| QA-009 | Table wave | core-functional | Table/Table2/Page/Layout snapshots 与 VirtualTableBody DOM 查询不破 | Jest / snapshot | `npm test --workspace amis -- Table` | 5 suites / 49 tests / 22 snapshots passed | pass |
| QA-010 | remaining legacy baseline | supporting | 剩余 `#{$ns}` / `classPrefix` 是记录债务，不是本 feature 未解释新增 | grep / ledger | DoD CMD-009 / CMD-010 + ledger | 有输出但按 document-baseline 分类 | pass |
| QA-011 | YAML / workflow evidence | supporting | checklist 可解析，feature evidence 可供 acceptance 消费 | YAML / gate | `validate-yaml.py` + DoD/scope/evidence pack | 全部 passed | pass |
| QA-012 | cleanliness | supporting | 无 whitespace error / debug output / 临时 TODO | diff / local scan | `git diff --check` + review diff | exit 0，无新增清洁度问题 | pass |

## 3. Command Results

- `npm run stylelint` → exit 0：SCSS lint 通过。
- `npm run check:theme-selectors --workspace amis-ui` → exit 0：`Theme selector guard passed: 1507 legacy baseline match(es), 0 new violation(s).`
- `npm test --workspace amis -- button` → exit 0：5 suites passed，19 tests passed，20 snapshots passed。
- `npm test --workspace amis -- Dialog` → exit 0：2 suites passed，12 tests passed，14 snapshots passed。
- `npm test --workspace amis -- drawer` → exit 0：2 suites passed，7 tests passed，14 snapshots passed。
- `npm test --workspace amis -- Tooltip` → exit 0：1 suite passed，9 tests passed，6 snapshots passed。
- `npm test --workspace amis -- Select` → exit 0：7 suites passed，31 tests passed，25 snapshots passed。
- `npm test --workspace amis -- DropDownButton` → exit 0：1 suite passed，10 tests passed，8 snapshots passed。
- `npm test --workspace amis -- Table` → exit 0：5 suites passed，49 tests passed，22 snapshots passed。
- `rg -n -F '#{$ns}' packages/amis-ui/scss/components packages/amis-ui/scss/_mixins.scss` → exit 0：剩余命中作为 document-baseline；目标 wave 已在 ledger 归档。
- `rg -n "\\.cxd-|\\.antd-|\\.dark-|classPrefix" packages/amis-core/src packages/amis-ui/src packages/amis/src packages/amis-ui/scss` → exit 0：剩余命中作为 legacy props passthrough / editor/helper / non-target debt 分类输入。
- `validate-yaml.py --file core-component-selector-migration-checklist.yaml --yaml-only` → exit 0：YAML valid。
- `codestable-dod-runner.py --stage implementation.before_review` → exit 0：status passed，blocking/warnings 为空。
- `codestable-scope-gate.py --stage implementation.before_review` → exit 0：status passed，blocking/warnings 为空。
- `codestable-evidence-pack.py --stage implementation.before_review` → exit 0：status passed，archguard/meta-cc skipped by disabled provider config。
- `git diff --check` → exit 0：无 whitespace error。

## 4. Scenario Results

- [x] QA-001 stable helper / DOM selector path：pass。
  - Evidence: `amis-core` theme helper tests + Dialog/Drawer/Form/Table targeted tests；helper 在 legacy alias 开启时仍优先 `.amis-*`。
  - Notes: 调用方使用 `getStableClassName` / `getStableClassSelector`，未各自硬编码 `.cxd-*`。
- [x] QA-002 Modal/Drawer outside-close 与 stack class：pass。
  - Evidence: `packages/amis/__tests__/renderers/Dialog.test.tsx` 新增直接组件断言；`Dialog`、`drawer` suites passed；相关 snapshots 已从 `cxd-Modal--1th` 更新为 `amis-Modal--1th`。
  - Notes: 这是 code review 本地对抗检查发现并修复的核心风险。
- [x] QA-003 Select/ChainedSelect custom style suffix：pass。
  - Evidence: `Select` suite 31 tests / 25 snapshots passed；`CustomStyle` option suffix 已使用 stable option class。
- [x] QA-004 Table/Table2 virtual body：pass。
  - Evidence: `Table` suite 49 tests / 22 snapshots passed；VirtualTableBody root/fixed header/autoFill state query 已用 stable helper。
- [x] QA-005 guard / ledger / remaining debt：pass。
  - Evidence: selector guard 1507 baseline / 0 new violation；ledger 记录目标 wave done 与剩余 debt 分类。
- [x] QA-006 范围反向核对：pass。
  - Evidence: scope gate passed；未迁移 editor/theme-editor helper、未删除 `classPrefix` 字段、未关闭 DOM-only alias。

## 5. Findings

### failed

none

### blocked

none

### residual-risk

- 本轮 code review 使用 owner 授权的 `reviewer: self` fallback，缺少独立 reviewer / OCR 视角；QA 已加大 targeted command 和 diff 复核覆盖，但 acceptance 仍应显式记录该降级。
- 真实浏览器视觉层叠未做截图 QA；本轮核心证据来自 jsdom DOM assertions、snapshots、selector guard、stylelint 和 grep baseline。
- 剩余 1507 legacy baseline match 属于后续 `legacy-prefix-teardown` / 非目标组件迁移输入，不在本 feature 内继续扩大处理。

## 6. Cleanliness

- Debug output: pass。
- Temporary TODO/FIXME/XXX: pass。
- Commented-out code: pass；既有历史注释未作为本 feature 新增问题处理。
- Unused imports / dead code from this feature: pass。
- Out-of-scope files: pass；scope gate 限定在 feature 目录、`goal-state.yaml`、`packages/amis-core`、`packages/amis-ui`、`packages/amis`。

## 7. Verdict

- Status: passed
- Next: 进入 `cs-feat` acceptance 阶段，使用 roadmap `approval-report.md#goal-acceptance` 授权完成 feature acceptance；acceptance 需复核 self-review fallback、Modal/Drawer 修复点、remaining legacy baseline 和下游 roadmap 状态。
