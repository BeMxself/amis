---
doc_type: feature-review
feature: 2026-07-24-theme-runtime-button-pilot
status: passed
reviewer: self
reviewed: 2026-07-25
round: 1
lane_a_state: unavailable
lane_a_ref: ""
lane_a_reason: "independent Task agent reviewer launch failed repeatedly; owner approved local-only fallback via approval-report.md#code-review-local-only"
lane_b_state: unavailable
lane_b_ref: ""
lane_b_reason: "ocr CLI not installed: which ocr returned not found"
---

# theme-runtime-button-pilot 代码审查报告

## 1. Scope And Inputs

- Design: `.codestable/features/2026-07-24-theme-runtime-button-pilot/theme-runtime-button-pilot-design.md`
- Checklist: `.codestable/features/2026-07-24-theme-runtime-button-pilot/theme-runtime-button-pilot-checklist.yaml`
- Evidence pack: `.codestable/features/2026-07-24-theme-runtime-button-pilot/theme-runtime-button-pilot-implementation.md`
- Gate results: none
- DoD results: none
- Implementation evidence: `.codestable/features/2026-07-24-theme-runtime-button-pilot/theme-runtime-button-pilot-implementation.md`
- Diff basis: current workspace diff; no staged diff
- Review mode: initial local-only fallback
- Baseline dirty files: roadmap item state and this feature package are part of the same feature; no unrelated staged diff observed

### Independent Review

- Detection: independent Task agent reviewer launch was unavailable in the host flow; OCR CLI unavailable (`which ocr` returned `ocr not found`)
- 环节 A 独立隔离 Task agent: local-only + unavailable, owner-approved fallback `approval-report.md#code-review-local-only`
- 环节 B OCR CLI: unavailable
- OCR severity mapping: High→blocking/important, Medium→nit/suggestion, Low→discarded
- Merge policy: no external reviewer findings exist; this report is an explicitly approved local-only gate result
- Gate effect: allowed by owner approval; residual risk retained for QA / acceptance

## 2. Diff Summary

- 新增：`packages/amis-core/__tests__/theme.test.ts`、feature goal package reports
- 修改：`packages/amis-core/src/theme.tsx`、`packages/amis-core/src/Root.tsx`、`packages/amis-core/src/index.tsx`
- 修改：`packages/amis-ui/scss/components/_button.scss`
- 修改：Button / DropDownButton / ButtonGroupSelect 相关测试与 snapshots
- 删除：none
- 未跟踪 / staged：feature goal package files and `packages/amis-core/__tests__/theme.test.ts` are untracked; no staged diff
- 风险热点：runtime theme contract、Root DOM wrapper、global classnames output、snapshot churn、typecheck baseline red

## 3. Adversarial Pass

- 假设的生产 bug：全局 `ThemeInstance.classnames` 切到 `.amis-*` 后，Button 之外组件 DOM 也会开始输出 `.amis-*`，但样式侧尚未全量迁移。
- 主动攻击过的反例：Dropdown / ButtonGroup snapshots 与目标 Button 回归能证明渲染测试已同步新 DOM；样式全量迁移仍是后续 `stylesheet-stable-selector-build` / `core-component-selector-migration` 范围，本 pilot 只承诺 Button 最小样式 proof。
- 结果：未升级为 blocking；作为 QA residual risk 复核 selector guard 和范围边界。
- 额外攻击点：`theme()` 在 `getTheme()` 之后开启 alias 的缓存陈旧风险、`:Token` escape 误加前缀风险、Root wrapper 顺序被新增 scope wrapper 打乱风险，均已有代码路径与目标测试覆盖。

## 4. Findings

### blocking

- none

### important

- none

### nit

- none

### suggestion

- none

### learning

- Root scope 与 overlay scope 的边界已经清晰：Root renderer 子树有 `data-amis-theme`，portal / overlay 传播仍属于后续 roadmap 项，不应在本 pilot 内补兼容层。

### praise

- `legacyDomClassAlias` 被限制在 Theme Runtime 的显式 DOM-only 输出路径，Button 组件没有手写 `.cxd-*`，这保住了后续组件迁移的单一扩展点。

## 5. Test And QA Focus

- QA 必须重点复核：默认 Button 无 `.cxd-Button`、alias 开启才出现 `.cxd-Button`、Root 有 `data-amis-theme="cxd"`、selector grep 没有新增 `.cxd-Button` SCSS selector。
- Evidence pack residual risks / gate warnings：`npm run typecheck` 失败仍为既有全仓库类型基线红灯；需要 QA 记录失败文件集中在 editor/schema/table/scripts 等非本 feature 触碰区域。
- 建议新增或加强的测试：本轮不要求新增测试；已有 `amis-core` runtime 单测和 `amis` Button 渲染测试覆盖核心路径。
- 不能靠 review 完全确认的点：缺少独立 reviewer / OCR 视角；local-only 降级风险保留到 QA 与 acceptance。

## 6. Residual Risk

- 本轮 review 是 owner 批准的 local-only fallback，缺独立隔离审查视角；QA / acceptance 必须复核 Root scope、alias、selector guard 和 typecheck 基线归因。
- Root scope 不覆盖 overlay / portal，这是 design 明确不做项；后续 `overlay-theme-scope-propagation` 必须承接。
- `.amis-*` classnames 会影响 Button 以外 DOM snapshots / 查询；本 pilot 只做运行时主路径切换和 Button proof，样式与测试全量迁移由后续 roadmap 项收敛。

## 7. Verdict

- Status: passed
- Next: 进入 Goal lane 的 `cs-feat` QA 阶段；QA passed 后使用 `approval-report.md#goal-acceptance` 进入 acceptance。

## 8. Focused Closure

- none
