---
doc_type: feature-acceptance
feature: 2026-07-25-core-component-selector-migration
status: passed
audit_state: completed
audit_reason: ""
auditor_id: ""
acceptance_authorization_ref: "approval-report.md#goal-acceptance"
accepted: 2026-07-26
round: 1
---

# core-component-selector-migration 验收报告

> 阶段：阶段 3（验收闭环）
> 验收日期：2026-07-26
> 关联方案 doc：`.codestable/features/2026-07-25-core-component-selector-migration/core-component-selector-migration-design.md`

## 1. 接口契约核对

对照方案第 2.1 节名词层，本 feature 的公开交接接口已经落盘。

**接口示例逐项核对**：
- [x] `ComponentMigrationLedger`：落在 `core-component-selector-migration-ledger.md`，按 Button/Form/Select/Dialog/Drawer/Modal/Dropdown/Tooltip/Popover/Table/Table2/Page/Layout 记录 SCSS、DOM query、token/scope、验证入口和剩余债务，符合方案示例。
- [x] `StableDomSelector`：落在 `packages/amis-core/src/theme.tsx#getStableClassName/getStableClassSelector`，并由 `amis-core/src/index.tsx` 导出；Dialog、Drawer、Modal、Form、Table 等调用方已改用 helper 或 theme `cx` 稳定主类。
- [x] `SelectorDependencyKind`：ledger 第 3 节按 `dom-query`、`scss-selector`、`legacy-props-passthrough`、`runtime-alias`、`editor-out-of-scope` 分类，覆盖 classPrefix 广义命中。
- [x] `ComponentTokenMapping`：目标 wave 未新增 token taxonomy；组件样式差异继续通过既有 token / `[data-amis-theme]` 作用域表达，未回退到主题前缀公共类。

**名词层“现状 → 变化”逐项核对**：
- [x] Theme Runtime 已默认输出 `.amis-*`，本项扩展到核心组件 SCSS、DOM 查询和 snapshots。
- [x] Stylesheet Build guard 被复用，没有新建平行 selector 数据源。
- [x] Overlay Scope 的前置能力被消费，Dialog/Tooltip/Select/Dropdown 相关验证通过。

**流程图核对**：
- [x] `确认依赖项已 done`：workflow-next 和 roadmap items 显示 `stylesheet-stable-selector-build`、`overlay-theme-scope-propagation` 均已完成。
- [x] `生成 migration ledger`：ledger 已落盘并纳入 evidence pack。
- [x] `按组件波次迁移 SCSS selector`：Wave A/B/C 目标 SCSS 已迁移，policy baseline 收窄到 1507。
- [x] `迁移同波次 DOM selector dependency`：policy 中 `classprefix-dom-selector` 为 0，review 补齐 Modal/Drawer close/stack 风险。
- [x] `运行 targeted tests + selector guard`：QA/DoD 记录的 stylelint、selector guard、Button/Dialog/Drawer/Tooltip/Select/DropDownButton/Table 均 passed。
- [x] `记录剩余 legacy 命中和退出条件`：ledger 第 5 节与 policy baseline 已作为 `legacy-prefix-teardown` 输入。

## 2. 行为与决策核对

**需求摘要逐项验证**：
- [x] 核心组件 DOM 主类名为 `.amis-*`：snapshots 和新增 Dialog/Drawer direct component tests 已验证 Modal/Drawer stack、overlay、content、close、outside-close 路径。
- [x] 目标 SCSS 从 `#{$ns}` 迁到稳定 selector：Wave A/B/C 文件在 ledger 中均为 done，selector guard 0 new violation。
- [x] DOM 查询不再拼主题前缀：Form feedback、Dialog/Drawer content、Modal header/root/stack、Drawer overlay/stack、VirtualTableBody root/fixed header/state 已改 stable helper。
- [x] 行为不变：Dialog/Drawer closeOnOutside、Tooltip、Select、DropDownButton、Table 相关 targeted suites 全部通过。

**明确不做逐项核对**：
- [x] 未迁移 editor/theme-editor helper、`.AMISCSSWrapper`、历史 schema 或 generated CSS；scope gate 未发现这些目录进入本 feature 实现范围。
- [x] 未删除 `classPrefix` 字段，未关闭 DOM-only `.cxd-*` alias，未执行 legacy-prefix-teardown。
- [x] 未新增 `.cxd-*` / `.antd-*` / `.dark-*` SCSS 兼容输出。
- [x] 未重构 Table/Select/Dialog/Drawer 业务结构。

**关键决策落地**：
- [x] 按迁移波次推进：checklist 7 个 step 全部 done，ledger 按 Wave A/B/C 归档。
- [x] `classPrefix` 依赖先分类再迁移：DOM selector dependency 已迁移，props passthrough/runtime alias/editor out-of-scope 保留并分类。
- [x] SCSS 和 TSX 成对验证：每个目标 wave 同时有 SCSS diff、TSX DOM selector diff、targeted tests 或 snapshots。
- [x] 优先复用 Stylesheet Build guard：`npm run check:theme-selectors --workspace amis-ui` 为核心 DoD。
- [x] 实现 admission 等待依赖 done：实现记录 S1 已写明依赖 gate 通过。

**挂载点反向核对（可卸载性）**：
- [x] `ComponentMigrationLedger`：删掉后 `legacy-prefix-teardown` 无法消费 1507 baseline 与分类，属于真实挂载点。
- [x] Core component SCSS selector migrations：目标文件 diff 均在 `packages/amis-ui/scss`，移除会让目标 wave 回退到主题前缀 selector。
- [x] Core renderer DOM query migrations：helper 调用集中在 `amis-core`/`amis`/`amis-ui` 目标路径，移除会恢复 classPrefix DOM 依赖。
- [x] Targeted tests / snapshots / selector guard evidence：QA、DoD、review 均直接引用这些证据；反向 grep 未发现清单外的本 feature 公共挂载点。
- [x] 拔除沙盘推演：按 ledger 回退 Wave A/B/C、helper 调用和 snapshots 后，本 feature 用户可见效果会消失；剩余 editor/helper/teardown 不会被误删除，说明边界可拆。

## 3. 验收场景核对

- [x] **S1 核心组件渲染输出 `.amis-*`**：
  - 证据来源：Jest DOM assertion / snapshots。
  - 结果：`button`、`Dialog`、`drawer`、`Tooltip`、`Select`、`DropDownButton`、`Table` suites passed。
- [x] **S2 SCSS / source grep 命中已迁移或有 ledger 解释**：
  - 证据来源：selector guard、DoD CMD-009/CMD-010、ledger。
  - 结果：1507 legacy baseline match(es)，0 new violation；目标 wave done，剩余命中进入 ledger/allowlist 分类。
- [x] **S3 Dialog/Drawer/Modal closeOnOutside、Select 下拉、Dropdown/Tooltip/Popover、Table 固定列/筛选/拖拽不变**：
  - 证据来源：targeted tests + review focus。
  - 结果：Dialog 12 tests / drawer 7 tests / Tooltip 9 tests / Select 31 tests / DropDownButton 10 tests / Table 49 tests passed。
- [x] **S4 主题差异不靠主题前缀组件类名**：
  - 证据来源：SCSS diff、token/scope 约束、selector guard。
  - 结果：目标 wave 使用 `.amis-*` 与 `[data-amis-theme]`，未新增 `.cxd-*` 公共选择器。
- [x] **S5 selector guard 无新增 legacy selector**：
  - 证据来源：DoD CMD-002。
  - 结果：`Theme selector guard passed: 1507 legacy baseline match(es), 0 new violation(s).`
- [x] **S6 反向核对不越界**：
  - 证据来源：scope gate、git diff、ledger 第 4 节。
  - 结果：editor/theme-editor、legacy alias、`classPrefix` 删除、generated CSS 均未纳入本 feature。

**review 报告重点复核**：
- [x] Modal/Drawer outside-close 与 stack class：review 发现后已修复，并由 `Dialog` / `drawer` suites 覆盖。
- [x] Table virtual scroll/fixed header：`VirtualTableBody` 已使用 stable helper，`Table` suite passed。
- [x] Select/ChainedSelect option custom style：Select suite 与 snapshots passed。
- [x] Dialog/Tooltip/DropDownButton 浮层 scope：对应 suites passed，Overlay Scope 前置已 accepted。
- [x] residual risk 已处理为验收遗留：self-review fallback、真实浏览器视觉 QA、剩余 legacy baseline 均不承载核心验收缺口。

**QA 报告重点复核**：
- [x] 验证证据来源：`core-component-selector-migration-qa.md`，status `passed`。
- [x] QA matrix 覆盖 design 关键场景、review QA focus、DoD commands、scope/evidence pack。
- [x] failed / blocked 项为 none。
- [x] Evidence pack、DoD Results、Scope Gate 已复核，均为 passed。

## 4. 术语一致性

- Component selector migration：代码与报告统一使用 stable selector / `.amis-*` 主路径，未引入第二套“主题前缀主路径”术语。
- Migration ledger：只落一个 ledger，并明确消费 selector policy，不另起 inventory。
- Stable component class：helper、SCSS、snapshots 均围绕 `.amis-*`；`.cxd-*` 仅作为 DOM-only legacy alias / 历史债务分类。
- Component/state token：本项没有新增 token taxonomy，继续承接 `token-contract-css-layers`。
- DOM selector dependency：已和 `legacy-props-passthrough` 区分，避免把全部 `classPrefix` 传参误删。
- 防冲突：`rg -n "\.\$\{[^}]*classPrefix[^}]*\}" ...` 无命中；剩余 `classPrefix` 广义命中均作为 passthrough / legacy / out-of-scope 债务处理。

## 5. 领域影响盘点（提示而非代写）

- 新名词候选：无需要新增到 `requirements/CONTEXT.md` 的术语。`amis-`、ThemeScope、DOM-only alias、token 化主题系统已由 ADR-001 和 roadmap 记录。
- 结构性选择候选：无新增 ADR。稳定选择器主路径、拒绝 SCSS/CSS legacy selector 双轨、DOM-only alias 评估边界均已在 ADR-001 / roadmap 中确定。
- 流程级约束候选：migration ledger 作为 `legacy-prefix-teardown` 输入已经由本 acceptance 和 roadmap 回写承接；不需要当前阶段代写 cs-domain。
- 建议：后续 `legacy-prefix-teardown` acceptance 可以把“不要把 classPrefix passthrough 当作 DOM selector debt 批量删除”沉淀为 keep/learning。

## 6. requirement delta / clarification 回写

- `related_requirements` 为空，本 feature 是 ADR-001 roadmap 下的内部迁移执行，不新增独立用户故事或能力边界。
- 用户可见心智变化已经由 roadmap 和 ADR-001 承载，本项只完成核心组件迁移，不在 acceptance 阶段自由改 requirement。
- 结论：无 requirement delta；无需写 approval-report 或 cs-req handoff。

## 7. roadmap 回写

- [x] `roadmap: theme-system-refactor` 与 `roadmap_item: core-component-selector-migration` 成对存在。
- [x] `.codestable/roadmap/theme-system-refactor/theme-system-refactor-items.yaml` 中 `core-component-selector-migration` 已从 `in-progress` 回写为 `done`。
- [x] `.codestable/roadmap/theme-system-refactor/theme-system-refactor-roadmap.md` 第 5 个子 feature 已同步为 `done`，对应 feature 填为 `2026-07-25-core-component-selector-migration`。
- [x] `.codestable/roadmap/theme-system-refactor/goal-state.yaml` 中当前 feature 已回写为 `accepted`，`current_feature_index` 推进到 4，下一项为 `editor-theme-helper-migration`。
- [x] YAML 校验与 workflow-next 复核在最终审计中记录。

## 8. attention.md 候选盘点

- 本 feature 未暴露新的编译、测试或环境注意事项需要写入 attention。
- 本轮用户已明确长期授权：独立 reviewer 无法启动时允许 local-only review fallback；该规则已经写入 `.codestable/attention.md`，本 acceptance 不重复追加。
- 其他知识出口：`classPrefix` passthrough 与 DOM selector debt 的区别建议后续通过 `cs-keep` 沉淀，当前不阻塞验收。

## 9. 遗留

- 后续优化点：`legacy-prefix-teardown` 消费 1507 legacy baseline，并谨慎区分 `classPrefix` props passthrough、runtime alias、DOM selector debt。
- 已知限制：本轮 code review 是 owner 授权的 `reviewer: self` fallback，独立 Task agent 和 OCR 均不可用；QA/acceptance 已通过更强 targeted command 与证据复核补偿。
- 已知限制：真实浏览器视觉层叠未做截图 QA；本轮核心证据来自 jsdom DOM assertions、snapshots、selector guard、stylelint 和 grep baseline。
- 顺手发现：`PopOver` closeOnOutside 的 `classPrefix` 用途被分类为 legacy behavior dependency，留给 teardown 评估，不在本项扩大处理。
- 范围外：editor/theme-editor helper、generated CSS、historical schema、legacy alias 默认策略仍由后续 roadmap item 处理。

## 10. 最终审计

- 验证证据来源：`core-component-selector-migration-qa.md`，status `passed`。
- Evidence sources：`core-component-selector-migration-evidence-pack.md`、`core-component-selector-migration-dod-results.json`、`core-component-selector-migration-scope-gate.json`、`core-component-selector-migration-evidence-pack-results.json`。
- 聚合命令：`npm run stylelint`、`npm run check:theme-selectors --workspace amis-ui`、`npm test --workspace amis -- button`、`Dialog`、`drawer`、`Tooltip`、`Select`、`DropDownButton`、`Table`、DoD grep、YAML 均在 DoD/QA 中 exit 0。
- 场景复核：re-verified 12 / trust-prior-verify 0，全部来自 QA/DoD 运行证据和 acceptance 复核。
- 交付物复核：代码 helper、组件 DOM selector、目标 SCSS、policy baseline、targeted tests/snapshots、ledger、review、QA、roadmap 状态均存在。
- 完整工作区复核：git status 中 dirty scope 均属于本 feature / roadmap state / packages target scope；未发现范围外生产实现。
- diff 清洁度：`git diff --check` passed；新增 debug output、临时 TODO/FIXME、注释掉代码、无用 import 未发现为本 feature 新增问题。
- 知识沉淀出口：attention 已有 local-only review fallback 授权；classPrefix debt 分类建议后续 `cs-keep`，不阻塞。
- 结论：通过。`core-component-selector-migration` 已满足 design、checklist、review、QA、DoD、roadmap 回写和 Goal acceptance 授权要求。
