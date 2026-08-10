---
doc_type: feature-design-review
feature: 2026-07-25-core-component-selector-migration
status: passed
review_state: passed
review_reason: ""
reviewer_id: "local-only:user-approved-2026-07-25"
reviewed: 2026-07-25
round: 1
---

# core-component-selector-migration feature design 审查报告

## 1. Scope And Inputs

- Design: `.codestable/features/2026-07-25-core-component-selector-migration/core-component-selector-migration-design.md`
- Checklist: `.codestable/features/2026-07-25-core-component-selector-migration/core-component-selector-migration-checklist.yaml`
- Roadmap: `.codestable/roadmap/theme-system-refactor/theme-system-refactor-roadmap.md`
- Roadmap item: `core-component-selector-migration`
- ADR: `.codestable/requirements/adrs/001-tokenized-theme-system.md`
- Prior features: `theme-runtime-button-pilot`, `token-contract-css-layers`, `stylesheet-stable-selector-build`, `overlay-theme-scope-propagation`
- Compound: `.codestable/compound/2026-07-24-explore-cxd-compat-compile-switch.md`
- Code facts checked: `packages/amis-ui/scss/_mixins.scss`, `packages/amis-ui/scss/components/_table.scss`, `packages/amis-ui/scss/components/_modal.scss`, `packages/amis-ui/scss/components/_tooltip.scss`, `packages/amis-ui/scss/components/_page.scss`, `packages/amis/src/renderers/Dialog.tsx`, `packages/amis/src/renderers/Drawer.tsx`, `packages/amis/src/renderers/Table/index.tsx`, `packages/amis/src/renderers/Table2/index.tsx`, `packages/amis-ui/src/components/Modal.tsx`, `packages/amis-ui/src/components/Drawer.tsx`, `packages/amis-ui/src/components/Select.tsx`, `packages/amis-ui/src/components/Tree.tsx`

### Independent Review

- Status: local-only
- Detection: local-only
- Provider / agent: none
- Raw output summary: reviewer tool attempts were rejected before an agent id was created because the tool wrapper still injected empty optional fields or treated `message` and `items` as mixed.
- Merge policy: 本地逐项核验 design、checklist、roadmap、ADR、前置 feature、compound 和关键代码事实。
- Gate effect: owner 已批准 local-only 降级，允许本轮 design review 给出最终 verdict。

## 2. Design Summary

- Goal: 迁移高覆盖组件和渲染器的 `.cxd-*`、`#{$ns}` 与 `classPrefix` DOM selector dependency，改为稳定 `.amis-*` 与 component/state token。
- Key contracts: ComponentMigrationLedger、MigrationWave、SelectorDependencyKind、StableDomSelector、ComponentTokenMapping。
- Steps: 7 步；从实现准入、migration ledger、三组迁移 wave，到剩余命中分类和验证交接。
- Checks: 15 项；覆盖依赖 done 准入、ledger 复用、`classPrefix` 分类、三组 wave、范围守护、selector guard、targeted tests 和 acceptance 可核验性。
- Baseline / validation: 设计列出 stylelint、theme selector guard、Button/Dialog/Tooltip/Select/DropDownButton/Table targeted tests、`#{$ns}` grep、legacy selector/classPrefix grep 和 checklist YAML 校验。

## 3. Findings

### blocking

- none

### important

- none

### nit

- none

### suggestion

- [ ] FDR-001 实现阶段建议把 migration ledger 做成机器可读文件，至少包含组件、selector 类型、旧命中、目标 selector、验证命令、owner 和退出条件。
  - Evidence: design 第 2.1 节已把 ComponentMigrationLedger 定义为本项与 legacy-prefix-teardown 的交接接口；checklist 也要求剩余命中带分类、owner 和退出条件。
  - Impact: 不阻塞 design；机器可读 ledger 能减少后续 legacy-prefix-teardown 重新扫描和人工解释成本。
- [ ] FDR-002 `npm run check:theme-selectors --workspace amis-ui` 是本项核心命令，但它来自前置 `stylesheet-stable-selector-build`，实现阶段必须 fail-closed。
  - Evidence: design 第 1 节关键决策明确复用前置 guard，checklist `CMD-002` 将其列为 core。
  - Impact: 如果实现阶段前置项尚未真正提供该命令，本项不能临时绕开 guard，应回前置项补齐或记录阻塞。

### learning

- 这个 design 正确地区分了 design admission 和 implementation admission：epic batch 允许依赖 design-review passed 后继续起草下游 design，但实现前仍必须等依赖项 `done`。
- Tree 中直接 `.cxd-TreeControl`、Dialog/Drawer/Modal 的 `classPrefix` DOM 查询、Table/Table2 的 selector 字符串说明迁移不是 SCSS 替换题，而是 selector behavior migration。

### praise

- design 用 waves 限制迁移半径，避免把 Table/Table2、Select、Dialog 等大文件一次性改成不可审 diff。
- 明确把 editor/theme-editor、`classPrefix` 字段删除、DOM-only alias 退出都排除在本项之外，和 roadmap 的干净迁移节奏一致。

## 4. User Review Focus

- 用户需要重点拍板：是否认可“核心组件迁移按 ledger + waves 执行”，以及 implementation 前必须等 `stylesheet-stable-selector-build` / `overlay-theme-scope-propagation` 都 `done`。
- implement 需要重点遵守：先建 ledger，不做全仓库替换；每个 wave 都要成对处理 SCSS selector 与 TSX DOM selector dependency；未迁移命中必须有分类和退出条件。
- code review / QA / acceptance 需要重点复核：Table/Table2、Select、Dialog/Drawer/Modal 行为是否不变，editor/theme-editor 是否无范围外 diff，selector guard 是否真实执行。

## 5. Evidence Confidence Ledger

| Check | Verdict | Evidence Class | Basis | Follow-up |
|---|---|---|---|---|
| Acceptance Coverage Matrix | pass | E | design 第 3.2 节覆盖依赖 done、ledger、Button/Form、Dialog/Tooltip/Dropdown/Select、Table/Table2/Page/Layout、guard 和 editor/helper 反向核对 | implementation / QA 落命令与 snapshot 证据 |
| DoD Contract | pass | E | design 第 3.3 节与 checklist `dod.commands` 覆盖 stylelint、selector guard、targeted tests、grep、YAML 校验和 required artifacts | none |
| Steps and checks traceability | pass | E | checklist 7 steps / 15 checks 均可追溯到 design 第 1-3 节 | none |
| Roadmap contract compliance | pass | E/C | roadmap 要求迁移高覆盖组件和渲染器的 `.cxd-*` / `$ns` / `classPrefix` DOM 查询，优先 Button、Form、Select、Dialog、Table/Table2、Dropdown/Tooltip/Popover、Page/Layout；design 全部覆盖且未扩大到 editor/theme-editor | none |
| Module interface design | pass | E/C | ComponentMigrationLedger 被定义为 Component Migration 与 legacy-prefix-teardown 的交接接口；waves、SelectorDependencyKind、StableDomSelector、ComponentTokenMapping 的 seam 清晰 | 实现阶段优先机器可读 ledger |
| Validation and artifacts | pass | E | checklist YAML 与 roadmap items YAML 已校验通过；`git diff --check` 已通过；local-only 授权已记录在 approval-report | none |

Summary: E=6, C=2, H=0, H-only core checks=none。

## 6. Residual Risk

- local-only design review 缺少独立 reviewer 视角；用户 review 应重点看 wave 拆分是否过大，尤其 Table/Table2 与 Page/Layout 是否需要再拆。
- 前置 selector guard 若实现不完整，本项 implementation 会被阻塞；这是故意的 fail-closed 设计，不应通过临时 grep 绕过。
- migration ledger 如果写成散文，后续 teardown 仍会高成本；建议实现阶段尽量使用 YAML/JSON 或固定表格结构。

## 7. Verdict

- Status: passed
- Next: 交回 epic child design batch；所有子 feature design-review passed 后再统一进入 owner design confirmation。

## 8. Focused Closure

- none
