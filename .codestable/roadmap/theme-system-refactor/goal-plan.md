---
doc_type: roadmap-goal-plan
roadmap: theme-system-refactor
status: awaiting-authorization
created: 2026-07-25
---

# theme-system-refactor Goal 执行计划

## 1. Scope

- Roadmap: `.codestable/roadmap/theme-system-refactor/theme-system-refactor-roadmap.md`
- Items: `.codestable/roadmap/theme-system-refactor/theme-system-refactor-items.yaml`
- Goal state: `.codestable/roadmap/theme-system-refactor/goal-state.yaml`
- Approval surface: `.codestable/roadmap/theme-system-refactor/approval-report.md`

本 goal 包只接管已通过统一确认的子 feature implementation / review / QA / acceptance / scoped commit / final audit。已完成的 `theme-runtime-button-pilot` 不进入本次 goal feature 队列。

## 2. Feature 顺序

1. `token-contract-css-layers` - non-functional - 固化 `--amis-*` token 分层、CSS layer 顺序、主题包覆写入口和 IE11 静态降级边界。
2. `overlay-theme-scope-propagation` - mixed - 统一 Overlay / portal / modal container 的 `data-amis-theme` 传播。
3. `stylesheet-stable-selector-build` - non-functional - 建立 SCSS helper、selector inventory、allowlist 和新增依赖 guard。
4. `core-component-selector-migration` - mixed - 迁移高覆盖组件和渲染器的 `.cxd-*` / `$ns` / `classPrefix` 样式与 DOM selector 依赖。
5. `editor-theme-helper-migration` - mixed - 迁移编辑器预览、theme-editor helper、历史 schema 和内置 SCSS 的主题身份依赖。
6. `legacy-prefix-teardown` - mixed - 收敛 legacy prefix 公共依赖，并治理显式 DOM-only `.cxd-*` alias 生命周期。
7. `theme-system-validation-docs-rollout` - non-functional - 完成跨包验证、examples inventory、贡献文档、用户覆写指南、IE11 说明和发布风险记录。

执行顺序来自 workflow topological order。implementation 入口仍必须重新核验依赖严格为 `done`，不能把 design-review passed 当作实现准入。

## 3. Roadmap 级验收路径

- Root / Button / 核心组件 DOM 主路径默认输出稳定 `.amis-*`，主题身份通过 `[data-amis-theme]` 表达。
- Root / SchemaRenderer / FormItem / amis-ui 子组件的公开 DOM classPrefix 主路径只能来自 `componentClassPrefix || 'amis-'`；`theme.classPrefix` 不得继续作为控件根类或第三方 `prefixCls` 的公开 DOM 前缀来源。
- Dialog / Tooltip / Popover / Dropdown / Select / PopUp 等浮层在 body container、自定义 container、多 root 和 editor preview 下继承正确主题 scope。
- Overlay / direct portal 的 ThemeScope 注入必须 layout-neutral：不得新增影响 `offsetParent`、定位、尺寸或事件边界的 wrapper，隐藏态不得提前修改 container scope；所有直接 `Portal` / `ReactDOM.createPortal` 路径都必须进入统一 ThemeScope gate。
- 标准样式值通过 `--amis-*` token 与固定 CSS layer 管理，非标准主题差异只在 `[data-amis-theme]` 作用域下覆写。
- 显式 DOM-only `.cxd-*` alias 仅用于迁移，默认不进入主路径，库 CSS 不输出 `.cxd-*` legacy selector。
- Editor / theme-editor 生成 CSS、preview scope、historical schema migration 和 helper SCSS inventory 全部对齐 ThemeScope / TokenContract。
- Docs / examples 不再推荐 `#{$ns}`、`.cxd-*`、`.antd-*`、`.dark-*` 或 `classPrefix` 作为主题定制主入口。

## 4. 关键假设

- ADR-001 是硬约束：标准化样式值 token 化，非标准差异走主题作用域选择器，最终用户不需要理解主题前缀。
- 稳定组件类名前缀固定为 `amis-`。
- 不做 `.cxd-*` SCSS/CSS legacy selector 双编译或双产物。
- DOM-only `.cxd-*` alias 只作为显式迁移开关；最多 1 年内复审，是否退出由人工架构评审决定。
- IE11 只保留静态 CSS 降级边界，不承诺动态 token theme switching。

## 5. Top 3 风险与缓解

1. 浮层 scope 泄漏。缓解：`overlay-theme-scope-propagation` 单独先跑，要求 body、自定义 container、多 root、direct portal、editor preview 和 iframe preview 证据。
2. token / selector 契约漂移。缓解：`token-contract-css-layers` 与 `stylesheet-stable-selector-build` 先固化命名、layer、helper、inventory、allowlist 和 guard。
3. DOM alias 被误认为新公共 API。缓解：alias 默认关闭、不生成库 CSS、不自动扩展到 `.antd-*` / `.dark-*`，并在 `legacy-prefix-teardown` 与 docs rollout 记录复审和迁移边界。
4. 前缀下发链路遗漏。缓解：涉及 `classPrefix` / `prefixCls` / FormItem 控件链路的变更必须用 renderer Jest 和浏览器 DOM scan 证明公开 DOM 类只输出 `.amis-*`。
5. ThemeScope 修复引入布局变化。缓解：Overlay / direct portal scope 注入必须无额外 layout wrapper，真实 Select / ColorPicker / PopUp popover 必须记录 scope、offsetParent 或等价布局证据。

## 6. 必跑命令集合

- `PYTHONPATH=/Users/songmingxu/Projects/gold-market/.venv/lib/python3.13/site-packages python3 /Users/songmingxu/.agents/skills/cs-onboard/tools/codestable-workflow-next.py epic --roadmap .codestable/roadmap/theme-system-refactor --json`
- `npm run typecheck`
- `npm run stylelint`
- `npm run build --workspace amis-ui`
- `npm run build --workspace amis`
- `npm run build --workspace amis-core`
- `npm run build --workspace amis-editor-core`
- `npm run build --workspace amis-editor`
- `npm run build --workspace amis-theme-editor-helper`
- `npm run check:theme-selectors --workspace amis-ui`
- `npm test --workspace amis-core -- theme`
- `npm test --workspace amis -- button`
- `npm test --workspace amis -- Dialog`
- `npm test --workspace amis -- Tooltip`
- `npm test --workspace amis -- Select`
- `npm test --workspace amis -- DropDownButton`
- `npm test --workspace amis -- Table`
- `npx jest packages/amis/__tests__/renderers/Form/options.test.tsx packages/amis/__tests__/renderers/Form/color.test.tsx packages/amis/__tests__/renderers/Form/inputArray.test.tsx packages/amis/__tests__/renderers/Form/inputMonthRange.test.tsx packages/amis/__tests__/renderers/Form/number.test.tsx --config packages/amis/package.json --runInBand`
- Browser gate after `npm start`: inspect `/zh-CN/components/form/options`, `/zh-CN/components/form/input-color`, `/zh-CN/components/form/input-array`, `/zh-CN/components/form/input-month-range` for `.amis-*` control roots, unexpected `cxd-*` control roots, popover `offsetParent`, control dimensions, and screenshots.
- Direct portal gate: grep `ReactDOM.createPortal` / `<Portal` call sites and require tests or browser evidence for every user-facing path that bypasses `Overlay`; at minimum cover `PopUp` after any mobile picker / popup theme change.
- `rg -n "@layer amis\\.reset, amis\\.tokens, amis\\.components, amis\\.theme, amis\\.user" packages/amis-ui/scss`
- `rg -n "--amis-(palette|color|Button)" packages/amis-ui/scss`
- `rg -n -F '#{$ns}' packages/amis-ui/scss`
- `rg -n "\\.cxd-|\\.antd-|\\.dark-|classPrefix" packages/amis-core/src packages/amis-ui/src packages/amis-ui/scss packages/amis/src packages/amis-editor-core/src packages/amis-theme-editor-helper/src`
- `rg -n "#\\{\\$ns\\}|\\.cxd-|\\.antd-|\\.dark-|classPrefix" docs examples`
- `rg -n "IE11|cxd-ie11|CSS 变量|data-amis-theme|--amis-|amis-" docs/zh-CN/start docs/zh-CN/style docs/zh-CN/extend`

每个 feature 可按 design / checklist 收窄为相关最小命令，但核心验收命令不得因为耗时跳过。工具缺失时只能修复真实 runner、依赖或既有配置，不能新增同名 shim 或伪造验证结果。

## 7. 最终聚合命令

- `PYTHONPATH=/Users/songmingxu/Projects/gold-market/.venv/lib/python3.13/site-packages python3 /Users/songmingxu/.agents/skills/cs-onboard/tools/codestable-workflow-next.py epic --roadmap .codestable/roadmap/theme-system-refactor --json`
- `python3 /Users/songmingxu/.agents/skills/cs-onboard/tools/codestable-goal-consistency-gate.py --roadmap .codestable/roadmap/theme-system-refactor`
- `npm run typecheck`
- `npm run stylelint`
- `npm run check:theme-selectors --workspace amis-ui`
- `npm test --workspace amis-core -- theme`
- `npm test --workspace amis -- button`
- `npm test --workspace amis -- Dialog`
- `npm test --workspace amis -- Tooltip`
- `npm test --workspace amis -- Select`
- `npm test --workspace amis -- DropDownButton`
- `npm test --workspace amis -- Table`
- `npx jest packages/amis/__tests__/renderers/Form/options.test.tsx packages/amis/__tests__/renderers/Form/color.test.tsx packages/amis/__tests__/renderers/Form/inputArray.test.tsx packages/amis/__tests__/renderers/Form/inputMonthRange.test.tsx packages/amis/__tests__/renderers/Form/number.test.tsx --config packages/amis/package.json --runInBand`
- Browser gate after `npm start`: inspect `/zh-CN/components/form/options`, `/zh-CN/components/form/input-color`, `/zh-CN/components/form/input-array`, `/zh-CN/components/form/input-month-range` for `.amis-*` control roots, unexpected `cxd-*` control roots, popover `offsetParent`, control dimensions, and screenshots.

如果某个命令因环境、依赖或 runner 缺失无法运行，final audit 必须判断它是否属于核心验收路径。核心路径不可验证时 handoff，不得以 residual risk 通过。

## 8. Gate / DoD / Provider Policy

- DoD Policy：每个 feature 按 checklist steps 顺序实现，steps 只在实现阶段置 `done`，checks 只在 acceptance 置 `passed`；review、QA、acceptance 和 evidence pack 均须落盘。
- Gate Policy：运行 `goal-protocol-gates.md` 定义的 implementation / review / QA / acceptance / roadmap audit gates；失败按协议回退修复，不能跳过核心 gate。
- Provider Policy：archguard / meta-cc / 其他 provider unavailable 记录 fallback，不自动阻塞；provider warning 必须由 review / QA / audit 解释，未解释的核心风险可阻塞。
- Final Audit：必须运行 `codestable-goal-consistency-gate.py --roadmap .codestable/roadmap/theme-system-refactor`，并聚合 goal-evidence-summary、provider warnings、E/C/H summary 与 H-only core checks。

## 9. 授权边界

- Goal acceptance 授权：独立命名决策 `approval-report.md#goal-acceptance`。只有批准后，goal driver 才能在 review / QA 通过后进入 acceptance。
- Goal scoped commit 授权：独立命名决策 `approval-report.md#goal-commits`。只有批准后，goal driver 才能按 feature 自动 scoped-commit。
- 两项授权可以在同一次 `goal-execution` group 中原子批准，但运行时仍分别机械核验。
- Non-Automatic Actions：不会自动 push、merge、publish、release、deploy、promotion 或 production cutover。
