---
doc_type: feature-design-review
feature: 2026-07-25-legacy-prefix-teardown
status: passed
review_state: passed
review_reason: ""
reviewer_id: "local-only:user-approved-2026-07-25"
reviewed: 2026-07-25
round: 1
---

# legacy-prefix-teardown feature design 审查报告

## 1. Scope And Inputs

- Design: `.codestable/features/2026-07-25-legacy-prefix-teardown/legacy-prefix-teardown-design.md`
- Checklist: `.codestable/features/2026-07-25-legacy-prefix-teardown/legacy-prefix-teardown-checklist.yaml`
- Roadmap: `.codestable/roadmap/theme-system-refactor/theme-system-refactor-roadmap.md`
- Roadmap item: `legacy-prefix-teardown`
- ADR: `.codestable/requirements/adrs/001-tokenized-theme-system.md`
- Compound: `.codestable/compound/2026-07-24-explore-cxd-compat-compile-switch.md`
- Prior features: `theme-runtime-button-pilot`, `stylesheet-stable-selector-build`, `core-component-selector-migration`, `editor-theme-helper-migration`
- Code facts checked: `packages/amis-core/src/theme.tsx`, `packages/amis-core/src/Root.tsx`, `packages/amis-editor-core/src/manager.ts`, `packages/amis-ui/src/themes/cxd.ts`, `packages/amis-ui/src/themes/antd.ts`, `packages/amis-ui/src/themes/dark.ts`, `packages/amis/build.sh`, `packages/amis-ui/scss/themes/cxd-ie11.scss`

### Independent Review

- Status: local-only
- Detection: local-only
- Provider / agent: none
- Raw output summary: reviewer tool attempts were rejected before an agent id was created because the tool wrapper injected empty optional fields (`reasoning_effort`) and/or mixed `message` with `items`.
- Merge policy: 本地逐项核验 design、checklist、roadmap、ADR、compound、前置 feature 和关键代码事实。
- Gate effect: owner 已批准 local-only 降级，允许本轮 design review 给出最终 verdict。

## 2. Design Summary

- Goal: 收敛旧主题前缀公共样式契约，治理 DOM-only `.cxd-*` alias 的显式开关、人工复审和退出边界。
- Key contracts: LegacyPrefixLedger、PrefixDependencyKind、PrefixTeardownDecision、AliasRetentionRecord、PrefixPublicApiGuard。
- Steps: 7 步；从依赖 done 准入、ledger 汇总、公共依赖迁移/内部化，到 alias policy、guard 收紧、docs handoff 和 acceptance 证据收口。
- Checks: 14 项；覆盖依赖准入、默认主路径、alias 默认关闭、禁止 SCSS/CSS legacy selector、ledger 分类、人工复审、文件名兼容、IE11 静态边界和 docs handoff。
- Baseline / validation: 设计列出 workflow hook、amis-core theme test、amis Button render test、theme selector guard、stylelint、typecheck、legacy prefix grep 和 checklist YAML 校验。

## 3. Findings

### blocking

- none

### important

- none

### nit

- none

### suggestion

- [ ] FDR-001 实现阶段建议把 LegacyPrefixLedger 做成机器可读 YAML/JSON，而不是只写 Markdown 表格。
  - Evidence: design 第 2.1 节允许 YAML/JSON 或固定 Markdown；checklist 要求剩余命中均有分类、owner、保留原因、退出条件和下一归属。
  - Impact: 不阻塞 design；机器可读格式能让 docs rollout、guard 和后续人工复审复用同一份证据，降低重新扫描成本。
- [ ] FDR-002 AliasRetentionRecord 的 `decision_owner` 不应长期停留在泛称，implementation/acceptance 阶段需要落到可执行的责任角色或小组。
  - Evidence: design 示例里写 `theme architecture owner`，roadmap notes 要求记录人工决策责任方。
  - Impact: 不阻塞 design；没有明确责任方会让“最多 1 年内复审”变成无人触发的软约束。
- [ ] FDR-003 `rg` 扫描命令很宽，implementation 阶段需要配合 ledger diff 或 guard 区分既有历史命中和本项新增命中。
  - Evidence: checklist `CMD-007` 使用跨包宽扫，failure_handling 是 `document-baseline`。
  - Impact: 不阻塞 design；如果只看 grep 总量，很容易把历史债务误判成本项失败。

### learning

- teardown 的核心不是“删掉所有 classPrefix”，而是把旧前缀从公共样式契约里退出；`classPrefix` 可能仍作为 internal legacy 或主题行为配置存在。
- `cxd.css` / `cxd-ie11.css` 这类文件名兼容需要单独分类，否则用户和文档容易把文件名兼容误解成 `.cxd-*` selector 兼容。

### praise

- design 正确保留了“最多 1 年内人工评估”的语义，没有把 DOM-only alias 退出写成自动版本卡点。
- 明确拒绝 SCSS/CSS `.cxd-*` 双轨，同时给 DOM-only alias 留出可审计迁移窗口，和 ADR / compound 共识一致。

## 4. User Review Focus

- 用户需要重点拍板：是否认可 legacy teardown 的完成标准是 ledger + guard + alias retention + docs handoff，而不是强行一次性删除所有 `classPrefix` 字段。
- implement 需要重点遵守：先等 core/editor 前置项 `done`；不能绕过前置 ledger；不能新增 `.cxd-*` 库 CSS 或自动 `antd` / `dark` alias。
- code review / QA / acceptance 需要重点复核：DOM-only alias 默认关闭、旧前缀剩余命中全可解释、文件名兼容不被包装成 selector 兼容、人工复审责任方真实可执行。

## 5. Evidence Confidence Ledger

| Check | Verdict | Evidence Class | Basis | Follow-up |
|---|---|---|---|---|
| Acceptance Coverage Matrix | pass | E | design 第 3.2 节覆盖依赖 done、LegacyPrefixLedger、public dependency 收口、alias off/on、不生成 `.cxd-*` 库 CSS、guard、file-name compatibility 和 IE11 静态边界 | implementation / QA 落命令与 ledger 证据 |
| DoD Contract | pass | E | design 第 3.3 节与 checklist `dod.commands` 覆盖 workflow hook、runtime/render test、guard、stylelint、typecheck、grep 和 YAML 校验 | none |
| Steps and checks traceability | pass | E | checklist 7 steps / 14 checks 均可追溯到 design 第 1-3 节 | none |
| Roadmap contract compliance | pass | E/C | roadmap 要求移除或内部化剩余 classPrefix 公共依赖，收敛 DOM-only alias 开关、文档、复审机制和移除条件；design 全部覆盖，并保留“人工评估非固定卡点” | none |
| Module interface design | pass | E/C | LegacyPrefixLedger、AliasRetentionRecord 和 PrefixPublicApiGuard 的 seam 清晰，分别承接前置 feature、runtime alias policy 和 guard | 实现阶段优先机器可读 ledger |
| Validation and artifacts | pass | E | checklist YAML 与 roadmap items YAML 待本轮命令复验；local-only 授权已记录在 approval-report | 跑 YAML / workflow / diff check |

Summary: E=6, C=2, H=0, H-only core checks=none。

## 6. Residual Risk

- local-only design review 缺少独立 reviewer 视角；用户 review 应重点看 legacy ledger 是否需要更强机器可读约束。
- 前置 core/editor 的 ledger 如果实现阶段不完整，本项会被阻塞；这是设计刻意保留的 fail-closed 边界。
- alias retention 的责任方如果没有在 implementation/acceptance 落实，1 年内人工评估可能无法触发。

## 7. Verdict

- Status: passed
- Next: 交回 epic child design batch；继续推进 `theme-system-validation-docs-rollout`，所有子 feature design-review passed 后再统一进入 owner design confirmation。

## 8. Focused Closure

- none
