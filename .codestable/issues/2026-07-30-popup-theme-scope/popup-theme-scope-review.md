---
doc_type: issue-review
issue: 2026-07-30-popup-theme-scope
status: passed
reviewer: self
reviewed: 2026-07-30
round: 1
lane_a_state: unavailable
lane_a_ref: ""
lane_a_reason: "当前工具列表无可启动独立 Task agent reviewer 的能力；按 .codestable/attention.md 2026-07-26 owner 长期授权使用 local-only fallback。"
lane_b_state: unavailable
lane_b_ref: ""
lane_b_reason: "ocr CLI not found"
---

# popup-theme-scope 代码审查报告

## 1. Scope And Inputs

- Report: `.codestable/issues/2026-07-30-popup-theme-scope/popup-theme-scope-report.md`
- Analysis: `.codestable/issues/2026-07-30-popup-theme-scope/popup-theme-scope-analysis.md`
- Fix note: `.codestable/issues/2026-07-30-popup-theme-scope/popup-theme-scope-fix-note.md`
- Roadmap / audit input: `.codestable/roadmap/theme-system-refactor/`、`.codestable/audits/2026-07-30-theme-hardening-risks/`
- Diff basis: working tree diff + untracked files
- Review mode: initial
- Baseline dirty files: roadmap / audit docs are same turn owner-requested context updates; review verdict重点覆盖 PopUp runtime fix 和相关 tests。

### Independent Review

- Detection: 无可用独立 Task agent reviewer 启动工具；`which ocr` 返回 not found。
- 环节 A 独立隔离 Task agent: local-only + unavailable。
- 环节 B OCR CLI: unavailable。
- OCR severity mapping: High→blocking/important, Medium→nit/suggestion, Low→discarded。
- Merge policy: 未启用外部 reviewer；本报告为本地主审，只对仓库事实和 diff 负责。
- Gate effect: owner 已在 `.codestable/attention.md` 授权无法启动独立 reviewer 时永远允许 local-only review fallback。

## 2. Diff Summary

- 新增：`packages/amis/__tests__/renderers/PopUpThemeScope.test.tsx`、`.codestable/issues/2026-07-30-popup-theme-scope/*`、`.codestable/audits/2026-07-30-theme-hardening-risks/*`
- 修改：`packages/amis-ui/src/components/PopUp.tsx`、`packages/amis/__tests__/renderers/OverlayThemeScope.test.tsx`、`packages/amis-ui/scripts/checkThemeSelectors.js`、`packages/amis-ui/scripts/theme-selectors/policy.json`、theme-system-refactor roadmap / goal docs
- 删除：none
- 未跟踪 / staged：untracked issue / audit docs 和 PopUpThemeScope test；无 staged diff
- 风险热点：UI / theme scope / direct portal / selector guard baseline

## 3. Adversarial Pass

- 假设的生产 bug：PopUp 为了补 scope 新增 wrapper 或提前修改 container，导致布局 / 隐藏态副作用。
- 主动攻击过的反例：body portal、自定义 scoped container、hidden before mount、Overlay 自身 root-scoped popover、Drawer 相邻 portal。
- 结果：未形成 blocking；新增测试覆盖上述主要反例。

## 4. Findings

### blocking

none

### important

none

### nit

none

### suggestion

- 后续若 direct portal baseline 继续增长，再评估统一 `ScopedPortal` helper；当前已有静态 guard 防止新增未分类 direct portal。

### learning

- ThemeScope gate 需要覆盖“根节点自身带 scope”和“祖先容器带 scope”两种 layout-neutral 合法形态；测试不能只假设有外层 wrapper。

### praise

- PopUp 修复复用了 `resolveOverlayContainer` / `applyThemeScope`，没有新建 parallel theme scope 机制，也没有要求每个调用方传额外 props。

## 5. Test And QA Focus

- QA 必须重点复核：移动端 PopUp 类控件（ColorPicker / DatePicker / SelectMobile）在非默认主题和 custom container 下是否继承主题。
- Evidence pack residual risks / gate warnings：`amis-ui` 自身 Jest runner 与 no-emit typecheck 有既有环境问题，已在 fix-note 记录。
- 建议新增或加强的测试：后续 direct portal baseline 变化时，除更新 guard 外必须补对应组件的 scope 运行时测试或浏览器证据。
- 不能靠 review 完全确认的点：未做真实浏览器截图；当前通过 jsdom runtime tests 验证 DOM 结构和 scope。

## 6. Residual Risk

- `amis-ui` package-level Jest setup 当前无法跑通既有 404 测试，说明该 package 的独立 test runner 需要后续修复；本次改用 `packages/amis` 的可运行 Jest 体系覆盖 PopUp 行为。
- 未抽象统一 `ScopedPortal`，但新增 direct portal 已会被 `direct-portal-theme-scope` guard 暴露；仍需人工判断是否属于内部例外。

## 7. Verdict

- Status: passed
- Next: 回到 issue fix 收尾；若 owner 确认完成，可按 scoped commit 提交本次 roadmap / audit / PopUp fix。

## 8. Focused Closure

none
