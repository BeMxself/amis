---
doc_type: feature-review
feature: 2026-07-25-legacy-prefix-teardown
status: passed
reviewer: self
reviewed: 2026-07-28
round: 1
lane_a_state: unavailable
lane_a_ref: ""
lane_a_reason: "Task agent reviewer 启动被宿主参数 schema 拒绝；owner 已在 .codestable/attention.md 授权独立 reviewer 无法启动时直接使用 local-only review fallback。"
lane_b_state: unavailable
lane_b_ref: ""
lane_b_reason: "`which ocr` 返回 not found。"
---

# legacy-prefix-teardown 代码审查报告

## 1. Scope And Inputs

- Design: `.codestable/features/2026-07-25-legacy-prefix-teardown/legacy-prefix-teardown-design.md`
- Checklist: `.codestable/features/2026-07-25-legacy-prefix-teardown/legacy-prefix-teardown-checklist.yaml`
- Evidence pack: `.codestable/features/2026-07-25-legacy-prefix-teardown/legacy-prefix-teardown-evidence-pack.md`
- Gate results: `.codestable/features/2026-07-25-legacy-prefix-teardown/legacy-prefix-teardown-scope-gate.json`
- DoD results: `.codestable/features/2026-07-25-legacy-prefix-teardown/legacy-prefix-teardown-dod-results.json`
- Implementation evidence: `.codestable/features/2026-07-25-legacy-prefix-teardown/legacy-prefix-teardown-implementation.md`
- Diff basis: `git status --short` + 当前 workspace diff；scope gate 已证明改动都落在本 feature 允许范围内。
- Review mode: full-rereview
- Baseline dirty files: none outside current feature scope。

### Independent Review

- Detection: Task agent tool 可见但启动参数被 schema 拒绝；OCR CLI 不可用。
- 环节 A 独立隔离 Task agent: local-only + unavailable。
- 环节 B OCR CLI: unavailable。
- OCR severity mapping: High→blocking/important, Medium→nit/suggestion, Low→discarded。
- Merge policy: 已按 owner 长期授权使用 local-only fallback；未伪造 subagent reviewer。
- Gate effect: `reviewer: self` 需要 downstream 以 `CODESTABLE_ALLOW_SELF_REVIEW_FALLBACK=1` 机械 opt-in 放行。

## 2. Diff Summary

- 新增：LegacyPrefixLedger、AliasRetentionRecord、docs rollout handoff、implementation / evidence / review packet、selector guard fixtures。
- 修改：theme runtime alias normalization、stable selector helper export、selector guard、UI/renderers 行为 DOM selector、相关 renderer tests/snapshots、feature design/checklist、roadmap goal-state。
- 删除：none。
- 未跟踪 / staged：新增 feature artifacts 与 guard fixtures；无 staged diff。
- 风险热点：跨 amis-core / amis-ui / amis renderer 的 UI 行为 selector 迁移、DOM-only alias 生命周期、selector guard 可信度、snapshot 更新可信度。

## 3. Adversarial Pass

- 假设的生产 bug：alias-on 时行为选择器仍偷偷选 `.cxd-*` 或 guard 漏掉间接 alias，导致旧前缀公共依赖回流。
- 主动攻击过的反例：`props.classPrefix`、解构 alias、预构造 selector/className 变量、`${cx(...)}`、`classList.contains(cx(...))`、Sortable `handle/filter/ghostClass`、Tree / FormulaPicker / Table summary row。
- 结果：本地审查先发现并修复了 `props.classPrefix` / 解构 alias guard 漏检风险；修复后 bad fixture expected fail、default guard pass，DoD / scope / evidence 重新刷新。

## 4. Findings

### blocking

none

### important

none

### nit

none

### suggestion

none

### learning

- selector guard 不能只覆盖直接 `classPrefix` 字面量；迁移类 guard 必须覆盖常见 alias、变量转存和行为 sink，否则很容易形成“guard 通过但真实 DOM selector 仍旧”的假安全。

### praise

- 迁移没有引入 SCSS/CSS `.cxd-*` 双产物兼容层，DOM-only alias 仍默认关闭且只允许显式 `cxd`。
- Guard fixtures 同时保留 good / bad 反向样例，能证明新增规则不是只靠 baseline 文档解释。

## 5. Test And QA Focus

- QA 必须重点复核：alias off / alias `cxd` on 两种运行时，Tabs/List/Table/Tree/FormulaPicker/Video/InputSubForm 行为查询仍命中 stable `.prismui-*` 主类。
- Evidence pack residual risks / gate warnings：`CMD-006` typecheck 仍为既有 broad baseline warning；scope gate / evidence pack 均 passed。
- 建议新增或加强的测试：后续组件波次如果迁移新的 DOM behavior selector，应复用 `checkThemeSelectors.js --fixture bad/good` 模式补反例。
- 不能靠 review 完全确认的点：未跑全量浏览器交互；`ocr` 行级扫描不可用；local-only review 缺少独立模型第二视角。

## 6. Residual Risk

- `reviewer: self` 是 owner 授权的 local-only fallback，不等同于独立 reviewer 已完成；下游 gate 需要显式允许 self-review fallback。
- `npm run typecheck` 仍因既有 Table row store typing、Wizard API typing、build-schemas dependency API 等 baseline 失败；本 feature 已将其作为 non-core `document-baseline` 警告处理。
- OCR CLI 未安装，未执行独立 OCR 行级扫描。

## 7. Verdict

- Status: passed
- Next: Goal feature 进入 QA 阶段；QA 重点复核 stable selector behavior、DOM-only alias 边界、guard fixtures 和 docs rollout handoff。

## 8. Focused Closure

none
