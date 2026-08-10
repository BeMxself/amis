---
doc_type: feature-implementation
feature: 2026-07-25-token-contract-css-layers
roadmap: theme-system-refactor
roadmap_item: token-contract-css-layers
status: passed
implemented: 2026-07-25
---

# token-contract-css-layers 实现记录

## 1. Scope

本轮实现只覆盖 token contract / CSS layer / legacy token alias / theme-scope token override 的最小契约闭环，不迁移全量组件选择器，不迁移 editor/theme-editor helper，不输出 `.cxd-*` SCSS/CSS legacy selector 兼容层。

## 2. Step Evidence

| Step | 退出信号 | 证据 |
|---|---|---|
| S1 微重构入口 | `tokens` 入口可被 `_properties.scss` 引入，旧导入链继续可用 | 新增 `packages/amis-ui/scss/tokens/`，`_properties.scss` 引入 `./tokens/index`；`npm run build --workspace amis-ui` 通过 |
| S2 契约骨架 | 可观察 canonical layer 顺序和 palette→semantic→component/state token 链 | `tokens/_layers.scss` 声明 `@layer amis.reset, amis.tokens, amis.components, amis.theme, amis.user`；`tokens/_base.scss` 定义 `--amis-palette-*`、`--amis-color-*`、`--amis-Button-*` |
| S3 旧 token alias | 旧 token 继续解析，新增 alias 集中在 token contract | `tokens/_legacy-aliases.scss` 集中把 `--button-primary-*` 首批 alias 指向 `--amis-Button-*`；`tokens/_legacy-palette-aliases.scss` 在主题变量后把 `--colors-brand-4/5/6` 最终桥接到 `--amis-palette-brand-400/500/600`；`_components.scss` 中首批 primary Button 最终变量也指向 `--amis-Button-*`，避免 alias 被旧定义覆盖 |
| S4 主题覆写入口 | 主题差异不依赖新增 `.cxd-*` selector，IE11 只保留静态边界 | `tokens/_theme-overrides.scss` 基于 `$amis-theme-name` 生成 `[data-amis-theme='...']` token override；`cxd/dark/antd/ang.scss` 设置 theme name；IE11 entry 仍仅 inline 静态 theme css |
| S5 构建验证 | 核心验证命令通过，既有 warning 已归因 | `npm run stylelint` 通过；`npm run build --workspace amis-ui` 通过，仅出现既有 Sass deprecation / rollup circular warnings |
| S6 范围收口 | 反向核对未偷塞后续 feature | diff 仅触及 token contract、theme entry、checklist 和 goal-state；没有修改 editor/helper、component migration 或 legacy teardown 代码 |

TDD exception：本 feature 是 SCSS contract / build-time 配置变更，没有新增可用单测可靠观察的运行时行为；替代证据为 stylelint、amis-ui build、compiled CSS grep 和 selector/token grep。

## 3. Commands

- `PYTHONPATH=/Users/songmingxu/Projects/gold-market/.venv/lib/python3.13/site-packages python3 /Users/songmingxu/.agents/skills/cs-onboard/tools/codestable-workflow-next.py feature --feature .codestable/features/2026-07-25-token-contract-css-layers --require-implementation-ready --json`
  - 结果：通过；`implementation_ready: true`，依赖 `theme-runtime-button-pilot` 为 `done`。
- `python3 /Users/songmingxu/.agents/skills/cs-onboard/tools/validate-yaml.py --file .codestable/features/2026-07-25-token-contract-css-layers/token-contract-css-layers-checklist.yaml --yaml-only`
  - 结果：通过；本机 PyYAML 缺失，使用 builtin fallback parser。
- `rg -n "@layer amis\\.reset, amis\\.tokens, amis\\.components, amis\\.theme, amis\\.user" packages/amis-ui/scss`
  - 结果：通过；命中 `packages/amis-ui/scss/tokens/_layers.scss`。
- `rg -n -- "--amis-(palette|color|Button)" packages/amis-ui/scss`
  - 结果：通过；命中 token contract 与既有 Button pilot `.amis-Button` proof。
- `rg -n "\\.cxd-|#\\{\\$ns\\}" packages/amis-ui/scss`
  - 结果：仅命中既有 baseline：`_condition-builder.scss`、`form/_form.scss`、`_mobile-dev-tool.scss`。
- `npm run stylelint`
  - 结果：通过。
- `npm run build --workspace amis-ui`
  - 结果：通过；产物 `packages/amis-ui/lib/themes/*.css` 可观察 `@layer`、`--amis-*` 和 `[data-amis-theme=...]` token override。输出包含既有 Sass deprecation、rollup circular dependency、TS5051 与 browserslist warning，未阻断构建。
- `git diff --check`
  - 结果：通过。
- Review-fix:
  - REV-001：`tokens/_base.scss` 改为由 Sass theme entry 提供首批 palette 字面值，避免新 `--amis-palette-*` 反向依赖旧 `--colors-*`。
  - REV-002：`_components.scss` 中首批 primary Button default / hover / active 背景、文字和边框颜色最终定义改为指向 `--amis-Button-*`，dark 主题同步设置 `--amis-Button-primary-*` 文字色，保持既有视觉边界。
  - REV-006：新增 `tokens/_legacy-palette-aliases.scss` 并在主题变量和 common 后导入，使 `--colors-brand-4/5/6` 的最终 winning declaration 指向 `--amis-palette-brand-400/500/600`。
  - REV-007：复审发现 dark 主题的 `--amis-Button-primary-*` 文字色覆写落在未分层 `:root, .AMISCSSWrapper` 中；已删除该旁路，把 dark primary 文本色收回为 `$amis-palette-neutral-text-inverse: #f7f8fa`，由 token contract 的 `--amis-color-text-inverse` / `--amis-Button-primary-*` 链路承载。
  - REV-003：本 feature 不包裹全量 reset/components 到 CSS layer；当前只声明 canonical layer 顺序并放入 token/theme-scope 最小入口，完整 `amis.components` / `amis.user` cascade 实证交给后续 `stylesheet-stable-selector-build` 和 docs rollout。

## 4. Deliverables

- `packages/amis-ui/scss/tokens/_layers.scss`
- `packages/amis-ui/scss/tokens/_base.scss`
- `packages/amis-ui/scss/tokens/_legacy-aliases.scss`
- `packages/amis-ui/scss/tokens/_legacy-palette-aliases.scss`
- `packages/amis-ui/scss/tokens/_theme-overrides.scss`
- `packages/amis-ui/scss/tokens/_index.scss`
- `packages/amis-ui/scss/_components.scss`
- `packages/amis-ui/scss/_properties.scss`
- `packages/amis-ui/scss/themes/cxd.scss`
- `packages/amis-ui/scss/themes/dark.scss`
- `packages/amis-ui/scss/themes/antd.scss`
- `packages/amis-ui/scss/themes/ang.scss`

## 5. Cleanliness

- 未新增 debug output。
- 未新增临时待办标记。
- 未注释掉代码。
- 未改 editor/theme-editor helper。
- 未迁移组件选择器。
- 未新增 `.cxd-*` SCSS/CSS legacy selector 兼容层。
- CSS layer 当前边界为 token/theme-scope contract 入口；全量组件分层和 `amis.user` 覆写实证不在本 feature 内完成，后续由 selector build / docs rollout 收口。

## 6. Follow-Up

- `stylesheet-stable-selector-build` 应消费本 token contract，并继续建立 selector inventory / guard。
- `core-component-selector-migration` 后续再把组件消费点从旧 token / `$ns` 迁移到稳定 selector 和 component/state token。
- `editor-theme-helper-migration` 后续处理 `ParseThemeData`、`.AMISCSSWrapper` 和旧 schema 迁移。
