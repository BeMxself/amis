---
doc_type: feature-qa
feature: 2026-07-25-stylesheet-stable-selector-build
status: passed
runner_state: not-started
runner_reason: ""
runner_id: ""
tested: 2026-07-26
round: 1
---

# stylesheet-stable-selector-build QA 报告

## 1. Scope And Inputs

- Design: `.codestable/features/2026-07-25-stylesheet-stable-selector-build/stylesheet-stable-selector-build-design.md`
- Checklist: `.codestable/features/2026-07-25-stylesheet-stable-selector-build/stylesheet-stable-selector-build-checklist.yaml`
- Review: `.codestable/features/2026-07-25-stylesheet-stable-selector-build/stylesheet-stable-selector-build-review.md`
- Evidence pack: `.codestable/features/2026-07-25-stylesheet-stable-selector-build/stylesheet-stable-selector-build-evidence-pack.md`
- Gate results: `.codestable/features/2026-07-25-stylesheet-stable-selector-build/stylesheet-stable-selector-build-scope-gate.json`
- DoD results: `.codestable/features/2026-07-25-stylesheet-stable-selector-build/stylesheet-stable-selector-build-dod-results.json`
- Diff basis: workspace unstaged + untracked diff，均属于当前 feature 的 helper / guard / policy / fixture / CodeStable 产物与 roadmap 状态。
- Baseline dirty files: none outside current feature scope.
- Feature type: non-functional
- Core evidence gate: 本 feature 建立样式 helper 与 build-time selector guard，不改变用户可见运行时行为；无需 browser / e2e。QA 使用脚本 fixture、stylelint、build 输出、YAML 和 diff clean 作为替代证据。

## 2. Verification Matrix

| ID | 来源 | 核心性 | 场景 / 风险 | 证据类型 | 命令或动作 | 期望 | 结果 |
|---|---|---|---|---|---|---|---|
| QA-001 | design S1/S2 | non-functional | 默认 guard 能读取 policy baseline，既有旧债被分类但无新增违规 | command | `npm run check:theme-selectors --workspace amis-ui` | exit 0，2233 baseline，0 new violation | pass |
| QA-002 | design S4 / review focus | non-functional | stable helper fixture 不被误报 | command | `node packages/amis-ui/scripts/checkThemeSelectors.js --fixture good` | exit 0，0 violation | pass |
| QA-003 | design S4 / review focus | non-functional | 新增 `#{$ns}` / `.cxd-*` 坏 selector 会失败 | command | `node packages/amis-ui/scripts/checkThemeSelectors.js --fixture bad` | exit 1，列出两条 fixture violation | pass |
| QA-004 | DoD CMD-001 | non-functional | SCSS 基础规则未被 helper/import 破坏 | command | `npm run stylelint` | exit 0 | pass |
| QA-005 | DoD CMD-002 / evidence risk | non-functional | amis-ui build 可产出 lib / esm，helper 不破坏主题构建 | command | `npm run build --workspace amis-ui` | 输出 `created lib` 与 `created esm`；后续不自然退出可按 baseline 中断 | pass |
| QA-006 | DoD CMD-006 | non-functional | checklist YAML 可解析 | command | `python3 ... validate-yaml.py --yaml-only` | exit 0 | pass |
| QA-007 | cleanliness | non-functional | diff 没有 whitespace error | command | `git diff --check` | exit 0 | pass |
| QA-008 | review residual risk | non-functional | `--update` 只作为维护入口，不进入默认 npm guard | diff review | 检查 `package.json` script 与脚本入口 | 默认 script 不带 `--update`，policy diff 进入 review | pass |

## 3. Command Results

- `npm run check:theme-selectors --workspace amis-ui` → exit 0：`Theme selector guard passed: 2233 legacy baseline match(es), 0 new violation(s).`
- `node packages/amis-ui/scripts/checkThemeSelectors.js --fixture good` → exit 0：stable helper fixture 无 legacy baseline / violation。
- `node packages/amis-ui/scripts/checkThemeSelectors.js --fixture bad` → exit 1（预期失败）：命中 `.#{$ns}GuardFixture` 与 `.cxd-GuardFixture` 两条新增违规。
- `npm run stylelint` → exit 0：SCSS lint 通过。
- `npm run build --workspace amis-ui` → reached `created lib in 24.1s` and `created esm in 18.9s`；之后进程不自然退出，按既有 build runner baseline 手动中断，命令会话退出码 0。日志仅包含既有 Sass deprecation、Browserslist stale data、Rollup circular deps、TS5051 和 postcss fill-available warning。
- `python3 /Users/songmingxu/.agents/skills/cs-onboard/tools/validate-yaml.py --file .codestable/features/2026-07-25-stylesheet-stable-selector-build/stylesheet-stable-selector-build-checklist.yaml --yaml-only` → exit 0：YAML valid；PyYAML 缺失 fallback warning 不影响本文件基础解析。
- `git diff --check` → exit 0：无 whitespace error。

## 4. Scenario Results

- [x] QA-001 inventory / allowlist 默认路径：pass
  - Evidence: 默认 guard 读取 `policy.json`，2233 个 baseline match，0 new violation。
  - Notes: policy 分类摘要覆盖 `migration-target`、`docs-historical`、`internal-legacy`；`public-forbidden` 与 `dom-alias-generated` 当前无 baseline entry，符合“阻止新增公共前缀 selector / DOM alias 不进 SCSS helper”的设计。
- [x] QA-002 stable helper 正例：pass
  - Evidence: good fixture 只包含 `amis-component` / `amis-themed-component`，guard exit 0。
- [x] QA-003 legacy selector 反例：pass
  - Evidence: bad fixture exit 1 并列出 `#{$ns}` 与 `.cxd-*` 两类违规。
- [x] QA-004 Button proof 不回退：pass
  - Evidence: `_button.scss` 只把 `[data-amis-theme='cxd']` / `.amis-Button` proof 包进 helper；旧 `.#{$ns}Button` 主体仍留作后续迁移目标，本 feature 未批量改组件。
- [x] QA-005 范围守护：pass
  - Evidence: diff 未修改 editor/theme-editor helper 和核心组件迁移面；新增文件集中在 `amis-ui` helper / guard / policy / fixture。

## 5. Findings

### failed

none

### blocked

none

### residual-risk

- `npm run build --workspace amis-ui` 在输出 `created lib` / `created esm` 后仍不自然退出；本轮按既有 workspace baseline 中断，final audit 仍应继续关注 aggregate build runner 行为。
- `--update` 可刷新 selector policy baseline；这是有意维护入口，但后续任何 policy diff 都必须继续进入 review，防止把新增 legacy selector 静默纳入 baseline。
- 本轮 local-only code review 缺少独立 reviewer 视角；owner 已授权该降级，QA 已把 guard 绕过和 fixture 行为列为核心复核项。

## 6. Cleanliness

- Debug output: pass
- Temporary TODO/FIXME/XXX: pass
- Commented-out code: pass
- Unused imports / dead code from this feature: pass
- Out-of-scope files: pass

## 7. Verdict

- Status: passed
- Next: 进入 `cs-feat` acceptance 阶段，使用 roadmap `approval-report.md#goal-acceptance` 授权完成 feature acceptance；随后复核 `goal-commits` 授权并 scoped commit。
