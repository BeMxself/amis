---
doc_type: approval-report
unit: theme-system-refactor
status: approved
reason: goal-execution-approved
approvals:
  goal-acceptance: approved
  goal-commits: approved
approval_groups:
  goal-execution:
    status: approved
    confirmation_id: "goal-execution-20260725160058"
    decisions:
      - goal-acceptance
      - goal-commits
created_at: 2026-07-25
---

# Approval Report

## Decision History

- 2026-07-25：owner 明确回复“允许 goal-execution”，批准 `goal-execution` group，并同时批准 `goal-acceptance` 与 `goal-commits`。Confirmation id: `goal-execution-20260725160058`。

## Decision Result

`goal-execution` 已批准。该批准允许状态机派发 goal driver 或输出同一条 `/goal` 指令，并允许 goal driver 在两项 ApprovalRef 机械核验通过后执行 feature acceptance 与逐 feature scoped commit。

## Decision Needed

需要 owner 一次性确认是否启动 `theme-system-refactor` 的 roadmap goal execution。该确认会同时授权两项仍需分别机械核验的命名决策：

- `goal-acceptance`：允许 goal driver 在每个 feature review / QA 通过后完成 acceptance。
- `goal-commits`：允许 goal driver 在每个 feature accepted 后执行该 feature 范围内的 scoped commit。

## Why Now

Roadmap 已确认，所有未完成子 feature design 已统一批准，且 goal 包已落盘。下一步若要进入实现，需要明确授权 goal driver 执行实现、review、QA、acceptance 与逐 feature scoped commit。

## Context

- Roadmap: `.codestable/roadmap/theme-system-refactor/theme-system-refactor-roadmap.md`
- Items: `.codestable/roadmap/theme-system-refactor/theme-system-refactor-items.yaml`
- Goal plan: `.codestable/roadmap/theme-system-refactor/goal-plan.md`
- Goal state: `.codestable/roadmap/theme-system-refactor/goal-state.yaml`
- Goal command:

```text
/goal "执行 CodeStable roadmap 目录 .codestable/roadmap/theme-system-refactor 下的 goal 执行包。先读取 goal-protocol.md、goal-protocol-feature-loop.md、goal-protocol-gates.md、goal-protocol-audit.md、goal-state.yaml、goal-plan.md；这是已由用户确认 roadmap 和全部 feature design，并在同一次 Goal 启动确认中授权 Goal acceptance 与每个 feature 自动 scoped-commit 的模式，两项 ApprovalRef 仍须分别机械核验。按 goal-state.yaml 的 features 顺序循环：进入 cs-feat implementation、cs-code-review、cs-feat QA；review/QA 失败按协议修复重跑，awaiting/needs-human/blocked 分别等待、请求输入或 handoff。QA passed 后只用 goal-acceptance ApprovalRef 调用 ResumeGoalAcceptance；accept 后先持久化 accepted 状态与新 index，再机械核验 goal-commits ApprovalRef，只有有效时才 scoped-commit 本 feature 的全部状态更新，缺失、不匹配或 rejected 必须 handoff 且不得提交。每个 feature 完成打印 CS_ROADMAP_GOAL_FEATURE_DONE；全部完成后做最终 roadmap 审计。只有出现 CS_ROADMAP_GOAL_COMPLETE，且所有 feature review/QA/acceptance、授权提交和最终审计均通过、没有 CS_ROADMAP_GOAL_HANDOFF，本 goal 才算完成。"
```

## Options

### Option A: 批准 `goal-execution`

把 `approval_groups.goal-execution` 写为 approved，并用同一个 confirmation id 同步 `goal-acceptance` 与 `goal-commits`。随后状态机可以派发可见 goal driver 或输出同一条 `/goal` 指令给用户粘贴执行。

### Option B: 暂不批准

保持 `goal-state.yaml` 为 `awaiting-authorization`，不进入实现、不 acceptance、不自动 scoped commit。

## Recommendation

建议在你确认可以进入长程执行时选择 Option A。当前批准范围只覆盖本 roadmap goal 包内的 feature 执行、acceptance 和逐 feature scoped commit，不覆盖远程或发布动作。

## Risks And Tradeoffs

- Goal driver 会按 feature 修改代码、文档和 CodeStable 产物，并在每个 feature accepted 后尝试 scoped commit。
- 如果 review、QA、核心命令或最终 audit 失败，driver 必须修复或 handoff，不能把风险写成通过。
- 自动 commit 只允许在 `goal-commits` 可机械核验时发生；push / merge / release 不在本授权内。

## Non-Automatic Actions

- 不自动 push。
- 不自动 merge。
- 不自动 publish。
- 不自动 release。
- 不自动 deploy。
- 不自动 promotion。
- 不自动 production cutover。

## After You Answer

批准后，主流程应原子更新 approval group、两项 named decision 和 `goal-state.yaml` projection，然后尝试派发可见 goal driver；如果 driver 不可见或派发失败，只输出同一条 fenced `/goal` 指令。
