---
doc_type: feature-goal-plan
feature: 2026-07-24-theme-runtime-button-pilot
status: ready-to-dispatch
created: 2026-07-24
---

# theme-runtime-button-pilot Goal Plan

## 1. 输入产物

- Feature: `2026-07-24-theme-runtime-button-pilot`
- Design: `.codestable/features/2026-07-24-theme-runtime-button-pilot/theme-runtime-button-pilot-design.md`
- Checklist: `.codestable/features/2026-07-24-theme-runtime-button-pilot/theme-runtime-button-pilot-checklist.yaml`
- Design review: `.codestable/features/2026-07-24-theme-runtime-button-pilot/theme-runtime-button-pilot-design-review.md`
- Roadmap item: `.codestable/roadmap/theme-system-refactor/theme-system-refactor-items.yaml` 中的 `theme-runtime-button-pilot`

## 2. 用户确认与授权

- Design 确认：owner 在 2026-07-24 明确回复“可以，通过了，继续吧”，design frontmatter 已更新为 `status: approved`。
- Design review：首轮独立 reviewer 工具失败后，owner 批准降级为 `local-only`；`theme-runtime-button-pilot-design-review.md` 已记录 `review_state: passed`。
- Goal acceptance 授权：owner 在 2026-07-24 明确回复“批准 goal-acceptance”；同目录 `approval-report.md` frontmatter 已记录 `approvals.goal-acceptance: approved`。
- 授权引用：`approval-report.md#goal-acceptance`。

确认 design 不等于 acceptance 授权；本 goal 包使用的是上面单独记录的 `goal-acceptance` 授权。

## 3. 实现目标

用 Button pilot 建立主题系统重构的最小闭环：

1. `ThemeInstance.classnames('Button')` 默认输出 `.amis-Button` / `.amis-Button--*`，不再由 `classPrefix: 'cxd-'` 决定组件身份。
2. `ThemeConfig.legacyDomClassAlias: 'cxd'` 显式开启后，Button DOM 同时包含 `.amis-*` 与 `.cxd-*`，仅作为 DOM-only 迁移 alias。
3. Root scope 容器输出 `data-amis-theme={themeName}`，并与 `env.theme`、ThemeContext 使用同一规范化主题名。
4. Button 最小样式路径证明 `.amis-Button` 能消费 scoped token，不新增 `.cxd-Button` 库 CSS selector。
5. 不扩展到全量组件、editor、overlay 或 SCSS/CSS legacy selector 双轨。

## 4. Checklist Steps

执行以 `theme-runtime-button-pilot-checklist.yaml` 为权威：

- S1 基线预检。
- S2 运行时契约。
- S3 Root 作用域。
- S4 Button 样式闭环。
- S5 DOM alias 验证。
- S6 范围守护。
- S7 收尾验证。

每个 step 完成后必须留下证据：命令输出、diff summary、测试断言或 selector grep。

## 5. TDD Policy

- 行为代码 step 默认 RED → GREEN → VERIFY。
- S2、S3、S5 是行为契约，必须先补失败测试或明确记录现有失败基线，再实现到 GREEN。
- S4 是样式 proof，优先用 targeted selector / grep / stylelint 证明；若无法先写 RED 测试，必须写 `TDD exception` 和替代证据。
- S1、S6、S7 是验证 / 守护 step，不要求 RED 测试，但必须有命令证据。

## 6. 必跑验证命令

以 checklist `dod.commands` 为机器权威：

- `npm test --workspace amis-core -- theme`
- `npm test --workspace amis -- button`
- `npm run typecheck`
- `npm run stylelint`
- `rg -n "\\.cxd-Button|#\\{\\$ns\\}Button|legacyDomClassAlias|componentClassPrefix|data-amis-theme" packages/amis-core packages/amis-ui packages/amis`

若某命令出现既有红灯，必须记录基线归因；核心命令不能无证据放行。

## 7. DoD / Gate Policy

- Implementation gate：checklist steps 全部完成，核心命令通过或有明确基线归因，清洁度规则满足。
- Code review gate：`cs-code-review` passed，无 unresolved blocking。
- QA gate：核心验收场景和必跑命令覆盖完成。
- Acceptance gate：读取 `goal-state.yaml` 中的 `approval-report.md#goal-acceptance`，核对同目录 `approval-report.md` 的 `approvals.goal-acceptance: approved`，再进入 `cs-feat` acceptance。

## 8. Handoff 条件

命中以下任一条件必须 handoff：

- 需要改变 approved design、feature 范围、公开契约或 roadmap item。
- 需要把 pilot 扩展到全量组件、editor、overlay 或 SCSS/CSS legacy selector 双轨。
- 独立 review / code review / QA 有 blocking，且同一失败项三轮修复仍不通过。
- 外部环境、依赖或凭证缺失导致核心行为无法判断。
- 用户主动要求暂停、改方向或终止。
