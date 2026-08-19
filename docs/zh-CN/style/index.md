---
title: 快速开始
---

示例有个[主题编辑器](../../examples/theme)，可以在线实时预览效果。

在 amis 中自定义样式推荐按下面的顺序选择：

1. 标准化样式值使用 `--prismui-*` CSS 变量，例如品牌色、按钮色、文本色等。
2. 需要按主题区分的非标准样式，使用 `[data-prismui-theme="主题名"]` 作为作用域。
3. 需要定位组件结构时，使用稳定的 `.prismui-*` 组件类名。
4. 对单个 schema 做局部调整时，使用辅助 class、`className` / `xxxClassName` 或 `wrapper` 的内嵌 `style`。

不建议把主题类前缀或 `classPrefix` 当作新的样式扩展入口。主题文件名只用于加载对应变量，组件 DOM 主路径使用稳定 `.prismui-*` 类名，主题身份由 `[data-prismui-theme]` 表达。

## CSS 变量

在 page 下可以设置 `cssVars` 属性，通过它来动态修改 amis 内的 CSS 变量。

```schema
{
  "type": "page",
  "cssVars": {
    "--prismui-palette-brand-500": "#CD3632",
    "--prismui-palette-brand-600": "#F23F3A",
    "--prismui-palette-brand-400": "#BB312D",
    "--prismui-color-brand-bg": "var(--prismui-palette-brand-500)",
    "--prismui-Button-primary-bg": "var(--prismui-color-brand-bg)"
  },
  "body": {
    "type": "form",
    "body": [
      {
        "type": "input-text",
        "label": "文本",
        "name": "text"
      },
      {
        "type": "input-password",
        "label": "密码",
        "name": "password"
      }
    ]
  }
}
```

具体有哪些变量请参考左侧的 [CSS 变量](css-vars) 说明。

## 主题作用域覆写

如果同一页面中需要为某个主题写非标准差异，优先把选择器收敛到主题作用域和稳定组件类名：

```css
[data-prismui-theme='dark'] .prismui-Button--primary {
  --prismui-Button-primary-bg: #1677ff;
}

[data-prismui-theme='custom'] .prismui-Card {
  border-radius: 8px;
}
```

这类样式应该放在业务自己的样式文件中，并保证加载顺序晚于 PrismUI 主题 CSS。PrismUI 主题 CSS 使用 `prismui.reset`、`prismui.tokens`、`prismui.components`、`prismui.theme`、`prismui.user` 的 layer 顺序；业务覆写可以放在更晚加载的普通 CSS，或显式放入 `prismui.user` layer。

## 辅助 class

辅助 class 参考自[tailwindcss](https://tailwindcss.com/), 做了精简，把一些不常用的剔除了，响应式方面只保留 pc 和手机两种，css 未压缩版本大概是 800K 左右，比 tailwind 要小很多。

使用方法：

- JS SDK
  - 引入 sdk 中的文件 `<link rel="stylesheet" href="sdk/helper.css" />`
- React
  - `import 'amis/lib/helper.css'`;

目前这个文件没有和主题文件合并在一起，用户可以选择性加载。

大部分 amis 组件都有 `className` 或者 `xxxClassName` 的配置，比如下面的配置给表单增加了边框、圆角和阴影

```schema: scope="body"
{
  "type": "form",
  "panelClassName": "border-solid border-2 border-blue-500 rounded-xl shadow-lg",
  "body": [
    {
      "type": "input-text",
      "className": "text-green-700",
      "label": "文本框",
      "name": "text"
    },
    {
      "type": "input-password",
      "label": "密码",
      "name": "password"
    }
  ]
}
```

还可以：

- 通过 `flex` `flex-shrink-0` 来设置布局方式。
- 通过 `bg-blue-100` `bg-white` 之类的类名设置背景色。
- 通过 `shadow-md` 设置投影。
- 通过 `rounded-xl` 设置圆角。
- 通过 `text-xl`、`font-medium` 设置字体大小粗细。
- 等等。。

具体用法请查看左边的文档列表。

## 主题文件与选择器边界

`cxd.css`、`antd.css`、`dark.css` 等文件名用于选择主题包，不代表主题文件名会派生出不同的组件 DOM 前缀。新样式应统一写在 `[data-prismui-theme]`、`.prismui-*` 稳定组件类名和 `--prismui-*` 变量之上，不再提供旧主题前缀的 DOM 或样式兼容路径。

IE11 只能使用静态 CSS 降级文件，不支持基于 CSS 变量的动态主题切换。
