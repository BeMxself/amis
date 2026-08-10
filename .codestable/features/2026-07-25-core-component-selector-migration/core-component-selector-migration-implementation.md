---
doc_type: feature-implementation
feature: 2026-07-25-core-component-selector-migration
roadmap: theme-system-refactor
roadmap_item: core-component-selector-migration
status: ready-for-review
implemented: 2026-07-26
blocked_gate: null
---

# core-component-selector-migration 实现记录

## 1. Scope

本轮完成实现准入、selector 基线、migration ledger、DOM selector dependency 迁移，以及 Wave A/B/C 指定高覆盖 SCSS 的 stable selector 迁移。核心代码路径是 theme runtime 的 `classnames`：新增 stable class selector helper 后，DOM 查询、自定义样式 suffix 和测试断言都以 `.amis-*` 为默认主路径。

本轮没有迁移 editor/theme-editor helper，没有删除 `classPrefix` 字段，没有关闭 DOM-only `.cxd-*` alias，也没有进行 Table/Select/Dialog/Drawer 业务结构重构。

## 2. Step Evidence

| Step | 退出信号 | 证据 |
|---|---|---|
| S1 实现准入与基线 | items.yaml 依赖状态可证，baseline ledger 能解释当前核心组件命中 | `codestable-workflow-next.py feature --require-implementation-ready --json` 返回 `implementation_ready: true`，两个依赖 `stylesheet-stable-selector-build` / `overlay-theme-scope-propagation` 均为 `done`；`npm run check:theme-selectors --workspace amis-ui` 基线从 2233 开始；`rg -n -F '#{$ns}' ... | wc -l` 为 2076，广义 `classPrefix`/theme-prefix grep 为 362。 |
| S2 Migration ledger | 每个目标组件都有 SCSS、DOM query、token、测试入口和未迁移状态 | 新增 `core-component-selector-migration-ledger.md`，按 Button/Form/Select/Dialog/Drawer/Modal/Dropdown/Tooltip/Popover/Table/Table2/Page/Layout 记录 SCSS 剩余、DOM query 状态、token/scope 状态、验证入口和后续 wave。 |
| S3 Wave A | Button/Form targeted tests 或 snapshots 证明 DOM class 与样式路径稳定 | Button、ButtonGroup、Button mixin、Form basics SCSS 已迁到 `.amis-*`；`npm test --workspace amis -- button`、`npm test --workspace amis -- Select` 通过。 |
| S4 Wave B | Dialog/Tooltip/Select/DropDownButton targeted tests 通过，selector guard 无新增 legacy 命中 | Dialog/Drawer/Modal、Dropdown/Tooltip/Popover/Popoverable、Select SCSS 与 DOM selector dependency 已迁移；本地 review 补齐 Modal/Drawer outside-close 与 stack class 稳定类路径；`Dialog`、`drawer`、`Tooltip`、`Select`、`DropDownButton` 测试通过。 |
| S5 Wave C | Table/Table2/Page/Layout targeted snapshots 或测试通过，DOM query 不依赖主题前缀 | Table/Table2/Page/Layout SCSS 已迁到 `.amis-*`，`VirtualTableBody` DOM 查询使用 stable helper；`npm test --workspace amis -- Table` 通过。 |
| S6 剩余命中分类与反向核对 | 剩余命中均有分类、owner 和退出条件，无未解释 `.cxd-*` / `#{$ns}` 新增 | policy baseline 收窄到 1507；目标 wave 文件除 `_form.scss` 一条 docs-historical 注释外无剩余命中；editor/helper、alias、classPrefix 字段删除均未触碰。 |
| S7 验证与交接 | 命令输出、ledger 和剩余 legacy 命中说明均可供 legacy-prefix-teardown 直接消费 | `stylelint`、selector guard、Button/Dialog/Tooltip/Select/DropDownButton/Table tests、grep baseline、YAML、diff check 均已形成 evidence。 |

## 3. Implementation Details

- `packages/amis-core/src/theme.tsx`：新增 `getStableClassName` 与 `getStableClassSelector`，从现有 `classnames` 返回值中取稳定主类；legacy alias 开启时仍优先 `.amis-*`。
- `packages/amis-core/src/index.tsx`：导出 stable selector helper，供 `amis` 与 `amis-ui` 使用。
- `packages/amis-core/__tests__/theme.test.ts`：补充 legacy alias 场景下 helper 仍返回 `.amis-Modal-content` 的单测。
- `packages/amis-core/src/renderers/Form.tsx`：`Form-feedback` 查询迁到 `getStableClassSelector`。
- `packages/amis/src/renderers/Dialog.tsx`：`Modal-content` 查询迁到 `getStableClassSelector`。
- `packages/amis/src/renderers/Drawer.tsx`：`Drawer-content` 查询迁到 `getStableClassSelector`。
- `packages/amis/src/renderers/Table/VirtualTableBody.tsx`：Table root/fixed header selector 与 auto fill state class 迁到 stable helper。
- `packages/amis-ui/src/components/Modal.tsx`：draggable handle、outside-close root match 和 stack class 迁到 stable helper。
- `packages/amis-ui/src/components/Drawer.tsx`：root/overlay/content/close class、outside-close overlay match 和 stack class 迁到 stable helper / theme classnames。
- `packages/amis/src/renderers/Form/Select.tsx`、`ChainedSelect.tsx`：Select wrapper DOM class 和 CustomStyle option suffix 迁到 stable class path，保留 `classPrefix` 透传给尚未 teardown 的内部边界。
- `packages/amis-ui/scss/components/_button.scss`、`_button-group.scss`、`form/_form.scss`、`form/_select.scss`、`_modal.scss`、`_drawer.scss`、`_dropdown.scss`、`_tooltip.scss`、`_popover.scss`、`_popoverable.scss`、`_table.scss`、`_table2.scss`、`_page.scss`、`layout/_layout.scss`：目标 wave SCSS selector 从 `#{$ns}` 迁到 `.amis-*`。
- `packages/amis-ui/scss/_mixins.scss`：Button icon/loading/link 相关 mixin selector 迁到 `.amis-Button*`，其他非目标组件债务保留。
- `packages/amis-ui/scripts/theme-selectors/policy.json`：基线从 2233 收窄到 1507，避免已删除 selector 未来被重新引入。
- `packages/amis/__tests__/**`：mandatory suites 中默认 DOM 主路径断言和快照更新为 `.amis-*`。

## 4. Commands

通过：

- `PYTHONPATH=/Users/songmingxu/Projects/gold-market/.venv/lib/python3.13/site-packages python3 /Users/songmingxu/.agents/skills/cs-onboard/tools/codestable-workflow-next.py feature --feature .codestable/features/2026-07-25-core-component-selector-migration --require-implementation-ready --json`
- `npm run check:theme-selectors --workspace amis-ui` -> 第一轮 2233，通过；DOM selector、target SCSS 和 Button mixin 迁移并更新 policy 后当前基线 1507。
- `npm test --workspace amis-core -- theme`
- `npm run stylelint`
- `npm test --workspace amis -- button`
- `npm test --workspace amis -- Dialog`
- `npm test --workspace amis -- drawer`
- `npm test --workspace amis -- Tooltip`
- `npm test --workspace amis -- Select`
- `npm test --workspace amis -- DropDownButton`
- `npm test --workspace amis -- Table`
- `python3 /Users/songmingxu/.agents/skills/cs-onboard/tools/validate-yaml.py --file .codestable/features/2026-07-25-core-component-selector-migration/core-component-selector-migration-checklist.yaml --yaml-only`
- `rg -n "\.\$\{[^}]*classPrefix[^}]*\}" packages/amis-core/src packages/amis/src packages/amis-ui/src packages/amis-editor-core/src packages/amis-theme-editor-helper/src` -> exit 1，无命中。
- `git diff --check`

基线记录：

- `rg -n -F '#{$ns}' packages/amis-ui/scss/components packages/amis-ui/scss/_mixins.scss | wc -l` -> 1409。
- `rg -n "\.cxd-|\.antd-|\.dark-|classPrefix" packages/amis-core/src packages/amis-ui/src packages/amis/src packages/amis-ui/scss | wc -l` -> 349。

## 5. Cleanliness

- 未新增 debug output。
- 未新增临时 TODO / FIXME / XXX。
- 未注释掉旧代码。
- 未修改 editor/theme-editor helper、历史 schema 或 generated CSS。
- 未新增 `.cxd-*` SCSS/CSS legacy selector。
- 本轮新增 helper 复用现有 theme runtime，不创建平行主题机制。

## 6. Next Steps

- 进入 implementation.before_review gates：scope gate、DoD runner、evidence pack。
- code review 需要确认测试快照更新全部来自默认 DOM 主路径切到 `.amis-*`，不是业务结构变化。
- legacy-prefix-teardown 可消费本 ledger 的 1507 剩余 baseline 和分类。
