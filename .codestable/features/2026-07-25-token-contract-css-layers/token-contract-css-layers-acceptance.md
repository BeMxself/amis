---
doc_type: feature-acceptance
feature: 2026-07-25-token-contract-css-layers
status: passed
audit_state: not-started
audit_reason: ""
auditor_id: ""
acceptance_authorization_ref: "approval-report.md#goal-acceptance"
accepted: 2026-07-25
round: 1
---

# token-contract-css-layers 验收报告

> 阶段：阶段 3（验收闭环）
> 验收日期：2026-07-25
> 关联方案 doc：`.codestable/features/2026-07-25-token-contract-css-layers/token-contract-css-layers-design.md`

## 1. 接口契约核对

**接口示例逐项核对**：

- [x] `@layer amis.reset, amis.tokens, amis.components, amis.theme, amis.user`：`packages/amis-ui/scss/tokens/_layers.scss` 声明，编译主题 CSS 可观察。
- [x] `--amis-palette-*` -> `--amis-color-*` -> `--amis-Button-*`：`packages/amis-ui/scss/tokens/_base.scss` 定义，dark 编译产物可观察 `--amis-palette-neutral-text-inverse` -> `--amis-color-text-inverse` -> `--amis-Button-primary-*`。
- [x] 旧 token alias：`tokens/_legacy-aliases.scss` 覆盖 Button primary 首批旧 token，`tokens/_legacy-palette-aliases.scss` 让 `--colors-brand-4/5/6` 最终指向 `--amis-palette-brand-400/500/600`。
- [x] Theme token override entry：`tokens/_theme-overrides.scss` 基于 `$amis-theme-name` 生成 `[data-amis-theme='...']` token override。

**名词层"现状 -> 变化"逐项核对**：

- [x] Token layer declaration：已新增 `tokens/_layers.scss`，并由 `_properties.scss` 经 `tokens/_index.scss` 接入。
- [x] Amis token namespace：新增 `--amis-palette-*`、`--amis-color-*`、`--amis-Button-*` 首批链路。
- [x] Legacy token alias map：旧 Button primary 和 brand palette alias 集中在 `tokens/` 目录及 `_components.scss` 的最终 primary proof 内，不在任意组件散落扩展。
- [x] Theme token override entry：`cxd/dark/antd/ang.scss` 设置 Sass theme values；default 通过 cxd 入口继承。
- [x] User override boundary：本 feature 只声明 layer 顺序和 token contract，不宣称全量 `amis.user` 覆写闭环；后续由 selector build / docs rollout 继续完成。

## 2. 行为与决策核对

**需求摘要逐项验证**：

- [x] 新代码使用 `--amis-*` token 主路径：首批 palette / semantic / component token 已落地。
- [x] 主题身份通过 `[data-amis-theme]` 表达：theme override 入口已生成 `[data-amis-theme='cxd'|'dark'|'antd'|'ang']` token override。
- [x] 旧 token 继续可读：编译 CSS 最终声明断言通过，旧 brand token 最终 alias 到新 palette。
- [x] IE11 静态边界：本 feature 未改 `*-ie11.scss` 和 `packages/amis/build.sh`；未承诺 IE11 动态 token switching。

**明确不做逐项核对**：

- [x] 不迁移全部组件 SCSS 或 `$ns` selector：`git diff -G "\\.cxd-|#\\{\\$ns\\}" -- packages/amis-ui/scss` 无输出。
- [x] 不迁移 editor/theme-editor helper：`git diff -- packages/amis-theme-editor-helper packages/amis-editor-core` 无输出。
- [x] 不输出 `.cxd-*` SCSS/CSS legacy selector 兼容层：未新增相关 diff；既有 grep 命中保留为 baseline。
- [x] 不承诺 IE11 动态 token 切换：验收和 QA 只记录静态降级边界。

**关键决策落地**：

- [x] 先建 token contract，再做组件迁移：本 feature 只落最小 Button/token proof，不扩到全组件。
- [x] CSS layer 顺序集中声明且可观察：源码和编译 CSS 均可 grep。
- [x] 旧 token 映射集中治理：旧 token alias 由 `tokens/` 和 `_components.scss` 的 primary proof 承载。
- [x] 主题覆写优先走 `[data-amis-theme]` token 值：theme override 入口已接入。
- [x] IE11 只作为静态边界记录：未扩展 IE11 动态能力。

**挂载点反向核对**：

- [x] token contract SCSS 入口：`packages/amis-ui/scss/tokens/`。
- [x] 主题 SCSS 入口：`packages/amis-ui/scss/themes/{cxd,dark,antd,ang}.scss`。
- [x] 构建/验证证据：DoD / QA / evidence pack 覆盖 stylelint、build、grep、final declaration assertion。
- [x] CodeStable artifacts：implementation / review / QA / acceptance / DoD / gates / evidence pack 已落盘。

## 3. 验收场景核对

- [x] canonical layer order 可观察。
  - 证据来源：`rg` 源码 + 编译 CSS。
  - 结果：通过。
- [x] `--amis-palette-*` -> `--amis-color-*` -> `--amis-Button-*` 链路可读。
  - 证据来源：源码 diff、dark.css token 链路 grep。
  - 结果：通过。
- [x] 旧 `--colors-brand-5` / `--Button*` / `--button-*` 旧消费点继续解析。
  - 证据来源：Node final-declaration assertion、`_components.scss` final primary proof。
  - 结果：通过。
- [x] dark / antd / cxd / ang 主题覆写通过 `[data-amis-theme]` 或 token contract 表达。
  - 证据来源：`tokens/_theme-overrides.scss`、主题入口 Sass values、编译 CSS。
  - 结果：通过。
- [x] IE11 theme entry 只承诺静态降级。
  - 证据来源：IE11 entry / build script 无 diff；QA 明确不要求动态 token。
  - 结果：通过。
- [x] 反向核对：未新增 `.cxd-*` SCSS/CSS selector 兼容、未迁移 editor helper、未偷塞全组件迁移。
  - 证据来源：`git diff -G`、editor/helper diff、scope gate。
  - 结果：通过。

**review 报告重点复核**：

- [x] `token-contract-css-layers-review.md` 第 5 节 Test And QA Focus 已覆盖：最终声明断言、dark token 链路、负向 grep、user-layer 边界、IE11 静态边界。
- [x] residual risk 已处理：完整 `amis.components` / `amis.user` 闭环不是本 feature 交付物，记录为后续 feature 边界。

**QA 报告重点复核**：

- [x] 验证证据来源：`token-contract-css-layers-qa.md`。
- [x] QA matrix 覆盖 design 关键场景、DoD commands、review QA focus、evidence pack residual risks。
- [x] Feature type 判定为 non-functional，替代证据理由充分。
- [x] failed / blocked 项为 none。
- [x] Evidence pack、DoD Results、Gate Results 均为 passed；blocking DoD 均有 pass evidence。

## 4. 术语一致性

- TokenContract：roadmap / design / implementation / QA 使用一致，代码中未新增独立运行时模块名，符合“SCSS 契约术语”定位。
- `--amis-*`：新增 token 使用公共命名空间，未引入替代前缀。
- legacy alias：旧 token alias 指向新 token，未把 `.cxd-*` 选择器兼容作为 CSS contract。
- IE11 static boundary：报告统一表述为静态降级，不描述动态 token switching。

## 5. 领域影响盘点

- 新名词：`TokenContract` 已由 roadmap 和 feature design 承载，本 feature 不需要改 `requirements/CONTEXT.md`。
- 结构性选择：`packages/amis-ui/scss/tokens/` 成为主题 token 公共契约目录，design 2.5 建议后续走 `cs-keep` 沉淀为 compound convention。
- 流程级约束：旧 token alias 只能集中定义，组件 SCSS 不新增散落旧 token alias；建议在当前 milestone 后沉淀。

## 6. requirement delta / clarification 回写

- 无 requirement 影响。本 feature 是 ADR-001 / roadmap 下的技术契约落地，不新增用户可感能力，不改变长期 requirement。
- 不需要 owner-approved req delta。

## 7. roadmap 回写

- [x] `.codestable/roadmap/theme-system-refactor/theme-system-refactor-items.yaml` 中 `token-contract-css-layers` 已从 `in-progress` 改为 `done`。
- [x] `.codestable/roadmap/theme-system-refactor/theme-system-refactor-roadmap.md` 第 5 节对应条目已从 `planned / 未启动` 改为 `done / 2026-07-25-token-contract-css-layers`。
- [x] roadmap 状态只做机械完成回写，未改后续 feature scope。

## 8. attention.md 候选盘点

- 候选 1：本地系统 Python 缺 PyYAML 时，CodeStable gate runner 需要 `PYTHONPATH=/Users/songmingxu/Projects/gold-market/.venv/lib/python3.13/site-packages`，否则 `codestable-dod-runner.py` 会把 YAML artifact 判为 blocked。
- 候选 2：`npm run build --workspace amis-ui` 在本 workspace 可到 `created lib` / `created esm` 后仍不退出，需把“输出完成后手动中断”作为 build runner warning 记录。
- 候选 3：主题 token 公共契约统一放在 `packages/amis-ui/scss/tokens/`，组件 SCSS 不新增散落旧 token alias。

以上候选不在 acceptance 阶段直接写入 `attention.md`；按协议作为退出后沉淀/notes 候选。

## 9. 遗留

- 后续优化点：`stylesheet-stable-selector-build` 继续完成 selector inventory / guard / `amis.components` / `amis.user` 覆写实证。
- 后续优化点：`core-component-selector-migration` 批量迁移组件 selector 和旧 token 消费。
- 后续优化点：`editor-theme-helper-migration` 处理 `ParseThemeData`、`.AMISCSSWrapper` 和历史 schema。
- 已知限制：IE11 只保留静态 CSS 降级边界；本 feature 不验证完整发布产物动态能力。

## 10. 最终审计

- 验证证据来源：`token-contract-css-layers-qa.md`。
- Evidence sources：`token-contract-css-layers-evidence-pack.md` / `token-contract-css-layers-dod-results.json` / `token-contract-css-layers-gate-results.json`。
- 聚合命令：
  - `npm run stylelint`：exit 0。
  - `npm run build --workspace amis-ui`：fresh run reached `created lib` / `created esm`；输出完成后需中断，记录 warning。
  - Node final brand alias assertion：exit 0，`cxd/default/antd/ang/dark` 均通过。
  - negative token回流 grep：exit 1 / no output，符合预期。
  - YAML validate：exit 0。
  - workflow-next epic gate：exit 0，authorization refs 可见。
  - `git diff --check`：exit 0。
- 场景复核：re-verified 8 / trust-prior-verify 0。
- 交付物复核：代码 / CodeStable artifacts / roadmap 回写通过；requirement / architecture doc 无本 feature 直接写入。
- 完整工作区复核：当前工作区 dirty files 均属于本 feature 范围或 roadmap state/writeback；untracked token artifacts 是本 feature 交付物。
- diff 清洁度：通过；无 debug output、临时 TODO/FIXME/XXX、注释掉代码、方案外文件。
- 知识沉淀出口：attention / compound convention 候选已登记在第 8 节和第 5 节。
- 结论：通过。
