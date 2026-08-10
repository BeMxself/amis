---
doc_type: feature-acceptance
feature: 2026-07-25-stylesheet-stable-selector-build
status: passed
audit_state: not-started
audit_reason: ""
auditor_id: ""
acceptance_authorization_ref: "approval-report.md#goal-acceptance"
accepted: 2026-07-26
round: 1
---

# stylesheet-stable-selector-build 验收报告

> 阶段：阶段 3（验收闭环）
> 验收日期：2026-07-26
> 关联方案 doc：`.codestable/features/2026-07-25-stylesheet-stable-selector-build/stylesheet-stable-selector-build-design.md`

## 1. 接口契约核对

**接口示例逐项核对**：

- [x] `amis-component($name)`：输入 `Button` → 输出 `.amis-Button` 包裹内容；实际落点 `packages/amis-ui/scss/_stable-selectors.scss` 与 `_button.scss` 一致。
- [x] `amis-theme($theme)`：输入 `cxd` → 输出 `[data-amis-theme='cxd']` 包裹内容；Button proof 输出语义保持一致。
- [x] `amis-themed-component($theme, $name)`：输入 `cxd` / `GuardFixture` → 输出 `[data-amis-theme='cxd'] .amis-GuardFixture`；good fixture 验证不触发 legacy guard。

**名词层“现状 → 变化”逐项核对**：

- [x] Stable selector helper：新增 `packages/amis-ui/scss/_stable-selectors.scss`，只生成 `.amis-*` 与 `[data-amis-theme]` 公共路径。
- [x] Selector inventory / allowlist：新增 `packages/amis-ui/scripts/theme-selectors/policy.json`，记录 2233 个 baseline match、分类、owner、退出条件和 scan 规则。
- [x] Selector guard：新增 `packages/amis-ui/scripts/checkThemeSelectors.js` 与 `packages/amis-ui/package.json` 的 `check:theme-selectors`。
- [x] Classification taxonomy：policy 中包含 `public-forbidden`、`migration-target`、`internal-legacy`、`dom-alias-generated`、`docs-historical`、`generated-artifact` 六类。

**流程图核对**：

- [x] scan current selectors → policy baseline：由 `checkThemeSelectors.js --update` 生成并落盘为 `policy.json`。
- [x] define allowlist / forbidden policy → guard command：默认 guard 比对当前扫描和 policy entries，新增未分类命中失败。
- [x] add stable SCSS helper → verify fixtures：helper 被 `_components.scss` 引入，good / bad fixture 覆盖正反例。
- [x] handoff to component migration：implementation 第 7 节和 roadmap 回写明确后续迁移消费 `migration-target` entries。

## 2. 行为与决策核对

**需求摘要逐项验证**：

- [x] 建立 SCSS helper：`_stable-selectors.scss` 已新增，Button proof 已改用 helper。
- [x] 建立 selector inventory / allowlist：`policy.json` 为机器可读，summary 为 2233 baseline match。
- [x] 建立 guard：`npm run check:theme-selectors --workspace amis-ui` exit 0；bad fixture exit 1。
- [x] 阻止新增旧 selector：guard 用 `scan/file/pattern/text/count` 比对基线，新增未分类命中会形成 violation。

**明确不做逐项核对**：

- [x] 不批量迁移 Form / Select / Dialog / Table / Dropdown / Tooltip / Popover 等核心组件：diff 只触碰 Button proof 和新 helper / guard。
- [x] 不重写 `_mixins.scss`：无该文件 diff。
- [x] 不输出 `.cxd-*` SCSS/CSS legacy selector 双轨：helper 不包含 `.cxd-*` 输出，bad fixture 仅用于负向验证。
- [x] 不迁移 editor/theme-editor helper：`packages/amis-theme-editor-helper` 与 `packages/amis-editor-core` 无本轮 diff。
- [x] 不改变 DOM-only `.cxd-*` alias 策略：本轮只做 inventory/guard，不改 runtime alias。

**关键决策落地**：

- [x] 先建 guard，再做批量迁移：当前 feature 只锁 baseline 和新增失败规则，后续迁移删除 entries。
- [x] SCSS helper 只输出新公共路径：`amis-component` / `amis-theme` / `amis-themed-component` 均不输出 legacy prefix。
- [x] inventory 分类先行：policy entries 已按 migration/internal/docs 分类；空类仍保留 owner / exit condition。
- [x] guard 用脚本而非塞进 stylelint：新增 Node 脚本，stylelint 保持基础 SCSS 检查。
- [x] editor 命中先纳入 inventory：editor/theme-editor 命中归入 `internal-legacy`，未在本项迁移。

**挂载点反向核对（可卸载性）**：

- [x] helper 挂载点：`_components.scss` import + `_button.scss` proof + good fixture。
- [x] inventory / allowlist 挂载点：`packages/amis-ui/scripts/theme-selectors/policy.json`。
- [x] guard command 挂载点：`packages/amis-ui/scripts/checkThemeSelectors.js` 和 `packages/amis-ui/package.json`。
- [x] CodeStable artifact 挂载点：design / checklist / implementation / review / QA / acceptance / roadmap state。
- [x] 反向核查：本轮 diff 引入的 selector 工具均落在上述清单内；没有额外运行时路径。
- [x] 拔除沙盘推演：移除 guard 脚本 / policy / package script 会移除自动检查；移除 helper 文件与 import 会移除稳定 selector 写法；留下的旧债由后续迁移项处理。

## 3. 验收场景核对

- [x] 当前仓库 selector 扫描 → inventory 分类：`npm run check:theme-selectors --workspace amis-ui` 返回 2233 legacy baseline match、0 new violation。
- [x] 新增 `.cxd-Foo` 或 `#{$ns}` bad selector → guard 失败：bad fixture exit 1，列出 `.#{$ns}GuardFixture` 和 `.cxd-GuardFixture`。
- [x] 既有 allowlist 命中 → guard 通过：默认 guard 读取 policy baseline 并通过。
- [x] stable helper 写 `.amis-Foo` / `[data-amis-theme] .amis-Foo` → guard 通过：good fixture exit 0。
- [x] Button pilot `.amis-Button` proof 不误判：`_button.scss` 的 `.amis-Button` 改为 helper，guard 通过。
- [x] 反向核对：未批量迁移核心组件、未迁移 editor/helper、未新增 SCSS `.cxd-*` 兼容输出。

**review 报告重点复核**：

- [x] review 第 5 节 QA focus 已覆盖：默认 guard、good fixture、bad fixture、build runner warning 均已在 QA 报告记录。
- [x] review 第 6 节 residual risk 已处理：local-only 已授权，`--update` policy 风险列入 residual，build runner warning 列入 residual。

**QA 报告重点复核**：

- [x] 验证证据来源：`.codestable/features/2026-07-25-stylesheet-stable-selector-build/stylesheet-stable-selector-build-qa.md`，status passed。
- [x] Feature type: non-functional，替代证据理由合理，不需要 browser / e2e。
- [x] failed / blocked 项为 none。
- [x] residual-risk 不包含核心验收缺口。
- [x] Evidence pack、DoD Results、Gate Results 已复核，blocking DoD 均有 pass evidence 或已记录 build runner baseline。

## 4. 术语一致性

- StableSelector / stable selector helper：design、implementation、review、QA、roadmap 均指向 `.amis-*` 与 `[data-amis-theme]`，一致。
- Selector inventory / allowlist / guard：policy、script、package script、报告命名一致。
- 禁用方向：没有新增 `.cxd-*` 作为公共 SCSS/CSS API；bad fixture 是测试数据，不是库输出路径。
- `classPrefix`：本轮只作为 inventory scan 对象，不改变运行时语义。

## 5. 领域影响盘点

- 新名词候选：StableSelector / SelectorInventory 已在 `.codestable/requirements/CONTEXT.md` 的“稳定组件类名”和 ADR-001 中覆盖到概念层；本 feature 的 helper / guard 属于 roadmap 执行术语，不需要改 CONTEXT。
- 结构性选择候选：selector guard + policy baseline 是 ADR-001 Stylesheet Build 的执行层细化，不新增替代 ADR。
- 流程级约束候选：design 2.5 明确建议沉淀 convention：新增主题组件样式必须使用 stable selector helper 或 `.amis-*` / `[data-amis-theme]` 公共路径，新增 `#{$ns}` / `.cxd-*` 选择器必须被 guard 拒绝。该候选已登记，后续可用 `cs-keep` 归档为 compound convention。

## 6. requirement delta / clarification 回写

- 无 requirement delta。`.codestable/requirements/CONTEXT.md` 已有“主题作用域”“稳定组件类名”“Legacy DOM 类名别名”等概念，ADR-001 已接受双通道主题系统；本 feature 不改变用户视角能力边界，只落 Stylesheet Build 执行层工具。

## 7. roadmap 回写

- [x] `.codestable/roadmap/theme-system-refactor/theme-system-refactor-items.yaml` 中 `stylesheet-stable-selector-build` 已从 `in-progress` 改为 `done`。
- [x] `.codestable/roadmap/theme-system-refactor/theme-system-refactor-roadmap.md` 第 3 项已改为 `done`，对应 feature 指向 `2026-07-25-stylesheet-stable-selector-build`。
- [x] `.codestable/roadmap/theme-system-refactor/goal-features/stylesheet-stable-selector-build.md` 已改为 `accepted`。
- [x] `.codestable/roadmap/theme-system-refactor/goal-state.yaml` 已把本 feature 改为 `accepted`，`current_feature_index` 推进到 3。

## 8. attention.md 候选盘点

- 已处理候选：owner 明确要求“以后只要不能启动独立 reviewer 的情况都不要再问了，永远允许 local-only review”，已写入 `.codestable/attention.md`，后续 CodeStable review gate 可直接恢复该项目规则。
- 其他候选：build runner 在 `created lib` / `created esm` 后不自然退出已在 evidence / QA / acceptance residual 记录；是否沉淀为全局 attention 可在后续 milestone 收口时统一整理。

## 9. 遗留

- 后续优化点：`--update` 是 policy baseline 维护入口，后续任何 policy diff 必须继续被 review/QA 复核。
- 已知限制：policy baseline 中 2233 个 legacy match 不在本 feature 逐条清除，后续 `core-component-selector-migration` / `editor-theme-helper-migration` 逐步删除。
- 实现阶段顺手发现：`_mixins.scss` 后续可能需要专项拆分；大量 `classPrefix` 是组件传参或运行时行为，后续迁移必须逐类判断。

## 10. 最终审计

- Review: `stylesheet-stable-selector-build-review.md` status passed，reviewer self，local-only 授权已落盘。
- QA: `stylesheet-stable-selector-build-qa.md` status passed，核心 guard / fixture / stylelint / build / YAML / diff clean 证据已记录。
- Checklist: steps 全 done，checks 全 passed。
- Commands re-verified: `npm run check:theme-selectors --workspace amis-ui`、good fixture、bad fixture、`npm run stylelint`、`npm run build --workspace amis-ui` 到 `created lib` / `created esm`、YAML 校验、`git diff --check`。
- Scope: diff 限于 helper、Button proof、guard script、policy/fixtures、package script、CodeStable artifact、roadmap state 和 `.codestable/attention.md` 授权规则。
- Residual risks: build runner 不自然退出、policy `--update` 维护入口、local-only review 降级；均非当前 feature 核心验收缺口。
- Verdict: passed。
