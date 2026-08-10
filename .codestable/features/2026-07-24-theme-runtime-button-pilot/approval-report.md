---
doc_type: approval-report
unit: 2026-07-24-theme-runtime-button-pilot
status: approved
reason: goal-acceptance-and-review-authorization
approvals:
  goal-acceptance: approved
  code-review-local-only: approved
approval_groups: {}
created_at: 2026-07-24
---

# Approval Report

## Decision History

- 2026-07-24：owner 批准 `goal-acceptance`，允许实现、code review、QA 都通过后使用 `approval-report.md#goal-acceptance` 进入 Goal acceptance。
- 2026-07-25：owner 批准 `code-review-local-only`，允许独立 reviewer 不可用且 OCR 不可用时以本地审查降级完成本轮 code review。

## Decision: goal-acceptance

已批准 owner 独立授权 `goal-acceptance`。

这不是确认 design，也不是现在接受实现结果；它只表示：当 `theme-runtime-button-pilot` 的实现、code review、QA 都通过并留下证据后，Goal driver 可以使用 `approval-report.md#goal-acceptance` 进入最终 acceptance 阶段，不需要再停下来等一次人工验收授权。

## Why Now

该 feature 的 `execution_lane` 是 `goal`。根据 CodeStable Goal Package Protocol，生成并派发 goal 包前必须存在同 feature 目录下的 `approval-report.md`，且 frontmatter 中有：

```yaml
approvals:
  goal-acceptance: approved
```

设计确认不能替代这个授权。

## Context

- Design: `.codestable/features/2026-07-24-theme-runtime-button-pilot/theme-runtime-button-pilot-design.md`
- Design review: `.codestable/features/2026-07-24-theme-runtime-button-pilot/theme-runtime-button-pilot-design-review.md`
- Checklist: `.codestable/features/2026-07-24-theme-runtime-button-pilot/theme-runtime-button-pilot-checklist.yaml`
- Roadmap item: `theme-runtime-button-pilot`

当前 design 已由 owner 确认通过，并已标记为 `approved`。Design review gate 通过方式为 owner 批准的 `local-only` 降级。

## Options

### Option A: 批准 `goal-acceptance`（推荐）

授权 Goal driver 在实现、review、QA 都通过后进入 acceptance。若遇到需要改 design、改范围、改公开契约、验证失败、连续修复三轮仍不过或外部环境缺失，仍必须 handoff，不得自行完成。

**Decision**：approved，2026-07-24，owner 明确回复“批准 goal-acceptance”。

### Option B: 不批准 `goal-acceptance`

不生成可派发的 goal 包，或生成后只能停在授权缺失状态。后续每次到 acceptance 前都需要人工恢复授权。

## Recommendation

建议选择 Option A。理由：本 feature 已有明确 design、checklist、review gate、验证命令和范围守护；Goal driver 的 acceptance 仍受 review / QA / checklist / evidence 约束，不是无条件自验收。

## Risks And Tradeoffs

- 批准后，正常路径会减少一次人工停顿；代价是 acceptance 阶段主要由产物证据驱动。
- 风险边界已经写入 goal protocol：需要改变 approved design、feature 范围、公开契约或 roadmap item 时必须 handoff。
- local-only design review 缺少异构 reviewer 视角；后续 code review 必须重点复核 Root scope 挂点和 classnames 缓存语义。

## Non-Automatic Actions

- 该授权不自动提交 commit。
- 该授权不自动 push。
- 该授权不自动改 ADR / requirements。
- 该授权不允许跳过 implementation、code review、QA 或 acceptance report。

## After You Answer

授权已生效。后续 `goal-state.yaml` 必须引用 `approval-report.md#goal-acceptance`，Goal acceptance 阶段必须机械核对本文件同 unit、同 decision 为 `approved`。

---

## Decision: code-review-local-only

已批准 owner 降级授权 `code-review-local-only`。

## Why Now

Implementation gate 已完成，但 code review 阶段无法启动独立 Task agent reviewer：多次启动均被工具 payload/schema 拒绝；OCR lane 也不可用，`which ocr` 返回 `ocr not found`。按照 CodeStable review gate，缺少独立 reviewer 时不能静默自审通过。

## Context

- Implementation evidence: `.codestable/features/2026-07-24-theme-runtime-button-pilot/theme-runtime-button-pilot-implementation.md`
- Review target: 当前工作区 diff
- 已通过验证：`npm test --workspace amis-core -- theme`、`npm test --workspace amis -- button`、`npm run stylelint`
- 已执行但红灯：`npm run typecheck`，错误集中在既有 editor/schema/table/scripts 类型问题，未指向本次触碰文件
- OCR: unavailable (`ocr not found`)

## Options

### Option A: 批准 `code-review-local-only`（推荐，若你接受本地审查降级）

允许主 agent 在本轮以 local-only 方式完成 code review，并在 review 报告中明确 `reviewer: self` / local-only 降级来源。后续 QA 与 acceptance 仍必须执行，不等于接受实现结果。

**Decision**：approved，2026-07-25，owner 明确回复“批准 code-review-local-only”。

### Option B: 不批准，稍后重试独立 reviewer

保持 goal 停在 review/blocked，等 Task agent 工具恢复或切换可用 reviewer 后重新进入 code review。

## Recommendation

建议选择 Option A 的前提是：你接受本轮缺少独立 reviewer 视角，但要求本地 review 报告显式保留该风险，并在 QA 中重点复核 Root scope、alias、selector guard 和 typecheck 基线归因。

## Risks And Tradeoffs

- local-only review 缺少隔离视角，可能漏掉主 agent 自身实现偏差。
- 不批准则实现已完成但无法进入 QA/acceptance。
- 该批准只覆盖 code review gate 降级，不授权 commit、push、merge，不改变 approved design 或 roadmap 范围。

## Non-Automatic Actions

- 不自动提交 commit。
- 不自动 push。
- 不跳过 QA。
- 不跳过 acceptance。
- 不接受新增范围或长期架构变化。

## After You Answer

授权已生效。frontmatter 中 `approvals.code-review-local-only` 已改为 `approved`，goal-state 从 `review/blocked` 恢复为 `review/ready`，然后完成 local-only review 报告并继续 QA。
