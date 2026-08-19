---
title: 可视化编辑器定制指南
---

本文面向需要集成或二次开发 amis 可视化编辑器的开发者，说明编辑器可以通过哪些入口定制、各入口适合什么场景，以及插件机制和渲染器之间的关系。

如果需要先理解面板、组件物料、插件、容器区域、工具栏、右键菜单等概念之间的架构关系，请参考[编辑器架构](./editor-architecture)。

## 定制入口总览

amis editor 的定制能力大致分为三层：

| 入口                                                                      | 适合场景                                                     | 是否需要写插件 | 是否必须关联渲染器 |
| ------------------------------------------------------------------------- | ------------------------------------------------------------ | -------------- | ------------------ |
| `Editor` 属性                                                             | 调整编辑器运行方式、禁用插件、注入事件监听、替换左右面板容器 | 否             | 否                 |
| 插件 `buildEditorPanel` / `buildEditorToolbar` / `buildEditorContextMenu` | 新增左侧/右侧面板、工具按钮、右键菜单                        | 是             | 否                 |
| 渲染器插件能力                                                            | 让某种 amis renderer 可点选、可拖入、可配置、可声明区域      | 是             | 通常需要           |

判断用哪一种入口时，可以按下面的顺序选：

1. 只是控制编辑器行为或替换容器，优先用 `Editor` 属性。
2. 要往编辑器外壳里加面板、工具栏、菜单，用全局插件即可，不必绑定具体渲染器。
3. 要让某个 schema 节点在画布中可识别、可点选、可配置，才需要把插件绑定到 `rendererName`。

## 通过属性定制

`Editor` 组件本身暴露了很多集成层属性，适合做不需要新建插件的定制。

### 基础运行属性

常见属性包括：

- `value`：当前 amis schema。
- `onChange`：编辑器修改 schema 后触发。
- `preview`：切换预览模式。
- `isMobile`：移动端预览模式。
- `theme`：amis 主题。
- `className`：给编辑器外层追加 class，方便做样式覆盖。
- `$schemaUrl`：提供 schema JSON 地址，主要用于代码编辑时的属性提示。
- `schemaFilter`：预览前改写 schema，常用于 API proxy。
- `amisEnv`：注入 amis 渲染环境，如 fetcher、tracker、notify、jumpTo 等。
- `readonly`：只读模式。

示例：

```tsx
<Editor
  value={schema}
  onChange={setSchema}
  theme="cxd"
  className="my-editor"
  schemaFilter={(schema, isPreview) => {
    if (!isPreview) {
      return schema;
    }

    return rewriteApiToProxy(schema);
  }}
  amisEnv={{
    fetcher: customFetcher,
    notify: customNotify
  }}
/>
```

### 插件开关

编辑器的内置能力大多也是插件。集成方可以通过属性控制插件集合：

- `disableBultinPlugin`：禁用所有内置插件。
- `disablePluginList`：按插件 `id` 或回调禁用部分插件。
- `plugins`：只给当前 `Editor` 实例追加插件。

示例：

```tsx
<Editor
  value={schema}
  onChange={setSchema}
  disablePluginList={['OutlinePlugin']}
  plugins={[MyGlobalPanelPlugin] as any}
/>
```

如果希望插件带参数，可以传 `[PluginClass, options]`：

```tsx
<Editor
  value={schema}
  onChange={setSchema}
  plugins={
    [
      [
        MyGlobalPanelPlugin,
        {
          title: '业务资源',
          api: '/api/resources'
        }
      ]
    ] as any
  }
/>
```

插件类构造时会收到这些 `options`：

```tsx
export class MyGlobalPanelPlugin extends BasePlugin {
  constructor(
    manager: EditorManager,
    readonly options: any
  ) {
    super(manager);
  }
}
```

### 事件监听

`Editor` 属性可以直接监听插件事件，适合做外围集成、审计、拦截或埋点。

常用事件包括：

- `onInit`：编辑器初始化后触发。
- `onActive`：选中节点变化时触发。
- `beforeInsert` / `afterInsert`：插入前后。
- `beforeUpdate` / `afterUpdate`：面板修改 schema 前后。
- `beforeReplace` / `afterReplace`：替换渲染器或粘贴配置前后。
- `beforeMove` / `afterMove`：移动节点前后。
- `beforeDelete` / `afterDelete`：删除节点前后。
- `onBuildPanels`：面板构建时触发。
- `onBuildContextMenus`：右键菜单构建时触发。
- `onBuildToolbars`：选中框工具栏构建时触发。
- `onSelectionChange`：选择变化时触发。
- `onPreventClick`：控制编辑态点击行为。

示例：

```tsx
<Editor
  value={schema}
  onChange={setSchema}
  beforeUpdate={event => {
    if (isLockedNode(event.context.node)) {
      event.preventDefault();
      return false;
    }
  }}
  afterUpdate={event => {
    reportEditorChange(event.context);
  }}
/>
```

### 替换左右面板容器

如果只是往左侧或右侧增加一个 tab，优先用插件加 panel。只有在需要重做容器结构、布局、开合行为、固定模式或抽屉逻辑时，才使用：

- `LeftPanelsComponent`
- `RightPanelsComponent`

示例：在默认左侧面板外增加一个不参与 tab 的常驻区域。

```tsx
import {LeftPanelsProps} from 'amis-editor-core';
import {LeftPanels} from './your-local-export';

function CustomLeftPanels(props: LeftPanelsProps) {
  return (
    <>
      <div className="my-always-visible-panel">业务资源</div>
      <LeftPanels {...props} />
    </>
  );
}

<Editor
  value={schema}
  onChange={setSchema}
  LeftPanelsComponent={CustomLeftPanels}
/>;
```

注意：当前公共入口导出了 `LeftPanelsProps` / `RightPanelsProps` 类型，但默认 `LeftPanels` 组件本身不是公共导出。如果需要“包一层默认左侧面板”，要么在项目内部引用源码组件，要么在 amis editor 侧补充导出；如果是业务项目外部集成，更稳妥的方式是完全自定义 `LeftPanelsComponent`，或优先用 plugin 添加左侧 tab。

## 通过插件定制

插件是编辑器最主要的扩展点。插件类通常继承 `BasePlugin`，可以全局注册，也可以只传给某个 `Editor` 实例。

### 注册方式

全局注册：

```tsx
import {BasePlugin, registerEditorPlugin} from 'amis-editor-core';

export class MyPlugin extends BasePlugin {
  static scene = ['layout'];
}

registerEditorPlugin(MyPlugin);
```

仅当前实例启用：

```tsx
<Editor value={schema} onChange={setSchema} plugins={[MyPlugin]} />
```

两种方式的差异：

- `registerEditorPlugin()` 会把插件加入全局插件池，之后创建的编辑器实例都会看到它。
- `plugins` 属性只影响当前编辑器实例，更适合业务项目按需注入。
- `disablePluginList` 可以继续过滤全局插件和实例插件。

### 插件是否必须关联渲染器

不必须。

插件分为两类：

1. **全局编辑器插件**：不设置 `rendererName`，只参与面板、工具栏、菜单、事件监听、组件物料收集等全局流程。
2. **渲染器插件**：设置 `rendererName` 和 `name`，让某种 amis renderer 在编辑器中具备可点选、可配置、可拖入、可声明区域等能力。

也就是说：

- 想加一个常驻左侧面板、顶部工具按钮、右键菜单：不需要 `rendererName`。
- 想让 `type: 'my-renderer'` 的节点能在画布上被编辑器识别：需要 `rendererName = 'my-renderer'`。
- 想把组件加入左侧“组件”物料列表：通常需要提供 `name`、`description`、`scaffold` 等物料信息；如果它对应真实 renderer，也应该设置 `rendererName`。

## 定制左侧面板

左侧面板和右侧面板共用同一个 `panels` 数组。区别只在于 `PanelItem.position`：

- `position: 'left'`：进入左侧面板。
- `position` 为空或为 `'right'`：进入右侧面板。

### 新增一个左侧 tab

```tsx
import React from 'react';
import {
  BasePlugin,
  BasicPanelItem,
  BuildPanelEventContext
} from 'amis-editor-core';

function ResourcePanel({store, manager}: any) {
  return <div className="my-resource-panel">业务资源</div>;
}

export class ResourcePanelPlugin extends BasePlugin {
  static scene = ['layout'];
  order = -9000;

  buildEditorPanel(
    context: BuildPanelEventContext,
    panels: Array<BasicPanelItem>
  ) {
    panels.push({
      key: 'resources',
      icon: <span>资</span>,
      tooltip: '业务资源',
      position: 'left',
      component: ResourcePanel,
      order: -9000
    });
  }
}
```

内置的“组件”“大纲”“代码”左侧面板也是这种方式实现的。

### 定义常驻左侧 tab

“常驻 tab”指每次构建 panels 时都存在，不依赖当前选中的 renderer。做法是不要在 `buildEditorPanel()` 中限制 `context.info.plugin === this`。

```tsx
export class PersistentLeftPanelPlugin extends BasePlugin {
  static scene = ['layout'];
  order = -10000;

  buildEditorPanel(context: BuildPanelEventContext, panels: BasicPanelItem[]) {
    panels.push({
      key: 'persistent',
      icon: <span>常</span>,
      tooltip: '常驻面板',
      position: 'left',
      component: PersistentPanel,
      order: -10000
    });
  }
}
```

如果希望构建后默认打开它，可以设置：

```tsx
context.changeLeftPanelKey = 'persistent';
this.manager.store.changeLeftPanelOpenStatus(true);
```

### 定义不参与 tab 的常驻区域

如果希望某块 UI 永远显示，不跟随 `panels` 重建，也不想成为左侧 tab，使用 `LeftPanelsComponent` 替换左侧容器更合适。

```tsx
function CustomLeftPanels(props: LeftPanelsProps) {
  return (
    <div className="my-left-shell">
      <aside className="my-left-fixed-region">固定资源区</aside>
      <MyTabsCompatibleWithEditorPanels {...props} />
    </div>
  );
}
```

这种方式自由度最高，但也意味着要自己兼容：

- 面板展开/收起状态。
- 当前 active tab。
- 插入组件抽屉。
- 宽度拖拽。
- 预览态和只读态下是否展示。

## 定制右侧配置面板

右侧配置面板有两种常见做法。

### 使用 `panelBody` / `panelBodyCreator`

当插件绑定了具体 renderer，并且当前选中的节点属于这个插件时，`BasePlugin` 会根据 `panelBody` / `panelBodyCreator` 自动生成右侧 `config` 面板。

```tsx
export class MyRendererPlugin extends BasePlugin {
  rendererName = 'my-renderer';
  name = '自定义渲染器';
  panelTitle = '自定义渲染器';

  panelBody = [
    {
      type: 'input-text',
      name: 'title',
      label: '标题'
    }
  ];
}
```

如果配置项需要根据上下文变化，使用 `panelBodyCreator`：

```tsx
panelBodyCreator = context => {
  const inForm = context.node?.ancestor?.some(
    (node: any) => node.schema?.type === 'form'
  );

  return [
    {
      type: 'input-text',
      name: 'name',
      label: inForm ? '字段名' : '名称'
    }
  ];
};
```

如果面板内容需要异步加载，可以使用 `panelBodyAsyncCreator`。

### 手动 push 右侧 panel

如果要加入一个额外右侧面板，不想使用自动 schema form，可以在 `buildEditorPanel()` 里 push。

```tsx
buildEditorPanel(context: BuildPanelEventContext, panels: BasicPanelItem[]) {
  if (context.info.plugin !== this) {
    return;
  }

  panels.push({
    key: 'advanced',
    icon: 'fa fa-sliders',
    title: '高级',
    position: 'right',
    render: props => <AdvancedPanel {...props} />,
    order: 1000
  });
}
```

`position` 不写时也会被右侧面板处理，但为了可读性建议明确写 `'right'`。

## 定制组件物料列表

左侧“组件”面板展示的是插件收集到的 `subRenderers`。插件可以通过 `buildSubRenderers()` 返回一个或多个物料项。

```tsx
export class BusinessWidgetPlugin extends BasePlugin {
  name = '业务卡片';
  description = '展示业务指标和趋势';
  rendererName = 'business-card';
  tags = ['业务组件'];
  icon = 'fa fa-id-card';

  scaffold = {
    type: 'business-card',
    title: '业务卡片'
  };
}
```

继承 `BasePlugin` 时，如果插件有 `name` 和 `description`，默认 `buildSubRenderers()` 会把它加入物料列表。也可以重写 `buildSubRenderers()` 来返回多个脚手架：

```tsx
buildSubRenderers(context, subRenderers, renderers) {
  return [
    {
      name: '指标卡片',
      description: '展示单个指标',
      tags: ['业务组件'],
      scaffold: {
        type: 'business-card',
        variant: 'metric'
      }
    },
    {
      name: '趋势卡片',
      description: '展示趋势图',
      tags: ['业务组件'],
      scaffold: {
        type: 'business-card',
        variant: 'trend'
      }
    }
  ];
}
```

如果某个插件只想提供编辑能力，不想出现在组件物料列表中，可以设置：

```tsx
disabledRendererPlugin = true;
```

## 定制工具栏和右键菜单

### 选中框工具栏

插件可以通过 `buildEditorToolbar()` 往选中框顶部按钮区加入能力：

```tsx
buildEditorToolbar(context, toolbars) {
  if (context.info?.plugin !== this) {
    return;
  }

  toolbars.push({
    icon: 'fa fa-copy',
    tooltip: '复制业务配置',
    onClick: () => {
      copyBusinessConfig(context.node?.schema);
    }
  });
}
```

### 右键菜单

插件可以通过 `buildEditorContextMenu()` 扩展右键菜单：

```tsx
buildEditorContextMenu(context, menus) {
  menus.push({
    label: '导出配置片段',
    onSelect: () => {
      exportSchemaFragment(context.node?.schema);
    }
  });
}
```

这两类扩展也不要求插件必须绑定 `rendererName`。如果只想对特定 renderer 生效，再在方法里判断 `context.info?.renderer?.name` 或 `context.info?.plugin`。

## 定制编辑器事件和动作

插件和 `Editor` props 都可以监听同一批编辑器生命周期事件。插件方式适合把能力和 UI 一起封装；属性方式适合业务集成层做统一拦截。

```tsx
export class AuditPlugin extends BasePlugin {
  afterInsert(event) {
    report('insert', event.context);
  }

  beforeDelete(event) {
    if (isProtected(event.context.node)) {
      event.preventDefault();
      return false;
    }
  }
}
```

对于 renderer 的事件动作面板，插件还可以定义：

- `events`：某类 renderer 支持哪些事件。
- `actions`：某类 renderer 支持哪些专有动作。

这部分会按 `rendererName` 记录到 `pluginEvents` / `pluginActions`，因此通常需要绑定具体 renderer。

## 定制渲染器编辑能力

如果希望某种 amis renderer 在编辑器画布中可点选、可显示名称、可配置区域、可拖入子组件，需要提供渲染器插件信息。

最小写法：

```tsx
export class MyRendererPlugin extends BasePlugin {
  rendererName = 'my-renderer';
  name = '自定义渲染器';
  description = '业务自定义渲染器';
}
```

`BasePlugin.getRendererInfo()` 会在满足以下条件时自动返回编辑器信息：

- schema 上有 `$$id`。
- 插件有 `name`。
- 插件有 `rendererName`。
- `rendererName` 匹配当前 amis renderer 的 `name` 或 `origin.name`。

如果匹配成功，编辑器会用这些信息包裹渲染器 DOM，使节点可以被点选、高亮、拖拽定位和生成配置面板。

### 声明容器区域

容器类组件需要声明 `regions`，告诉编辑器哪里可以插入子组件。

```tsx
export class MyLayoutPlugin extends BasePlugin {
  rendererName = 'my-layout';
  name = '自定义布局';

  regions = [
    {
      key: 'body',
      label: '内容区',
      preferTag: '展示'
    },
    {
      key: 'actions',
      label: '操作区',
      preferTag: '按钮'
    }
  ];
}
```

复杂组件还可以通过 `matchRegion`、`renderMethod`、`renderMethodOverride`、`wrapperResolve` 等能力适配真实 DOM 和 React 结构。

## 全局插件与渲染器插件的边界

下面这张表可以作为判断依据：

| 能力                         | 全局插件可做     | 需要 `rendererName`                |
| ---------------------------- | ---------------- | ---------------------------------- |
| 新增左侧 tab                 | 可以             | 不需要                             |
| 新增右侧通用 tab             | 可以             | 不需要                             |
| 替换左右面板容器             | 用 `Editor` 属性 | 不需要                             |
| 扩展右键菜单                 | 可以             | 不需要，除非只对某类 renderer 生效 |
| 扩展选中框工具栏             | 可以             | 不需要，除非只对某类 renderer 生效 |
| 监听插入、更新、删除等事件   | 可以             | 不需要                             |
| 加入组件物料列表             | 可以             | 不强制，但真实组件通常应该绑定     |
| 让画布节点可点选、可识别     | 不够             | 需要                               |
| 自动生成某类组件右侧配置面板 | 不够             | 需要                               |
| 声明容器 regions             | 不够             | 需要                               |
| 定义某类组件事件和动作       | 通常不够         | 需要                               |

核心原则：

- 插件类本身不要求有 `rendererName`。
- `rendererName` 的作用是把插件和某个 amis renderer 绑定起来。
- 只做编辑器外壳扩展时，保持插件全局化更清晰。
- 只做某个组件的编辑体验时，绑定 `rendererName` 更清晰。

## 插件机制的局限性

插件机制很强，但也有边界。

### 面板构建依赖当前编辑器状态

`buildEditorPanel()` 是在编辑器构建当前 panels 时调用的。它通常和当前 active 节点、多选状态、schema 树状态有关。

因此：

- 常驻 tab 要避免依赖 `context.info.plugin === this`。
- 真正完全独立于 panels 生命周期的常驻 UI 应使用 `LeftPanelsComponent` / `RightPanelsComponent`。
- 如果没有 active 节点，某些基于节点上下文的 panel 不会有完整 `node` / `info`。

### `panelBody` 主要服务右侧配置面板

`panelBody` / `panelBodyCreator` 是 `BasePlugin` 自动生成配置面板的快捷方式。它默认生成的是 `config` panel，且只有当前选中节点属于该插件时才生效。

如果要做左侧面板或全局面板，不应使用 `panelBody`，应直接在 `buildEditorPanel()` 里 push `position: 'left'` 或自定义 panel。

### 可视化编辑能力依赖 renderer 信息

全局插件可以扩展编辑器 UI，但不能凭空让某个 schema 节点拥有完整编辑能力。节点能否被识别，关键取决于是否能解析到 `RendererInfo`。

对于自定义 renderer，至少要提供：

- amis renderer 注册。
- editor plugin 的 `rendererName`。
- editor plugin 的 `name`。
- 必要时提供 `regions`、`panelBody`、`scaffold` 等。

### 组件物料和画布编辑是两件事

出现在左侧组件列表，不等于拖入后就拥有完整编辑体验。

- 物料列表来自 `buildSubRenderers()` 或 `BasePlugin` 默认物料信息。
- 画布编辑来自 `getRendererInfo()` / `rendererName` 匹配。

实际开发自定义组件时，通常两者都要做。

### 替换容器比新增 panel 风险更高

`LeftPanelsComponent` / `RightPanelsComponent` 给了完整替换能力，但默认容器里包含不少编辑器交互约定，比如 tab 激活、展开收起、抽屉插入、宽度拖拽、panel props 传递等。

如果只是增加功能入口，应优先新增 panel；只有默认容器结构无法满足时，再替换容器。

### 插件场景目前主要用于注册查询

插件类有 `static scene`，注册时会补上 `global`。`getEditorPlugins({scene})` 会按 scene 过滤。当前 `EditorManager` 实例化时会合并内置插件和 `config.plugins`，并没有直接按 `config.scene` 过滤全部插件。

因此，业务集成里更可控的方式是：

- 用 `plugins` 显式传入当前实例需要的插件。
- 用 `disablePluginList` 过滤不需要的插件。
- 不要只依赖 `scene` 来隔离某个 `Editor` 实例的插件集合。

## 推荐模式

### 模式一：业务常驻左侧面板

适合资源库、页面树、业务模板、AI 助手等全局功能。

推荐：

- 用全局插件或实例插件。
- 不设置 `rendererName`。
- 在 `buildEditorPanel()` 中 push `position: 'left'`。
- 使用稳定唯一的 `key`。

```tsx
export class BusinessAssetsPanelPlugin extends BasePlugin {
  static scene = ['layout'];
  order = -9500;

  buildEditorPanel(context, panels) {
    panels.push({
      key: 'business-assets',
      icon: <span>业</span>,
      tooltip: '业务资产',
      position: 'left',
      component: BusinessAssetsPanel,
      order: -9500
    });
  }
}
```

### 模式二：自定义 renderer 完整编辑体验

适合新增业务组件、二方组件库、NPM 自定义组件。

推荐：

- 注册 amis renderer。
- 写 editor plugin，并设置 `rendererName` / `name` / `description`。
- 提供 `scaffold` 进入组件物料列表。
- 提供 `panelBody` 或 `panelBodyCreator` 生成右侧配置。
- 容器组件声明 `regions`。

```tsx
export class ChartCardPlugin extends BasePlugin {
  rendererName = 'chart-card';
  name = '图表卡片';
  description = '展示业务图表';
  tags = ['业务组件'];

  scaffold = {
    type: 'chart-card',
    title: '图表卡片'
  };

  panelBody = [
    {
      type: 'input-text',
      name: 'title',
      label: '标题'
    },
    {
      type: 'input-text',
      name: 'api',
      label: '数据接口'
    }
  ];
}
```

### 模式三：只做拦截和审计

适合埋点、权限控制、操作审计、schema 校验。

推荐：

- 优先用 `Editor` props。
- 如果要复用成模块，再封装成不绑定 renderer 的全局插件。

```tsx
<Editor
  value={schema}
  onChange={setSchema}
  beforeDelete={event => {
    if (isProtectedNode(event.context.node)) {
      event.preventDefault();
      return false;
    }
  }}
  afterUpdate={event => {
    audit('editor.update', event.context);
  }}
/>
```

## 调试建议

调试插件时建议从这几个点排查：

1. 插件是否被实例化：确认传入了 `plugins`，或已调用 `registerEditorPlugin()`。
2. 插件是否被过滤：检查 `disableBultinPlugin` / `disablePluginList`。
3. 面板是否被 push：在 `buildEditorPanel()` 中检查 `panels` 和 `context`。
4. 左右位置是否正确：左侧必须设置 `position: 'left'`。
5. 右侧配置是否出现：检查当前选中节点的 `context.info.plugin === this`。
6. 自定义 renderer 是否可点选：检查 `rendererName` 是否匹配 amis renderer 的注册名。
7. 物料是否出现：检查 `name`、`description`、`scaffold`、`disabledRendererPlugin`。
8. 容器是否可拖入：检查 `regions` 和真实渲染结构是否能被编辑器包裹。

## 相关源码

- `packages/amis-editor-core/src/component/Editor.tsx`：`Editor` 属性、左右面板替换入口、生命周期。
- `packages/amis-editor-core/src/manager.ts`：插件注册、实例化、面板收集、物料收集。
- `packages/amis-editor-core/src/plugin.ts`：插件接口、`BasePlugin` 默认逻辑、`PanelItem` 类型。
- `packages/amis-editor-core/src/component/Panel/LeftPanels.tsx`：左侧面板渲染。
- `packages/amis-editor-core/src/component/Panel/RightPanels.tsx`：右侧面板渲染。
- `packages/amis-editor-core/src/plugin/AvailableRenderers.tsx`：内置“组件”左侧面板示例。
- `packages/amis-editor-core/src/plugin/Outline.tsx`：内置“大纲”左侧面板示例。
- `packages/amis-editor-core/src/plugin/Code.tsx`：内置“代码”左侧面板示例。
