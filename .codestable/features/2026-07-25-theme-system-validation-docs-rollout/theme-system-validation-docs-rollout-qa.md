---
doc_type: feature-qa
feature: 2026-07-25-theme-system-validation-docs-rollout
status: passed
runner_state: not-started
runner_reason: "low-risk non-functional docs / validation rollout; local QA evidence is sufficient"
runner_id: ""
tested: 2026-07-28
round: 1
---

# theme-system-validation-docs-rollout QA 报告

## 1. Scope And Inputs

- Design: `.codestable/features/2026-07-25-theme-system-validation-docs-rollout/theme-system-validation-docs-rollout-design.md`
- Checklist: `.codestable/features/2026-07-25-theme-system-validation-docs-rollout/theme-system-validation-docs-rollout-checklist.yaml`
- Review: `.codestable/features/2026-07-25-theme-system-validation-docs-rollout/theme-system-validation-docs-rollout-review.md`
- Evidence pack: `.codestable/features/2026-07-25-theme-system-validation-docs-rollout/theme-system-validation-docs-rollout-evidence-pack.md`
- Gate results: `.codestable/features/2026-07-25-theme-system-validation-docs-rollout/theme-system-validation-docs-rollout-scope-gate.json`
- DoD results: `.codestable/features/2026-07-25-theme-system-validation-docs-rollout/theme-system-validation-docs-rollout-dod-results.json`
- Diff basis: 当前工作区 diff；本 feature 的 docs、fixture 类型声明、feature artifacts、review 与 QA 产物。
- Baseline dirty files: none；当前变更均归因于本 feature。
- Feature type: non-functional
- Core evidence gate: 本项是文档与验证收口，不改变运行行为；不需要浏览器 E2E。替代证据为目标单测、selector guard、stylelint、docs/examples grep、YAML 校验、manual notes 和 evidence pack。

## 2. Verification Matrix

| ID | 来源 | 核心性 | 场景 / 风险 | 证据类型 | 命令或动作 | 期望 | 结果 |
|---|---|---|---|---|---|---|---|
| QA-001 | design / matrix | supporting | runtime / stable selector 契约仍通过 | unit | `npm test --workspace amis-core -- theme` | 9 tests pass | pass |
| QA-002 | design / review | supporting | button smoke 未被 stable class 文档改动破坏 | unit | `npm test --workspace amis -- button` | 5 suites pass | pass |
| QA-003 | design / DoD | non-functional | selector guard 无新增旧前缀违规 | script | `npm run check:theme-selectors --workspace amis-ui` | 0 new violations | pass |
| QA-004 | design / DoD | non-functional | SCSS 样式规则无回归 | lint | `npm run stylelint` | exit 0 | pass |
| QA-005 | design / docs map | non-functional | source docs 不再推荐 `#{$ns}` / `.cxd-*` 新路径 | grep / diff | docs/examples old-prefix grep + DocsMigrationMap | retained hits classified | pass |
| QA-006 | design / IE11 notes | non-functional | IE11 只描述静态 CSS fallback | grep / diff | `rg -n "IE11|cxd-ie11|CSS 变量|data-amis-theme|--amis-|amis-" ...` | IE11 dynamic token 不被承诺 | pass |
| QA-007 | DoD | non-functional | checklist YAML 可解析 | schema | `validate-yaml.py --yaml-only` | valid | pass |
| QA-008 | DoD residual | non-functional | broad typecheck baseline 不被误归因为本 feature | evidence review | DoD CMD-002 + fixture declarations diff | feature fixture errors absent; remaining failures are baseline | pass |
| QA-009 | review residual | non-functional | examples shell 旧前缀不是静默遗留 | artifact review | ExamplesThemeInventory + ReleaseRiskRecord | risk accepted / follow-up recorded | pass |
| QA-010 | design DoD / validation matrix | non-functional | 手工主题、浮层、editor preview 路径已纳入整体验证矩阵 | trust-prior review | ThemeSystemValidationMatrix + 前置 feature acceptance | prior evidence referenced, not rerun | pass |

## 3. Command Results

- `npm run check:theme-selectors --workspace amis-ui` → exit 0：1503 legacy baseline matches，0 new violations。
- `npm test --workspace amis-core -- theme` → exit 0：1 suite / 9 tests passed。
- `npm test --workspace amis -- button` → exit 0：5 suites / 19 tests / 20 snapshots passed。
- `npm run stylelint` → exit 0。
- `rg -n "#\\{\\$ns\\}|\\.cxd-|\\.antd-|\\.dark-|classPrefix" docs examples` → exit 0：命中均由 DocsMigrationMap / ExamplesThemeInventory / generated artifact 分类覆盖；`examples/docs.json` 输出很大且属于生成物。
- `rg -n "IE11|cxd-ie11|CSS 变量|data-amis-theme|--amis-|amis-" docs/zh-CN/start docs/zh-CN/style docs/zh-CN/extend` → exit 0：覆盖 `--amis-*`、`[data-amis-theme]` 和 IE11 静态边界文案。
- `python3 .../validate-yaml.py --file ...checklist.yaml --yaml-only` → exit 0：YAML valid；有 PyYAML fallback warning，不影响本文件语法校验。
- `npm run typecheck` → DoD CMD-002 exit 1：非核心基线失败，剩余错误位于 editor/table/schema；本 feature 的 `Sortable` fixture 噪音已消除。
- Theme / overlay / editor preview 手工路径 → trust-prior：本 feature 不重跑浏览器；ThemeSystemValidationMatrix 指向已 accepted 的 runtime、overlay、editor feature evidence。

## 4. Scenario Results

- [x] QA-001 runtime / stable selector 契约：pass
  - Evidence: `amis-core` theme tests 9/9 passed。
- [x] QA-002 button smoke：pass
  - Evidence: `amis` button tests 19/19 passed，snapshots 20/20 passed。
- [x] QA-003 selector guard：pass
  - Evidence: guard reported 0 new violations。
- [x] QA-004 stylelint：pass
  - Evidence: command exit 0。
- [x] QA-005 docs/examples old-prefix classification：pass
  - Evidence: source docs retained hits are warnings / file-name compatibility / component-specific prop；examples hits are inventoried or generated.
- [x] QA-006 IE11 static fallback boundary：pass
  - Evidence: `getting-started.md`、`style/index.md`、`css-vars.md` all describe IE11 as static CSS fallback only.
- [x] QA-007 checklist YAML：pass
  - Evidence: validator exit 0。
- [x] QA-008 typecheck baseline attribution：pass
  - Evidence: DoD marks CMD-002 non-core / document-baseline; remaining errors are outside this feature scope.
- [x] QA-009 release risk visibility：pass
  - Evidence: ReleaseRiskRecord records examples shell, DOM-only alias, IE11 and typecheck baseline risks.
- [x] QA-010 manual theme / overlay / editor preview coverage：pass
  - Evidence: ThemeSystemValidationMatrix references accepted prior feature evidence; no current rerun.

## 5. Findings

### failed

none

### blocked

none

### residual-risk

- No browser screenshot / rendered docs pass was run in this feature; acceptable because this is a non-functional docs / validation rollout, source docs were diff-reviewed, and theme / overlay / editor preview coverage is trust-prior from accepted prior features.
- `examples/docs.json` remains generated and may contain stale text until docs bundle regeneration.
- examples shell old-prefix selector migration remains follow-up scope, not a hidden blocker.

## 6. Cleanliness

- Debug output: pass
- Temporary TODO/FIXME/XXX: pass
- Commented-out code: pass
- Unused imports / dead code from this feature: pass
- Out-of-scope files: pass

## 7. Verdict

- Status: passed
- Next: `cs-feat` acceptance 阶段。
