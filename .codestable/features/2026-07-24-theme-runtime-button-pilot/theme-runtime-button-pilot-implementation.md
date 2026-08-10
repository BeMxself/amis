---
doc_type: feature-implementation
feature: 2026-07-24-theme-runtime-button-pilot
status: passed
implemented: 2026-07-25
---

# theme-runtime-button-pilot 实现证据

## 1. 实现摘要

- 在 `packages/amis-core/src/theme.tsx` 建立 `ThemeScope`、`getThemeScope()`、`getThemeScopeProps()`、`makeStableClassnames()`、`normalizeThemeName()`。
- `ThemeInstance.classnames` 默认输出稳定 `.amis-*`；`legacyDomClassAlias: 'cxd'` 只在显式开启时追加 DOM-only `.cxd-*` alias。
- `theme()` 更新 `legacyDomClassAlias` 后，后续 `getTheme('cxd').classnames` 会按配置 key 重建，不保留旧缓存。
- `Root` 新增 `ThemeScopeRoot`，在 renderer 初始 children 外层输出 `data-amis-theme="cxd"`，现有 `addRootWrapper` 的相对包裹顺序保持不变。
- Button 组件本身未手写 alias，继续消费注入的 `classnames`。
- Button SCSS 只新增 `.amis-Button` + `[data-amis-theme='cxd']` 的最小 token proof，不新增 `.cxd-Button` 库 CSS selector。

## 2. TDD 证据

- RED：新增 `packages/amis-core/__tests__/theme.test.ts` 后，`npm test --workspace amis-core -- theme` 失败，原因是缺 `getThemeScope` / `makeStableClassnames` 且默认仍输出 `cxd-Button`。
- RED：新增 Button DOM 断言后，`npm test --workspace amis -- button` 失败，原因是 Root 无 `data-amis-theme` 且 Button DOM 仍无 `.amis-Button`。
- GREEN：实现运行时、Root scope、Button 样式 proof，并更新目标测试选择器与 snapshots 后，两条 targeted test 均通过。

## 3. 变更范围

- Runtime：`packages/amis-core/src/theme.tsx`、`packages/amis-core/src/index.tsx`。
- Root scope：`packages/amis-core/src/Root.tsx`。
- 样式 proof：`packages/amis-ui/scss/components/_button.scss`。
- 测试与快照：`packages/amis-core/__tests__/theme.test.ts`、Button / DropDownButton / ButtonGroup 相关目标测试和 snapshots。
- 未触碰 `packages/amis-editor/**`、theme-editor、overlay 传播实现或其他组件迁移实现。

## 4. 验证命令

| 命令 | 结果 | 说明 |
|---|---|---|
| `npm test --workspace amis-core -- theme` | passed | 4 tests passed；覆盖 stable classnames、ThemeScope、escape 语义、alias 缓存失效。 |
| `npm test --workspace amis -- button` | passed | 5 suites / 19 tests / 20 snapshots passed；覆盖 Root scope、默认 Button DOM、alias DOM、相关 Button 选择器。 |
| `npm run stylelint` | passed | SCSS 风格检查通过。 |
| `rg -n "\\.cxd-Button|#\\{\\$ns\\}Button|legacyDomClassAlias|componentClassPrefix|data-amis-theme" packages/amis-core packages/amis-ui packages/amis` | completed | 新增命中集中在 runtime 字段、测试、snapshots 和 `.amis-Button` proof；未新增 `.cxd-Button` SCSS selector。既有命中包括 `packages/amis-ui/scss/components/_condition-builder.scss` 的历史 `.cxd-Button` 和若干旧测试查询。 |
| `npm run typecheck` | failed-baseline | 错误集中在既有 editor/schema/table/scripts 类型问题，如 `amis-editor/src/plugin/Form/*`、`ValidationControl.tsx`、`scripts/build-schemas.ts`；未出现本次触碰文件的新增错误。 |

## 5. 范围守护结论

- `.cxd-*` 兼容层没有进入 SCSS/CSS；alias 只存在于 Theme Runtime 的显式 DOM 输出路径和测试断言。
- Button 以外的组件没有新增迁移实现；测试 snapshots 中出现的 `.amis-*` 是全局 `classnames` 主路径变化的可观察结果。
- Overlay / portal 仍按 roadmap 后续项处理；本次 Root scope 只覆盖 Root renderer 子树。
- IE11 动态 token 切换未新增承诺。

## 6. 实现 Gate 结论

Implementation gate 通过。保留一个非本 feature 引入的全局 typecheck 基线红灯，后续 code review / QA 应复核该红灯是否仍可作为既有环境 / 历史类型债记录，而不是扩大本 pilot 去修 editor 或 schema build。
