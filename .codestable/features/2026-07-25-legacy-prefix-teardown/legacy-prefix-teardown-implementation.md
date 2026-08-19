---
doc_type: feature-implementation
feature: 2026-07-25-legacy-prefix-teardown
roadmap: theme-system-refactor
roadmap_item: legacy-prefix-teardown
status: implemented
implemented: 2026-07-28
---

# legacy-prefix-teardown 实现报告

## 1. Scope

本轮按 goal lane 执行 `legacy-prefix-teardown` implementation。核心处理的是旧前缀公共样式 API 的退出证据：汇总 ledger、收敛 DOM-only alias policy、补强 selector guard 反例、交接 docs rollout 材料，并修复主题 scope 类型导出缺口。

## 2. Step Evidence

| Step | Status | Evidence |
|---|---|---|
| S1 实现准入与依赖核验 | done | `codestable-workflow-next.py feature --require-implementation-ready --json` pass；`core-component-selector-migration` 与 `editor-theme-helper-migration` 均 `done`；前置 ledger / inventory 可读 |
| S2 LegacyPrefixLedger 汇总 | done | 新增 `legacy-prefix-teardown-ledger.md`；消费 selector policy、ComponentMigrationLedger、HelperScssInventory、runtime alias 与 file-name compatibility |
| S3 公共依赖迁移或内部化 | done | `classprefix-dom-selector=0`；已迁移 `ns` / `themePrefix` / `cx(...)` 别名驱动的 DOM / Sortable 行为选择器；保留广义 `classPrefix` 为 internal / legacy passthrough；修复 `ThemeScopeProps` barrel export；`legacyDomClassAlias` 归一化非法值为 false |
| S4 DOM-only alias policy 固化 | done | 新增 `legacy-prefix-teardown-alias-retention-record.md`；`npm test --workspace amis-core -- theme` 覆盖默认关闭、显式 `cxd`、非法 `antd` 不输出旧类 |
| S5 guard 收紧与反向验证 | done | `checkThemeSelectors.js --update` 将 policy baseline 收敛为 7 条 portal scope 记录；新增 bad fixture 覆盖 `classPrefix` / `ns` / `themePrefix`、间接 alias、`props.classPrefix`、解构 alias、预构造 selector 变量、`${cx(...)}`、`classList.contains(cx(...))` 的 DOM selector 与 Sortable selector；default/good pass，bad expected fail |
| S6 docs rollout 交接 | done | 新增 `legacy-prefix-teardown-docs-rollout-handoff.md`，覆盖用户迁移口径、must say/must not say、IE11 静态边界、文件名兼容说明 |
| S7 evidence 收口 | done | 本报告、ledger、retention record、handoff、DoD runner、scope gate 与 evidence pack 为 review / QA / acceptance 提供可核验证据 |

## 3. Code Changes

- `packages/amis-core/src/theme.tsx`：新增 `normalizeLegacyDomClassAlias()`，确保 runtime 只接受显式 `cxd`，非法 alias 不进入 classnames cache key。
- `packages/amis-core/src/index.tsx`：导出 `ThemeScopeProps`，修复 editor theme scope helper 的跨包类型入口。
- `packages/amis-core/__tests__/theme.test.ts`：新增非法 non-`cxd` alias 回归。
- `packages/amis-ui/scripts/checkThemeSelectors.js`：`classprefix-dom-selector` 支持 `classPrefix` / `ns` / `themePrefix`、简单 alias 变量、`props.classPrefix`、解构 alias、预构造 selector/className 变量、`${cx(...)}` / `${classnames(...)}` 在 DOM API、`classList.contains` 与 Sortable selector 上的行为选择器扫描。
- `packages/amis-ui/scripts/theme-selectors/policy.json`：收窄 baseline 到 7 条 portal scope 记录，并更新 `classprefix-dom-selector` 扫描说明；`#{$ns}` 是主题入口赋值后的合法 Sass 命名空间插值，不纳入旧前缀债务。
- `packages/amis-ui/scripts/theme-selectors/fixtures/bad/legacy-dom-selector.tsx`：新增 `${classPrefix}`、`${ns}`、`${themePrefix}`、间接 alias、`props.classPrefix`、解构 alias、预构造 selector、`${cx(...)}`、`classList.contains(cx(...))` DOM / Sortable selector 反例。
- `packages/amis-ui/scripts/theme-selectors/fixtures/good/stable-dom-selector.tsx`：新增 stable selector 正例。
- `packages/amis-core/src/components/PopOver.tsx`、`packages/amis-ui/src/components/{Tabs,UserSelect,CalendarMobile,Tree}.tsx`、`packages/amis-ui/src/components/formula/VariableList.tsx`、`packages/amis-ui/src/components/table/index.tsx`、`packages/amis/src/renderers/*`：将行为 DOM selector / Sortable selector 从 classPrefix alias 或 `${cx(...)}` 迁移到 stable selector helper。
- `packages/amis/__tests__/renderers/{Tabs,List,Tree,Video}.test.tsx`、`packages/amis/__tests__/renderers/Form/{formula,inputSubForm}.test.tsx` 及对应 snapshots：将相关测试查询和快照更新到 stable class 主路径，保留尚未迁移组件的既有 `cxd-*` snapshot 证据。

## 4. Validation

| Command | Result |
|---|---|
| `PYTHONPATH=... codestable-workflow-next.py epic --roadmap ... --json` | pass；返回 `dispatch_goal`，两份 ApprovalRef 均可见 |
| `npm test --workspace amis-core -- theme` | pass；10 tests |
| `npm test --workspace amis -- button` | pass；5 suites / 110 tests |
| `npm run check:theme-selectors --workspace amis-ui` | pass；7 baseline / 0 new violation |
| `node packages/amis-ui/scripts/checkThemeSelectors.js --fixture good` | pass；0 baseline / 0 violation |
| `node packages/amis-ui/scripts/checkThemeSelectors.js --fixture bad` | expected fail；命中 `classprefix-dom-selector`、`theme-prefix-selector` |
| `npm run stylelint` | pass |
| `python3 .../validate-yaml.py --file legacy-prefix-teardown-checklist.yaml --yaml-only` | pass；PyYAML fallback warning |
| `npm test --workspace amis -- --runTestsByPath __tests__/renderers/Tabs.test.tsx __tests__/renderers/List.test.tsx __tests__/renderers/Table.test.tsx __tests__/renderers/Form/inputSubForm.test.tsx __tests__/renderers/Video.test.tsx` | pass；5 suites / 51 tests / 37 snapshots；更新 24 个旧 `.cxd-*` 快照 |
| `npm test --workspace amis -- --runTestsByPath __tests__/renderers/Tree.test.tsx __tests__/renderers/Form/formula.test.tsx` | pass；2 suites / 14 tests / 3 snapshots；补充 Tree 与 FormulaPicker stable class 主路径覆盖 |
| `rg -n "\\.cxd-|\\.antd-|\\.dark-|classPrefix" ...` | exit 0；作为 document-baseline，已由 ledger 分类 |

## 5. Typecheck Baseline

`npm run typecheck` 当前失败，但本轮已修复主题链路新增/前序真实缺口 `ThemeScopeProps` barrel export。剩余错误集中在既有 editor schema typing、event-control modal body、validation control、test container nullability、build-schemas dependency API 和若干 renderer store typing，不落在本次修改文件；`CMD-006` 已按 supporting / non-core 命令调整为 `document-baseline`，DoD runner 必须将它记录为警告证据而不是 blocking。

## 6. Cleanliness

- 未新增 SCSS/CSS `.cxd-*` compatibility layer。
- 未自动支持 `antd` / `dark` DOM alias。
- 未把 `classPrefix` 批量删除或改造成新的公共样式 API。
- 新增文档均为 feature 目录内可审计产物；新增代码无调试输出、临时 TODO/FIXME 或注释掉代码。
