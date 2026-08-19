---
doc_type: docs-rollout-handoff
feature: 2026-07-25-legacy-prefix-teardown
roadmap: theme-system-refactor
roadmap_item: legacy-prefix-teardown
status: ready-for-docs-rollout
updated: 2026-07-28
---

# legacy-prefix-teardown Docs Rollout Handoff

## 1. User-Facing Message

最终用户不需要理解主题类前缀。主题定制主路径应写成：

- 标准样式值：使用 `--prismui-*` token。
- 组件定位：使用稳定 `.prismui-*` component class。
- 主题差异：使用 `[data-prismui-theme="..."]` 作用域。
- 非标准遗留覆写：迁移期可评估显式 DOM-only `.cxd-*` alias，但不把它写成推荐入口。

## 2. Must Say

- `classPrefix` 是 legacy/internal 兼容字段，不再是公开主题样式 API。
- DOM-only `.cxd-*` alias 默认关闭，只允许显式 `cxd`，只为了迁移老定制 CSS。
- amis 不提供 `.cxd-*` SCSS/CSS selector 双编译，不生成 parallel legacy CSS selector layer。
- `cxd.css` / `cxd-ie11.css` 是文件名兼容和 IE11 静态 CSS 降级边界，不代表 `.cxd-*` selector compatibility。
- IE11 只保留静态 CSS 降级说明，不承诺动态 token theme switching。

## 3. Must Not Say

- 不要把 `.cxd-*`、`.antd-*`、`.dark-*` 作为新主题覆写推荐写法。
- 不要建议用户通过 `classPrefix` 创建新的主题样式命名空间。
- 不要承诺 DOM-only alias 会在固定版本自动退出。
- 不要把 `.AMISCSSWrapper` 描述成主题身份；它只是 editor/preview 容器别名。

## 4. Migration Notes For Docs Rollout

| Legacy Pattern | Replacement / Guidance |
|---|---|
| `.cxd-Button` | `.prismui-Button` |
| `.cxd-Button--primary` with theme-specific values | `[data-prismui-theme="custom"] .prismui-Button--primary` or token override |
| `#{$ns}` in custom SCSS | stable selector helper or explicit `.prismui-*` |
| `classPrefix` based DOM query | stable helper such as `getStableClassSelector()` |
| theme-editor old `.cxd-*` selector configs | migrate to scoped `[data-prismui-theme] .prismui-*` and record warnings for historical schema |
| `cxd.css` / `cxd-ie11.css` | keep as file names; explain separately from selector policy |

## 5. Risk Notes

- Large `classPrefix` grep output contains legacy props passthrough and third-party behavior configuration. Do not tell users these are all supported public styling hooks.
- Remaining `#{$ns}` SCSS baseline is migration debt guarded by policy; it is not permission to add new old-prefix selectors.
- DOM-only alias helps old custom pages, but it increases the chance that users keep writing `.cxd-*`; docs should describe it as a temporary migration aid.

## 6. Inputs To Consume

- `.codestable/features/2026-07-25-legacy-prefix-teardown/legacy-prefix-teardown-ledger.md`
- `.codestable/features/2026-07-25-legacy-prefix-teardown/legacy-prefix-teardown-alias-retention-record.md`
- `packages/amis-ui/scripts/theme-selectors/policy.json`
- `.codestable/features/2026-07-25-editor-theme-helper-migration/editor-theme-helper-migration-helper-scss-inventory.md`
- `.codestable/features/2026-07-25-core-component-selector-migration/core-component-selector-migration-ledger.md`
