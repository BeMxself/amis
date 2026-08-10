---
doc_type: roadmap-review
roadmap: theme-system-refactor
status: passed
review_state: passed
review_reason: ""
reviewer_id: "019f9265-57a2-7f23-8e25-1fecd0dbe2b4"
reviewed: 2026-07-24
round: 1
---

# theme-system-refactor roadmap 审查报告

## 1. Scope And Inputs

- Roadmap: `.codestable/roadmap/theme-system-refactor/theme-system-refactor-roadmap.md`
- Items: `.codestable/roadmap/theme-system-refactor/theme-system-refactor-items.yaml`
- Related docs: `.codestable/attention.md`, `.codestable/requirements/CONTEXT.md`, `.codestable/requirements/adrs/001-tokenized-theme-system.md`
- Code facts checked: `packages/amis-core/src/theme.tsx`, `packages/amis-core/src/Root.tsx`, `packages/amis-core/src/index.tsx`, `packages/amis-core/src/components/Overlay.tsx`, `packages/amis-ui/scss/_variables.scss`, `packages/amis-ui/scss/_properties.scss`, `packages/amis-ui/scss/themes/_cxd-variables.scss`, `packages/amis-ui/scss/components/_button.scss`, `packages/amis-editor-core/src/manager.ts`, `packages/amis-editor-core/src/util.ts`, `packages/amis-theme-editor-helper/src/helper/ParseThemeData.ts`, `docs/zh-CN/extend/contribute.md`, `docs/zh-CN/start/getting-started.md`, `packages/amis/build.sh`, workspace `package.json` scripts
- Validation run: `validate-yaml.py --yaml-only` passed; `js-yaml` DAG check passed with 8 items, exactly one `minimal_loop`, no unknown dependency, no self dependency, no cycle

### Independent Review

- Status: completed
- Detection: independent-agent
- Provider / agent: `Hypatia` / `019f9265-57a2-7f23-8e25-1fecd0dbe2b4`
- Raw output: 独立 reviewer 未发现 blocking；提出 5 个 important、1 个 nit、2 个 suggestion、1 个 residual-risk
- Merge policy: 已逐条本地核验；5 个 important 均已转成 roadmap/items 约束或验收边界
- Gate effect: no blocking；可进入用户 review

## 2. Roadmap Summary

- Goal completion signal: 用户不再依赖主题类名前缀；组件输出稳定 `.amis-*`，主题身份由 `[data-amis-theme]` 表达，标准样式值走 token，非标准差异走主题作用域选择器。
- Module split: Theme Runtime、Token Contract、Stylesheet Build、Overlay Scope、Component Migration、Editor Integration、Verification And Docs 七块职责清楚。
- Interface contracts: 已定义 ThemeScope、TokenContract / CSS Layer、StableSelector、OverlayThemeScope、EditorThemeCss 五类共享契约。
- Items: 8 个 planned item；`theme-runtime-button-pilot` 是唯一最小闭环；后续按 token / selector / overlay / component / editor / teardown / docs 收口推进。
- Dependency shape: DAG，无未知依赖、自依赖或循环。

## 3. Findings

### blocking

- none

### important

- none open
- Resolved: 第一轮 `RMR-001` 已通过更细验证入口和“每个子 feature design 必须收窄命令 / fixture / 手工路径”处理。
- Resolved: 第一轮 `RMR-002` 已通过 `theme-runtime-button-pilot` 范围闸门处理，仅允许 Button、最小 token alias、最小 SCSS entry 和必要 runtime scope。
- Resolved: 第一轮 `RMR-003` 已通过 Theme Runtime 的 source-of-truth 约束处理，要求 `themeName` 派生 `ThemeInstance`、`ThemeScope`、`ThemeContext`、`env.theme` 和 Root DOM attribute。
- Resolved: 第一轮 `RMR-004` 已通过 selector inventory / allowlist 分类和 `legacy-prefix-teardown` 通过条件处理。
- Resolved: 第一轮 `RMR-005` 已通过 editor 验收四分法处理：generated CSS、preview scope、historical schema migration、helper SCSS inventory。

### nit

- none open

### suggestion

- resolved: 用户已确认 `amis-` 稳定组件类名前缀、旧主题前缀退出公共 API、IE11 只保留静态 CSS 降级边界；`.cxd-*` SCSS/CSS legacy selector 编译开关已评估为高影响并放弃，DOM-only `.cxd-*` alias 可作为显式迁移开关验证，最长 1 年内复审，是否退出由人工架构评审决定。

### learning

- 这个 epic 的核心风险是 source of truth 迁移：ThemeInstance、Root DOM scope、portal container、editor preview、theme-editor generator 必须收敛到同一契约，而不是只做字符串替换。

### praise

- Overlay Scope 单独拆出是正确的；ADR-001 已明确浮层是高风险区，roadmap 也给了独立 item 和多 root / body container / editor preview 验证要求。

## 4. User Review Focus

- 用户已拍板：稳定组件类名前缀确定为 `amis-`；旧 `.cxd-*` / `.antd-*` / `.dark-*` 不再作为公共样式 API；`.cxd-*` SCSS/CSS legacy selector 编译开关已评估为高影响并放弃；DOM-only `.cxd-*` alias 可作为显式迁移开关验证，最长 1 年内复审，是否退出人工决定且不设固定自动删除卡点；IE11 只保留静态 CSS 降级边界。
- 后续 feature-design 需要重点复核：`theme-runtime-button-pilot` 不得膨胀；ThemeScope source-of-truth 不得拆成多条并行真相；selector allowlist 必须先于大规模清理；新增 `.cxd-*` selector、`classPrefix` 样式依赖和 editor `.cxd-*` 依赖必须被 guard 拦截或落入 inventory 例外分类；editor 迁移必须覆盖历史 schema 和 helper SCSS。
- 不能靠 roadmap review 完全确认的点：CSS layer 经过 postcss / ie11 build 后的真实产物行为；现有 examples 中旧选择器迁移量；外部用户是否有未纳入仓库的 `.cxd-*` 自定义 CSS。

## 5. Evidence Confidence Ledger

| Check | Verdict | Evidence Class | Basis | Follow-up |
|---|---|---|---|---|
| Granularity Gate | pass | E | roadmap 第 2 节已说明不是 single feature / brainstorm，且定义最小闭环与范围边界 | none |
| Goal Coverage Matrix | pass | E | roadmap 第 5 节将核心完成信号映射到 item、验证入口和证据类型 | 子 feature design 继续收窄命令 |
| DAG and minimal loop | pass | E | `validate-yaml.py` 通过；`js-yaml` 检查 8 items、唯一 `theme-runtime-button-pilot`、无 unknown/self/cycle | none |
| Interface contract usability | pass | E/C | ThemeScope、TokenContract、StableSelector、OverlayThemeScope、EditorThemeCss 已写到类型、字段、selector、helper 级别，并对齐现有代码事实 | feature-design 如需改契约必须回 epic planning |
| Module interface depth | pass | E/C | 七个模块均有职责、不做、触碰代码、Depth 判断；source-of-truth、selector allowlist、editor schema migration 已补强 | none |

Summary: E=3, C=2, H=0, H-only core checks=none。

## 6. Residual Risk

- CSS layer 与 IE11 postcss 输出的真实兼容性仍需后续 feature 用实际 build artifact 证明；现有 `packages/amis/build.sh` 仍生成 `*-ie11.css`，文档也已说明 IE11 不支持 CSS 变量。
- 旧 `.cxd-*` 外部用户自定义 CSS 不在仓库内，DOM-only alias 只能保证选择器继续命中，不能保证旧 CSS 视觉语义自动适配 token 化；docs rollout 仍需要提供迁移指南。
- DOM-only alias 不设自动删除卡点，可能延长保留时间；风险缓解依赖新增依赖 guard、inventory 分类和 1 年内人工复审，而不是靠固定版本强删。
- 第二轮 focused independent rerun 因工具参数校验问题未启动；本报告依据第一轮独立 review + 主 agent 本地事实核验定稿，未把未完成的第二轮伪装成完成。

## 7. Verdict

- Status: passed
- Next: roadmap 已可作为 active 规划进入子 feature design batch；第一条是 `theme-runtime-button-pilot`。
