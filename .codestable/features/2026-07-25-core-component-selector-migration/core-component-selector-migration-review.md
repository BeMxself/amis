---
doc_type: feature-review
feature: 2026-07-25-core-component-selector-migration
status: passed
reviewer: self
reviewed: 2026-07-26
round: 1
lane_a_state: unavailable
lane_a_ref: ""
lane_a_reason: "独立 Task agent reviewer 启动多次被宿主 schema 拒绝；按 .codestable/attention.md 中 owner 长期授权，无法启动独立 reviewer 时使用 local-only review fallback。"
lane_b_state: unavailable
lane_b_ref: ""
lane_b_reason: "which ocr && ocr llm test 返回 ocr not found。"
---

# core-component-selector-migration 代码审查报告

## 1. Scope And Inputs

- Design: `.codestable/features/2026-07-25-core-component-selector-migration/core-component-selector-migration-design.md`
- Checklist: `.codestable/features/2026-07-25-core-component-selector-migration/core-component-selector-migration-checklist.yaml`
- Evidence pack: `.codestable/features/2026-07-25-core-component-selector-migration/core-component-selector-migration-evidence-pack.md`
- Gate results: `.codestable/features/2026-07-25-core-component-selector-migration/core-component-selector-migration-scope-gate.json`
- DoD results: `.codestable/features/2026-07-25-core-component-selector-migration/core-component-selector-migration-dod-results.json`
- Implementation evidence: `.codestable/features/2026-07-25-core-component-selector-migration/core-component-selector-migration-implementation.md` + ledger + 当前 git diff
- Diff basis: `git status --short` / `git diff`，当前 diff 均在 feature 目录、`goal-state.yaml`、`packages/amis-core`、`packages/amis-ui`、`packages/amis` 范围内；scope gate passed。
- Review mode: initial local-only review
- Baseline dirty files: none outside this feature scope；DoD runner、scope gate、evidence pack 已在修复后重跑并通过。

### Independent Review

- Detection: Task agent 工具存在但启动 payload 被宿主 schema 拒绝；`ocr` CLI 不存在。
- 环节 A 独立隔离 Task agent: local-only + unavailable。
- 环节 B OCR CLI: unavailable。
- OCR severity mapping: High→blocking/important, Medium→nit/suggestion, Low→discarded；本轮未运行 OCR。
- Merge policy: 未合并外部 reviewer 结论；本地审查逐项核对 design、ledger、diff、DoD 与 targeted grep。
- Gate effect: `reviewer: self` 需要下游 runner 使用 self-review fallback opt-in；授权来源为 `.codestable/attention.md` 中 owner 明确规则。

## 2. Diff Summary

- 新增：`core-component-selector-migration-*` evidence/implementation/ledger/review-packet/review 等 CodeStable 产物。
- 修改：theme runtime stable selector helper、核心 renderer DOM selector、Modal/Drawer stable class path、目标 SCSS wave、selector policy baseline、targeted tests 与 snapshots。
- 删除：无生产文件删除。
- 未跟踪 / staged：未跟踪项均为本 feature 新增 CodeStable 产物。
- 风险热点：跨 `amis-core` / `amis-ui` / `amis` 的样式身份迁移；Dialog/Drawer/Modal 外部点击、Modal stack class、Table virtual body DOM 查询、Select CustomStyle suffix、大片 SCSS snapshot 更新。

## 3. Adversarial Pass

- 假设的生产 bug：某些行为仍依赖 `classPrefix` / `.cxd-*`，SCSS 已切 `.amis-*` 后导致 DOM 查询、关闭或堆叠样式失效。
- 主动攻击过的反例：Modal root outside-close、Drawer overlay outside-close、Modal/Drawer `Modal--nth` stack class、VirtualTableBody fixed header/root 查询、Select/ChainedSelect option custom style suffix、target SCSS 是否仍有 `.cxd-*` 兼容输出。
- 结果：本地审查发现 Modal/Drawer close/stack class 仍有旧前缀行为依赖，已修复为 stable helper / theme classnames，并新增 `npm test --workspace amis -- drawer` 到 DoD；修复后完整 DoD runner 通过。

## 4. Findings

### blocking

- none

### important

- none

### nit

- none

### suggestion

- 后续 `legacy-prefix-teardown` 可优先消费本 ledger 中剩余 `classPrefix` 广义 grep 分类，避免把 props passthrough 当作 DOM selector debt 批量删除。

### learning

- `classprefix-dom-selector` guard 只覆盖一部分模板字符串形态；解构为 `ns` 的 `matches()` / class render path 仍需本地 grep 和 review 补位。

### praise

- stable selector helper 集中在 `amis-core/src/theme.tsx`，调用方迁移时没有各自手写前缀判断，符合 ADR-001 的单一稳定 DOM 身份方向。
- selector policy baseline 从 2233 收窄到 1507，并在修复后保持 0 new violation，为后续 teardown 提供了清晰输入。

## 5. Test And QA Focus

- QA 必须重点复核：Modal/Drawer 外部点击关闭、Drawer position/size/stack class、Table virtual scroll/fixed header、Select/ChainedSelect popover option custom style、Dialog/Tooltip/DropDownButton 浮层 scope。
- Evidence pack residual risks / gate warnings：archguard/meta-cc disabled 为 provider skip；DoD、scope gate、evidence-pack 本轮均 passed。
- 建议新增或加强的测试：后续 teardown 阶段应为剩余 `classPrefix` props passthrough 建立更窄的 DOM-selector grep，覆盖 `const ns = classPrefix` 形态。
- 不能靠 review 完全确认的点：真实浏览器视觉样式细节未在本 gate 做截图 QA；本轮依赖 Jest snapshots、stylelint、selector guard 和 targeted tests。

## 6. Residual Risk

- 剩余 `#{$ns}` / `classPrefix` 命中仍大量存在，但已按本 feature 边界记录为非目标组件、legacy props passthrough、editor/helper 或后续 teardown 输入；不得在本项内继续扩大迁移范围。
- 本轮 `reviewer: self` 是 owner 授权降级，不等同于独立 reviewer 已完成；QA / acceptance 应保留对 Modal/Drawer 和大片 snapshot 更新的重点复核。

## 7. Verdict

- Status: passed
- Next: Goal feature 进入 QA 阶段；QA 应读取本 review、最新 evidence pack、DoD results 和 ledger，重点覆盖 Modal/Drawer 修复点与核心组件行为不变性。

## 8. Focused Closure

- none
