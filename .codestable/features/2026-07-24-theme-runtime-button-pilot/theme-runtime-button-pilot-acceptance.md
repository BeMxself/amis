---
doc_type: feature-acceptance
feature: 2026-07-24-theme-runtime-button-pilot
status: passed
audit_state: completed
audit_reason: ""
auditor_id: ""
acceptance_authorization_ref: "approval-report.md#goal-acceptance"
accepted: 2026-07-25
round: 1
---

# theme-runtime-button-pilot 验收报告

> 阶段：阶段 3（验收闭环）
> 验收日期：2026-07-25
> 关联方案 doc：`.codestable/features/2026-07-24-theme-runtime-button-pilot/theme-runtime-button-pilot-design.md`

## 1. 接口契约核对

- [x] `ThemeScope` / `ThemeScopeProps`：`packages/amis-core/src/theme.tsx` 暴露 `data-amis-theme`、selector、token scope selector，符合 design 2.1。
- [x] `ThemeConfig.componentClassPrefix`：稳定前缀固定为 `amis-`，默认主题和 `cxd` 主题均配置默认值。
- [x] `ThemeConfig.legacyDomClassAlias`：类型限制为 `false | 'cxd'`，只在显式开启时追加 DOM alias。
- [x] `makeStableClassnames()` / `getTheme()`：默认输出 `.amis-*`；alias 开启时输出 stable + legacy DOM alias；`:Token` escape 不加前缀。
- [x] `getThemeScopeProps()` / `ThemeScopeRoot`：Root children 外层输出 `data-amis-theme="cxd"`。

## 2. 行为与决策核对

- [x] 需求摘要：Button 默认 DOM 包含 `.amis-Button`，不包含 `.cxd-Button`；证据见 QA-001 / QA-003。
- [x] alias 决策：`.cxd-*` 只作为 DOM-only 迁移 alias；Button 组件没有手写 alias，SCSS 不新增 `.cxd-Button`。
- [x] Root source-of-truth：`normalizeThemeName()` 驱动 `env.theme`、`ThemeContext` 和 Root DOM attribute。
- [x] 缓存纪律：`theme()` 更新 `legacyDomClassAlias` 后，`getTheme('cxd').classnames` 按配置 key 重建。
- [x] 明确不做：未触碰 editor/theme-editor、overlay propagation、全量组件 SCSS 迁移或 IE11 动态 token 承诺。
- [x] 挂载点反向核对：新增挂载点仅在 Theme Runtime、Root scope、Button 最小 style proof 与目标测试；`git diff --name-only` 未出现范围外实现文件。

## 3. 验收场景核对

- [x] 默认稳定类名：`npm test --workspace amis-core -- theme` 与 `npm test --workspace amis -- button` 均通过。
- [x] modifier 保持语义：Button render test 覆盖 default / primary / size-sm；DropDownButton 和 ButtonGroup 目标测试通过。
- [x] Root 主题作用域：Button render test 与 snapshots 均记录 `data-amis-theme="cxd"`。
- [x] alias 显式开启：`theme.test.ts` 与 Button alias test 断言 `.amis-Button cxd-Button`、modifier stable + legacy alias 同时存在。
- [x] alias 默认关闭：默认 Button test 断言不含 `.cxd-Button`。
- [x] 样式边界：selector grep 显示 `_button.scss` 只有 `[data-amis-theme='cxd']` 与 `.amis-Button`，无新增 `.cxd-Button` 库 selector。
- [x] QA 报告复核：`.codestable/features/2026-07-24-theme-runtime-button-pilot/theme-runtime-button-pilot-qa.md` 为 `status: passed`，failed / blocked 为 none。

## 4. 术语一致性

- 主题作用域：`.codestable/requirements/CONTEXT.md` 已定义，代码使用 `ThemeScope` / `data-amis-theme`。
- 稳定组件类名：`.codestable/requirements/CONTEXT.md` 与 ADR-001 已确认 `amis-`，代码使用 `componentClassPrefix: 'amis-'`。
- Legacy DOM 类名别名：CONTEXT 与 ADR-001 已定义 DOM-only 迁移边界；代码实现为 `legacyDomClassAlias: false | 'cxd'`。
- 防冲突 grep：本 feature 未新增 `.antd-*` / `.dark-*` selector，也未新增 `.cxd-Button` 库 SCSS selector。

## 5. 领域影响盘点

- [x] 新名词：无新增。design 提到的“主题作用域 / 稳定组件类名 / Legacy DOM 类名别名”已在 `.codestable/requirements/CONTEXT.md` 存在。
- [x] 结构性选择：无新增 ADR。ADR-001 已覆盖 `amis-`、ThemeScope、DOM-only alias、IE11 静态降级边界。
- [x] 流程级约束：Root scope 不覆盖 overlay / portal 已作为后续 `overlay-theme-scope-propagation` roadmap 项保留，不在本 feature 写新 ADR。

## 6. requirement delta / clarification 回写

- 本 feature 是 ADR-001 和 roadmap 的第一条实现闭环，没有新增用户可见 requirement 边界。
- 实际 requirement 路径为 `.codestable/requirements/CONTEXT.md` / `.codestable/requirements/adrs/001-tokenized-theme-system.md`；内容已覆盖本 feature 术语和决策。
- 结论：无 requirement delta；不需要 `cs-req` handoff。

## 7. roadmap 回写

- [x] `.codestable/roadmap/theme-system-refactor/theme-system-refactor-items.yaml` 中 `theme-runtime-button-pilot` 已从 `in-progress` 更新为 `done`，`feature: 2026-07-24-theme-runtime-button-pilot` 保持一致。
- [x] `.codestable/roadmap/theme-system-refactor/theme-system-refactor-roadmap.md` 第 5 节同步为 `状态：done`、对应 feature 指向本目录。
- [x] YAML 校验：`js-yaml` 读取 `theme-system-refactor-items.yaml` 与 checklist 成功，输出 `yaml ok`。

## 8. attention.md 候选盘点

- 本 feature 未暴露需要补入 `.codestable/attention.md` 的新通用环境规则。
- 可复用经验已记录在 review / QA residual risk：typecheck 基线红灯、local-only review 降级、overlay scope 延后边界。
- 对外 docs / API 参考更新属于后续 `theme-system-validation-docs-rollout`，本 feature 不提前写。

## 9. 遗留

- 后续优化点：`overlay-theme-scope-propagation` 负责 portal / overlay scope；`stylesheet-stable-selector-build` 和 `core-component-selector-migration` 负责全量 selector / SCSS 迁移。
- 已知限制：`npm run typecheck` 仍为全仓库基线红灯，错误集中在 editor/schema/table/scripts 等非本 feature 触碰文件。
- 实现阶段顺手发现：历史 `.cxd-Button` 测试查询和 `_condition-builder.scss` 旧 selector 仍存在，已归入后续 roadmap。

## 10. 最终审计

- 验证证据来源：`theme-runtime-button-pilot-qa.md`。
- Evidence sources：`theme-runtime-button-pilot-implementation.md`、`theme-runtime-button-pilot-review.md`、`theme-runtime-button-pilot-qa.md`、`approval-report.md#goal-acceptance`。
- 聚合命令：`npm test --workspace amis-core -- theme` exit 0；`npm test --workspace amis -- button` exit 0；`npm run stylelint` exit 0；selector grep exit 0；`npm run typecheck` exit 1 baseline；`git diff --check` exit 0；YAML 校验 exit 0。
- 场景复核：re-verified 8 / trust-prior-verify 0。
- 交付物复核：Theme Runtime、Root scope、Button style proof、runtime tests、Button render tests、review、QA、roadmap writeback 均已落盘。
- 完整工作区复核：`git status --short` 仅显示本 feature 代码、测试、roadmap 和 feature package 文件；无 staged diff。
- diff 清洁度：通过；touched files 无 `console.log` / `TODO` / `FIXME` / `XXX` 命中。
- 知识沉淀出口：CONTEXT / ADR 已存在；无 attention 新候选；后续 docs 由 roadmap 收口项处理。
- 结论：通过。Goal acceptance authorization 已机械核验，feature 可标记 `stage: complete` / `status: passed`。
