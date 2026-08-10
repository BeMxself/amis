---
doc_type: feature-goal-protocol
feature: 2026-07-24-theme-runtime-button-pilot
status: ready-to-dispatch
created: 2026-07-24
---

# theme-runtime-button-pilot Goal Protocol

## 1. 启动顺序

1. 读取 `goal-state.yaml`、`goal-plan.md`、`theme-runtime-button-pilot-design.md`、`theme-runtime-button-pilot-checklist.yaml` 和 `theme-runtime-button-pilot-design-review.md`。
2. 复核 design `status: approved`，design-review `review_state: passed`。
3. 复核 `approval-report.md#goal-acceptance`：同 feature 目录下 `approval-report.md` frontmatter 必须包含 `approvals.goal-acceptance: approved`。
4. 复核 roadmap item `theme-runtime-button-pilot` 为 `in-progress` 且 `feature: 2026-07-24-theme-runtime-button-pilot`。

任何复核失败都必须写 `stage: handoff` / `status: blocked`，并输出 `CS_FEATURE_GOAL_HANDOFF`。

## 2. 执行 Loop

1. 进入 `cs-feat` implementation 阶段，按 checklist steps 顺序执行。
2. 行为代码 step 默认按 RED → GREEN → VERIFY 执行；不能 TDD 时写 `TDD exception` 和替代证据。
3. 每完成一个 step，更新实现证据；不要把未完成 step 标为 done。
4. implementation gate 通过后，更新 `goal-state.yaml` 为 `stage: review` / `status: ready`。
5. 进入 `cs-code-review`。有 blocking 时修复并重跑 review；修复期间状态为 `stage: review` / `status: fixing`。
6. review passed 后，更新 `goal-state.yaml` 为 `stage: qa` / `status: ready`。
7. 进入 `cs-feat` QA。QA failed / blocked 时修复后重跑 review 和 QA；修复期间状态为 `stage: qa` / `status: fixing`。
8. QA passed 后，更新 `goal-state.yaml` 为 `stage: acceptance` / `status: ready`。
9. 以 `ResumeGoalAcceptance approval-report.md#goal-acceptance` 进入 `cs-feat` acceptance；acceptance 必须复核同目录 approval report。
10. acceptance passed 后，更新 `goal-state.yaml` 为 `stage: complete` / `status: passed`，并输出 `CS_FEATURE_GOAL_COMPLETE`。

## 3. Implementation Gate

必须满足：

- `theme-runtime-button-pilot-checklist.yaml` 的 steps 全部完成且证据可追溯。
- `ThemeInstance.classnames` 默认稳定输出 `.amis-*`。
- `legacyDomClassAlias: 'cxd'` 仅显式开启时输出 `.cxd-*` DOM alias。
- Root scope 容器输出 `data-amis-theme`，不破坏现有 root wrapper 顺序。
- Button 最小样式 proof 不生成 `.cxd-Button` 库 selector。
- 未扩展到全量组件、editor、overlay 或 SCSS/CSS legacy selector 双轨。

## 4. 必跑命令

以 checklist `dod.commands` 为机器权威：

```bash
npm test --workspace amis-core -- theme
npm test --workspace amis -- button
npm run typecheck
npm run stylelint
rg -n "\\.cxd-Button|#\\{\\$ns\\}Button|legacyDomClassAlias|componentClassPrefix|data-amis-theme" packages/amis-core packages/amis-ui packages/amis
```

核心命令失败时必须 fix-or-block；selector grep 可 document-baseline，但新增命中必须能分类解释。

## 5. Goal 模式接管

- 普通流程中 implementation / review / QA / acceptance 的停等 checkpoint，在 Goal 模式下改为写入报告、状态和证据记录。
- acceptance 仍必须消费 goal package 前独立取得的 `ApprovalRef`：`approval-report.md#goal-acceptance`。
- Goal driver 不得绕过 implementation 的 TDD policy；行为代码 step 缺 RED / GREEN / VERIFY evidence 且无 `TDD exception` 时，implementation gate 不通过。
- 每个阶段 gate 通过后必须立即写回 `goal-state.yaml` 的 `stage` / `status`，保证中断后可恢复。

## 6. Handoff 条件

命中以下任一条件必须先写 `goal-state.yaml`：

```yaml
stage: handoff
status: blocked
handoff_reason: "<具体阻塞>"
handoff_next: "<建议动作>"
```

然后输出：

```text
CS_FEATURE_GOAL_HANDOFF
Reason: <具体阻塞>
Next: <建议动作>
```

handoff 条件：

- 需要改变 approved design、feature 范围、公开契约或 roadmap item。
- 需要扩展到全量组件、editor、overlay 或 SCSS/CSS legacy selector 双轨。
- 独立 review / code review / QA 有 blocking，且同一失败项三轮修复仍不通过。
- 外部凭证、依赖或环境缺失导致核心行为无法判断。
- 用户主动要求暂停、改方向或终止。

## 7. 完成信号

只有同时满足以下条件，goal 才算完成：

- review passed。
- QA passed。
- acceptance passed。
- `goal-state.yaml` 为 `stage: complete` / `status: passed`。
- transcript 中出现 `CS_FEATURE_GOAL_COMPLETE`。
- transcript 中没有未处理的 `CS_FEATURE_GOAL_HANDOFF`。
