---
title: CSS 变量
---

目前示例中包含了一个[主题编辑器](../../examples/theme)，可以在线实时预览效果。

amis 的主题变量主路径使用 `--amis-*` 命名。旧变量仍可能作为兼容 alias 存在，但新主题和新业务覆写应优先使用 `--amis-*`。

## Token 分层

| 层级 | 示例 | 说明 |
| --- | --- | --- |
| palette | `--amis-palette-brand-500` | 原始色板值，适合定义主题基础色。 |
| semantic | `--amis-color-brand-bg` | 语义化颜色，适合表达品牌、文本、边框等通用语义。 |
| component | `--amis-Button-primary-bg` | 组件级 token，适合精确调整某个组件状态。 |

## 常用变量

| 变量 | 类型 | 说明 |
| --- | --- | --- |
| `--amis-palette-brand-400` | 颜色 | 品牌色浅态。 |
| `--amis-palette-brand-500` | 颜色 | 品牌主色。 |
| `--amis-palette-brand-600` | 颜色 | 品牌色深态。 |
| `--amis-palette-neutral-text-inverse` | 颜色 | 反色文字。 |
| `--amis-color-brand-bg` | 颜色 | 品牌背景色，默认引用品牌主色。 |
| `--amis-color-brand-hover-bg` | 颜色 | 品牌 hover 背景色。 |
| `--amis-color-brand-active-bg` | 颜色 | 品牌 active 背景色。 |
| `--amis-color-brand-border` | 颜色 | 品牌边框色。 |
| `--amis-color-text-inverse` | 颜色 | 反色文字语义。 |
| `--amis-Button-primary-bg` | 颜色 | 主按钮背景色。 |
| `--amis-Button-primary-hover-bg` | 颜色 | 主按钮 hover 背景色。 |
| `--amis-Button-primary-active-bg` | 颜色 | 主按钮 active 背景色。 |
| `--amis-Button-primary-border-color` | 颜色 | 主按钮边框色。 |
| `--amis-Button-primary-color` | 颜色 | 主按钮文字色。 |

## 覆写示例

```schema
{
  "type": "page",
  "cssVars": {
    "--amis-palette-brand-500": "#CD3632",
    "--amis-color-brand-bg": "var(--amis-palette-brand-500)",
    "--amis-Button-primary-bg": "var(--amis-color-brand-bg)"
  },
  "body": "内容"
}
```

如果只想对某个主题生效，可以在业务 CSS 中加主题作用域：

```css
[data-amis-theme='custom'] {
  --amis-palette-brand-500: #CD3632;
  --amis-Button-primary-bg: var(--amis-palette-brand-500);
}
```

## 兼容说明

旧变量名如 `--primary`、`--button-color` 仍可能由兼容层映射到新的 token，但它们不再是新增主题能力的推荐入口。新文档、新主题包和新业务覆写应优先使用 `--amis-*`。

IE11 不支持 CSS 变量动态切换主题；如果需要 IE11，只能使用对应的静态 CSS 降级文件。
