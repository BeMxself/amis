---
doc_type: approval-report
unit: .codestable/features/2026-07-25-overlay-theme-scope-propagation
status: approved
reason: code-review-local-only-approved
approvals:
  design-review-local-only: approved
  overlay-dod-baseline-narrowing: approved
  code-review-local-only: approved
approval_groups: {}
created_at: 2026-07-25
---

# Approval Report

## Decision History

- 2026-07-25：owner 明确回复“批准 overlay design-review-local-only”，允许独立 design reviewer 工具不可用时以本地审查降级完成本轮 design review。
- 2026-07-25：owner 明确回复“批准 overlay-dod-baseline-narrowing”，允许本 feature 将 full `Dialog` / `Tooltip` / `Select` 命令降为 baseline risk，并以后续 selector migration 清理。
- 2026-07-26：code review 复审阶段独立 reviewer 启动被宿主工具 payload/schema 校验阻断，OCR CLI 不可用；owner 明确回复“批准 overlay code-review-local-only”，允许本轮 code review 以 local-only 降级完成。

## Decision: code-review-local-only

已批准 `overlay-theme-scope-propagation` 在本轮以 local-only 方式完成 code review 复审。

命名决策：`approval-report.md#code-review-local-only`

## Why Now

Implementation review-fix 已完成并重跑核心 gate：

- REV-001：Overlay scope source 已改为 target DOM nearest scope → `ThemeContext` → `EnvContext.theme` fallback。
- REV-002：Modal / Drawer custom container 返回 `null` 时保持旧 `null` 行为。
- REV-003：Overlay portal child 外层已有 scoped ancestor，targeted tests 覆盖 `[data-amis-theme] .amis-*` 后代选择器。

但完整独立复审无法启动：多次调用 Task agent reviewer 时宿主工具返回 `Provide either message or items, but not both` 或空 `reasoning_effort` 校验错误；OCR lane 也不可用，`which ocr` 返回 `ocr not found`。按照 CodeStable review gate，缺少独立 reviewer 时不能静默自审通过。

## Context

- Implementation evidence: `.codestable/features/2026-07-25-overlay-theme-scope-propagation/overlay-theme-scope-propagation-implementation.md`
- Review packet: `.codestable/features/2026-07-25-overlay-theme-scope-propagation/overlay-theme-scope-propagation-review-packet.md`
- Evidence pack: `.codestable/features/2026-07-25-overlay-theme-scope-propagation/overlay-theme-scope-propagation-evidence-pack.md`
- Scope gate: passed
- DoD runner: passed with approved non-core baseline warnings CMD-002 / CMD-003 / CMD-004
- OCR: unavailable (`ocr not found`)

## Options

### Option A: 批准 `code-review-local-only`

允许主 agent 在本轮以 local-only 方式完成 code review，并在 review 报告中明确 `reviewer: self` / local-only 降级来源。后续 QA 与 acceptance 仍必须执行，不等于接受实现结果。

### Option B: 不批准，等待或重试独立 reviewer

保持 feature 停在 review blocked，等 Task agent 工具恢复、切换 reviewer 通道，或 owner 后续另行授权。

## Recommendation

建议批准 Option A，前提是你接受本轮缺少独立 reviewer 视角；QA / acceptance 将继续重点复核多 root + shared env、scoped descendant selector、Modal/Drawer null custom container 和 non-core full-suite baseline risk。

## Risks And Tradeoffs

- local-only review 缺少隔离视角，可能漏掉主 agent 自身实现偏差。
- 不批准则实现已完成但无法进入 QA / acceptance。
- 该批准只覆盖本 feature 的本轮 code review gate 降级，不授权 push / merge / release，不改变 approved design 或 roadmap 范围。

## Non-Automatic Actions

- 不自动提交 commit。
- 不自动 push。
- 不自动 merge。
- 不跳过 QA。
- 不跳过 acceptance。
- 不接受新增范围或长期架构变化。

## After Approval

授权已生效。frontmatter 中 `approvals.code-review-local-only` 已改为 `approved`，review 报告将记录 local-only passed，并继续进入 QA。

## Decision: overlay-dod-baseline-narrowing

已批准 `overlay-theme-scope-propagation` 调整 implementation.before_review 的 DoD 判定：

- full `npm test --workspace amis -- Dialog`
- full `npm test --workspace amis -- Tooltip`
- full `npm test --workspace amis -- Select`

上述命令当前作为 baseline risk 记录，不阻断本 feature 进入 code review / QA；本 feature 改用 targeted overlay scope tests、`amis-core -- theme`、stylelint、rg 和 YAML 校验作为当前阶段核心证据。

命名决策：`approval-report.md#overlay-dod-baseline-narrowing`

## Why Now

`codestable-dod-runner.py` 真实执行 checklist 后失败：

- CMD-002 `Dialog`：`renderers/Dialog.test.tsx` 通过；`event-action/dialog.test.tsx` 旧 snapshots 失败。
- CMD-003 `Tooltip`：旧 `.cxd-Tooltip*` / `.cxd-TooltipWrapper` DOM 查询失败。
- CMD-004 `Select`：旧 `.cxd-*` DOM 查询和旧 snapshots 失败。

这些失败在本 feature 动代码前已经出现；本次 Modal 新增 `data-amis-theme` 会让 Dialog 旧 snapshot 额外变化，但主要阻塞面仍是前缀类测试/源码迁移债。

## Context

本 feature 的已完成代码和 targeted tests 覆盖：

- `packages/amis-core/src/theme.tsx`：统一 helper `getNearestThemeScope` / `applyThemeScope` / `resolveOverlayContainer`。
- `packages/amis-core/src/components/Overlay.tsx`：Portal child 继承 body/custom/custom-scope/multi-root/iframe scope。
- `packages/amis-ui/src/components/Modal.tsx`：Dialog/Modal root 携带 body/custom container scope。
- `packages/amis-ui/src/components/Drawer.tsx`：Drawer root 复用 Modal fullscreen+scope resolver。

通过证据：

- `npm test --workspace amis-core -- theme`
- `npm test --workspace amis-core -- Overlay`
- `npm test --workspace amis -- renderers/Dialog.test.tsx`
- `npm test --workspace amis -- DrawerThemeScope`
- `npm run stylelint`
- YAML / rg / `git diff --check`

## Options

**Option A（推荐）：批准 DoD 窄化**

把 full `Dialog` / `Tooltip` / `Select` 命令在本 feature 中降为 baseline risk；当前 feature 继续进入 review / QA。后续 `core-component-selector-migration` 负责清理 `.cxd-*` selector tests、snapshots 和源码中 `classPrefix` DOM 类依赖。

**Option B：先迁移 selector 测试和源码**

暂停当前 feature review，先处理 `Tooltip` / `Select` / event-action Dialog 的旧 `.cxd-*` 查询、snapshots，以及 Select / ChainedSelect 等源码中的 `classPrefix` DOM 类依赖。完成后回到本 feature 重跑 DoD。

## Recommendation

选 Option A。

理由：当前 feature 的目标是 overlay scope 传播，不是组件 selector 迁移；Select 失败已经命中源码里的旧 `classPrefix` DOM 类依赖，提前修会扩大到后续 `core-component-selector-migration` 的核心范围。

## Risks And Tradeoffs

- Option A 的风险：full renderer suites 暂时仍红，必须在后续 selector migration 里清掉，否则 final audit 仍会阻断。
- Option A 的收益：保持本 feature 干净，只验证 portal/container scope 行为。
- Option B 的风险：当前 feature 会吞并后续组件 selector migration，review 面明显变大。

## Non-Automatic Actions

批准本决策不会自动 push、merge、release 或提交。是否 commit 仍受 roadmap goal 的 `goal-commits` 授权和后续 gate 结果约束。

## Prior Decision: design-review-local-only

`design-review-local-only` 已批准。本授权只覆盖本 feature 的 design review 降级，不自动确认 design、不自动进入实现、不跳过后续 code review、QA 或 acceptance。

## After Approval

已按 Option A 执行：把 `overlay-dod-baseline-narrowing` 改为 `approved`，恢复 `goal-state.yaml` 为可继续，重跑 scope/evidence gate，并进入 `cs-code-review`。
