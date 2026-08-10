---
doc_type: roadmap
slug: theme-system-refactor
status: active
created: 2026-07-24
last_reviewed: 2026-08-09
tags: [theme, design-token, css, editor]
related_requirements: []
related_architecture: []
related_adrs: [001-tokenized-theme-system]
related_context: [requirements/CONTEXT.md]
---

# 主题系统 token 化重构

## 1. 背景

ADR-001 已接受“token 与主题作用域选择器的双通道主题系统”：标准化样式值走 Design Token / CSS custom properties，组件身份输出稳定类名，主题身份由 `[data-amis-theme="..."]` 表达，非标准主题差异留在主题作用域选择器中。现有实现仍以 `classPrefix` 和 SCSS `$ns` 为核心：运行时把 `Button` 编译成 `cxd-Button` / `antd-Button`，主题 SCSS 通过 `$ns` 输出对应选择器，编辑器和主题编辑器又继续把 `.cxd-*` 当作可依赖 DOM API。

这次重构的目标不是“把 cxd 改成 amis”这么浅，而是把主题身份、组件身份、token 值、浮层继承、编辑器生成样式和用户覆写入口重新分层。完成后，最终用户只需要理解主题名、token、稳定组件类名和主题作用域，不再需要知道 `cxd-` / `antd-` / `dark-` 这类主题前缀。

## 2. 范围与明确不做

### 本 roadmap 覆盖

- 运行时主题 API：把 `ThemeConfig` / `ThemeInstance` 从“类名前缀驱动”改成“主题作用域 + 稳定组件类名驱动”。
- Token 契约：建立 palette、semantic、component、state 分层，以及 CSS layer 顺序 `amis.reset`、`amis.tokens`、`amis.components`、`amis.theme`、`amis.user`。
- 样式构建：把 SCSS `$ns` 生成的主题前缀组件选择器迁移为稳定 `.amis-*` 组件选择器，主题差异改写到 `[data-amis-theme="..."]` 下。
- 浮层主题传播：Overlay、Dialog、Toast、Tooltip、Popover、Select 下拉层等脱离普通 DOM 树的节点能携带或继承主题作用域。
- 核心组件迁移：优先迁移 Button、Form、Select、Dialog、Table / Table2、Dropdown / Popover / Tooltip 等高覆盖组件。
- 编辑器与主题编辑器：迁移 `.AMISCSSWrapper`、`.cxd-*`、`getTheme(...).classPrefix`、`ParseThemeData` 生成 CSS 等硬依赖。
- 验证、文档和收口：更新快照、示例、贡献文档、IE11 CSS 说明和用户覆写指南。

### 明确不做

- 不保留 `cxd-*`、`antd-*`、`dark-*` 作为新的公共样式 API；不做 `.cxd-*` SCSS/CSS legacy selector 双编译或双产物。允许评估显式开启的 DOM-only `.cxd-*` legacy class alias，只用于老定制页面自己的 `.cxd-*` CSS 继续命中；该 alias 最长保留目标为 1 年内复审，是否退出由人工架构评审决定，不绑定固定版本卡点。
- 不把所有主题差异强行 token 化；结构、形态、默认行为和第三方库主题仍由主题作用域选择器或主题行为对象承担。
- 不把组件 DOM 前缀做成运行时主题能力；`amis-` 是默认品牌级 build-time constant。未来如果要切换品牌前缀，必须作为统一构建配置和破坏性迁移处理，而不是通过主题或用户配置动态切换。
- 不在实现子 feature 时顺手改代码外的 ADR 或 requirements；发现过时信息先记录观察项，除非用户已明确要求同步决策文档。
- 不重写完整视觉设计语言；本次先建立主题系统机制和迁移路径，不重新设计 cxd / antd / dark 的视觉规格。
- 不直接承诺 IE11 等无 CSS custom properties 环境的完整动态主题能力；IE11 构建产物只作为兼容风险单独评估。

### Granularity Gate

| 判断项 | 结论 |
|---|---|
| 为什么不是 single feature | 涉及 `amis-core` 运行时、`amis-ui` SCSS 构建、`amis` 渲染器、浮层容器、编辑器、主题编辑器、测试快照和文档，且需要多条可恢复迁移链。 |
| 为什么不是 brainstorm | ADR-001 已拍板目标形态和边界，现有代码事实也足够定位主要接口；当前问题是如何拆执行，而不是是否要做。 |
| roadmap 边界 | 只覆盖主题系统从前缀类名迁移到 token + theme scope 的执行规划；不覆盖新视觉规范、产品级主题策略或全量外部兼容承诺。 |
| 最小闭环 | `theme-runtime-button-pilot` 完成后，最窄路径能渲染一个 Button：根节点带 `[data-amis-theme]`，组件输出 `.amis-Button`，样式从 scoped token 取值，并有测试证明旧 `classPrefix` 不再是该路径的必要条件。该 pilot 同时验证显式 DOM-only `.cxd-*` alias 开关在 Button 上可开启/关闭，但不做 SCSS `.cxd-*` 兼容、全量 token 治理或批量组件迁移。 |

### Postmortem Hardening Gate

2026-07-30 的表单视觉回归暴露出四个设计执行缺口：组件前缀 source-of-truth 没有覆盖 Root 到 FormItem 控件的完整下发链路；Overlay scope 传播没有明确 layout-neutral 约束；直接 `Portal` / `createPortal` 路径没有被纳入 ThemeScope 统一 gate；验证矩阵偏 helper / snapshot，缺少真实页面弹层定位和控件视觉检查。因此后续主题系统相关修补、审计或二次迁移必须额外满足：

- **组件 DOM 前缀唯一来源**：所有公开组件 DOM classPrefix 只能来自 `ThemeInstance.componentClassPrefix || DEFAULT_COMPONENT_CLASS_PREFIX`；`DEFAULT_COMPONENT_CLASS_PREFIX` 默认值为 `amis-`，且属于品牌级 build-time constant。`ThemeInstance.classPrefix` 仅允许 legacy/internal 读取，不得通过 Root、themeable、renderer props、FormItem、amis-ui 子组件或第三方 `prefixCls` 继续派生公开 DOM 类。
- **ThemeScope 传播必须 layout-neutral**：为了注入 `[data-amis-theme]`，不得新增影响 `offsetParent`、定位容器、滚动容器、尺寸计算或事件边界的 wrapper；隐藏态 / 未 mount 态不得提前修改 container scope。所有直接使用 `Overlay`、`Portal` 或 `ReactDOM.createPortal` 的脱树渲染路径都必须进入同一 ThemeScope gate，不能只验证 `Overlay` 主路径。
- **直接 portal 必须分类治理**：渲染公开 amis UI 的 direct portal 必须使用 shared ThemeScope resolution / application helper，或在实体 portal 节点上 layout-neutral 地携带作用域；editor-only、非主题 UI 的 direct portal 可以作为 `theme-scope-portal-exception`，但必须有测试证明它不承载公共 amis 主题样式契约，且 policy 中明确分类。
- **Root scope 必须附着真实宿主节点**：`Root` 不得通过额外 `<div>` 包住 `RootRenderer` 来注入 `data-amis-theme`。`RootRenderer` 在真实宿主根挂载和更新时应用当前主题作用域，以保留现有页面的直接子节点布局契约，并覆盖主题切换和懒加载根节点替换。
- **真实渲染链路必须进 gate**：涉及前缀、浮层或基础表单控件的改动，除了 helper 单测和快照，还必须覆盖至少一条 `Root -> SchemaRenderer -> FormItem -> 控件 -> amis-ui 子组件 -> Overlay` 链路，并用浏览器证据检查 DOM class、popover `offsetParent`、控件宽高和用户点名页面截图。

### 2026-08-09 视觉回归补充结论

双服务像素回归发现，`ThemeScopeRoot` 的额外 `<div data-amis-theme>` 会插入 `schema-wrapper` 与 `.amis-Page` 之间，破坏 examples 既有的直接子节点选择器和 Flex 宽度分配，造成示例页面主内容区被压缩。修正为 `RootRenderer` 将作用域属性直接应用到真实宿主根节点，并在主题更新时同步属性；未恢复 `.cxd-*` SCSS 兼容层。

示例页签 127 页复测结果：`103 pass / 1 warn / 1 fail / 22 content-drift / 0 error`。剩余高差异页面均有独立的动态内容原因：验证码、轮播图、异步服务数据或随机表格数据；未再发现 Root scope 导致的结构性布局回归。完整报告：`.gstack/visual-regression/examples-2026-08-09-root-scope-fixed/`。

## 3. 模块拆分（概设）

```
theme-system-refactor
├── Theme Runtime：主题注册、作用域、稳定 classnames、行为对象
├── Token Contract：token 分层、命名、CSS custom properties、CSS layers
├── Stylesheet Build：SCSS helper、稳定选择器、主题作用域覆写
├── Overlay Scope：浮层容器主题继承和 portal 节点装饰
├── Component Migration：核心组件选择器、DOM 查询和快照迁移
├── Editor Integration：编辑器预览、主题编辑器、用户 CSS 生成
└── Verification And Docs：测试矩阵、示例、贡献文档、发布说明
```

### Theme Runtime · 运行时主题基础

- **职责**：定义主题身份、主题作用域、稳定组件 classnames 和主题行为对象的统一运行时契约；让 `themeable()` / `Root` / `env.theme` 注入的对象不再把 `classPrefix` 当作唯一核心。
- **不做**：不负责具体 token 值和组件 SCSS 迁移。
- **承载的子 feature**：`theme-runtime-button-pilot`、`legacy-prefix-teardown`
- **触碰的现有代码 / 模块**：`packages/amis-core/src/theme.tsx`、`packages/amis-core/src/Root.tsx`、`packages/amis-core/src/index.tsx`、`packages/amis-ui/src/themes/*.ts`
- **Depth 判断**：deep。主题身份、稳定类名和行为对象统一藏在 `ThemeInstance` 后面，调用方不再各自拼接主题前缀。
- **Source of truth**：规范化后的 `themeName` 是唯一输入源；`ThemeInstance`、`ThemeScope`、`ThemeContext`、`env.theme` 和 Root DOM attribute 都必须由同一个 `themeName` 派生，不能分别回退到全局默认值。

### Token Contract · token 与 CSS layer 契约

- **职责**：建立 token 命名层级、token 作用域、CSS layer 输出顺序，以及主题包如何覆盖 token。
- **不做**：不逐个迁移全部组件样式；组件迁移由 Component Migration 承担。
- **承载的子 feature**：`token-contract-css-layers`
- **触碰的现有代码 / 模块**：`packages/amis-ui/scss/_variables.scss`、`packages/amis-ui/scss/_properties.scss`、`packages/amis-ui/scss/themes/*.scss`、构建脚本和产物入口。
- **Depth 判断**：deep。token 契约会成为所有组件和 theme-editor 的共享协议，必须集中治理，不能让每个组件自己发明 token 名。

### Stylesheet Build · 稳定选择器构建

- **职责**：把 `.#{$ns}Button` 这类前缀选择器迁移到 `.amis-Button`，把主题差异放进 `[data-amis-theme="..."] .amis-Button`，并定义 SCSS helper / lint / 搜索规则防止新增前缀选择器。
- **不做**：不改 React 组件业务逻辑；只提供样式侧迁移机制和批量迁移规则。
- **承载的子 feature**：`stylesheet-stable-selector-build`、`core-component-selector-migration`
- **触碰的现有代码 / 模块**：`packages/amis-ui/scss/components/**`、`packages/amis-ui/scss/themes/**`、`packages/amis/src/renderers/**`
- **Depth 判断**：deep。该模块把选择器生成策略集中在 Sass helper / 构建规则中，避免调用方散落字符串替换。

### Overlay Scope · 浮层主题传播

- **职责**：保证 portal / body 下的 Dialog、Toast、Tooltip、Popover、Select 下拉层、Dropdown menu 等都能携带或继承当前主题作用域和 token。
- **不做**：不重新实现浮层定位或动画。
- **承载的子 feature**：`overlay-theme-scope-propagation`
- **触碰的现有代码 / 模块**：`packages/amis-core/src/components/Overlay.tsx`、`EnvContext.getModalContainer` 使用点、`packages/amis/src/renderers/Dialog.tsx`、`DropDownButton.tsx`、`TooltipWrapper.tsx`、Select / PopOver 相关组件。
- **Depth 判断**：deep。浮层是 theme scope 最容易泄漏的边界，应通过统一 scope applicator 处理，而不是每个组件手动补属性。

### Component Migration · 核心组件迁移

- **职责**：按风险和覆盖面迁移组件 DOM class、DOM 查询和测试快照，让组件消费稳定类名和 component/state token。
- **不做**：不引入新的组件 API；不把内部实现细节写进 roadmap。
- **承载的子 feature**：`core-component-selector-migration`
- **触碰的现有代码 / 模块**：Button、Form、Select、Dialog、Table / Table2、Dropdown、Tooltip、Popover、Page、Layout 等组件和渲染器。
- **Depth 判断**：medium-deep。每个组件迁移是局部的，但共享规则来自 Runtime / Stylesheet Build / Token Contract。

### Editor Integration · 编辑器和主题编辑器集成

- **职责**：把编辑器预览容器、右侧面板、iframe preview、theme-editor helper、用户 CSS 生成从 `.cxd-*` / `.AMISCSSWrapper` 转向主题作用域和稳定组件类名。
- **不做**：不重新设计编辑器 UI。
- **承载的子 feature**：`editor-theme-helper-migration`
- **触碰的现有代码 / 模块**：`packages/amis-editor-core/src/manager.ts`、`packages/amis-editor-core/src/util.ts`、`packages/amis-editor-core/scss/**`、`packages/amis-theme-editor-helper/src/helper/ParseThemeData.ts`、`packages/amis-theme-editor-helper/src/style/**`
- **Depth 判断**：deep。编辑器是用户自定义 CSS 的生产者和预览者，必须消费同一套 ThemeScope / TokenContract，不能另开一套选择器规则。

### Verification And Docs · 验证与文档收口

- **职责**：建立迁移期间的测试矩阵、快照更新规则、示例验证、贡献文档和用户覆写指南；处理 IE11 CSS 产物说明和发布风险。
- **不做**：不替代每个 feature 的实现级测试。
- **承载的子 feature**：`theme-system-validation-docs-rollout`
- **触碰的现有代码 / 模块**：`package.json` scripts、`docs/zh-CN/start/getting-started.md`、`docs/zh-CN/extend/contribute.md`、examples、Jest snapshots、build scripts。
- **Depth 判断**：medium。它不隐藏复杂业务逻辑，但提供跨 feature 的验收标准和回归入口。

## 4. 模块间接口契约 / 共享协议（架构层详设）

### 4.1 ThemeScope 运行时契约

**方向**：Theme Runtime → Root / themeable / Overlay Scope / Editor Integration
**形式**：TypeScript 类型 + React context + DOM attributes

**契约**：

```ts
type ThemeName = string;

interface ThemeScope {
  theme: ThemeName;
  attribute: 'data-amis-theme';
  value: ThemeName;
  selector: `[data-amis-theme="${string}"]`;
  tokenScopeSelector: ':root' | `[data-amis-theme="${string}"]`;
}

interface ThemeConfig {
  classPrefix?: string; // legacy/internal only; not a public styling contract
  componentClassPrefix?: string; // build-time brand prefix, default 'amis-'; not runtime theme state
  legacyDomClassAlias?: false | 'cxd'; // migration-only DOM alias, no legacy CSS output
  scope?: Partial<ThemeScope>;
  renderers?: Record<string, any>;
  components?: Record<string, any>;
  [propName: string]: any;
}

interface ThemeInstance extends ThemeConfig {
  name: ThemeName;
  scope: ThemeScope;
  classnames: ClassNamesFn;        // outputs stable component classes and optional DOM aliases
  stableClassnames?: ClassNamesFn; // stable-only helper for tests/internal migration
  legacyClassnames?: ClassNamesFn; // migration-only alias helper, not public styling API
  getRendererConfig(name?: string): any;
  getComponentConfig(name?: string): any;
}

function getTheme(theme: ThemeName): ThemeInstance;
function getThemeScope(theme: ThemeName): ThemeScope;
function getThemeScopeProps(theme: ThemeName): {'data-amis-theme': ThemeName};
function makeStableClassnames(prefix?: string): ClassNamesFn;
```

**约束**：

- `ThemeInstance.classnames('Button')` 必须输出 `.amis-Button` 语义的稳定类名；只有显式开启 `legacyDomClassAlias: 'cxd'` 时才允许额外附加 `.cxd-Button`。
- 默认公共组件类名为 `.amis-*`；如果未来执行品牌级前缀更名，必须通过同一个 build-time component prefix 同步 runtime classnames、SCSS `$amis-component-prefix`、theme-editor helper、examples/docs shell、测试选择器和截图基线。
- `componentClassPrefix` 不得暴露成按主题、按 root 或按用户输入动态切换的运行时主题 API；同一构建产物只承诺一个公开组件前缀。
- `ThemeInstance.classPrefix` 只允许作为内部迁移读取点；新代码不得用它拼接组件选择器。
- `Root`、`themeable()`、`getClassPrefix()`、`SchemaRenderer`、FormItem 控件 props 和传给 amis-ui / 第三方子组件的 `classPrefix` / `prefixCls` 必须全部使用 `componentClassPrefix`；不得出现 `theme.classPrefix` 继续作为公开组件 DOM 前缀的旁路。
- DOM-only legacy alias 不得生成 `.cxd-*` 库 CSS，不得要求 SCSS helper 输出双选择器，不得从任意 `classPrefix` 自动推导 `.antd-*` / `.dark-*` alias。
- DOM-only legacy alias 是 best-effort 迁移桥，只保证 `classnames()` 生成路径可在显式开启后附加 `.cxd-*`；不承诺覆盖全部手写 `${classPrefix}Xxx` 拼接路径，旧定制页面仍必须迁移到 token / `.amis-*` / `[data-amis-theme]` 主路径。
- DOM-only legacy alias 必须记录开启方式、默认状态、适用场景和复审时间点；最长保留目标为首次进入可用迁移路径后 1 年内复审，是否退出由人工架构评审决定。
- `Root` 必须在真实 amis 根 DOM 上输出 `data-amis-theme={themeName}`；不得为了作用域注入额外布局 wrapper。
- `ThemeContext` 保存主题名；需要完整对象的调用方通过 `getTheme()` 或新的 ThemeScope context 获取，不靠字符串拼接。
- `env.theme` 是从规范化 `themeName` 派生的缓存对象，不是第二个 source of truth；Root、Overlay 和 Editor preview 必须共享同一条派生链。
- 多个 amis root 并存时，Root DOM scope、ThemeContext、`env.theme`、portal scope 必须按各自 root 的 `themeName` 隔离，不得回落到进程级 `defaultTheme`。
- 主题行为对象继续保留 renderer/component/chart/editor 配置，不试图转成 CSS token。

**Interface 设计检查**：

- Module / interface：`amis-core/src/theme.tsx` 暴露唯一运行时主题契约，Root、组件和编辑器只消费该契约。
- Seam placement：seam 放在 `ThemeInstance` / `ThemeScope`，因为调用方需要的稳定类名、scope props、行为配置都从这里进入。
- Depth / locality：后续改 theme scope 属性名或 token scope 规则时，变更集中在 Theme Runtime。
- Dependency strategy：in-process；不需要 adapter。
- Adapter：无。若实现阶段为旧 classPrefix 加 helper，必须命名为 legacy/internal，并有显式开启条件与移除条件。
- Test surface：`packages/amis-core` 增加 theme runtime 单元测试；`amis` 渲染快照证明 DOM 同时具备 root scope 和稳定组件类名，并证明 DOM-only alias 开启时出现 `.cxd-*`、关闭时消失。必须至少覆盖一条 FormItem 控件链路，证明 `Root` 下发的 `classPrefix` 到控件根类和 amis-ui 子组件均为 `amis-*`。

### 4.2 TokenContract 与 CSS Layer 契约

**方向**：Token Contract → Stylesheet Build / Component Migration / Editor Integration
**形式**：CSS custom properties + SCSS maps / helper + 文档化命名规则

**契约**：

```scss
@layer amis.reset, amis.tokens, amis.components, amis.theme, amis.user;

@layer amis.tokens {
  :root {
    --amis-palette-blue-500: #2468f2;
    --amis-color-brand-bg: var(--amis-palette-blue-500);
    --amis-Button-primary-bg: var(--amis-color-brand-bg);
    --amis-Button-primary-hover-bg: var(--amis-palette-blue-600);
  }

  [data-amis-theme='dark'] {
    --amis-color-brand-bg: var(--amis-palette-blue-400);
  }
}

@layer amis.components {
  .amis-Button {
    background: var(--amis-Button-bg);
  }
}

@layer amis.theme {
  [data-amis-theme='antd'] .amis-Tabs {
    /* 非标准结构或形态差异 */
  }
}
```

**约束**：

- Token 分层固定为 palette → semantic → component → state；组件样式优先消费 component/state token，避免直接消费 palette token。
- token 命名使用 `--amis-*` 命名空间；旧 `--colors-*` / `--button-*` 如需迁移映射，只能在迁移层集中定义，不允许新代码继续扩散。
- CSS layer 顺序必须固定为 ADR-001 顺序：`amis.reset`、`amis.tokens`、`amis.components`、`amis.theme`、`amis.user`。
- 用户覆写入口进入 `amis.user` 或更晚加载的用户 CSS；文档不得再要求用户理解 `#{$ns}` 或 `.cxd-*`。
- IE11 构建不能支持运行时 CSS custom properties 动态切换；相关产物只能作为静态降级能力在文档中明确。

**Interface 设计检查**：

- Module / interface：TokenContract 提供 token 命名、默认值和 layer 顺序，组件和 theme-editor 都必须遵守。
- Seam placement：seam 放在 token 文件 / SCSS helper，而不是每个组件自己定义根变量。
- Depth / locality：token 命名变更集中在 token contract 和 generator，组件只读 component/state token。
- Dependency strategy：in-process build-time；无远程依赖。
- Adapter：无；旧 token 迁移映射是数据映射，不是运行时 adapter。
- Test surface：stylelint / snapshot / 构建产物检查 CSS layer、`data-amis-theme` scope 和禁止新增 `.cxd-*` 公共选择器。

### 4.3 StableSelector SCSS 契约

**方向**：Stylesheet Build → Component Migration / Verification
**形式**：SCSS helper / lint 约束 / selector policy

**契约**：

```scss
$amis-component-prefix: 'amis-' !default;
$amis-theme-attr: 'data-amis-theme' !default;

@mixin amis-component($name) {
  .#{$amis-component-prefix}#{$name} {
    @content;
  }
}

@mixin amis-theme($theme) {
  [#{$amis-theme-attr}='#{$theme}'] {
    @content;
  }
}

@include amis-component('Button') {
  color: var(--amis-Button-color);
}

@include amis-theme('dark') {
  .amis-Button {
    color: var(--amis-Button-dark-color);
  }
}
```

**约束**：

- 新 SCSS 不得通过 `$ns` 生成主题前缀组件选择器。
- `$amis-component-prefix` 是 SCSS 侧唯一组件前缀输入，默认 `amis-`；未来品牌前缀更名必须通过该 build-time 变量与运行时 `componentClassPrefix` 同步，不允许在主题 SCSS 中散落品牌前缀。
- SCSS / CSS 构建不提供 `.cxd-*` legacy selector 双输出；DOM-only alias 的验证归 Theme Runtime，不归 Stylesheet Build。
- 新增代码禁止新增 `.cxd-*` / `.antd-*` / `.dark-*` selector、禁止新增 `classPrefix` 样式依赖、禁止新增 editor 对 `.cxd-*` 的生成或查询依赖；唯一例外是 selector inventory 标注的 DOM alias 生成路径、历史文档引用和内部 legacy allowlist。
- 主题差异只能写在 `[data-amis-theme='x']` 作用域下，不能重新发明 `.dark-Button` 这样的公共类名。
- 稳定组件类名大小写和 BEM 状态沿用现有组件语义，例如 `.amis-Button--primary`、`.amis-Form-item`。
- 迁移组件时，必须同时处理 TS / TSX 中对 `classPrefix` 的 DOM 查询，例如 `querySelector(\`.${classPrefix}Table\`)`。
- `stylesheet-stable-selector-build` 必须先产出 selector inventory / allowlist，至少分为：public API forbidden、dom alias generated allowed、internal legacy helper allowed、theme package filename allowed、historical docs mention allowed、generated build artifact ignored。
- selector guard 默认承担债务退出压力：`--update` 只能保持或减少 legacy baseline；任何 baseline 增长必须显式使用增长开关并经过人工审查，避免把新债务静默固化进 policy。
- `legacy-prefix-teardown` 的通过条件必须引用该 allowlist；没有分类的 `.cxd-*` / `.antd-*` / `.dark-*` / `$ns` / `classPrefix` 命中不得静默保留。

**Interface 设计检查**：

- Module / interface：Stylesheet Build 暴露 selector helper，组件 SCSS 通过 helper 输出稳定选择器。
- Seam placement：seam 放在 SCSS helper 和 lint 规则；测试和组件都穿过编译后 CSS 验证。
- Depth / locality：selector policy 变化集中在 helper。
- Dependency strategy：build-time local-substitutable；可以用 fixture SCSS 做测试。
- Adapter：无。
- Test surface：编译 fixture 验证 `.amis-*`、`[data-amis-theme]`、CSS layer；grep / lint 禁止新增 public `.cxd-*`，并证明 SCSS 不因 DOM alias 开关输出 `.cxd-*` legacy selector。

### 4.4 OverlayThemeScope 契约

**方向**：Theme Runtime / Overlay Scope → Overlay / Modal / Toast / Tooltip / Popover / Select
**形式**：TypeScript helper + DOM attribute propagation

**契约**：

```ts
interface ThemeScopeCarrier {
  theme: ThemeName;
  scope: ThemeScope;
}

function getNearestThemeScope(node: HTMLElement | null): ThemeScope | null;
function applyThemeScope(node: HTMLElement, scope: ThemeScope): void;
function resolveOverlayContainer(
  requested: HTMLElement | (() => HTMLElement | null) | undefined,
  fallback: () => HTMLElement,
  scope: ThemeScope
): HTMLElement;
```

**约束**：

- 所有渲染到 `body` 或自定义 container 的浮层根节点必须带 `data-amis-theme`，或挂载到已带该属性的最近容器下。
- `Overlay` 不改变定位语义，只负责在真实浮层节点或已存在的 mount root 上保证主题作用域可见；不得新增影响布局、`offsetParent` 或定位计算的 wrapper。
- `Overlay` 在 `show=false` 且无 transition residual mount 时不得提前解析 / 修改 container theme scope。
- `Modal`、`Drawer`、`PopUp`、移动端 picker、全局 loading 等直接 `Portal` / `createPortal` 路径必须复用同一 ThemeScope resolution / application 机制；不得各自手写不完整的 scope 复制逻辑。
- `env.getModalContainer` 仍可作为业务自定义容器入口，但主题作用域装饰必须由统一 helper 处理。
- 多个 amis root 并存时，浮层不能错误继承全局默认主题；必须使用触发组件所在 root 的 ThemeScope。
- iframe preview / editor preview 需要同样的 scope 注入规则。

**Interface 设计检查**：

- Module / interface：OverlayThemeScope helper 是唯一 DOM scope applicator；各组件不手写属性复制逻辑。
- Seam placement：seam 放在 Overlay / modal container 解析点，因为这是普通 DOM 树和 portal 树的边界。
- Depth / locality：后续新增浮层类型时，只需调用同一 helper。
- Dependency strategy：in-process DOM；测试可用 jsdom + fake container。
- Adapter：无。
- Test surface：Dialog / Tooltip / Dropdown / Select / PopUp 下拉层在自定义 container 和默认 body container 下都能拿到正确 `data-amis-theme`；必须断言无额外 layout wrapper、隐藏态不修改 container scope，并用浏览器证据记录至少 Select / ColorPicker 一类 popover 的 `offsetParent` 为触发控件。直接 `Portal` / `createPortal` 组件要有独立用例证明没有绕过 ThemeScope helper。

### 4.5 EditorThemeCss 契约

**方向**：Editor Integration → Theme Runtime / Token Contract / Stylesheet Build
**形式**：theme-editor CSS generator contract + preview scope contract

**契约**：

```ts
interface ThemeCssGenerationOptions {
  theme: ThemeName;
  scope: ThemeScope;
  componentClassPrefix: string; // build-time brand prefix, default 'amis-'
  tokenNamespace: '--amis';
}

interface GeneratedThemeCss {
  tokenCss: string;       // [data-amis-theme='x'] { --amis-... }
  selectorCss: string;    // [data-amis-theme='x'] .<componentClassPrefix>Button { ... }
  customCss: string;      // user-provided CSS, loaded in user layer
}
```

**约束**：

- `ParseThemeData` 不得生成 `.cxd-Button...`；必须基于 ThemeScope + `.amis-*` 生成。
- `.AMISCSSWrapper` 若继续存在，只能作为编辑器 preview / 用户 CSS 容器别名，不得承载主题身份；主题身份必须来自 `data-amis-theme`。
- `getCssVarById('baseStyle', ':root, .AMISCSSWrapper')` 这类读取入口要迁移到 TokenContract 定义的 scope 列表。
- 编辑器内置 SCSS 中的 `.cxd-*` 选择器必须改为 `.amis-*` 或 `[data-amis-theme] .amis-*`。
- `editor-theme-helper-migration` 的验收必须拆成四类：generated CSS、preview scope、historical schema migration、helper SCSS inventory；只改 CSS generator 不算完成。
- `style2ThemeCss` 等历史 schema 迁移入口必须明确旧 schema 中 `.cxd-*` / themeCss 的处理边界，避免新生成样式正确但旧数据继续暴露主题前缀。

**Interface 设计检查**：

- Module / interface：EditorThemeCss 只消费 ThemeScope / TokenContract，不定义第二套主题身份。
- Seam placement：seam 放在 theme-editor helper 的生成选项和预览根节点。
- Depth / locality：后续 theme-editor token schema 变化集中在 helper。
- Dependency strategy：in-process generation + DOM preview。
- Adapter：无。
- Test surface：生成 CSS 文本不包含 `.cxd-`；编辑器 preview root 和 iframe root 带 `data-amis-theme`；自定义 token 在预览中生效。

## 5. 子 feature 清单

1. **theme-runtime-button-pilot** — 建立 ThemeScope / 稳定 classnames 运行时契约，并用 Button 走通最窄端到端样式闭环。
   - 所属模块：Theme Runtime、Token Contract、Stylesheet Build、Component Migration
   - 依赖：无
   - 状态：done
   - 对应 feature：`2026-07-24-theme-runtime-button-pilot`
   - 备注：最小闭环；只允许 Button、最小 token alias、最小 SCSS entry、必要 runtime scope 和 DOM-only `.cxd-*` alias 开关验证，不能把 SCSS legacy selector 兼容、全量 token 治理或其他组件迁移塞进 pilot。

2. **token-contract-css-layers** — 固化 token 分层、`--amis-*` 命名、CSS layer 顺序和主题包 token 覆写入口。
   - 所属模块：Token Contract
   - 依赖：`theme-runtime-button-pilot`
   - 状态：done
   - 对应 feature：`2026-07-25-token-contract-css-layers`
   - 备注：包含旧 token 映射策略和 IE11 静态降级说明，但不迁移全部组件。

3. **stylesheet-stable-selector-build** — 建立 SCSS helper / 构建规则 / selector inventory / allowlist / lint 或 grep guard，把新增样式约束到 `.amis-*` 与 `[data-amis-theme]`。
   - 所属模块：Stylesheet Build
   - 依赖：`theme-runtime-button-pilot`、`token-contract-css-layers`
   - 状态：done
   - 对应 feature：`2026-07-25-stylesheet-stable-selector-build`
   - 备注：已建立 stable selector helper、selector inventory / allowlist、`check:theme-selectors` guard 和正反例 fixture；当前 policy 锁定 2233 个 legacy baseline match，新增未分类 `.cxd-*` / `#{$ns}` / `classPrefix` selector 依赖会失败。未迁移核心组件和 editor/theme-editor helper，相关旧债交给后续迁移项。

4. **overlay-theme-scope-propagation** — 统一 Overlay / portal / modal container 的 theme scope 传播，覆盖 Dialog、Tooltip、Popover、Dropdown 和 Select 下拉层。
   - 所属模块：Overlay Scope
   - 依赖：`theme-runtime-button-pilot`
   - 状态：done
   - 对应 feature：`2026-07-25-overlay-theme-scope-propagation`
   - 备注：已验证多 amis root、body container、自定义 container、iframe container 和 editor preview 边界；full Dialog / Tooltip / Select 旧 selector suite 作为后续组件迁移 baseline risk。

5. **core-component-selector-migration** — 迁移高覆盖组件和渲染器的 `.cxd-*` / `$ns` / `classPrefix` DOM 查询，改为稳定 `.amis-*` 与 component/state token。
   - 所属模块：Component Migration、Stylesheet Build
   - 依赖：`stylesheet-stable-selector-build`、`overlay-theme-scope-propagation`
   - 状态：done
   - 对应 feature：`2026-07-25-core-component-selector-migration`
   - 备注：已完成 Button 后续、Form、Select、Dialog / Drawer / Modal、Table / Table2、Dropdown / Tooltip / Popover、Page / Layout 的稳定 selector 迁移；selector guard 通过，1507 legacy baseline match(es)、0 new violation(s)，剩余债务进入 legacy-prefix-teardown 输入。

6. **editor-theme-helper-migration** — 迁移编辑器、预览容器、theme-editor helper、历史 schema 迁移和内置 SCSS 的 `.cxd-*` / `.AMISCSSWrapper` 主题身份依赖。
   - 所属模块：Editor Integration
   - 依赖：`token-contract-css-layers`、`stylesheet-stable-selector-build`、`overlay-theme-scope-propagation`
   - 状态：done
   - 对应 feature：`2026-07-25-editor-theme-helper-migration`
   - 备注：已完成 generated CSS、preview scope、iframe scope、historical schema migration 和 helper SCSS inventory；`AMISCSSWrapper` 仅保留为容器别名，selector guard 1503 legacy baseline match(es)、0 new violation(s)，剩余 editor/helper legacy 命中进入 `legacy-prefix-teardown` 输入。

7. **legacy-prefix-teardown** — 基于 selector allowlist 移除或内部化剩余 `classPrefix` 公共依赖，并收敛 DOM-only `.cxd-*` alias 的开关、文档、复审机制和移除条件。
   - 所属模块：Theme Runtime、Verification And Docs
   - 依赖：`core-component-selector-migration`、`editor-theme-helper-migration`
   - 状态：done
   - 对应 feature：`2026-07-25-legacy-prefix-teardown`
   - 备注：已完成 LegacyPrefixLedger、AliasRetentionRecord、DOM-only alias policy、behavior selector 迁移与 guard 收紧；selector guard 通过，1503 legacy baseline match(es)、0 new violation(s)，bad fixture 覆盖 props alias、解构 alias、预构造 selector、cx/classnames、classList.contains 与 Sortable selector；不生成 `.cxd-*` 库 CSS。

8. **theme-system-validation-docs-rollout** — 完成跨包验证、examples inventory、贡献文档、主题覆写指南、IE11 说明和发布风险记录。
   - 所属模块：Verification And Docs
   - 依赖：`legacy-prefix-teardown`
   - 状态：done
   - 对应 feature：`2026-07-25-theme-system-validation-docs-rollout`
   - 备注：已完成 ValidationMatrix、DocsMigrationMap、ExamplesThemeInventory、IE11 静态降级说明、ReleaseRiskRecord、用户主题覆写指南和贡献指南收口；examples shell 旧前缀保留为 risk accepted / follow-up，`npm run typecheck` broad baseline 作为 non-core document-baseline。

**最小闭环**：第 1 条 `theme-runtime-button-pilot` 完成后，可以用一个最小页面证明：Root 输出 `[data-amis-theme="cxd"]`，Button DOM 默认输出 `.amis-Button`，Button 样式读取 scoped token，切换到 dark 时通过 token / theme scope 生效，且这条路径不依赖 `.cxd-Button`；显式开启 DOM-only legacy alias 时，Button DOM 额外带 `.cxd-Button`，老用户 CSS 可命中，但库 SCSS 不输出 `.cxd-*`。

### Goal Coverage Matrix

| Goal / completion signal | Covered by item(s) | Verification entry | Evidence type | Core? |
|---|---|---|---|---|
| 用户渲染组件时看到稳定 `.amis-*` 组件类名，不再把主题名编码进组件类名 | `theme-runtime-button-pilot`, `core-component-selector-migration`, `legacy-prefix-teardown` | targeted Jest snapshot / DOM render test / selector allowlist guard | test, snapshot, command | yes |
| 主题身份由 `[data-amis-theme]` 表达，Root 和浮层都能继承正确主题 | `theme-runtime-button-pilot`, `overlay-theme-scope-propagation`, `editor-theme-helper-migration` | jsdom portal tests / multi-root manual examples / editor preview checks | test, screenshot, acceptance report | yes |
| 标准样式值通过 token 和 CSS custom properties 管理，且 CSS layer 顺序符合 ADR-001 | `token-contract-css-layers`, `stylesheet-stable-selector-build` | stylelint / compiled CSS fixture inspection / package build | command, diff review | yes |
| 非标准主题差异只能在主题作用域下覆写，不重新暴露主题前缀类名 | `stylesheet-stable-selector-build`, `core-component-selector-migration`, `editor-theme-helper-migration` | selector inventory + allowlist guard / selector fixture tests | command, test | yes |
| 品牌级组件前缀可通过 build-time constant 统一更名，但不作为运行时主题切换能力 | `theme-runtime-button-pilot`, `stylesheet-stable-selector-build`, `editor-theme-helper-migration`, `theme-system-validation-docs-rollout` | custom prefix fixture / compiled CSS selector grep / runtime classnames test / docs boundary review | test, command, diff review | yes |
| 老定制页面可在显式迁移开关下让 `.cxd-*` 用户 CSS 继续命中，同时库不输出 `.cxd-*` CSS | `theme-runtime-button-pilot`, `legacy-prefix-teardown`, `theme-system-validation-docs-rollout` | DOM render test / compiled CSS grep / migration docs review / alias 1 年内复审记录 | test, command, diff review, review record | yes |
| 主题行为对象继续承载 renderer/component/chart/editor 等 CSS 无法表达的差异 | `theme-runtime-button-pilot`, `legacy-prefix-teardown` | TypeScript tests / existing renderer config tests | test, diff review | yes |
| 编辑器和 theme-editor 生成的 token / selector 与新主题系统一致 | `editor-theme-helper-migration`, `theme-system-validation-docs-rollout` | generated CSS tests / editor preview manual path | test, screenshot | yes |
| 用户文档不再推荐 `#{$ns}` / `.cxd-*` 作为主题定制入口 | `theme-system-validation-docs-rollout` | docs grep / docs diff review | command, diff review | yes |
| Root 到 FormItem 控件和 amis-ui 子组件的完整前缀下发链路只输出稳定 `.amis-*` | `theme-runtime-button-pilot`, `core-component-selector-migration`, `legacy-prefix-teardown`, postmortem hardening | Form renderer Jest / targeted browser DOM scan / badControls grep | test, screenshot, command | yes |
| ThemeScope 注入不改变 Overlay / 直接 portal 定位链路和隐藏态副作用 | `overlay-theme-scope-propagation`, postmortem hardening | Overlay jsdom tests / direct portal tests / browser popover offsetParent check | test, screenshot, command | yes |

## 6. 排期思路

先做 `theme-runtime-button-pilot`，因为它能最早暴露 ThemeScope、stable classnames、token 和组件样式之间的接口是否真正闭合。随后做 token/layer 契约和 SCSS selector build guard，把批量迁移前的公共规则稳定下来。浮层传播应在核心组件批量迁移前完成，否则 Dialog / Tooltip / Select 等组件即使类名迁移成功也可能在 body container 下丢主题。

中段按“公共机制先于批量迁移”的顺序推进：先 `stylesheet-stable-selector-build`，再 `overlay-theme-scope-propagation`，然后 `core-component-selector-migration`。编辑器和 theme-editor 依赖 token、selector、overlay 三条公共机制，所以放在批量组件迁移之后或并行后半段。最后 `legacy-prefix-teardown` 和 `theme-system-validation-docs-rollout` 收口，避免新旧主题心智长期并存。

### Top 3 风险与缓解

1. **浮层 scope 泄漏**：Dialog / Tooltip / Select / PopUp 或其他直接 portal 渲染到 `body` 后可能拿不到 scoped token。缓解：单独拆 `overlay-theme-scope-propagation`，要求 jsdom + 手工路径覆盖默认 container、自定义 container、多 root、direct portal 和 editor preview。
2. **token 语义漂移和 token 爆炸**：组件各自添加变量会破坏 palette / semantic / component / state 分层。缓解：`token-contract-css-layers` 先定义命名、层级和旧 token 映射策略，组件迁移只能消费契约内 token。
3. **DOM alias 被误认为新公共 API**：为了兼容老定制 CSS 而输出的 `.cxd-*` 可能继续诱导新用户依赖主题前缀。缓解：alias 必须显式开启，SCSS 不输出 `.cxd-*`，docs 主路径只讲 token / `.amis-*` / `[data-amis-theme]`，新增代码 guard 禁止新 `.cxd-*` 依赖，`legacy-prefix-teardown` 记录迁移范围、最长 1 年内复审点和人工退出决策。
4. **前缀下发链路遗漏**：只改 `themeable()` / helper 容易漏掉 Root、FormItem、renderer props 和 amis-ui 子组件实际消费的 `classPrefix`。缓解：把 `componentClassPrefix` 作为唯一公开 DOM 前缀 source-of-truth，并把 Form renderer 链路和浏览器 DOM 扫描纳入 gate。
5. **ThemeScope 修复引入布局变化**：用 wrapper 注入 scope 会破坏 popover 定位、offsetParent 和尺寸计算。缓解：Overlay / direct portal scope 注入必须 layout-neutral，测试断言无额外 wrapper、隐藏态无副作用，并记录真实页面 popover `offsetParent`。
6. **品牌前缀被误实现成运行时主题能力**：一个 CSS 构建产物无法同时承诺多个公开组件前缀，运行时切换会让用户 CSS、测试选择器和截图基线不稳定。缓解：组件前缀只作为 build-time constant，默认 `amis-`；品牌更名必须同步 runtime、SCSS、theme-editor helper、examples/docs shell、测试和截图基线，并走 breaking migration review。
7. **baseline guard 变成债务仓库**：如果每次扫描都允许直接更新 policy，历史 selector 债务会被永久接受。缓解：普通 `--update` 只允许 baseline 持平或减少；新增债务必须先被移除，确需保留时必须显式增长并人工审查分类。

### 非显然依赖

- `ThemeInstance.classnames` 当前由 `makeClassnames(classPrefix)` 生成，运行时稳定类名切换会影响大量 snapshots 和第三方组件调用。
- `packages/amis-ui/scss/_variables.scss` 注释说明 Sass 变量仍因颜色计算和兼容保留，不能假设一次性删除所有 Sass 变量。
- `packages/amis/build.sh` 仍生成 `*-ie11.css`，而文档说明 IE11 CSS 变量不可用；token 化后的动态主题能力需要明确降级边界。
- 编辑器 `getCssVarById('baseStyle', ':root, .AMISCSSWrapper')` 和 theme-editor `ParseThemeData` 直接影响用户可见自定义 CSS 生成。
- examples 和 docs 中仍有大量 `.cxd-*` / `.antd-*` / `.dark-*` 选择器，收口必须覆盖示例和贡献文档。
- 外部老定制页面中用户自写 `.cxd-*` CSS 不在仓库内；DOM-only alias 只能保证选择器匹配条件，不能保证这些旧 CSS 在 token 化后的视觉语义仍完全正确。

### 关键假设

- 本次重构以 ADR-001 为硬约束：最终用户不需要关心主题前缀。
- 允许牺牲库内旧 `cxd-*` 公共选择器兼容性；若为老定制页面提供阶段性桥接，只允许 DOM-only alias，不允许 SCSS/CSS legacy selector 双轨。
- 主题行为对象仍保留，ECharts、Monaco、CodeMirror 等第三方主题不会强行 token 化。
- `amis-` 已确认为默认稳定组件类名前缀和品牌级 build-time constant；它不是运行时主题状态，所有新公共组件选择器默认使用 `.amis-*`。
- `.cxd-*` SCSS/CSS 兼容编译期开关已评估为高影响：不做公开兼容层；DOM-only `.cxd-*` alias 可以作为显式迁移开关进入 pilot 验证。
- DOM-only `.cxd-*` alias 的退出不是自动版本卡点：最多 1 年内复审，是否退出由人工架构评审决定；复审前新代码仍不得新增 `.cxd-*` 依赖。
- IE11 只保留静态 CSS 降级边界，不承诺 token 动态主题切换。

### 用户 review 拍板项

- 已确认：稳定组件类名前缀默认采用 `amis-`。
- 已确认：`amis-` 是默认品牌级组件前缀，不需要支持运行时任意前缀切换；未来品牌标识更名走 build-time constant 统一迁移。
- 已确认并评估：旧 `.cxd-*` / `.antd-*` / `.dark-*` 不再作为公共样式 API；`.cxd-*` SCSS/CSS 兼容编译期开关影响面大，不进入实现路线；DOM-only `.cxd-*` alias 可作为显式迁移开关验证。
- 已确认：DOM-only alias 最长保留目标为 1 年内复审，是否退出由人工架构评审决定，不设置固定自动删除卡点；新增代码不得继续制造 `.cxd-*` 依赖。
- 已确认：IE11 只保留静态 CSS 降级边界，不承诺 token 动态主题切换。

### 基线与验证入口

- `npm run typecheck`
- `npm run stylelint`
- `npm test --workspace amis-core -- theme`
- `npm test --workspace amis-ui -- Button`
- `npm test --workspace amis -- Dialog`
- `npm test --workspace amis -- Tooltip`
- `npm test --workspace amis -- DropDown`
- `npm test --workspace amis -- Select`
- `npm run build --workspace amis-core`
- `npm run build --workspace amis-ui`
- `npm run build --workspace amis`
- selector inventory / guard 基线：`rg -n "\\.(cxd|antd|dark)-|#\\{\\$ns\\}|classPrefix|getTheme\\(.*classPrefix" packages docs examples`
- DOM-only alias 基线：Button pilot 中分别断言 alias 关闭时无 `.cxd-Button`，开启时 DOM 有 `.amis-Button cxd-Button`，同时编译 CSS 不新增 `.cxd-Button` selector。
- 品牌前缀 build-time fixture：用非 `amis-` 测试前缀编译最小 SCSS fixture，并渲染最小 runtime classnames fixture，证明 CSS selector 与 DOM class 同步；该 fixture 不进入运行时主题 API。
- 新增依赖 guard 基线：`rg -n "\\.(cxd|antd|dark)-|#\\{\\$ns\\}|classPrefix" packages docs examples` 的新增命中必须落入 selector inventory 分类；新增 public selector、样式依赖或 editor 生成依赖失败。
- docs/examples 收口基线：`rg -n "cxd-|antd-|dark-|#\\{\\$ns\\}|classPrefix" docs examples`
- `npm start` 后用示例页手工验证主题切换、Dialog、Tooltip、Dropdown、Select、编辑器 preview 和 iframe preview。
- `npm start` 后必须额外抽查真实页面链路：`/zh-CN/components/form/options`、`/zh-CN/components/form/input-color`、`/zh-CN/components/form/input-array`、`/zh-CN/components/form/input-month-range`，记录控件根类是否为 `.amis-*`、是否存在未预期 `cxd-*` 控件根类、popover `offsetParent` 是否为触发控件，以及截图路径；移动端 / direct portal 组件改动还要记录 portal 根节点的 `data-amis-theme`。
- 每个子 feature design 必须把上述入口进一步收窄为本条相关的最小命令 / fixture / 手工路径；不得只写“跑全量测试”。

### 交付物落点

- 运行时契约落在 `packages/amis-core/src/theme.tsx`、`Root.tsx` 和相关导出。
- token / layer / selector helper 落在 `packages/amis-ui/scss/**` 和构建 / lint 检查。
- 组件迁移落在 `packages/amis/src/renderers/**`、`packages/amis-ui/src/components/**`、`packages/amis-ui/scss/components/**`。
- 浮层传播落在 `packages/amis-core/src/components/Overlay.tsx`、`EnvContext` 使用点和浮层组件调用点。
- 编辑器迁移落在 `packages/amis-editor-core/**`、`packages/amis-theme-editor-helper/**`。
- 文档和示例落在 `docs/zh-CN/start/getting-started.md`、`docs/zh-CN/extend/contribute.md`、examples 和主题系统相关说明。

### 知识回写点

- `amis-` 默认稳定组件类名前缀已回写到 `requirements/CONTEXT.md` 和 ADR-001；如果后续引入 build-time 品牌前缀常量，必须同步更新 CONTEXT、贡献文档和 release note。
- 如果 IE11 主题能力降级边界被实现验证，应沉淀到 getting-started 和 release note。
- 如果发现新的 token 命名约束或 selector guard，应在 acceptance 阶段同步到贡献文档。
- 如果发现前缀 source-of-truth、Overlay / direct portal layout-neutral 或真实页面视觉 gate 的遗漏，应同步回本 roadmap 的 Postmortem Hardening Gate，并在对应 issue / audit 中留证据。

## 7. 观察项

- ADR-001 已拍板双通道方向，且用户已确认默认稳定组件类名前缀为 `amis-`；组件前缀是品牌级 build-time constant，不是运行时主题能力。
- `cxd.ts` 注释写明 “yunshe.design 百度云舍”，可作为 `cxd` 历史来源线索；是否需要在对外文档解释不属于本 roadmap。
- `docs/zh-CN/extend/contribute.md` 当前仍要求组件 SCSS 使用 `#{$ns}` 并举 `.cxd-Avatar` 例子；这是 docs rollout 的必改项。
- `docs/zh-CN/start/getting-started.md` 当前说明 IE11 需要 `cxd-ie11.css` 且无法支持 CSS 变量；token 化后应明确 IE11 静态降级或停止承诺动态主题能力。
- examples 的自定义样式大量依赖 `.cxd-*` / `.antd-*` / `.dark-*`，可能需要作为 `theme-system-validation-docs-rollout` 的独立手工检查项。
- `theme-runtime-button-pilot` 需要特别防止范围膨胀：它验证 source-of-truth 和 Button 闭环，不承担全量 token 命名治理、全组件选择器迁移或 editor 迁移。
- `.cxd-*` 兼容评估结论已归档为 `2026-07-24-explore-cxd-compat-compile-switch.md`：SCSS/CSS legacy selector 双轨影响面大，不做；DOM-only `.cxd-*` alias 作为显式迁移开关进入 pilot 和收口验证。
- 人工审查新增共识：DOM-only alias 最长保留目标为 1 年内复审，是否退出人工决定，不设固定自动删除卡点；真正的硬约束是禁止新代码继续增加 `.cxd-*` / `classPrefix` 样式依赖。
- 人工审查新增共识：DOM-only alias 是 best-effort 迁移桥，不承诺覆盖所有手写 `classPrefix` 拼接路径；direct portal 必须分为 `theme-scope-portal-covered` 与 `theme-scope-portal-exception`；selector guard 的 baseline 默认只能持平或减少。

## 8. 变更日志

- 2026-07-24：根据 ADR-001 新建主题系统重构 roadmap draft，拆分运行时、token、样式构建、浮层、组件、编辑器和收口验证 8 个子 feature。
- 2026-07-24：根据独立规划审查补充 source-of-truth、多 root/env/theme 同步边界、pilot 范围闸门、selector allowlist、editor 历史 schema/helper SCSS 验收和更细验证入口。
- 2026-07-24：根据用户 review 确认 `amis-` 稳定前缀、`.cxd-*` 兼容策略评估边界、IE11 静态 CSS 降级边界，并将 roadmap 标为 active。
- 2026-07-24：细化 `.cxd-*` 兼容策略：拒绝 SCSS/CSS legacy selector 双轨，允许评估显式 DOM-only `.cxd-*` alias 以支持老定制页面用户 CSS 命中，并纳入 pilot、收口和文档验证。
- 2026-07-24：根据人工答辩审查补充 DOM-only alias 生命周期原则和新增依赖禁令：alias 最长 1 年内复审，人工决定是否退出，不设自动卡点；新增 `.cxd-*` / `classPrefix` 样式依赖必须被 guard 拦截或进入 inventory 例外分类。
- 2026-07-26：完成 `core-component-selector-migration`，核心组件 Wave A/B/C 迁移到稳定 `.amis-*`，DoD/QA passed，policy baseline 收窄到 1507 且 0 new violation。
- 2026-07-30：根据表单视觉回归修复复盘，补充 Postmortem Hardening Gate：组件 DOM 前缀唯一来源必须覆盖 Root→FormItem→amis-ui 完整链路；Overlay / direct portal ThemeScope 注入必须 layout-neutral 且隐藏态无副作用；真实页面浏览器验证纳入前缀 / 浮层 / 基础表单控件 gate。
- 2026-08-10：根据品牌前缀讨论，同步 ADR-001 与 roadmap：`amis-` 是默认品牌级 build-time 组件前缀，不支持运行时任意前缀切换；未来品牌前缀更名必须统一迁移 runtime、SCSS、theme-editor helper、examples/docs shell、测试和截图基线。
- 2026-08-10：根据 clean architecture 审查整改，补充 alias best-effort 边界、direct portal covered/exception 分类和 selector guard baseline 防增长规则；`Spinner` 纳入 ThemeScope 覆盖，`MobileDevTool` 作为 editor-only portal exception 管理。
