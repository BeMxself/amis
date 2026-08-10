---
doc_type: helper-scss-inventory
feature: 2026-07-25-editor-theme-helper-migration
roadmap: theme-system-refactor
roadmap_item: editor-theme-helper-migration
status: current
updated: 2026-07-26
---

# editor-theme-helper-migration helper SCSS inventory

## 1. 结论

本轮没有把 helper/editor 内置 SCSS 全量清零，而是完成分类和 guard 收口：`npm run check:theme-selectors --workspace amis-ui` 当前通过，基线为 1503 个 legacy match，0 个新增未分类 violation。剩余 editor/helper 命中属于迁移期存量，不作为新的公共主题 API。

核心边界：

- `.AMISCSSWrapper` 只保留为 preview / popover / modal 容器别名，不再作为主题身份来源。
- `.cxd-*` 的 SCSS/CSS 双轨兼容不实现；存量命中必须有分类、owner 和退出条件。
- 新生成 CSS 和 preview scope 已迁到 `[data-amis-theme]` / `.amis-*`。
- 本 inventory 是 `legacy-prefix-teardown` 和 docs rollout 的输入，不是永久 allowlist。

## 2. 命令快照

```bash
rg --count-matches "\.cxd-|AMISCSSWrapper" \
  packages/amis-theme-editor-helper/src/style \
  packages/amis-editor-core/scss \
  packages/amis-editor/src/plugin
```

结果：28 个文件，78 处命中。

```bash
npm run check:theme-selectors --workspace amis-ui
```

结果：`Theme selector guard passed: 1503 legacy baseline match(es), 0 new violation(s).`

## 3. 分类清单

| Area | File / Lines | Selector / Token | Classification | Owner | Retain Reason | Exit Condition |
|---|---|---|---|---|---|---|
| theme-editor helper style | `packages/amis-theme-editor-helper/src/style/_padding-and-margin.scss:116,206` | `.cxd-Form-item` | internal-legacy | editor-theme-helper-migration | theme-editor helper 面板内部 Form 布局存量样式 | helper 面板样式迁到 `.amis-Form-item` 或 token 化布局变量 |
| theme-editor helper style | `packages/amis-theme-editor-helper/src/style/_border.scss:122,131,157` | `.cxd-Form-item`, `.cxd-Select` | internal-legacy | editor-theme-helper-migration | border 控制面板依赖旧 Form/Select DOM | helper 面板控件稳定类迁移后删除 |
| theme-editor helper style | `packages/amis-theme-editor-helper/src/style/_radius.scss:7` | `.cxd-Form-item` | internal-legacy | editor-theme-helper-migration | radius 控制面板内部布局存量 | helper Form selector 统一迁移后删除 |
| theme-editor helper style | `packages/amis-theme-editor-helper/src/style/index.scss:13` | `.cxd-PopOver` | internal-legacy | editor-theme-helper-migration | helper popover 旧容器样式 | popover container 统一 ThemeScope + stable selector 后删除 |
| theme-editor helper style | `packages/amis-theme-editor-helper/src/style/_color-picker.scss:244,283,286,289` | `.cxd-SearchBox`, `.cxd-Number*` | internal-legacy | editor-theme-helper-migration | color picker 内部搜索和数字输入样式存量 | helper 控件样式迁到 stable selector/token 后删除 |
| editor-core SCSS | `packages/amis-editor-core/scss/control/_formItem-control.scss:155,160` | `.cxd-Combo*` | internal-legacy | editor-theme-helper-migration | editor form-item 控制面板内部 Combo 布局 | Combo 控件稳定类迁移后删除 |
| editor-core SCSS | `packages/amis-editor-core/scss/control/_switch-more-control.scss:37,38` | `.cxd-DropDown`, `.cxd-Button` | internal-legacy | editor-theme-helper-migration | switch-more 控制面板操作按钮样式 | DropDown/Button helper 样式 stable 化后删除 |
| editor-core SCSS | `packages/amis-editor-core/scss/control/_key-value-map-control.scss:20` | `.cxd-Container-body` | internal-legacy | editor-theme-helper-migration | key-value-map 控制面板容器样式 | Container 稳定类或局部 editor class 替代后删除 |
| editor-core SCSS | `packages/amis-editor-core/scss/control/_api-control.scss:153,157` | `.cxd-EditorControl`, `.cxd-MonacoEditor-placeholder` | internal-legacy | editor-theme-helper-migration | API control 兼容旧 editor 控件 DOM | editor control 稳定类补齐后删除 |
| editor-core SCSS | `packages/amis-editor-core/scss/control/_nav-control.scss:80,83,86,91,94,181` | `.cxd-Form-groupColumn`, `.cxd-TextControl*`, `.cxd-IconPickerControl-*` | internal-legacy | editor-theme-helper-migration | nav 控制面板旧 Form/Text/Icon 控件样式 | 控件稳定类迁移或 token 化后删除 |
| editor-core SCSS | `packages/amis-editor-core/scss/control/_status.scss:29,30,32,39,48,63` | `.cxd-Combo*`, `.cxd-Form-*`, `.cxd-Icon*` | internal-legacy | editor-theme-helper-migration | status 控制面板内部布局 | 控件稳定类迁移后删除 |
| editor-core SCSS | `packages/amis-editor-core/scss/_mixin.scss:87` | `.cxd-Collapse-content` | internal-legacy | editor-theme-helper-migration | editor mixin 依赖旧 Collapse DOM | Collapse editor 样式 stable 化后删除 |
| editor-core SCSS | `packages/amis-editor-core/scss/style-control/_theme-css-code.scss:83,103` | `.cxd-MonacoEditor-placeholder`, `.cxd-ThemeCssCode-custom-editor` | internal-legacy | editor-theme-helper-migration | ThemeCss code editor 内部存量样式 | editor code control stable class 替代后删除 |
| editor-core SCSS | `packages/amis-editor-core/scss/editor.scss:283,286` | commented `.cxd-Page*` | docs-historical | theme-system-validation-docs-rollout | 注释中的历史 selector，不生成 CSS | docs rollout 或后续清理注释时删除 |
| editor plugin themeCss config | `packages/amis-editor/src/plugin/Page.tsx:140,144,368,372,376,380,384` | `.cxd-Page*` | themeCss-config-legacy | editor-theme-helper-migration | 旧 themeCss 配置 selector，用户 schema 迁移需要识别 | themeCss 配置迁移到 stable selector 或 migration warning 后删除 |
| editor plugin themeCss config | `packages/amis-editor/src/plugin/Button.tsx:380` | `.cxd-Button` | themeCss-config-legacy | editor-theme-helper-migration | Button 旧 themeCss selector 配置 | Button themeCss selector stable 化后删除 |
| editor plugin themeCss config | `packages/amis-editor/src/plugin/Tabs.tsx:391,395,399,403` | `.cxd-Tabs*` | themeCss-config-legacy | editor-theme-helper-migration | Tabs 旧 themeCss selector 配置 | Tabs themeCss selector stable 化后删除 |
| editor plugin themeCss config | `packages/amis-editor/src/plugin/Panel.tsx:89` and `packages/amis-editor/src/plugin/Form/Form.tsx:151` | `:scope.cxd-Panel .cxd-Panel-title` | themeCss-config-legacy | editor-theme-helper-migration | Panel/Form 旧样式定位配置 | Panel/Form themeCss stable selector 替代后删除 |
| editor plugin themeCss config | `packages/amis-editor/src/plugin/Form/Item.tsx:43,47` | `.cxd-Form-label`, `.cxd-Form-description` | themeCss-config-legacy | editor-theme-helper-migration | Form item 旧 themeCss selector 配置 | Form item stable selector 替代后删除 |
| editor plugin themeCss config | `packages/amis-editor/src/plugin/Form/InputText.tsx:519,523,527,531,535` | `.cxd-from-item`, `.cxd-Form-label`, `.cxd-TextControl*` | themeCss-config-legacy | editor-theme-helper-migration | InputText 旧 themeCss selector 配置 | InputText themeCss stable selector 替代后删除 |
| editor plugin themeCss config | `packages/amis-editor/src/plugin/Form/InputNumber.tsx:340,344,348,352` | `.cxd-from-item`, `.cxd-Form-label`, `.cxd-Number*` | themeCss-config-legacy | editor-theme-helper-migration | InputNumber 旧 themeCss selector 配置 | InputNumber themeCss stable selector 替代后删除 |
| editor plugin themeCss config | `packages/amis-editor/src/plugin/Form/InputTree.tsx:845,849` | `.cxd-TreeControl`, `.cxd-Tabs-toolbar` | themeCss-config-legacy | editor-theme-helper-migration | InputTree 旧 themeCss selector 配置 | InputTree themeCss stable selector 替代后删除 |
| editor plugin themeCss config | `packages/amis-editor/src/plugin/Form/Picker.tsx:628,632,636,640` | `.cxd-from-item`, `.cxd-Form-label`, `.cxd-Picker*` | themeCss-config-legacy | editor-theme-helper-migration | Picker 旧 themeCss selector 配置 | Picker themeCss stable selector 替代后删除 |
| preview / popover wrapper | `packages/amis-editor/src/plugin/CRUD2/BaseCRUD.tsx:182`, `Images.tsx:23`, `Form/Form.tsx:469`, `Nav.tsx:37`, `Form/Picker.tsx:65` | `:AMISCSSWrapper` / `app-popover :AMISCSSWrapper` | container-alias-retained | editor-theme-helper-migration | preview/modal/popover 容器别名；不承载 theme identity | 对应容器补齐 `data-amis-theme` 后，docs rollout 决定是否移除别名 |

## 4. Handoff

- `legacy-prefix-teardown` 应消费本 inventory 和 selector guard baseline，继续收敛剩余 `.cxd-*` 与 `AMISCSSWrapper`。
- `theme-system-validation-docs-rollout` 应把“`.AMISCSSWrapper` 只是容器别名，不是主题身份”写入迁移文档。
- 任何新增 `.cxd-*` selector、`classPrefix` selector 或未分类 helper SCSS 命中都应由 `check:theme-selectors` 阻断。
