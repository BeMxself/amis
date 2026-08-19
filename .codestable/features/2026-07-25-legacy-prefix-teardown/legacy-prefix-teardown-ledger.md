---
doc_type: legacy-prefix-ledger
feature: 2026-07-25-legacy-prefix-teardown
roadmap: theme-system-refactor
roadmap_item: legacy-prefix-teardown
status: current
updated: 2026-07-28
source_policy: packages/amis-ui/scripts/theme-selectors/policy.json
---

# legacy-prefix-teardown LegacyPrefixLedger

## 1. 结论

本 ledger 汇总 selector guard、core component migration ledger、editor helper inventory 与本轮 runtime / file-name 扫描，用来判断旧前缀是否仍是公共样式 API。结论是：默认公共样式主路径已经转向 `.prismui-*`、`[data-prismui-theme]` 和 token；剩余旧前缀命中必须按下表分类治理，不能被解释为新的 `.cxd-*` 公共定制入口。

本轮收紧了 selector policy：`npm run check:theme-selectors --workspace amis-ui` 当前为 7 个 portal scope baseline match，0 个新增 violation；`theme-prefix-selector` 与 `classprefix-dom-selector` 均为 0。行为选择器扫描覆盖 `classPrefix`、常见别名 `ns` / `themePrefix`、简单 alias 变量、`props.classPrefix`、解构 alias、预构造 selector/className 变量、`${cx(...)}` / `${classnames(...)}` 在 DOM API、`classList.contains` 与 Sortable selector 上的使用。`#{$ns}` 是由主题入口设置为稳定前缀的 Sass 命名空间插值，不属于旧前缀债务。

## 2. 输入证据

| Source | Path | Current Signal | Consumption |
|---|---|---|---|
| Selector policy | `packages/amis-ui/scripts/theme-selectors/policy.json` | 7 条 portal scope baseline；`theme-prefix-selector=0`、`classprefix-dom-selector=0`；行为选择器扫描覆盖 `classPrefix` / `ns` / `themePrefix` / alias 变量 / props alias / `cx(...)` selector | PrefixPublicApiGuard 的机器基线 |
| ComponentMigrationLedger | `.codestable/features/2026-07-25-core-component-selector-migration/core-component-selector-migration-ledger.md` | Wave A/B/C done；DOM selector dependency 已迁到 stable helper；广义 `classPrefix` passthrough 不批量删除 | 区分 DOM selector debt 与 props passthrough |
| HelperScssInventory | `.codestable/features/2026-07-25-editor-theme-helper-migration/editor-theme-helper-migration-helper-scss-inventory.md` | editor/helper `.cxd-*` 与 `.AMISCSSWrapper` 属内部迁移输入 | 防止把 editor helper 存量当公共 API |
| Runtime alias policy | `packages/amis-core/src/theme.tsx` | `legacyDomClassAlias` 默认 false；只识别显式 `cxd` | DOM-only alias 生命周期治理 |
| File-name compatibility | `packages/amis/build.sh`、`packages/amis-ui/scss/themes/cxd-ie11.scss` | `cxd.css` / `cxd-ie11.css` 仍是文件名兼容 | 不等于 selector compatibility |

## 3. PrefixDependencyKind Ledger

| Kind | Current Matches / Paths | Owner | Decision | Retain Reason | Exit Condition / Next Owner |
|---|---|---|---|---|---|
| `public selector` | No new `.cxd-*` / `.antd-*` / `.dark-*`; guard baseline only | `legacy-prefix-teardown` | migrate / block new | 旧 selector 基线只允许减少，不允许未分类增加 | guard 继续 0 new violation；后续组件迁移逐步删除 baseline |
| `behavior dom selector` | `classprefix-dom-selector=0` across `querySelector` / `querySelectorAll` / `closest` / `matches` / `classList.contains` / Sortable `handle` / `filter` / `ghostClass` | `legacy-prefix-teardown` | migrated | 行为定位必须跟随稳定 `.prismui-*` 主路径，不能依赖 DOM-only alias | 新增命中直接阻塞；如确属非公共行为例外，必须先扩 ledger 分类 |
| `internal legacy` | 0 theme-prefix policy entries；helper inventory 仍记录历史 `.cxd-*` / `AMISCSSWrapper` 输入 | `editor-theme-helper-migration` then `theme-system-validation-docs-rollout` | internalize / handoff | editor/helper 内部样式和历史 themeCss 输入，需要迁移文档承接 | helper stable selector 补齐后删除；docs 说明 `.AMISCSSWrapper` 只是容器别名 |
| `runtime alias` | `legacyDomClassAlias?: false | 'cxd'` | `legacy-prefix-teardown` | retain-temporarily | 兼容老定制页面自己的 `.cxd-*` CSS；不生成库 CSS | 可用迁移路径形成后不晚于 1 年触发人工评估 |
| `theme behavior config` | `classPrefix: 'cxd-'/'antd-'/'dark-'` in theme objects | `legacy-prefix-teardown` | internalize | 仍供旧组件和行为配置透传；不是新样式定制入口 | 文档从公共 API 中移除；后续重构可拆 internal behavior config |
| `legacy props passthrough` | broad `classPrefix` props across renderers/components | owning renderer/component | retain-temporarily | 传给旧组件或第三方封装，不等同 DOM selector debt | 只在对应组件迁移时收窄，不在本项批量删除 |
| `file-name compatibility` | `cxd.css` / `cxd-ie11.css` build references | release/docs owner | retain-temporarily | 文件名兼容既有产物和 IE11 静态 CSS 边界 | docs rollout 明确“文件名兼容不等于 selector compatibility” |
| `docs historical` | 0 policy baseline entries | `theme-system-validation-docs-rollout` | handoff-to-docs | 历史注释/示例引用不应生成样式输出 | docs rollout 删除或改写为 token / `.prismui-*` / `[data-prismui-theme]` |
| `generated artifact` | `lib` / `esm` ignored by guard | build owner | ignore generated | 构建产物不手写 | 由源码 guard 和 build 产物检查覆盖 |

## 4. Baseline Scope

当前 7 条 baseline 全部属于 `direct-portal-theme-scope`，其中 6 条由共享 ThemeScope helper 覆盖，1 条为 MobileDevTool 的已测试内部例外。组件 SCSS 中的 `#{$ns}` 不计入 baseline，因为它在主题入口统一解析为稳定 `.prismui-*` 前缀。

## 5. Teardown Decisions

- 默认主路径：`.prismui-*` component class、`[data-prismui-theme]` theme identity、`--prismui-*` token。
- 新增公共旧前缀选择器：禁止；guard 默认失败，不通过 baseline 扩张掩盖。
- DOM-only `.cxd-*` alias：保留为显式迁移能力；默认关闭；不支持 `antd` / `dark` alias；不生成库 CSS。
- 广义 `classPrefix`：保留为 internal / legacy passthrough；不作为用户主题定制文档入口；后续只按组件边界逐步删除。
- `cxd.css` / `cxd-ie11.css`：只算文件名兼容和 IE11 静态 CSS 边界，不代表 `.cxd-*` selector 兼容层。

## 6. Verification Snapshot

| Check | Result |
|---|---|
| `npm run check:theme-selectors --workspace amis-ui` | pass；7 baseline / 0 new violation |
| `node packages/amis-ui/scripts/checkThemeSelectors.js --fixture good` | pass；0 baseline / 0 violation |
| `node packages/amis-ui/scripts/checkThemeSelectors.js --fixture bad` | expected fail；命中 `classprefix-dom-selector`、`theme-prefix-selector` |
| `npm test --workspace amis-core -- theme` | pass；新增 alias 非 `cxd` 回归已覆盖 |
| `npm test --workspace amis -- button` | baseline pass |
| `npm test --workspace amis -- --runTestsByPath __tests__/renderers/Tabs.test.tsx __tests__/renderers/List.test.tsx __tests__/renderers/Table.test.tsx __tests__/renderers/Form/inputSubForm.test.tsx __tests__/renderers/Video.test.tsx` | pass；相关 renderer 测试查询和 snapshot 已迁到 stable class 主路径 |
| `npm test --workspace amis -- --runTestsByPath __tests__/renderers/Tree.test.tsx __tests__/renderers/Form/formula.test.tsx` | pass；Tree / FormulaPicker 行为查询和 snapshot 已迁到 stable class 主路径 |
