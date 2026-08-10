---
doc_type: feature-design
feature: 2026-07-24-theme-runtime-button-pilot
roadmap: theme-system-refactor
roadmap_item: theme-runtime-button-pilot
execution_lane: goal
status: approved
summary: 建立 ThemeScope 与稳定 Button 类名最小闭环
tags: [theme, runtime, button, design-token]
---

# Theme Runtime Button Pilot Design

## 0. 术语约定

- **主题作用域**：由 `data-amis-theme` 表达当前主题身份，防冲突结论：与旧的主题类名前缀不同，它不进入组件 class 名。
- **稳定组件类名**：由 `amis-` 前缀表达组件身份，例如 `.amis-Button`，防冲突结论：`cxd-Button` / `antd-Button` 不再是公共组件身份。
- **Legacy DOM 类名别名**：显式迁移期开关开启后附加到 DOM 的 `.cxd-*` 类名，防冲突结论：它只服务旧用户 CSS 命中，不生成库侧 `.cxd-*` CSS，也不是推荐 API。
- **Theme Runtime**：`amis-core` 中生成 `ThemeInstance`、`classnames`、`ThemeContext` 和 Root 注入信息的运行时主题层，防冲突结论：本 feature 只改运行时主题契约和 Button 最小闭环，不接管 token 全量治理。
- **Button pilot**：以 Button 为最小可观察组件验证 `Root scope → ThemeInstance.classnames → Button DOM → 最小 token 样式`，防冲突结论：不代表其他组件已完成选择器迁移。

## 1. 决策与约束

### 需求摘要

本 feature 从 roadmap 第一项起头，目标是在最小闭环中证明 ADR-001 的运行时主题契约可执行：Root 暴露 `data-amis-theme`，Button 默认输出 `.amis-Button`，必要状态 / modifier 仍沿用现有 BEM token，样式读取最小 scoped token；显式开启 DOM-only alias 时，Button DOM 额外带 `.cxd-Button` 以支持老定制页面 CSS 命中。

成功标准：

- `ThemeInstance.classnames('Button')` 默认产生稳定 `.amis-Button`，不再由 `classPrefix: 'cxd-'` 决定组件身份。
- Root 或 root wrapper 带 `data-amis-theme={themeName}`，且与 `ThemeContext` / `env.theme` 使用同一个规范化 `themeName`。
- Button 的主类、level、size、block、iconOnly、loading 等 modifier 在稳定类名路径下可观察。
- DOM-only alias 显式开启时才出现 `.cxd-Button` / `.cxd-Button--primary` 等别名；关闭时不出现。
- 本 feature 不输出 `.cxd-*` 库 CSS，不引入 SCSS/CSS legacy selector 双轨。

明确不做：

- 不迁移 Form、Select、Dialog、Table、Dropdown、Tooltip、Popover 等其他组件。
- 不建立完整 token taxonomy、CSS layer 全量产物或 selector inventory guard；这些属于后续 `token-contract-css-layers` 和 `stylesheet-stable-selector-build`。
- 不迁移 editor / theme-editor 的 `.cxd-*` 生成、查询或历史 schema；这些属于 `editor-theme-helper-migration`。
- 不做 overlay / portal 主题传播；这些属于 `overlay-theme-scope-propagation`。
- 不保留 `.cxd-*` / `.antd-*` / `.dark-*` 作为新的公共样式 API。
- 不承诺 IE11 动态 token 主题切换；IE11 只作为静态 CSS 降级边界保留。

### 复杂度档位

- **结构 = modules**（偏离普通局部前端改动的 `functions`）：本 feature 触碰 `ThemeInstance` 这个跨包契约，必须把 ThemeScope / classnames / alias 放在运行时主题模块内，而不是在 Button 或测试里内联。
- **可读性 = public**（偏离内部工具默认 `team`）：`ThemeConfig` / `ThemeInstance` 会被组件、渲染器和外部主题注册使用，字段语义必须可从类型和示例读懂。
- **可测试性 = tested**（偏离“设计阶段可先 testable”）：运行时 classnames 和 Root scope 是后续 roadmap 的地基，必须有单测和渲染测试证明核心路径。
- **Compatibility = backward-compatible with explicit migration switch**（特殊维度）：只对显式 DOM-only `.cxd-*` alias 做迁移兼容，不对库 CSS selector 做兼容。

### 关键决策

1. **ThemeScope 进入 Theme Runtime，不在 Button 内部散落**：换成 Button 手写 `amis-Button` 会让其他组件后续重复造轮子，也无法统一 alias 生命周期。
2. **稳定 classnames 是主路径，legacy alias 是附加输出**：`ThemeInstance.classnames('Button')` 的主语义是 `.amis-Button`；alias 只能在显式开启后追加，不允许从任意 `classPrefix` 推导 `.antd-*` 或 `.dark-*`。
3. **`classPrefix` 保留为 legacy/internal 字段**：本 feature 不删除它，避免一次性破坏现有内部调用；但新增逻辑不得把它作为公共样式 source of truth。
4. **Button 只验证最小 token 样式路径**：仅引入足以证明 `.amis-Button` 能消费 scoped token 的最小变量和样式，不把 Button 871 行 SCSS 全量迁移。
5. **Root 使用同一规范化主题名派生 scope 和 env.theme**：`themeName` 不能在 Root、`env.theme`、`ThemeContext` 和 DOM attribute 之间分叉。
6. **Root scope 需要稳定 DOM 挂点**：`RootRenderer` 当前不是固定 DOM 根，不能假设可直接给组件实例加属性；实现必须通过默认 `ThemeScopeRoot` wrapper、root wrapper 链路或等价根容器方案输出 `data-amis-theme`，且不得破坏既有 `addRootWrapper` 的包裹顺序。

### 方案深度 pre-pass

候选：

- **完整版**：一次性切换 Theme Runtime、全量 SCSS helper、全量 Button 样式和其他高覆盖组件。
- **最小闭环版**：先建立 ThemeScope / stable classnames / alias 的运行时契约，只用 Button 与最小 token 样式证明端到端路径。

本场景选择最小闭环版。理由不是“更快”，而是 roadmap 已把 token layer、SCSS build、overlay、editor 和全量组件迁移拆成独立项；在这些公共机制未稳定前全量推进会把失败面混在一起。转正条件是：`theme-runtime-button-pilot` 的接口被后续 `token-contract-css-layers`、`stylesheet-stable-selector-build`、`core-component-selector-migration` 复用且无需重新定义 ThemeScope。

### Top 3 风险与缓解

1. **全局 classnames 切换影响面超出 Button**：中心化 `classnames` 会影响所有大写组件 token。缓解：implementation 先跑 targeted baseline，只在 checklist S2/S5 验证 Button 与 runtime，若发现全量 snapshot 大面积红，记录为后续组件迁移风险，不用本 feature 静默扩大迁移范围。
2. **DOM-only alias 被误读为公共 API**：`.cxd-*` 重新出现在 DOM 上可能诱导新依赖。缓解：alias 必须显式开启；design、测试和后续文档都把它写成迁移辅助；SCSS grep 证明不生成 `.cxd-Button` 库 selector。
3. **Root scope 和 env.theme 分叉**：Root 可能用 `props.theme`，env 可能用 `options.theme`，默认回退路径可能不同。缓解：S3 必须验证规范化主题名同时驱动 `env.theme`、`ThemeContext` 和 DOM attribute。
4. **主题配置更新后 classnames 缓存陈旧**：当前 `getTheme()` 会把 `config.classnames` 缓存在主题配置上；若实现允许 `theme('cxd', {legacyDomClassAlias: 'cxd'})` 之后即时生效，必须让 `theme()` 失效相关 classnames 缓存或让 classnames 从配置版本派生。缓解：S2 单测覆盖“先 getTheme 后 theme() 更新 alias”的顺序。

### 非显然依赖与基线风险

- `packages/amis-core/src/theme.tsx` 当前 `makeClassnames(ns)` 会把 `Button` 转成 `cxd-Button`，是本 feature 的主 seam。
- `packages/amis-core/src/Root.tsx` 当前只提供 `ThemeContext.Provider value={themeName}`，没有 Root DOM attribute。
- `packages/amis-core/src/index.tsx` 当前在 render path 中设置 `env.theme = getTheme(theme)`，需要与 Root 的主题名规范化保持一致。
- `packages/amis-ui/src/components/Button.tsx` 已经主要通过 `classnames: cx` 消费 `Button` / `Button--*` token，是 pilot 的理想观察点。
- `packages/amis-ui/scss/components/_button.scss` 体量大且依赖 `$ns`，本 feature 只能做最小样式证明，不做全量 SCSS 重写。

必跑验证入口收窄为：

- `npm test --workspace amis-core -- theme`
- `npm test --workspace amis -- button`
- `npm run stylelint`
- `npm run typecheck`
- `rg -n "\\.cxd-Button|#\\{\\$ns\\}Button|legacyDomClassAlias|componentClassPrefix|data-amis-theme" packages/amis-core packages/amis-ui packages/amis`

## 2. 名词与编排

### 2.1 名词层

#### 现状

- `ThemeConfig` 位于 `packages/amis-core/src/theme.tsx`，当前主要暴露 `classPrefix`、`renderers`、`components` 和开放扩展字段；`themes.cxd.classPrefix = 'cxd-'` 是默认主题前缀来源。
- `makeClassnames(ns)` 位于 `packages/amis-core/src/theme.tsx`，当前把大写开头 class token 加上 `ns`，例如 `Button` → `cxd-Button`。
- `ThemeInstance` 当前只保证 `getRendererConfig`、`getComponentConfig`、`classnames`，没有主题作用域值对象。
- `Root` 位于 `packages/amis-core/src/Root.tsx`，当前把 `themeName` 放进 `ThemeContext`，并把 `theme.classnames` / `theme.classPrefix` 传给 renderer；DOM 不带 `data-amis-theme`。
- `addRootWrapper` 位于 `packages/amis-core/src/Root.tsx`，当前允许外部包在 Root children 外层追加 Provider 或容器；`packages/amis/src/preset.tsx` 已用它包裹 HTML filter 和 ImageGallery。
- `Button` 位于 `packages/amis-ui/src/components/Button.tsx`，当前通过 `cx('Button', 'Button--primary', ...)` 生成 DOM class，不直接拼 `classPrefix`。

#### 变化

- 新增 `ThemeScope` 值对象：表达 `theme`、`attribute: 'data-amis-theme'`、`value`、`selector`、`tokenScopeSelector`。
- 扩展 `ThemeConfig`：新增 `componentClassPrefix?: 'amis-'` 与 `legacyDomClassAlias?: false | 'cxd'`，`classPrefix` 标记为 legacy/internal。
- 扩展 `ThemeInstance`：新增 `name`、`scope`、`stableClassnames`，保留 `classnames` 作为主调用入口；如实现需要，可新增 `legacyClassnames` 作为 internal migration helper。
- 新增 `getThemeScope(themeName)` / `getThemeScopeProps(themeName)` / `makeStableClassnames(prefix?: 'amis-')` 运行时接口。
- 新增或等价引入 `ThemeScopeRoot` 根作用域挂点：负责在 Root children 外层输出 `data-amis-theme`，同时尊重现有 `rootWrappers.reduce()` 的包裹顺序。
- 调整 `theme(name, config)` 或 `getTheme()` 缓存语义：影响 `componentClassPrefix` / `legacyDomClassAlias` / `scope` 的配置更新后，后续 `getTheme(name).classnames` 必须反映新配置。
- Button 不新增专属 alias 逻辑，只继续消费注入的 `classnames`。

#### 接口示例

```ts
// 来源：packages/amis-core/src/theme.tsx getTheme / makeClassnames
const theme = getTheme('cxd');
theme.scope;
// => {
//   theme: 'cxd',
//   attribute: 'data-amis-theme',
//   value: 'cxd',
//   selector: '[data-amis-theme="cxd"]',
//   tokenScopeSelector: '[data-amis-theme="cxd"]'
// }

theme.classnames('Button', 'Button--primary');
// alias 关闭 => 'amis-Button amis-Button--primary'

theme('cxd', {legacyDomClassAlias: 'cxd'});
getTheme('cxd').classnames('Button', 'Button--primary');
// alias 开启 => 'amis-Button cxd-Button amis-Button--primary cxd-Button--primary'
```

#### Interface 设计检查

- **Module**：`amis-core/src/theme.tsx` 的 Theme Runtime，现状为 classPrefix 驱动；本 feature 改造为 ThemeScope + stable classnames 驱动。
- **Interface**：caller 必须知道主题名、稳定组件前缀、alias 是否开启、`classPrefix` 仅 legacy/internal、`getTheme()` 对未知 / 空主题的规范化回退语义。
- **Seam**：seam 放在 `ThemeInstance` / `makeStableClassnames` / `getThemeScopeProps`，因为组件、Root、测试和后续 overlay/editor 都应穿过同一主题契约。
- **Depth / locality**：主题作用域、alias 组合和类名稳定化集中在 Theme Runtime；删掉该 seam 后，复杂度会重新散到 Button、Root 和后续组件迁移中。
- **Dependency strategy**：in-process；无远程依赖，无 adapter。
- **Adapter**：无。legacy alias 是同一 interface 的迁移选项，不是独立 adapter。
- **Test surface**：`amis-core` 单测覆盖 classnames / scope；`amis` 渲染测试穿过 Root + Button 观察 DOM。

### 2.2 编排层

主流程是线性派生链，暂不需要复杂流程图：

1. render entry 规范化 `themeName`。
2. `getTheme(themeName)` 派生 `ThemeInstance`。
3. `ThemeInstance.scope` 派生 Root DOM props。
4. Root 通过 `ThemeScopeRoot` / root wrapper 链路把 `data-amis-theme` 放到 children 外层的稳定 DOM 容器。
5. `ThemeContext`、`env.theme`、renderer props 使用同一个 `themeName` / `ThemeInstance`。
6. Button 通过 `classnames` 把 token `Button` / `Button--*` 转成稳定 DOM class。
7. 最小 Button SCSS / token 证明 `.amis-Button` 能读到主题作用域下的变量。

#### 现状

当前主流程是“主题名 → `getTheme()` → `classPrefix` → `makeClassnames(classPrefix)` → DOM class”。Root 只把主题名放进 React context，不把主题作用域写入 DOM；样式侧仍依赖 `$ns` 输出 `.cxd-Button`。

#### 变化

主流程改为“主题名 → `getTheme()` → `ThemeScope + stable classnames` → Root DOM scope + `.amis-Button`”。`classPrefix` 不再决定新 DOM class 主路径；alias 开关只在 classnames 输出阶段追加 legacy class。

#### 流程级约束

- **错误语义**：未知或非字符串主题名仍按现有语义回退到 `cxd` / default theme，但 Root DOM、ThemeContext、env.theme 必须回退到同一个结果。
- **幂等性**：重复调用 `getTheme('cxd')` 不得创建语义不同的 scope / classnames；缓存允许，但缓存 key 必须包含影响 classnames 输出的配置。
- **顺序约束**：Root scope props 必须在 renderer children 外层可见，并且不能吞掉或重排现有 root wrappers；Button 不负责补 root scope。
- **扩展点位置**：alias 只允许在 Theme Runtime 中配置和生成；组件内不得手写 `.cxd-*`。
- **可观测点**：DOM 上的 `data-amis-theme`、`.amis-Button`、alias 开关下的 `.cxd-Button`、grep 中不存在新增 `.cxd-Button` SCSS selector。

### 2.3 挂载点清单

- `ThemeConfig.legacyDomClassAlias`：新增显式迁移开关；删掉后 DOM-only `.cxd-*` alias 能力消失。
- `ThemeConfig.componentClassPrefix` / stable classnames：新增稳定组件类名前缀入口；删掉后 `.amis-*` 主路径消失。
- Root DOM `data-amis-theme`：新增主题作用域挂载点；删掉后 scoped token 和主题选择器无法按 root 生效。
- `ThemeScopeRoot` / root wrapper 根容器：新增 Root scope 的实际 DOM 挂点；删掉后 React context 仍在但 CSS theme scope 不可见。
- Button 最小稳定 selector / token 样式：新增 pilot 样式挂载点；删掉后无法证明 `.amis-Button` 样式闭环。

### 2.4 推进策略

1. **基线预检**：确认目标测试和 grep 基线，区分既有 `.cxd-*` 命中与本 feature 新增命中。
   退出信号：预检命令有输出记录，且新增 worktree diff 未混入无关改动。
2. **运行时契约**：建立 ThemeScope、stable classnames 和 DOM-only alias 输出规则。
   退出信号：`amis-core` 单测证明默认 `.amis-*`、alias 显式开启时 `.amis-* + .cxd-*`、未知主题回退一致，且 `theme()` 更新 alias 后缓存不陈旧。
3. **Root 作用域**：把同一规范化主题名同步到 `env.theme`、ThemeContext 和 DOM attribute。
   退出信号：渲染测试能在 root scope 容器上读到 `data-amis-theme="cxd"`，既有 root wrapper 顺序不被破坏，且 Button 使用同一主题实例。
4. **Button 最小样式闭环**：建立最小 `.amis-Button` selector / scoped token 证明路径。
   退出信号：样式侧存在 `.amis-Button` 与 `[data-amis-theme]` token 路径，且不生成 `.cxd-Button` 库 selector。
5. **DOM alias 验证**：用 Button 渲染覆盖 alias 关闭 / 开启两种路径。
   退出信号：关闭时 DOM 无 `.cxd-Button`，开启时 DOM 同时有 `.amis-Button` 与 `.cxd-Button`。
6. **范围守护**：grep / diff review 确认没有把全量组件、editor、overlay 或 SCSS legacy selector 兼容塞进 pilot。
   退出信号：新增 `.cxd-*`、`classPrefix`、`#{$ns}` 命中均能解释为 legacy/internal 或既有未触碰内容。
7. **收尾验证**：跑 targeted test、typecheck、stylelint，并更新 feature evidence。
   退出信号：核心命令通过；若出现既有红灯，必须记录基线归因，不得静默放行。

### 2.5 结构健康度与微重构

##### 评估

- 文件级 — `packages/amis-core/src/theme.tsx`：225 行；职责集中在主题注册、classnames、themeable 注入；本 feature 会改接口与生成逻辑，但仍属于同一主题运行时职责。
- 文件级 — `packages/amis-core/src/Root.tsx`：260 行；职责是 Root context / wrapper / renderer 编排；本 feature 只增加主题作用域输出，不改变 renderer 拓扑。
- 文件级 — `packages/amis-core/src/index.tsx`：432 行；render path 已负责 env.theme 派生；本 feature 只校准 themeName source-of-truth，不做 render 入口重构。
- 文件级 — `packages/amis-ui/src/components/Button.tsx`：167 行；组件职责清晰，已通过 `classnames` 消费 class token；不需要拆文件。
- 文件级 — `packages/amis-ui/scss/components/_button.scss`：871 行；体量偏胖且依赖 `$ns`，但本 feature 只允许最小 selector / token proof，不适合在 design 内做“只搬不改行为”重构。
- 文件级 — `packages/amis-ui/scss/_properties.scss`：898 行；token / CSS variable 体量偏胖，完整治理属于后续 token contract。
- 目录级 — `packages/amis-core/__tests__`：已有 17 个测试文件，本次新增 theme runtime 测试不会造成新的目录组织问题。
- 目录级 — `packages/amis/__tests__/renderers/Form`：已有约 70 个测试文件，本次复用 Button 渲染测试路径，不新增多文件分组。
- 目录级 — `packages/amis-ui/scss/components`：已有 96 个组件 SCSS 文件，目录已扁平；本 feature 不新增多个组件 SCSS 文件。
- compound convention：命中 `2026-07-24-explore-cxd-compat-compile-switch.md`，要求 DOM-only alias 优先放在 `ThemeInstance` / `makeClassnames` 附近，不做 SCSS 双轨。

##### 结论：不做

本 feature 不做前置微重构。原因：需要改变的是主题运行时契约，不是纯搬移；`_button.scss` 和 `_properties.scss` 虽胖，但在 token / selector 公共机制未稳定前拆文件会把行为迁移和结构整理混在一起。结构问题进入“超出范围观察”，不阻塞 pilot。

##### 超出范围的观察

- `packages/amis-ui/scss/components/_button.scss`：Button SCSS 体量大，后续 `stylesheet-stable-selector-build` 或 `core-component-selector-migration` 可考虑拆分变量、基础态和 modifier。
- `packages/amis-ui/scss/_properties.scss`：旧变量与新 `--amis-*` token 映射需要集中治理，属于 `token-contract-css-layers`。

## 3. 验收契约

### 关键场景清单

- **默认稳定类名**：渲染一个 Button，触发默认主题 `cxd` → Button DOM 包含 `.amis-Button` / `.amis-Button--default` / `.amis-Button--size-default`，不包含 `.cxd-Button`。
- **modifier 保持语义**：渲染 primary small loading / disabled Button → DOM 包含 `.amis-Button--primary`、`.amis-Button--size-sm`、`is-loading` 或 `is-disabled`，状态类不被错误加前缀。
- **Root 主题作用域**：渲染 amis root，传入 `theme: 'cxd'` 或默认主题 → root 可观察 DOM 带 `data-amis-theme="cxd"`。
- **alias 显式开启**：开启 `legacyDomClassAlias: 'cxd'` 后渲染 Button → DOM 同时包含 `.amis-Button` 和 `.cxd-Button`，modifier 也同时有 stable / legacy alias。
- **alias 默认关闭**：不传 alias 开关渲染 Button → DOM 不出现 `.cxd-Button`。
- **样式边界**：编译或源 SCSS 检查 → 本 feature 不新增 `.cxd-Button` 库 selector，不新增 SCSS legacy selector 双轨。
- **主题名 source-of-truth**：`env.theme`、ThemeContext 和 Root DOM attribute 对同一输入主题名给出同一规范化结果。
- **配置更新顺序**：先调用 `getTheme('cxd')`，再通过 `theme('cxd', {legacyDomClassAlias: 'cxd'})` 开启 alias → 后续 `getTheme('cxd').classnames('Button')` 反映 alias，不使用陈旧缓存。

### 明确不做的反向核对项

- `packages/amis-editor-core/**` 与 `packages/amis-theme-editor-helper/**` 不应出现本 feature 新增 diff。
- 本 feature diff 不应新增 `.antd-*` / `.dark-*` selector。
- 本 feature diff 不应新增 `.cxd-Button` SCSS selector；若 `.cxd-Button` 出现在测试期望中，只能是 DOM-only alias 场景。
- 本 feature 不应新增 overlay container helper 或 editor preview scope helper。
- 本 feature 不应把 IE11 动态 token 切换写成承诺。

### Acceptance Coverage Matrix

| Scenario | Covered By Step | Evidence Type | Command / Action | Core? |
|---|---|---|---|---|
| 默认 Button 输出 `.amis-Button` 且无 `.cxd-Button` | S2, S5 | test | `npm test --workspace amis -- button` | yes |
| Button modifier / state 类名保持语义 | S2, S5 | test | `npm test --workspace amis -- button` | yes |
| Root 输出 `data-amis-theme="cxd"` | S3 | test | `npm test --workspace amis -- button` 或新增 Root targeted test | yes |
| 既有 root wrappers 顺序不被 ThemeScopeRoot 破坏 | S3 | test, diff review | Root wrapper targeted test 或现有 wrapper 回归 | yes |
| alias 开启时 DOM 同时有 `.amis-*` 与 `.cxd-*` | S2, S5 | test | `npm test --workspace amis-core -- theme` + render test | yes |
| alias 关闭时 DOM 无 `.cxd-*` | S2, S5 | test | `npm test --workspace amis-core -- theme` + render test | yes |
| `theme()` 更新 alias 后 classnames 不使用陈旧缓存 | S2 | test | `npm test --workspace amis-core -- theme` | yes |
| 不新增 `.cxd-Button` SCSS selector | S4, S6 | command, diff review | `rg -n "\\.cxd-Button|#\\{\\$ns\\}Button" packages/amis-ui/scss` | yes |
| 不迁移 editor / overlay / 全组件 | S6 | diff review | `git diff --name-only` | yes |
| typecheck / stylelint 不因 pilot 破坏 | S7 | command | `npm run typecheck`, `npm run stylelint` | yes |

### DoD Contract

| ID | 要求 | 证据 | 阻塞级别 |
|---|---|---|---|
| DOD-DESIGN-001 | design / checklist 通过 design review gate；若独立 reviewer 不可用，必须有 owner 明确批准 local-only 降级 | design-review report | blocking |
| DOD-IMPL-001 | checklist steps 全部完成且 evidence 可追踪 | checklist / evidence | blocking |
| DOD-REVIEW-001 | code review passed 且无 unresolved blocking | review report | blocking |
| DOD-QA-001 | targeted test、typecheck、stylelint 和 selector grep 完成 | command output / QA report | blocking |
| DOD-ACCEPT-001 | roadmap item 状态与 feature evidence 回写完成 | acceptance report / items.yaml | blocking |

Validation Commands:

| ID | 命令 | 目的 | 核心性 | 失败处理 |
|---|---|---|---|---|
| CMD-001 | `npm test --workspace amis-core -- theme` | 验证 ThemeScope、stable classnames、alias 运行时契约 | core | fix-or-block |
| CMD-002 | `npm test --workspace amis -- button` | 验证 Root + Button DOM 最小闭环 | core | fix-or-block |
| CMD-003 | `npm run typecheck` | 跨包类型验证；当前存在 broad baseline，作为非核心基线记录 | non-core | document-baseline |
| CMD-004 | `npm run stylelint` | 验证 SCSS 变更风格与语法 | core | fix-or-block |
| CMD-005 | `rg -n "\\.cxd-Button|#\\{\\$ns\\}Button|legacyDomClassAlias|componentClassPrefix|data-amis-theme" packages/amis-core packages/amis-ui packages/amis` | 核对 selector / runtime 新增命中是否符合范围 | core | document-baseline |

Required Artifacts: implementation evidence、code review、QA report、acceptance report、必要 snapshots 或 DOM assertion diff。

### 清洁度规则

- 不允许留下临时 `console.log`、调试注释、注释掉的旧实现、未使用 import。
- 不允许新增无 owner 的 TODO/FIXME；若因后续 roadmap 拆分必须记录，只能写入 feature evidence 或 roadmap observation。
- 不允许用测试专用分支改变生产 classnames 语义；测试必须穿过 public/runtime interface。

## 4. 与项目级架构文档的关系

- ADR-001 已包含 `amis-`、ThemeScope、DOM-only alias 和 IE11 静态降级边界；本 feature 不顺手改 ADR。
- `requirements/CONTEXT.md` 已有“主题作用域”“稳定组件类名”“Legacy DOM 类名别名”等术语；只有 implementation 发现新跨 feature 术语时才回写。
- Acceptance 阶段需要核实 roadmap item `theme-runtime-button-pilot` 的状态，并在完成后把真实实现约束回写到 roadmap evidence / 后续条目输入中。
