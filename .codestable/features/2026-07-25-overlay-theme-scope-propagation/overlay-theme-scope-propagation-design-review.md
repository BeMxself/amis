---
doc_type: feature-design-review
feature: 2026-07-25-overlay-theme-scope-propagation
status: passed
review_state: passed
review_reason: ""
reviewer_id: "local-only:user-approved-2026-07-25"
reviewed: 2026-07-25
round: 1
---

# overlay-theme-scope-propagation feature design 审查报告

## 1. Scope And Inputs

- Design: `.codestable/features/2026-07-25-overlay-theme-scope-propagation/overlay-theme-scope-propagation-design.md`
- Checklist: `.codestable/features/2026-07-25-overlay-theme-scope-propagation/overlay-theme-scope-propagation-checklist.yaml`
- Roadmap: `.codestable/roadmap/theme-system-refactor/theme-system-refactor-roadmap.md`
- Roadmap item: `overlay-theme-scope-propagation`
- ADR: `.codestable/requirements/adrs/001-tokenized-theme-system.md`
- Related compound: `.codestable/compound/2026-07-24-explore-cxd-compat-compile-switch.md`
- Code facts checked: `packages/amis-core/src/Root.tsx`, `packages/amis-core/src/theme.tsx`, `packages/amis-core/src/env.tsx`, `packages/amis-core/src/components/Overlay.tsx`, `packages/amis-ui/src/components/Modal.tsx`, `packages/amis-ui/src/components/TooltipWrapper.tsx`, `packages/amis-ui/src/components/Select.tsx`, `packages/amis/src/renderers/Dialog.tsx`, `packages/amis-editor-core/src/component/ScaffoldModal.tsx`, `packages/amis-editor-core/src/component/IFramePreview.tsx`

### Independent Review

- Status: local-only
- Detection: local-only
- Provider / agent: none
- Raw output summary: reviewer tool attempts were rejected before an agent id was created because the tool wrapper treated `message` and `items` as mixed, or rejected empty optional fields.
- Merge policy: 本地逐项核验 design、checklist、roadmap、ADR、compound 和关键代码事实。
- Gate effect: owner 已批准 local-only 降级，允许本轮 design review 给出最终 verdict。

## 2. Design Summary

- Goal: 统一 Overlay、portal 和 modal container 的 theme scope 传播，确保浮层挂到 body、自定义 container、modal container、editor preview 或 iframe preview 时仍能继承正确 `data-amis-theme`。
- Key contracts: `getNearestThemeScope(node)`、`applyThemeScope(node, scope)`、`resolveOverlayContainer(requested, fallback, scope)`，以及 Overlay / Modal portal 边界统一应用 scope。
- Steps: 6 步；从 Overlay/Modal 基线预检到 helper、Overlay 接入、Modal 接入、多 root/preview 验证和范围收口。
- Checks: 14 项；覆盖唯一 helper、Overlay/Modal scope、多 root、自定义 container、iframe/editor preview、行为不变性和范围守护。
- Baseline / validation: 设计已列出 amis-core theme helper、Overlay/Modal tests、Dialog/Tooltip/Select targeted tests、stylelint、grep 命中核对和 checklist YAML 校验。

## 3. Findings

### blocking

- none

### important

- none

### nit

- none

### suggestion

- [ ] FDR-001 `packages/amis-core/src/components/Overlay.tsx` / `packages/amis-core/src/theme.tsx` 实现阶段需要明确 Overlay 如何取得触发 root 的 theme scope。
  - Evidence: `Overlay` 当前 `static contextType = EnvContext`，通过 env 解析 `getModalContainer`；`ThemeContext` 也存在，但 class component 只能直接挂一个 `contextType`。`RendererEnv.theme` 已有 `ThemeInstance.scope`，Modal 也通过 `themeable` 注入 `theme`。
  - Impact: 不阻塞 design；实现阶段应优先复用 `EnvContext.theme.scope` 或用一个小 wrapper/consumer 取 `ThemeContext`，避免为了取 scope 改写 Overlay 主行为。
- [ ] FDR-002 iframe / editor preview 的证据建议拆成“自动 DOM 断言优先、手工 fixture 兜底”，避免实现阶段被迫大改 editor。
  - Evidence: design 已把 editor / iframe preview 列为验证边界，同时明确不迁移 `.AMISCSSWrapper`、theme-editor helper 和生成 CSS。
  - Impact: 不阻塞 design；后续 QA/acceptance 应记录哪些 preview 场景自动化覆盖、哪些只做代表性手工证据。

### learning

- 当前 `Root` 已通过 `ThemeScopeRoot` 输出 `data-amis-theme`，真正的缺口集中在 portal 脱离 Root DOM 子树后丢 scope，设计把修复边界放在 Overlay / Modal 主路径是对的。
- `TooltipWrapper`、`Select`、`Dialog` 等调用方都已有 container / popOverContainer / env.getModalContainer 入口，逐个业务组件复制属性会制造并行路径；统一 helper 更符合 roadmap 的 OverlayThemeScope 契约。

### praise

- design 明确不改定位、RootClose、Modal 拖拽、closeOnOutside 和 editor/theme-editor CSS，能防止 scope 修复扩大成浮层行为重构。
- checklist 把 body/custom container、多 root、custom container 保留已有 scope、iframe/editor preview 和范围守护拆成独立 checks，后续 implementation / QA 可以逐项验收。

## 4. User Review Focus

- 用户需要重点拍板：是否认可 Overlay / Modal portal 边界作为唯一主修复点，以及 editor / iframe preview 只作为 scope 验证边界、不迁移 editor CSS。
- implement 需要重点遵守：helper 必须幂等；custom container 已有 `data-amis-theme` 时优先保留；body container 必须使用触发 root 的 scope；不得改定位、RootClose、拖拽、关闭语义。
- code review / QA / acceptance 需要重点复核：多 root 主题不串线、跨 document 写入位置正确、Overlay 和 Modal 双入口都接入、没有在 Select/Dialog/Tooltip 等胖组件里散落 scope 逻辑。

## 5. Evidence Confidence Ledger

| Check | Verdict | Evidence Class | Basis | Follow-up |
|---|---|---|---|---|
| Acceptance Coverage Matrix | pass | E | design 第 3.2 节覆盖 Tooltip、Dropdown/PopOver、Select、Dialog/Drawer/Modal、多 root、editor/iframe preview 和行为不变性 | implementation / QA 落 DOM 证据 |
| DoD Contract | pass | E | design 第 3.3 节与 checklist `dod.commands` 均列出 helper、Overlay、Modal、QA、acceptance、stylelint、grep 和 YAML 校验 | none |
| Steps and checks traceability | pass | E | checklist 6 steps / 14 checks 可追溯到 design 第 1-3 节 | none |
| Roadmap contract compliance | pass | E/C | roadmap 第 4.4 节要求 OverlayThemeScope helper、body/custom container scope、custom container 优先、iframe/editor preview、Dialog/Tooltip/Dropdown/Select test surface；design 均覆盖 | none |
| Module interface design | pass | E/C | design 第 2.1 节定义 helper、边界、依赖类型和测试面；代码事实显示 Root/theme/env/Overlay/Modal 已有可接入主路径 | 实现阶段注意 Overlay 取 scope 来源 |
| Validation and artifacts | pass | E | checklist YAML 和 roadmap items YAML 已校验通过；`git diff --check` 已通过；local-only 授权已记录在 approval-report | none |

Summary: E=6, C=2, H=0, H-only core checks=none。

## 6. Residual Risk

- local-only design review 缺少独立 reviewer 视角；用户 review 应重点看 Overlay 取 scope 的实现路径是否会引入第二套 context 机制。
- iframe / editor preview 的自动化成本可能高于普通 jsdom 场景；后续 QA/acceptance 必须明确自动化与手工证据边界。
- custom container “保留已有 scope”与“触发 root scope”可能冲突；实现阶段应按 design 明确的优先级写测试并在 code review 中复核。

## 7. Verdict

- Status: passed
- Next: 交回 epic child design batch；所有子 feature design-review passed 后再统一进入 owner design confirmation。

## 8. Focused Closure

- none
