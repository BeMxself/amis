---
doc_type: feature-artifact
artifact_type: DocsMigrationMap
feature: 2026-07-25-theme-system-validation-docs-rollout
status: current
updated: 2026-07-28
---

# DocsMigrationMap

## 1. 结论

用户文档主路径已从“主题前缀 / `#{$ns}` / `classPrefix`”改为“`--amis-*` token / `.amis-*` stable class / `[data-amis-theme]` scope”。保留命中均有分类，不作为新增主题定制入口。

## 2. Updated Docs

| Path | Old Signal | Action | Classification |
|---|---|---|---|
| `docs/zh-CN/extend/contribute.md` | 新组件 SCSS 示例要求 `#{$ns}` 并解释 `.cxd-Avatar` | 改为 `.amis-Avatar` + `--amis-*` token；补充 `[data-amis-theme] .amis-*` 主题差异写法 | migrated |
| `docs/zh-CN/start/getting-started.md` | 主题切换说明容易把 `cxd.css` / `theme: cxd` 读成 selector policy | 补充文件名兼容、稳定 DOM 类名、`[data-amis-theme]` 和 IE11 静态边界 | file-name compatibility |
| `docs/zh-CN/style/index.md` | 样式定制仍提源码改 `scss/themes/cxd.scss` 生成主题 CSS | 改为 token、stable selector、theme scope、user layer / 加载顺序；旧前缀只作兼容边界 | migrated |
| `docs/zh-CN/style/css-vars.md` | 只列 `--primary` / `--button-color` 等旧变量 | 改为 `--amis-*` palette / semantic / component token 分层；旧变量标为兼容 alias | migrated |
| `docs/zh-CN/components/form/transfer.md` | `popOverContainerSelector` 示例使用 `.cxd-Panel--form` | 改为 `.amis-Panel--form` | migrated |

## 3. Remaining Docs Hits

| Path | Hit | Decision |
|---|---|---|
| `docs/zh-CN/start/getting-started.md` | `cxd.css` / `antd.css` / `dark.css` / `cxd-ie11.css` | file-name compatibility and IE11 static fallback; not selector API |
| `docs/zh-CN/style/index.md` | `.cxd-*` / `.antd-*` / `.dark-*` in warning text | historical / migration warning; explicitly says not recommended |
| `docs/zh-CN/extend/contribute.md` | `classPrefix` in warning text | migration warning; explicitly says not recommended |
| `docs/zh-CN/components/office-viewer.md` | `classPrefix` property for docx viewer renderer | component-specific prop, not theme prefix public API |

## 4. Non-Goals

- 不修改 ADR-001。
- 不把 `cxd.css` 文件名改掉。
- 不承诺 IE11 dynamic token theme switching。
- 不把 DOM-only `.cxd-*` alias 写成新公共主题 API。
