---
doc_type: feature-review
feature: 2026-07-25-stylesheet-stable-selector-build
status: passed
reviewer: self
reviewed: 2026-07-26
round: 1
lane_a_state: unavailable
lane_a_ref: ""
lane_a_reason: "独立 Task agent reviewer 多次启动被宿主 payload/schema 校验阻断；owner 已批准 stylesheet code-review-local-only，并在 .codestable/attention.md 中授权后续 reviewer 不可启动时默认 local-only。"
lane_b_state: unavailable
lane_b_ref: ""
lane_b_reason: "ocr CLI not installed"
---

# stylesheet-stable-selector-build 代码审查报告

## 1. Scope And Inputs

- Design: `.codestable/features/2026-07-25-stylesheet-stable-selector-build/stylesheet-stable-selector-build-design.md`
- Checklist: `.codestable/features/2026-07-25-stylesheet-stable-selector-build/stylesheet-stable-selector-build-checklist.yaml`
- Evidence pack: `.codestable/features/2026-07-25-stylesheet-stable-selector-build/stylesheet-stable-selector-build-evidence-pack.md`
- Gate results: `.codestable/features/2026-07-25-stylesheet-stable-selector-build/stylesheet-stable-selector-build-scope-gate.json`
- DoD results: `.codestable/features/2026-07-25-stylesheet-stable-selector-build/stylesheet-stable-selector-build-dod-results.json`
- Implementation evidence: `.codestable/features/2026-07-25-stylesheet-stable-selector-build/stylesheet-stable-selector-build-implementation.md`
- Diff basis: workspace unstaged + untracked diff；范围限于 stylesheet stable selector feature 的 helper、guard、policy、fixtures、package script 和 CodeStable 产物。
- Review mode: initial
- Baseline dirty files: none outside current feature scope.

### Independent Review

- Detection: 独立 Task agent reviewer 不可用；OCR CLI 不可用；owner 已批准本轮和后续 reviewer 不可启动时使用 local-only fallback。
- 环节 A 独立隔离 Task agent: local-only + unavailable
- 环节 B OCR CLI: unavailable
- OCR severity mapping: High→blocking/important, Medium→nit/suggestion, Low→discarded
- Merge policy: 没有已启动 pending lane；本报告只合并本地逐文件审查结果，并显式记录 local-only 降级。
- Gate effect: user-approved downgrade；后续 QA / acceptance 仍必须复核 guard 绕过、policy 过宽、fixture 泄漏和 build runner warning。

## 2. Diff Summary

- 新增：`packages/amis-ui/scss/_stable-selectors.scss`、`packages/amis-ui/scripts/checkThemeSelectors.js`、`packages/amis-ui/scripts/theme-selectors/policy.json`、guard 正反例 fixture、implementation / scope / DoD / evidence / review packet 产物。
- 修改：`packages/amis-ui/package.json`、`packages/amis-ui/scss/_components.scss`、`packages/amis-ui/scss/components/_button.scss`、feature checklist、roadmap goal-state、approval-report、`.codestable/attention.md`。
- 删除：none.
- 未跟踪 / staged：当前 feature 新增文件均未跟踪；没有 staged diff。
- 风险热点：构建脚本、SCSS 全局 import、selector policy baseline、fixture 执行路径。

## 3. Adversarial Pass

- 假设的生产 bug：selector guard 基线过宽或 fixture 路径泄漏，导致新增 `.cxd-*` / `#{$ns}` 债务没有被拦住。
- 主动攻击过的反例：`--fixture good` 只扫描 fixture 路径且无 legacy 命中；`--fixture bad` 用空 policy 扫描同一路径并返回违规；默认 `npm run check:theme-selectors --workspace amis-ui` 不扫 fixture 目录，而是扫描源码路径并与 policy baseline 比较；Button proof 只把原 direct selector 包进 helper，输出语义保持 `.amis-Button` 与 `[data-amis-theme='cxd']`。
- 结果：没有升级为 blocking；`--update` 能刷新 baseline 属于有意维护入口，需要通过 review/QA 监控 policy diff，列为 QA focus。

## 4. Findings

### blocking

none

### important

none

### nit

none

### suggestion

- REV-001 `packages/amis-ui/scripts/checkThemeSelectors.js:283` 后续可以为 `--update` 增加更显式的人工流程说明或单独维护命令，降低误把新增 legacy selector 纳入 baseline 的风险；本轮不阻塞，因为默认 npm script 不带 `--update`，policy diff 会进入 review。

### learning

- selector guard 用 `scan/file/pattern/text/count` 锁定 legacy 基线，允许删除或移动旧债，但新增同类命中会因为 count 增加或新 key 出现而失败。
- helper 只提供 `.amis-*` 与 `[data-amis-theme]` 输出，符合 ADR-001 的“主题身份与组件类名分离”方向。

### praise

- 正反例 fixture 直接覆盖最关键风险：stable helper 通过、`#{$ns}` / `.cxd-*` 新增坏 selector 失败。
- policy 分类包含 owner 和退出条件，后续 component / editor / legacy teardown 能直接消费。

## 5. Test And QA Focus

- QA 必须重点复核：`npm run check:theme-selectors --workspace amis-ui` 默认路径不包含 fixture；`node packages/amis-ui/scripts/checkThemeSelectors.js --fixture good` 通过；`--fixture bad` 必须失败且命中 `.#{$ns}GuardFixture` 和 `.cxd-GuardFixture`。
- Evidence pack residual risks / gate warnings：`npm run build --workspace amis-ui` 在输出 `created lib` / `created esm` 后不自然退出，需作为 workspace build runner baseline 记录，不应掩盖真实构建失败。
- 建议新增或加强的测试：后续 core component migration 可把 guard 加入更高层级的 aggregate 命令；本 feature 以脚本 fixture 覆盖即可。
- 不能靠 review 完全确认的点：policy 中 2233 个 baseline 命中无法在本轮逐条人工验证语义，只能通过分类摘要、guard 行为和后续迁移逐步收敛。

## 6. Residual Risk

- local-only review 缺少隔离视角；已由 owner 授权并要求后续 reviewer 不可启动时默认使用 local-only fallback。QA / acceptance 需要重点复核 guard 有效性与 scope 边界。
- `--update` 可刷新 policy baseline；这是维护入口，不是默认验证路径。后续新增 policy diff 必须继续进入 review。

## 7. Verdict

- Status: passed
- Next: 进入 `cs-feat` QA 阶段，覆盖 design 关键场景、DoD commands、review QA focus 和 evidence residual risks。

## 8. Focused Closure

none
