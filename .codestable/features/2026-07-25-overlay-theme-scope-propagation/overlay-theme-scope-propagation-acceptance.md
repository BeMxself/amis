---
doc_type: feature-acceptance
feature: 2026-07-25-overlay-theme-scope-propagation
status: passed
audit_state: not-started
audit_reason: ""
auditor_id: ""
acceptance_authorization_ref: "approval-report.md#goal-acceptance"
accepted: 2026-07-26
round: 1
---

# overlay-theme-scope-propagation 验收报告

> 阶段：阶段 3（验收闭环）
> 验收日期：2026-07-26
> 关联方案 doc：`.codestable/features/2026-07-25-overlay-theme-scope-propagation/overlay-theme-scope-propagation-design.md`

## 1. 接口契约核对

**接口示例逐项核对**：

- [x] `getNearestThemeScope(node)`：已在 `packages/amis-core/src/theme.tsx` 实现，从当前 DOM 节点向上解析最近 `data-amis-theme`，测试覆盖 root / container 近邻查找。
- [x] `applyThemeScope(node, scope)`：已在 `packages/amis-core/src/theme.tsx` 实现，幂等写入 `data-amis-theme`，并保留 custom container 已有 scope。
- [x] `resolveOverlayContainer(...)`：已在 `packages/amis-core/src/theme.tsx` 实现，在既有 container 解析结果上附加待应用 scope，不改变显式 custom container `null` 语义。
- [x] `Overlay` portal wrapper：`packages/amis-core/src/components/Overlay.tsx` 在 Portal 边界添加 scoped ancestor，保证 `[data-amis-theme] .amis-*` 后代选择器可命中。
- [x] `Modal` / `Drawer` portal root：`packages/amis-ui/src/components/Modal.tsx` 和 `packages/amis-ui/src/components/Drawer.tsx` 在 modal root 上应用同一 ThemeScope。

**名词层“现状 -> 变化”逐项核对**：

- [x] OverlayThemeScope：本 feature 将 roadmap 中的浮层 scope 契约落实为 core theme helper + Overlay / Modal / Drawer 接入点。
- [x] Portal mount root：默认 body、自定义 container、iframe document body、modal container 均有 targeted DOM 断言。
- [x] Scope applicator：`applyThemeScope` 是唯一 DOM scope 写入 helper；Overlay / Modal / Drawer 没有各自手写属性复制规则。
- [x] Container resolver：复用现有 container 决策，只在解析后装饰 scope；不改变 `containerSelector`、`env.getModalContainer`、fullscreen container 或 body fallback 规则。
- [x] 多 root：真实 `amisRender` + shared env 场景验证 `cxd` / `dark` root 的 body portal scope 不串线。

## 2. 行为与决策核对

**需求摘要逐项验证**：

- [x] 默认 body portal 能继承触发 root 的 `data-amis-theme`：Overlay、Dialog、Drawer、renderer 级 DropDown 路径均有 DOM 断言。
- [x] 自定义 container 能保留或应用正确 scope：Overlay / Dialog / Drawer 均覆盖 custom container 已有 scope 与触发 scope。
- [x] custom container 不可用时不误 fallback：Dialog / Drawer 新增测试确认显式 custom container 返回 `null` 时保持旧 `null` 行为。
- [x] 多 root 不回退全局默认主题：`OverlayThemeScope.test.tsx` 覆盖两个 root 共享 env 的 body portal。
- [x] iframe preview 边界不跨 document：`Overlay.test.tsx` 覆盖 iframe `contentDocument.body` container。

**明确不做逐项核对**：

- [x] 不修改 Overlay 定位、RootClose、offset、scroll parent：review 明确复核 Position / RootClose 原组合顺序保持。
- [x] 不修改 Modal 动画、拖拽、closeOnOutside：实现只在 modal root ref 上应用 scope，未改动动画/拖拽/关闭逻辑。
- [x] 不迁移 editor/theme-editor CSS 或组件 SCSS：QA 通过 `git diff --name-only -- packages/amis-editor-core packages/amis-theme-editor-helper packages/amis-ui/scss packages/amis-editor` 反向核对无输出。
- [x] 不解决所有第三方库浮层：本 feature 只覆盖 amis 当前 Overlay / Modal 主路径，第三方浮层仍作为后续边界。

**关键决策落地**：

- [x] scope seam 放在 Overlay / modal container 边界：portal 脱离 Root DOM 树处统一补 scope。
- [x] 统一 helper：scope 查找、写入、container 解析收敛在 `packages/amis-core/src/theme.tsx`，并由 `packages/amis-core/src/index.tsx` 导出。
- [x] 多 root 以触发组件上下文为准：Overlay 优先 target DOM nearest scope，其次 `ThemeContext`，最后才是 `EnvContext.theme` fallback。
- [x] editor / iframe preview 只作为验证边界：iframe 有 DOM 断言，editor CSS/helper 未迁移。

## 3. 验收场景核对

- [x] Tooltip / Overlay body container 带 scope。
  - 证据来源：`npm test --workspace amis-core -- Overlay`。
  - 结果：通过。
- [x] Dropdown / PopOver custom container 与 descendant selector 可命中。
  - 证据来源：`Overlay.test.tsx` 和 `OverlayThemeScope.test.tsx` 的 `[data-amis-theme] .amis-*` DOM 断言。
  - 结果：通过。
- [x] Select / 下拉层相关 full suite 当前作为 baseline risk 记录。
  - 证据来源：`overlay-theme-scope-propagation-dod-results.json` CMD-004；降级授权见 `approval-report.md#overlay-dod-baseline-narrowing`。
  - 结果：本 feature 通过，后续 `core-component-selector-migration` 继续清理。
- [x] Dialog / Drawer / Modal 默认和自定义 container 带 scope。
  - 证据来源：`npm test --workspace amis -- renderers/Dialog.test.tsx`、`npm test --workspace amis -- DrawerThemeScope`。
  - 结果：通过。
- [x] 两个 root 不同 theme 时 portal scope 不串线。
  - 证据来源：`npm test --workspace amis -- OverlayThemeScope`。
  - 结果：通过。
- [x] iframe preview container 不跨 document 写 scope。
  - 证据来源：`Overlay.test.tsx` iframe case。
  - 结果：通过。
- [x] 反向核对：未修改 SCSS、editor/theme-editor helper、定位/拖拽/RootClose 语义。
  - 证据来源：QA cleanliness、review adversarial pass、scope gate。
  - 结果：通过。

**review 报告重点复核**：

- [x] `overlay-theme-scope-propagation-review.md` 第 5 节 Test And QA Focus 已覆盖：真实 `amisRender` 多 root + shared env + body portal、`[data-amis-theme] .amis-*` 后代选择器、Modal/Drawer `null` custom container、iframe/editor preview 边界。
- [x] review residual risk 已保留：本轮 code review 为 owner 批准的 local-only fallback，缺独立 reviewer / OCR 视角；acceptance 以 targeted DOM invariant 和 QA 复核兜底，不把该风险改写为不存在。

**QA 报告重点复核**：

- [x] 验证证据来源：`overlay-theme-scope-propagation-qa.md`。
- [x] QA matrix 覆盖 helper、Overlay、Dialog、Drawer、真实 renderer 多 root、DoD warnings 和 cleanliness。
- [x] failed / blocked 项为 none。
- [x] Evidence pack、DoD Results、Scope Gate 均为 passed；CMD-002 / CMD-003 / CMD-004 是已授权 non-core baseline warnings。

## 4. 术语一致性

- OverlayThemeScope：roadmap / design / implementation / review / QA / acceptance 使用一致，定位为浮层继承触发 root theme scope 的 DOM 契约。
- `data-amis-theme`：Root 与 portal 边界统一使用该属性，不引入新的主题身份属性。
- `ThemeScope`：继续使用 core theme runtime 的现有类型，不新增平行概念。
- custom container：验收统一表述为“已有 scope 优先保留；无 scope 时应用触发 scope；显式不可用时不 fallback”。

## 5. 领域影响盘点

- 新名词：`OverlayThemeScope` 已由 roadmap 和 feature design 承载，本 feature 不需要修改 `requirements/CONTEXT.md`。
- 结构性选择：`getNearestThemeScope` / `applyThemeScope` / `resolveOverlayContainer` 已稳定为浮层 scope 公共 helper，可在后续 milestone 后作为 architecture / compound convention 候选沉淀。
- ADR 影响：本 feature 是 ADR-001 的执行层细化，不新增替代 ADR，也不改变 ADR-001 中“主题身份由 `[data-amis-theme]` 表达”的长期决策。

## 6. requirement delta / clarification 回写

- 无 requirement 影响。本 feature 是主题系统内部运行时能力落地，不新增用户可感产品能力。
- 无 owner-approved req delta。
- 无 `requirements/CONTEXT.md` 更新需求；主题作用域术语和 ADR-001 已覆盖当前边界。

## 7. roadmap 回写

- [x] `.codestable/roadmap/theme-system-refactor/theme-system-refactor-items.yaml` 中 `overlay-theme-scope-propagation` 已为 `done`。
- [x] `.codestable/roadmap/theme-system-refactor/theme-system-refactor-roadmap.md` 第 6 节对应条目已为 `done / 2026-07-25-overlay-theme-scope-propagation`。
- [x] roadmap 状态只做机械完成回写，未修改后续 feature scope。
- [x] `goal-state.yaml` 将在 feature 完成阶段把本 feature 状态推进为 `accepted`，并将 `current_feature_index` 推进到下一项。

## 8. attention.md 候选盘点

- 候选 1：本地系统 Python 缺 PyYAML 时，CodeStable gate runner 需要 `PYTHONPATH=/Users/songmingxu/Projects/gold-market/.venv/lib/python3.13/site-packages`。
- 候选 2：Task agent reviewer payload/schema 校验失败时，必须先写 approval report 并等待 owner 明确批准 local-only fallback，不能静默自审。
- 候选 3：OCR lane 依赖本地 `ocr` CLI；当前环境 `ocr` 不存在时只能记录 unavailable，不得伪造 OCR 审查。

以上候选不在 acceptance 阶段直接写入 `attention.md`；按协议作为退出后沉淀/notes 候选。

## 9. 遗留

- 后续优化点：`core-component-selector-migration` 必须清理 full `Dialog` / `Tooltip` / `Select` suites 中旧 `.cxd-*` selector / snapshot / `classPrefix` DOM 依赖。
- 后续优化点：真实浏览器 CSS 层叠、editor preview 时序和视觉验证仍应在后续 validation / docs rollout 中补强。
- 已知限制：本轮 code review 是 owner 批准的 local-only fallback，缺独立 reviewer / OCR 视角。
- 已知限制：本 feature 不覆盖第三方库自建 portal，也不迁移 editor/theme-editor CSS。

## 10. 最终审计

- 验证证据来源：`overlay-theme-scope-propagation-qa.md`。
- Evidence sources：`overlay-theme-scope-propagation-evidence-pack.md` / `overlay-theme-scope-propagation-dod-results.json` / `overlay-theme-scope-propagation-scope-gate.json`。
- 聚合命令：
  - `npm test --workspace amis-core -- theme`：exit 0。
  - `npm test --workspace amis-core -- Overlay`：exit 0。
  - `npm test --workspace amis -- renderers/Dialog.test.tsx`：exit 0。
  - `npm test --workspace amis -- DrawerThemeScope`：exit 0。
  - `npm test --workspace amis -- OverlayThemeScope`：exit 0。
  - `npm run stylelint`：exit 0。
  - YAML validate：exit 0。
  - `codestable-workflow-next.py epic --roadmap .codestable/roadmap/theme-system-refactor --json`：exit 0，`dispatch_goal`，两项 authorization refs 可见。
  - `git diff --check`：exit 0。
- 场景复核：re-verified 7 / trust-prior-verify 0。
- 交付物复核：代码 / CodeStable artifacts / roadmap 回写通过；requirement / ADR 无本 feature 直接写入。
- 完整工作区复核：dirty files 均属于本 feature 范围或 roadmap state/writeback。
- diff 清洁度：通过；无新增 debug output、临时 TODO/FIXME/XXX、注释掉代码、方案外文件。
- 知识沉淀出口：attention / compound convention 候选已登记在第 8 节和第 5 节。
- 结论：通过。
