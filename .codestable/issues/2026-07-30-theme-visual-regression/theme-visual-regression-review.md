---
doc_type: issue-review
issue: 2026-07-30-theme-visual-regression
status: passed
reviewer: self
reviewed: 2026-07-30
round: 1
lane_a_state: unavailable
lane_a_ref: ""
lane_a_reason: "本会话尝试启动独立 Task agent reviewer 时工具参数契约拒绝调用；.codestable/attention.md 已记录 owner 长期授权：独立 reviewer 无法启动时允许 local-only review fallback。"
lane_b_state: unavailable
lane_b_ref: ""
lane_b_reason: "ocr not found"
---

# theme-visual-regression 代码审查报告

## 1. Scope And Inputs

- Report: `.codestable/issues/2026-07-30-theme-visual-regression/theme-visual-regression-report.md`
- Fix note: `.codestable/issues/2026-07-30-theme-visual-regression/theme-visual-regression-fix-note.md`
- Implementation evidence: 当前工作区 diff、Jest 验证、本地 CDP 浏览器验证和 `/private/tmp/amis-visual-regression/` 截图。
- Diff basis: `git status --short --untracked-files=all`、`git diff`、`git diff --check`
- Review mode: initial
- Baseline dirty files: none；当前 dirty 文件均归因于本 issue 修复和对应测试/记录。

### Independent Review

- Detection: Task agent reviewer 可用性尝试失败；OCR CLI 自检结果为 `ocr not found`。
- 环节 A 独立隔离 Task agent: local-only + unavailable
- 环节 B OCR CLI: unavailable
- OCR severity mapping: High→blocking/important, Medium→nit/suggestion, Low→discarded
- Merge policy: 无外部 reviewer 结果可合并；本轮使用 owner 已授权的 local-only fallback。
- Gate effect: `reviewer: self`，依赖 `.codestable/attention.md` 中记录的 local-only review 授权。

## 2. Diff Summary

- 新增：`.codestable/issues/2026-07-30-theme-visual-regression/theme-visual-regression-report.md`、`.codestable/issues/2026-07-30-theme-visual-regression/theme-visual-regression-fix-note.md`
- 修改：`packages/amis-core/src/Root.tsx`、`packages/amis-core/src/theme.tsx`、`packages/amis-core/src/components/Overlay.tsx`
- 修改测试：`packages/amis-core/__tests__/theme.test.ts`、`packages/amis-core/__tests__/components/Overlay.test.tsx`
- 修改测试与快照：`packages/amis/__tests__/renderers/Form/color.test.tsx`、`inputArray.test.tsx`、`inputMonthRange.test.tsx`、`number.test.tsx` 及对应 snapshots，另含 `options.test.tsx.snap`
- 风险热点：UI / DOM class contract / portal overlay positioning

## 3. Adversarial Pass

- 假设的生产 bug：Overlay 修复虽然去掉了 wrapper，但可能在隐藏态或自定义 container 下提前修改 DOM scope，或丢失 portal 子节点主题作用域。
- 主动攻击过的反例：`show=false` 不应提前渲染或作用域化 custom container；body portal/custom container/iframe container/target scope/dark+cxd 双弹层均应保持正确 `data-amis-theme`。
- 结果：review 中发现并修正了 `Overlay` 隐藏态提前解析 scope 的副作用；新增 `Overlay does not scope or render portal child before mount` 用例后，核心测试通过。

## 4. Findings

### blocking

none

### important

none

### nit

none

### suggestion

- 后续如果要追平文档页面纵向位置差异，建议另开文档布局 issue；不要混入本次控件样式/弹层定位修复。

### learning

- 在稳定 `amis-*` 前缀路线下，`theme.classPrefix` 只能保留为 legacy/internal 语义；组件实际 DOM 前缀必须从 `componentClassPrefix` 下发。
- Overlay 主题作用域应直接附着在真实定位节点上，额外 wrapper 会改变定位链路。

### praise

- 修复点落在 Root/theme/Overlay 三个 canonical path，没有在单个表单控件里打补丁。
- 验证覆盖了单测、快照、选择器守卫、浏览器 DOM/弹层定位和基线视觉对照。

## 5. Test And QA Focus

- QA 必须重点复核：`/zh-CN/components/form/options` 下拉位置、`input-color` 颜色面板、`input-array` 内部 Color/Number 控件、`input-month-range` 输入框和内嵌月份选择器。
- Evidence pack residual risks / gate warnings：独立 Task agent reviewer 未完成，已按 owner 授权降级为 local-only；OCR 不可用。
- 建议新增或加强的测试：本轮已新增 Overlay 不插入 layout wrapper 和隐藏态不提前 scope 的用例；后续可考虑 Playwright screenshot regression 覆盖文档站示例页。
- 不能靠 review 完全确认的点：不同浏览器渲染像素级差异未做完整矩阵；本轮仅在本地 Chromium/CDP 验证。

## 6. Residual Risk

- 文档页局部纵向位置与 8889 基线仍有差异，当前不影响用户点名的控件根类、控件宽高和弹层定位；若产品要求整页视觉完全对齐，需要单独追踪。

## 7. Verdict

- Status: passed
- Next: 可以提交本 issue 修复；不建议继续扩大修复范围。

## 8. Focused Closure

none
