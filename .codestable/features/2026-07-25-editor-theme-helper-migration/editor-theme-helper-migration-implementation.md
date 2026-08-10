---
doc_type: feature-implementation
feature: 2026-07-25-editor-theme-helper-migration
roadmap: theme-system-refactor
roadmap_item: editor-theme-helper-migration
status: ready-for-review
implemented: 2026-07-26
blocked_gate: null
---

# editor-theme-helper-migration 实现记录

## 1. Scope

本轮把 editor preview 与 theme-editor helper 的主题身份从 `.cxd-*` / `.AMISCSSWrapper` 迁到 ThemeScope、`[data-amis-theme]` 和 stable `.amis-*` 路径。四条验收线均已覆盖：generated CSS、preview scope、historical schema migration、helper SCSS inventory。

本轮没有删除 `.AMISCSSWrapper` 容器别名，没有实现 SCSS/CSS legacy selector 双轨兼容，没有提前执行 `legacy-prefix-teardown`，也没有迁移 core component SCSS。

## 2. Step Evidence

| Step | 退出信号 | 证据 |
|---|---|---|
| S1 实现准入与基线 | 三项前置依赖已 done，基线覆盖四类范围 | roadmap items 显示 `token-contract-css-layers`、`stylesheet-stable-selector-build`、`overlay-theme-scope-propagation` 均 `done`；`rg` 基线覆盖 generated CSS、preview scope、historical schema、helper SCSS。 |
| S2 Helper SCSS inventory | 每个保留命中有分类、owner 和退出条件 | 新增 `editor-theme-helper-migration-helper-scss-inventory.md`；28 个文件、78 处 helper/editor 命中均已分类。 |
| S3 Generated CSS migration | generated CSS fixture 不含 `.cxd-`，custom Button/size 走 stable selector | `ParseThemeData` 新增 `ThemeCssGenerationOptions` / `GeneratedThemeCss`，custom Button selector 生成 `[data-amis-theme] .amis-Button--*`；`ParseThemeData.test.ts` 通过。 |
| S4 Preview scope migration | preview / iframe DOM 能观察 `data-amis-theme`，CSS var 读取不只依赖 `.AMISCSSWrapper` | 新增 `themeScope.ts`；`Preview`、`IFramePreview`、`ScaffoldModal`、`RightPanels` 写入 `data-amis-theme`；`getAllCssVar()` 读取 `[data-amis-theme]` scope；`themeScope.test.ts` 通过。 |
| S5 Historical schema migration | 旧 style/themeCss fixture 输出 stable themeCss 或 warning | `clearDirtyCssKey()` 删除旧 selector key 时记录 migration warning；`themeCssMigration.test.ts` 覆盖 `JSONPipeIn` 旧 schema fixture。 |
| S6 范围收口与 guard | 无未分类 `.cxd-*` 新增，剩余命中可交给后续项 | `npm run check:theme-selectors --workspace amis-ui` 通过，1503 legacy baseline / 0 new violation；`rg` 基线已记录。 |
| S7 交接材料 | acceptance 可从四条线核验 | implementation、inventory、DoD results 均已落盘，等待 review / QA / acceptance。 |

## 3. Implementation Details

- `packages/amis-theme-editor-helper/src/helper/ParseThemeData.ts`：新增 `ThemeCssGenerationOptions`、`GeneratedThemeCss`、`getGeneratedCss()` 和 migration warning；custom Button / size selector 从 legacy `.cxd-*` 生成路径迁到 `[data-amis-theme] .amis-Button--*`。
- `packages/amis-editor-core/src/themeScope.ts`：新增 editor 专用 ThemeScope helper，保留 raw custom theme key，避免通过 `getThemeScope('dark')` 被默认主题归一化。
- `packages/amis-editor-core/src/component/Preview.tsx`：preview root 写入 `data-amis-theme`，并把 `env.theme` 解析为 editor scope 名。
- `packages/amis-editor-core/src/component/IFramePreview.tsx`：iframe body、`.ae-IFramePreview` 和 `.ae-PageWrapper` 写入 `data-amis-theme`。
- `packages/amis-editor-core/src/component/ScaffoldModal.tsx`、`Panel/RightPanels.tsx`：modal / right panel preview 容器写入 `data-amis-theme`，保留 `AMISCSSWrapper` 容器别名。
- `packages/amis-editor-core/src/util.ts`：`getCssVarById()` 支持多个 selector，并只收集 `--*` CSS custom properties，避免 `[data-amis-theme] .amis-*` 组件 selector 的普通属性污染 cssVars；`getAllCssVar()` 读取 `[data-amis-theme]`；`clearDirtyCssKey()` 对旧 `.cxd-*` selector key 写入 migration warning。
- `packages/amis-editor-core/src/manager.ts`、`packages/amis-editor/src/plugin/Collapse.tsx`：保留 `getThemeClassPrefix()` 兼容面，新增 `getThemeClassName()` 并把 Collapse DOM 查询迁到 theme classnames。
- `packages/amis-theme-editor-helper/__tests__/ParseThemeData.test.ts`：覆盖 generated CSS stable selector 和 migration warning。
- `packages/amis-editor-core/__tests__/themeScope.test.ts`：覆盖 editor theme name resolution、DOM props 和 HTML attr escape。
- `packages/amis-editor-core/__tests__/themeCssMigration.test.ts`：覆盖 `JSONPipeIn` 旧 style / `.cxd-*` dirty selector 清理和 warning，并覆盖 theme scoped CSS 只读取 custom properties。

## 4. Commands

通过：

- `PYTHONPATH=/Users/songmingxu/Projects/gold-market/.venv/lib/python3.13/site-packages python3 /Users/songmingxu/.agents/skills/cs-onboard/tools/codestable-dod-runner.py --checklist .codestable/features/2026-07-25-editor-theme-helper-migration/editor-theme-helper-migration-checklist.yaml --json-out .codestable/features/2026-07-25-editor-theme-helper-migration/editor-theme-helper-migration-dod-results.json`
- `npm run build --workspace amis-theme-editor-helper`
- `npm run build --workspace amis-editor-core`
- `npm run build --workspace amis-editor`
- `npm run check:theme-selectors --workspace amis-ui` -> 1503 legacy baseline，0 new violation。
- `npx jest packages/amis-theme-editor-helper/__tests__/ParseThemeData.test.ts`
- `npx jest packages/amis-editor-core/__tests__/themeScope.test.ts`
- `npx jest packages/amis-editor-core/__tests__/themeCssMigration.test.ts`
- `python3 /Users/songmingxu/.agents/skills/cs-onboard/tools/validate-yaml.py --file .codestable/features/2026-07-25-editor-theme-helper-migration/editor-theme-helper-migration-checklist.yaml --yaml-only`

基线记录：

- `rg -n "\.cxd-" packages/amis-theme-editor-helper packages/amis-editor-core packages/amis-editor` -> exit 0，剩余命中已进入 inventory 或历史迁移测试。
- `rg -n "AMISCSSWrapper|getCssVarById|data-amis-theme|ParseThemeData|style2ThemeCss" packages/amis-editor-core packages/amis-theme-editor-helper packages/amis-editor` -> exit 0，显示 preview scope / schema migration / container alias 命中。

说明：

- build 命令仍输出项目既有 i18n、Sass deprecation、Rollup TypeScript warning；exit code 均为 0。
- Jest 仍输出 `.worktrees/script-editor-lsp` 下 duplicate manual mock warning；exit code 均为 0。

## 5. Cleanliness

- 未新增 debug output。
- 未新增临时 TODO / FIXME / XXX。
- 未注释掉旧代码。
- 未提交 `lib` / `esm` 生成产物。
- 未新增 SCSS/CSS `.cxd-*` 兼容 selector；guard 已证明 0 new violation。
- `.AMISCSSWrapper` 仅作为容器别名保留，主题身份由 `data-amis-theme` 承担。

## 6. Next Steps

- 进入 implementation.before_review gates：scope gate、evidence pack、review packet。
- code review 需要重点核查 `ParseThemeData` 后向兼容、preview scope 传播和 `JSONPipeIn` warning 不污染正常 schema。
- QA / acceptance 需要引用四条线证据，并把剩余 helper/editor legacy 命中交给 `legacy-prefix-teardown`。
