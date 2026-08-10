---
doc_type: feature-implementation
feature: 2026-07-25-stylesheet-stable-selector-build
roadmap: theme-system-refactor
roadmap_item: stylesheet-stable-selector-build
status: ready-for-review
implemented: 2026-07-26
blocked_gate: null
---

# stylesheet-stable-selector-build 实现记录

## 1. Scope

本轮实现完成稳定 selector helper、selector inventory / allowlist、guard 命令和正反例 fixture。核心结果是：后续新增样式默认应走 `.amis-*` 与 `[data-amis-theme]`；现有 `#{$ns}` / `.cxd-*` / classPrefix selector 债务被机器基线锁住，允许删除，新增未分类命中会失败。

本轮没有批量迁移 Form、Select、Dialog、Table、Dropdown、Tooltip、Popover 等核心组件；没有迁移 editor/theme-editor helper；没有新增 `.cxd-*` SCSS/CSS legacy selector 兼容输出。

## 2. Step Evidence

| Step | 退出信号 | 证据 |
|---|---|---|
| S1 基线扫描 | inventory 能解释现有主要命中，分类覆盖 SCSS、runtime DOM query、editor/helper、docs/generated，且不要求零命中 | `packages/amis-ui/scripts/theme-selectors/policy.json` 由 `node packages/amis-ui/scripts/checkThemeSelectors.js --update` 生成，记录 2233 条 baseline match：`scss-ns-selector` 2185、`theme-prefix-selector` 42、`classprefix-dom-selector` 6。 |
| S2 分类与 allowlist | allowlist 是机器可读或可被 guard 消费的结构，新增未分类命中默认失败 | policy JSON 定义 `public-forbidden`、`migration-target`、`internal-legacy`、`dom-alias-generated`、`docs-historical`、`generated-artifact` 六类，包含 owner 与退出条件；guard 比对当前扫描与 `entries` baseline。 |
| S3 SCSS helper | helper 不输出 `.cxd-*`，Button proof 或 fixture 能使用 helper 路径 | 新增 `packages/amis-ui/scss/_stable-selectors.scss`，提供 `amis-component`、`amis-theme`、`amis-themed-component`；`_button.scss` 的 Button proof 改用 `amis-theme('cxd')` / `amis-component('Button')`，输出 selector 语义保持 `[data-amis-theme='cxd']` 与 `.amis-Button`。 |
| S4 Guard 命令 | guard 能读取 inventory/allowlist，并通过正例/反例 fixture 或等价测试证明新增违规会失败 | 新增 `packages/amis-ui/scripts/checkThemeSelectors.js` 与 `packages/amis-ui/package.json` 脚本 `check:theme-selectors`；正常仓库通过，good fixture 通过，bad fixture 对 `.#{$ns}GuardFixture` / `.cxd-GuardFixture` 失败。 |
| S5 验证集成 | 核心命令可运行；若 build/typecheck 存在既有红灯，已记录归因 | `npm run stylelint`、`npm run check:theme-selectors --workspace amis-ui`、YAML 校验、targeted grep 均通过；`npm run build --workspace amis-ui` 到达 `created lib` / `created esm`，仅既有 Sass/Rollup/Browserslist warnings，输出完成后仍需中断。 |
| S6 交接收口 | artifact 能反向核对未迁移全组件、未迁移 editor/helper、未新增 SCSS legacy selector 兼容 | checklist steps 全 `done`、checks 全 `passed`；diff 仅限 helper、Button proof、guard script、policy/fixtures、package script 和 CodeStable artifact。 |

## 3. Implementation Details

- `packages/amis-ui/scss/_stable-selectors.scss`：稳定 selector helper，只生成 `.amis-*` 与 `[data-amis-theme]` 公共路径。
- `packages/amis-ui/scss/_components.scss`：引入 stable selector helper，供组件 SCSS 使用。
- `packages/amis-ui/scss/components/_button.scss`：把现有 Button pilot proof 改为 helper 写法，避免新增输出语义。
- `packages/amis-ui/scripts/checkThemeSelectors.js`：扫描源码 selector 命中，按 `file + pattern + normalized line + count` 与 policy baseline 比对；当前 baseline 允许删除，不允许新增未分类命中。
- `packages/amis-ui/scripts/theme-selectors/policy.json`：机器可读 inventory / allowlist；包含分类、owner、退出条件、扫描规则和 entries。
- `packages/amis-ui/scripts/theme-selectors/fixtures/good/stable-selector.scss`：guard 正例，使用 stable helper，不产生 legacy match。
- `packages/amis-ui/scripts/theme-selectors/fixtures/bad/legacy-selector.scss`：guard 反例，包含 `#{$ns}` 和 `.cxd-*`，fixture 模式必须失败。

## 4. Commands

通过：

- `npm run stylelint`
- `npm run check:theme-selectors --workspace amis-ui`
- `node packages/amis-ui/scripts/checkThemeSelectors.js --fixture good`
- `PYTHONPATH=/Users/songmingxu/Projects/gold-market/.venv/lib/python3.13/site-packages python3 /Users/songmingxu/.agents/skills/cs-onboard/tools/validate-yaml.py --file .codestable/features/2026-07-25-stylesheet-stable-selector-build/stylesheet-stable-selector-build-checklist.yaml --yaml-only`
- `git diff --check`

预期失败：

- `node packages/amis-ui/scripts/checkThemeSelectors.js --fixture bad` -> exit 1，报告 `.#{$ns}GuardFixture` 和 `.cxd-GuardFixture` 两条新增未分类 legacy selector。

基线记录：

- `rg -n -F '#{$ns}' packages/amis-ui/scss` -> exit 0，当前旧 `#{$ns}` 基线仍存在，由 policy 记录为 migration target。
- `rg -n "\.cxd-|\.antd-|\.dark-" packages/amis-ui/scss packages/amis-theme-editor-helper packages/amis-editor-core` -> exit 0，当前主题前缀命中仍存在，由 policy 分类为 migration target / internal legacy / docs historical。
- `npm run build --workspace amis-ui` -> 输出已到 `created lib` 和 `created esm`；进程在输出完成后仍不自然退出，按既有 build runner warning 中断。stderr 仅见既有 Sass deprecation、Browserslist stale data、Rollup circular dependency、TS5051 和 postcss fill-available warnings。

## 5. Gate Readiness

- Scope gate 输入：feature dir、`packages/amis-ui/package.json`、`packages/amis-ui/scss/_components.scss`、`packages/amis-ui/scss/_stable-selectors.scss`、`packages/amis-ui/scss/components/_button.scss`、`packages/amis-ui/scripts/checkThemeSelectors.js`、`packages/amis-ui/scripts/theme-selectors/**`、roadmap goal-state。
- DoD runner 注意：`CMD-002 npm run build --workspace amis-ui` 在本 workspace 输出完成后不退出；按 `token-contract-css-layers` 的既有做法，DoD 结果需要聚合手工 build completion evidence，而不能让 runner 永久挂住。
- Evidence pack 将在 scope / DoD results 生成后刷新。

## 6. Cleanliness

- 未新增 debug output。
- 未新增临时 TODO / FIXME / XXX。
- 未注释掉代码。
- 未修改 editor/theme-editor helper 或历史 schema。
- 未迁移核心组件 SCSS。
- 未新增 `.cxd-*` SCSS/CSS legacy selector 兼容输出；bad fixture 仅用于 guard 负向验证，普通 guard 扫描不把 fixture 当产物路径。

## 7. Handoff To Component Migration

后续 `core-component-selector-migration` 应把 policy 中 `migration-target` entries 当作迁移清单输入：迁移某组件时删除对应 legacy match，并保持 `npm run check:theme-selectors --workspace amis-ui` 通过；如果确需新增 selector 命中，必须先给出分类、owner 和退出条件，否则 guard 会失败。
