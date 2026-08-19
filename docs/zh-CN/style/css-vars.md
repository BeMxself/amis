---
title: CSS 变量
---

目前示例中包含了一个[主题编辑器](../../examples/theme)，可以在线实时预览效果。

amis 的主题变量主路径使用 `--prismui-*` 命名。旧变量仍可能作为兼容 alias 存在，但新主题和新业务覆写应优先使用 `--prismui-*`。

## Token 分层

| 层级 | 示例 | 说明 |
| --- | --- | --- |
| palette | `--prismui-palette-brand-500` | 原始色板值，适合定义主题基础色。 |
| semantic | `--prismui-color-brand-bg` | 语义化颜色，适合表达品牌、文本、边框等通用语义。 |
| component | `--prismui-Button-primary-bg` | 组件级 token，适合精确调整某个组件状态。 |

## 常用变量

| 变量 | 类型 | 说明 |
| --- | --- | --- |
| `--prismui-palette-brand-400` | 颜色 | 品牌色浅态。 |
| `--prismui-palette-brand-500` | 颜色 | 品牌主色。 |
| `--prismui-palette-brand-600` | 颜色 | 品牌色深态。 |
| `--prismui-palette-neutral-text-inverse` | 颜色 | 反色文字。 |
| `--prismui-color-brand-bg` | 颜色 | 品牌背景色，默认引用品牌主色。 |
| `--prismui-color-brand-hover-bg` | 颜色 | 品牌 hover 背景色。 |
| `--prismui-color-brand-active-bg` | 颜色 | 品牌 active 背景色。 |
| `--prismui-color-brand-border` | 颜色 | 品牌边框色。 |
| `--prismui-color-text-inverse` | 颜色 | 反色文字语义。 |
| `--prismui-Button-primary-bg` | 颜色 | 主按钮背景色。 |
| `--prismui-Button-primary-hover-bg` | 颜色 | 主按钮 hover 背景色。 |
| `--prismui-Button-primary-active-bg` | 颜色 | 主按钮 active 背景色。 |
| `--prismui-Button-primary-border-color` | 颜色 | 主按钮边框色。 |
| `--prismui-Button-primary-color` | 颜色 | 主按钮文字色。 |

## 覆写示例

```schema
{
  "type": "page",
  "cssVars": {
    "--prismui-palette-brand-500": "#CD3632",
    "--prismui-color-brand-bg": "var(--prismui-palette-brand-500)",
    "--prismui-Button-primary-bg": "var(--prismui-color-brand-bg)"
  },
  "body": "内容"
}
```

如果只想对某个主题生效，可以在业务 CSS 中加主题作用域：

```css
[data-prismui-theme='custom'] {
  --prismui-palette-brand-500: #CD3632;
  --prismui-Button-primary-bg: var(--prismui-palette-brand-500);
}
```

## 兼容说明

旧变量名如 `--primary`、`--button-color` 仍可能由兼容层映射到新的 token，但它们不再是新增主题能力的推荐入口。新文档、新主题包和新业务覆写应优先使用 `--prismui-*`。

IE11 不支持 CSS 变量动态切换主题；如果需要 IE11，只能使用对应的静态 CSS 降级文件。
