---
doc_type: feature-design-review
feature: 2026-07-25-stylesheet-stable-selector-build
status: passed
review_state: passed
review_reason: ""
reviewer_id: "local-only:user-approved-2026-07-25"
reviewed: 2026-07-25
round: 1
---

# stylesheet-stable-selector-build feature design 审查报告

## 1. Scope And Inputs

- Design: `.codestable/features/2026-07-25-stylesheet-stable-selector-build/stylesheet-stable-selector-build-design.md`
- Checklist: `.codestable/features/2026-07-25-stylesheet-stable-selector-build/stylesheet-stable-selector-build-checklist.yaml`
- Roadmap: `.codestable/roadmap/theme-system-refactor/theme-system-refactor-roadmap.md`
- Roadmap item: `stylesheet-stable-selector-build`
- ADR: `.codestable/requirements/adrs/001-tokenized-theme-system.md`
- Prior feature: `.codestable/features/2026-07-25-token-contract-css-layers/token-contract-css-layers-design.md`
- Compound: `.codestable/compound/2026-07-24-explore-cxd-compat-compile-switch.md`
- Code facts checked: `packages/amis-ui/scss/_mixins.scss`, `packages/amis-ui/scss/components/**`, `.stylelintrc.json`, `packages/amis-ui/rollup.config.js`, `packages/amis-theme-editor-helper/src/helper/ParseThemeData.ts`, `packages/amis-editor-core/src/manager.ts`

### Independent Review

- Status: local-only
- Detection: local-only
- Provider / agent: none
- Raw output summary: `spawn_agent` rejected both message-only and items-only attempts as mixed `message/items`, before an agent id was created.
- Merge policy: 本地逐项核验 design、checklist、roadmap、ADR、prior token contract、compound 和关键代码事实。
- Gate effect: owner 已批准 local-only 降级，允许本轮 design review 给出最终 verdict。

## 2. Design Summary

- Goal: 建立 StableSelector SCSS helper、selector inventory、allowlist 和新增代码 guard，为后续组件迁移提供工具与护栏。
- Key contracts: `.amis-*` / `[data-amis-theme]` helper、selector classification taxonomy、allowlist、guard command、禁止新增 SCSS `.cxd-*` legacy selector。
- Steps: 6 步；从基线扫描到分类/allowlist、helper、guard、验证集成和迁移交接。
- Checks: 14 项；覆盖 helper、inventory、allowlist、guard、流程约束、范围守护和验收场景。

## 3. Findings

### blocking

- none

### important

- none

### nit

- none

### suggestion

- [ ] FDR-001 实现阶段需要把 `npm run check:theme-selectors --workspace amis-ui` 真正加到 `packages/amis-ui/package.json` 或等价入口，否则 checklist 的核心命令不能执行。
  - Evidence: design 第 3.3 节和 checklist `dod.commands` 已把该命令列为 core。
  - Impact: 不阻塞 design；实现阶段必须落真实命令或同步修订 design/checklist。

### learning

- guard 的核心不是让旧 `#{$ns}` / `.cxd-*` 立即清零，而是把“既有债务”和“新增倒退”分开；design 已按 inventory + allowlist + guard 的顺序处理。
- `packages/amis-ui/scss/_mixins.scss` 和 components 目录迁移面很大，本 feature 选择只建工具和护栏，不批量迁移，符合 roadmap 拆分。

### praise

- design 明确拒绝 SCSS `.cxd-*` legacy selector 双轨，避免 guard/helper 反向打开已被 ADR 和 compound 拒绝的兼容策略。
- checklist 把 selector inventory、allowlist、guard 正反例和迁移交接拆成独立 step，后续实现可以逐项验收。

## 4. User Review Focus

- 用户需要重点拍板：是否认可 selector 分类 taxonomy、`npm run check:theme-selectors --workspace amis-ui` 作为后续 guard 入口，以及 guard 初始只拦新增/未分类项而不要求旧债清零。
- implement 需要重点遵守：先建立 inventory/allowlist，再建 helper/guard；helper 不生成 `.cxd-*`；guard 必须有正反例证据。
- code review / QA / acceptance 需要重点复核：新增命中是否默认失败、允许项是否有分类和退出条件、是否偷塞组件批量迁移或 editor/helper 迁移。

## 5. Evidence Confidence Ledger

| Check | Verdict | Evidence Class | Basis | Follow-up |
|---|---|---|---|---|
| Acceptance Coverage Matrix | pass | E | design 第 3.2 节覆盖 inventory、bad selector failure、allowlist pass、stable helper、SCSS legacy 反向核对和 editor/helper 反向核对 | implementation 按矩阵落证据 |
| DoD Contract | pass | E | design 第 3.3 节和 checklist `dod.commands` 均列出 stylelint、amis-ui build、fixed-string `#{$ns}` grep、theme prefix grep、selector guard、YAML 校验 | 实现阶段新增真实 guard script |
| Steps and checks traceability | pass | E | checklist 6 steps / 14 checks 均能回到 design 第 1-3 节 | none |
| Roadmap contract compliance | pass | E/C | roadmap item 要求 SCSS helper、构建规则、selector inventory、allowlist、新增代码 guard、分类 taxonomy、不输出 `.cxd-*` SCSS 兼容；design 均覆盖 | none |
| Module interface design | pass | E/C | design 第 2.1 节覆盖 StableSelector helper/guard 的 module/interface、seam、depth/locality、dependency category、adapter 和 test surface | implementation 复核 guard 落点 |
| Validation and artifacts | pass | E | checklist YAML 和 roadmap items YAML 已用 `validate-yaml.py --yaml-only` 校验通过；design-review local-only 授权已记录在 approval-report | none |

Summary: E=6, C=2, H=0, H-only core checks=none。

## 6. Residual Risk

- local-only design review 缺少独立 reviewer 视角；用户 review 应重点看 selector taxonomy 是否过宽、guard 是否会误伤或放水。
- `npm run check:theme-selectors --workspace amis-ui` 目前还是设计中的目标命令，实现阶段必须真实新增，否则 checklist core command 不可执行。
- guard 如何判断“新增”可能需要依赖基线文件、git diff 或快照；实现阶段需选择最小可维护路径并留下证据。

## 7. Verdict

- Status: passed
- Next: 交回 epic child design batch；所有子 feature design-review passed 后再统一进入 owner design confirmation。
