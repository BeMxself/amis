---
doc_type: feature-review
feature: 2026-07-25-token-contract-css-layers
status: passed
reviewer: subagent
reviewed: 2026-07-25
round: 3
lane_a_state: completed
lane_a_ref: "019f98d6-78e7-78d0-9451-65b2c66cd917"
lane_a_reason: ""
lane_b_state: unavailable
lane_b_ref: ""
lane_b_reason: "ocr CLI not found on PATH"
---

# token-contract-css-layers 代码审查报告

## 1. Scope And Inputs

- Design: `.codestable/features/2026-07-25-token-contract-css-layers/token-contract-css-layers-design.md`
- Checklist: `.codestable/features/2026-07-25-token-contract-css-layers/token-contract-css-layers-checklist.yaml`
- Evidence pack: `.codestable/features/2026-07-25-token-contract-css-layers/token-contract-css-layers-evidence-pack.md`
- Gate results: `.codestable/features/2026-07-25-token-contract-css-layers/token-contract-css-layers-gate-results.json`
- DoD results: `.codestable/features/2026-07-25-token-contract-css-layers/token-contract-css-layers-dod-results.json`
- Implementation evidence: `.codestable/features/2026-07-25-token-contract-css-layers/token-contract-css-layers-implementation.md`
- Diff basis: 当前工作区 diff + 本 feature untracked artifacts。
- Review mode: full-rereview。
- Baseline dirty files: none outside this feature scope。

### Independent Review

- Detection: Task agent 可用；OCR CLI 不可用（`which ocr` exit 1）。
- 环节 A 独立隔离 Task agent: independent-agent completed，id `019f98d6-78e7-78d0-9451-65b2c66cd917`。
- 环节 B OCR CLI: unavailable。
- OCR severity mapping: High -> blocking/important, Medium -> nit/suggestion, Low -> discarded。
- Merge policy: 环节 A findings 已按仓库事实核验后合并；OCR 未启用。
- Gate effect: reviewer 为 `subagent`，review gate 可放行。

## 2. Diff Summary

- 新增：`packages/amis-ui/scss/tokens/_index.scss`、`_layers.scss`、`_base.scss`、`_legacy-aliases.scss`、`_legacy-palette-aliases.scss`、`_theme-overrides.scss`，以及本 feature implementation / DoD / gate / evidence artifacts。
- 修改：`packages/amis-ui/scss/_properties.scss`、`packages/amis-ui/scss/_components.scss`、`packages/amis-ui/scss/themes/{cxd,dark,antd,ang}.scss`、checklist、roadmap goal-state。
- 删除：none。
- 未跟踪 / staged：本 feature 新增文件均未跟踪；无 staged 文件。
- 风险热点：CSS custom properties cascade、legacy token alias 生效顺序、CSS layer 用户覆写语义、IE11 静态降级边界。

## 3. Adversarial Pass

- 假设的生产 bug：源码 grep 看到新旧 token 都存在，但编译后最终获胜声明仍可能落在旧 token 或未分层旁路上。
- 主动攻击过的反例：`--amis-palette-*` 反向依赖旧 `--colors-*`、旧 Button primary token 被后续 `_components.scss` 覆盖、旧 `--colors-brand-4/5/6` 在主题变量后仍以字面值获胜、dark 主题通过未分层 root 覆写 `--amis-Button-primary-*`、本 feature 偷偷扩到 editor/helper 或 `.cxd-*` legacy selector。
- 结果：round 1 / round 2 blocking 已修复；round 3 未发现 blocking / important。

## 4. Findings

### blocking

none

### important

none

### nit

- [ ] REV-008 `.codestable/features/2026-07-25-token-contract-css-layers/token-contract-css-layers-checklist.yaml` `checks` 仍全部是 `pending`。
  - Evidence: goal protocol 要求 implementation 只把 `steps` 置 `done`，acceptance 才把 `checks` 置 `passed`。
  - Impact: 不影响本轮代码正确性；QA / acceptance 需要明确 `checks` 属于验收 rubric，不是 implementation 未完成。

### suggestion

- [ ] REV-009 建议 QA 增加“最终声明”断言，而不只 grep 存在性。
  - Evidence: 编译 CSS 中旧 literal 和最终 alias 可同时存在，例如 dark 主题旧 brand literal 早于末尾 alias。
  - Expected check: `lib/themes/{cxd,default,antd,ang,dark}.css` 中 `--colors-brand-4/5/6` 最后一次出现必须分别为 `var(--amis-palette-brand-400/500/600)`。

### learning

- CSS cascade layers 中，未分层声明优先于所有 layered 声明；因此本 feature 只声明 layer 顺序和 token/theme-scope 最小入口，不等同于完整 `amis.components` / `amis.user` 覆写闭环。
- 新 `--amis-palette-*` 必须是源，旧 token 只能 alias 到新 token；当前 `tokens/_base.scss` 已由 Sass theme entry 字面值输出 palette。

### praise

- `tokens/_base.scss` 的 `--amis-palette-brand-400/500/600` 由 Sass theme entry 字面值输出，不反向依赖旧 `--colors-brand-*`。
- `_components.scss` 已把 primary Button 旧 token 的最终声明改为 `--amis-Button-*`。
- `tokens/_legacy-palette-aliases.scss` 加上主题入口尾部导入，能让编译后 `--colors-brand-4/5/6` 最终声明指向 `--amis-palette-brand-400/500/600`。
- round 3 修复把 dark primary text 从未分层 `:root` 旁路收回到 `$amis-palette-neutral-text-inverse: #f7f8fa` -> `--amis-color-text-inverse` -> `--amis-Button-primary-*` 链路。
- 未修改 editor/theme-editor helper；未新增 `.cxd-*` SCSS/CSS legacy selector 兼容层。

## 5. Test And QA Focus

- QA 必须对 `cxd/default/antd/ang/dark` 编译 CSS 做“最后一次声明”断言：`--colors-brand-4/5/6` 最终 alias 到 `--amis-palette-brand-400/500/600`。
- QA 必须复核 dark primary Button token 链：`--amis-palette-neutral-text-inverse` -> `--amis-color-text-inverse` -> `--amis-Button-primary-*` -> `--button-primary-*font-color`。
- QA 必须做负向 grep：禁止 `--amis-palette-* : var(--colors-*)`，禁止 dark root 未分层 `--amis-Button-primary-*` 或 `--button-primary-*font-color: var(--colors-neutral-text-2)` 回流。
- Evidence pack residual risks / gate warnings：`npm run build --workspace amis-ui` 输出完成后进程不退出，已用 fresh manual build 到 `created lib` / `created esm` 并记录 warning；QA 需诚实复核。
- 不要把全量 `amis.components` / `amis.user` layer 闭环描述成本 feature 已完成能力；本轮只证明最小 layer 声明和 token/theme-scope 入口。
- IE11 只做静态降级边界 smoke / grep，不要求支持 CSS custom properties 动态主题。

## 6. Residual Risk

- `tokens/_legacy-palette-aliases.scss` 是未分层 alias，并在主题入口末尾导入。这是为了保证旧 `--colors-brand-4/5/6` 的最终 winning declaration 指向新 palette；它不证明 `amis.user` layer 可以覆盖所有旧 token，完整闭环交给后续 `stylesheet-stable-selector-build` / docs rollout。
- IE11 发布链仍需后续验证确认静态 CSS 降级边界没有被误描述为动态 token theme switching。

## 7. Verdict

- Status: passed
- Next: 进入 `cs-feat` QA 阶段。

## 8. Focused Closure

none
