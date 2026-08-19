---
doc_type: feature-acceptance
feature: 2026-07-25-legacy-prefix-teardown
status: passed
audit_state: not-started
audit_reason: ""
auditor_id: ""
acceptance_authorization_ref: "approval-report.md#goal-acceptance"
accepted: 2026-07-28
round: 1
---

# legacy-prefix-teardown 验收报告

> 阶段：阶段 3（验收闭环）
> 验收日期：2026-07-28
> 关联方案 doc：`.codestable/features/2026-07-25-legacy-prefix-teardown/legacy-prefix-teardown-design.md`

## 1. 接口契约核对

**接口示例逐项核对**：
- [x] `AliasRetentionRecord` 示例：`legacyDomClassAlias` 默认 `false`、显式值仅 `cxd`、不生成库 CSS → 代码实际行为一致，`normalizeLegacyDomClassAlias()` 只接受 `cxd`，`theme.test.ts` 覆盖非法 `antd` 不输出旧类。
- [x] `LegacyPrefixLedger` 示例：剩余旧前缀命中有 kind / owner / retain reason / exit condition → `legacy-prefix-teardown-ledger.md` 已覆盖 public selector、behavior dom selector、internal legacy、runtime alias、theme behavior config、legacy props passthrough、file-name compatibility、docs historical、generated artifact，并明确合法 `#{$ns}` 插值不属于旧前缀债务。
- [x] `PrefixPublicApiGuard` 示例：新增行为 DOM selector 依赖必须失败 → `checkThemeSelectors.js` 与 bad fixture 覆盖 direct / props / destructured / prebuilt / `cx(...)` / Sortable 反例。

**名词层"现状 → 变化"逐项核对**：
- [x] Legacy prefix public contract：从公共 API 收口为 ledger 分类治理；默认主路径转向 `.prismui-*`、`[data-prismui-theme]`、token。
- [x] DOM-only legacy alias：保留为显式迁移能力，不自动支持 `antd` / `dark`，不生成 SCSS/CSS legacy selector 兼容层。
- [x] AliasRetentionRecord：已落盘并记录最多 1 年窗口内人工评估、责任方和退出评估材料。

**流程图核对**：
- [x] 确认前置依赖 done → ledger 汇总 → 公共依赖迁移/内部化 → alias retention → guard 反向验证 → docs rollout handoff → evidence 收口，均有 checklist step done 与 implementation evidence 对应。

## 2. 行为与决策核对

**需求摘要逐项验证**：
- [x] 默认主路径只暴露 `.prismui-*`、`[data-prismui-theme]` 和 token：runtime tests、renderer snapshots、ledger 和 docs handoff 均一致。
- [x] 剩余 `classPrefix` / `.cxd-*` 依赖被迁移、内部化或分类：ledger 与 scoped grep 证据一致。
- [x] docs rollout 只接收迁移事实和风险记录：`legacy-prefix-teardown-docs-rollout-handoff.md` 明确 must say / must not say。

**明确不做逐项核对**：
- [x] 不重新启用 SCSS/CSS `.cxd-*` legacy selector 双编译或双产物：无新增库 CSS compat layer；ledger 将硬编码旧 selector 与合法 Sass 命名空间插值分开治理。
- [x] 不把 `.cxd-*` / `.antd-*` / `.dark-*` 写成新公共样式入口：docs handoff 明确 must not say。
- [x] 不自动退出 alias、不绑定固定版本卡点：AliasRetentionRecord 写成人工评估。
- [x] 不承诺 IE11 动态 token：docs handoff 写为静态 CSS 降级边界。

**关键决策落地**：
- [x] implementation admission 依赖 done：前置 `core-component-selector-migration`、`editor-theme-helper-migration` 均已 accepted / done。
- [x] DOM-only alias 只允许 `cxd`：`normalizeLegacyDomClassAlias()` 与 `theme.test.ts` 验证。
- [x] 剩余命中必须可审计：LegacyPrefixLedger 有分类、owner、保留原因和退出条件。
- [x] 退出机制人工评估：AliasRetentionRecord 已记录 owner、trigger、window、inputs、allowed outcomes。

**编排层"现状 → 变化"逐项核对**：
- [x] Theme Runtime：新增 alias normalization 和 `ThemeScopeProps` barrel export。
- [x] Selector Guard：增强 classprefix DOM selector 检测，覆盖 indirect / props / destructured alias 和 behavior sinks。
- [x] Component / renderer behavior selector：迁移 Tabs、Tree、Table、VariableList、Cards/List/Form/Table/Video 等行为查询到 stable selector helper。
- [x] QA / review / evidence：review passed，QA passed，DoD / scope / evidence pack passed。

**流程级约束核对**：
- [x] 不把 broad `classPrefix` props passthrough 误删：ledger 标为 legacy props passthrough / theme behavior config。
- [x] 文件名兼容不等于 selector compatibility：ledger 与 docs handoff 均明确。
- [x] guard 新增命中直接阻塞：default guard 0 new violation，bad fixture expected fail。

**挂载点反向核对（可卸载性）**：
- [x] 挂载点：Theme Runtime alias policy → `packages/amis-core/src/theme.tsx` / `theme.test.ts`。
- [x] 挂载点：PrefixPublicApiGuard → `packages/amis-ui/scripts/checkThemeSelectors.js` / policy / fixtures。
- [x] 挂载点：LegacyPrefixLedger / AliasRetentionRecord / docs handoff → feature 目录三份文档。
- [x] 反向核查：`rg` / scope gate / DoD `CMD-007` 覆盖剩余旧前缀和 `classPrefix` 命中，未分类命中由 ledger / document-baseline 处理。
- [x] 拔除沙盘推演：移除本 feature 的 alias policy / guard fixture / ledger 后，review/QA/acceptance 均会失去对应 evidence；挂载点清单完整。

## 3. 验收场景核对

- [x] **S1**：前置 core/editor ledger 与 selector allowlist → LegacyPrefixLedger 汇总所有剩余旧前缀命中并分类。
  - 证据来源：ledger / implementation report / scope gate。
  - 结果：通过。
- [x] **S2**：默认渲染主路径 → `.prismui-*`，默认不输出 `.cxd-*` alias。
  - 证据来源：`npm test --workspace amis-core -- theme`。
  - 结果：通过。
- [x] **S3**：显式开启 `legacyDomClassAlias: 'cxd'` → DOM classnames 同时有 `.prismui-*` 与 `.cxd-*`，但 stable helper 仍优先 `.prismui-*`。
  - 证据来源：`theme.test.ts`。
  - 结果：通过。
- [x] **S4**：新增旧前缀公共依赖 → guard 失败。
  - 证据来源：`node packages/amis-ui/scripts/checkThemeSelectors.js --fixture bad` expected exit 1。
  - 结果：通过。
- [x] **S5**：`cxd.css` / `cxd-ie11.css` 文件名兼容不等于 selector compatibility。
  - 证据来源：ledger + docs rollout handoff。
  - 结果：通过。
- [x] **S6**：AliasRetentionRecord 包含默认状态、显式值、适用范围、人工复审窗口、责任方和退出评估材料。
  - 证据来源：AliasRetentionRecord。
  - 结果：通过。

**review 报告重点复核**：
- [x] Test And QA Focus 已覆盖：alias off/on、Tabs/List/Table/Tree/FormulaPicker/Video/InputSubForm、guard fixtures、typecheck baseline。
- [x] residual risk 已处理：self-review fallback、OCR unavailable、typecheck baseline 都在 QA / acceptance residual risk 中保留为非核心风险。

**QA 报告重点复核**：
- [x] 验证证据来源：`.codestable/features/2026-07-25-legacy-prefix-teardown/legacy-prefix-teardown-qa.md`。
- [x] QA matrix 覆盖 design 关键场景和 review QA focus。
- [x] Feature type 为 mixed，核心功能路径有 unit / snapshot / guard 运行证据。
- [x] failed / blocked 项为 none。
- [x] residual-risk 没有承载核心验收缺口。
- [x] Evidence pack、DoD Results、Gate Results 已复核；blocking DoD 均有 pass evidence。

## 4. 术语一致性

- Legacy prefix public contract：design / ledger / docs handoff 用语一致。
- DOM-only legacy alias：CONTEXT、ADR-001、design、AliasRetentionRecord 和 docs handoff 一致。
- Stable component class / `.prismui-*`：CONTEXT、ADR-001、runtime tests 和 renderer snapshots 一致。
- 防冲突：`.cxd-*` 不被写成 public API；`classPrefix` 被标为 legacy/internal 或 behavior config。

## 5. 领域影响盘点

- [x] 新名词：LegacyPrefixLedger / AliasRetentionRecord / PrefixDependencyKind 是 feature 治理产物；现有 `.codestable/requirements/CONTEXT.md` 已覆盖主题作用域、稳定组件类名、Legacy DOM 类名别名、Design Token、双通道主题系统、主题行为对象。本 feature 不需要立即扩 CONTEXT。
- [x] 结构性选择：DOM-only alias 不做 SCSS/CSS compatibility、IE11 静态边界、双通道主题系统均已由 ADR-001 覆盖；不新增 ADR。
- [x] 流程级约束：guard fixture 与 ledger 作为迁移治理格式具备复用价值，建议后续 docs rollout 或 milestone 收尾时沉淀到 compound / architecture，而不是在 acceptance 内代写。

## 6. requirement delta / clarification 回写

- 无 requirement 影响。本 feature 执行 ADR-001 和 roadmap 既定主题系统重构，不新增用户可感能力边界，不改 requirement current 文档。
- `related_requirements` 为空，未发现需要 owner-approved req delta 的变更。

## 7. roadmap 回写

- [x] `.codestable/roadmap/theme-system-refactor/theme-system-refactor-items.yaml`：`legacy-prefix-teardown` 已从 `in-progress` 改为 `done`，notes 更新为本 feature 交付结果。
- [x] `.codestable/roadmap/theme-system-refactor/theme-system-refactor-roadmap.md`：第 5 节第 7 项已从 planned / 未启动改为 done / `2026-07-25-legacy-prefix-teardown`。
- [x] `.codestable/roadmap/theme-system-refactor/goal-state.yaml`：`legacy-prefix-teardown` 已标为 `accepted`，`current_feature_index` 推进到 6。
- [x] YAML 校验：checklist、items、goal-state 均通过。

## 8. attention.md 候选盘点

- 本 feature 未暴露新的每次会话必读项。
- 已有 `.codestable/attention.md` 包含“独立 reviewer 无法启动时默认允许 local-only fallback”的长期授权，本轮沿用该授权，无需重复追加。
- 可复用经验候选：selector guard 要覆盖 alias 变量、props alias、解构 alias、预构造 selector 和 behavior sink；建议 milestone 收尾时用 `cs-keep` 沉淀。

## 9. 遗留

- 后续优化点：`theme-system-validation-docs-rollout` 消费 docs rollout handoff，产出用户迁移文档、贡献指南、IE11 说明和发布风险记录。
- 已知限制：OCR CLI 不可用；code review 使用 owner 授权的 local-only fallback；broad `npm run typecheck` 仍为既有 non-core baseline warning。
- 实现阶段顺手发现：guard 曾漏掉 `props.classPrefix` / 解构 alias，已在本 feature 内修复并补 bad fixture。

## 10. 最终审计

- 验证证据来源：`.codestable/features/2026-07-25-legacy-prefix-teardown/legacy-prefix-teardown-qa.md`
- Evidence sources：`legacy-prefix-teardown-evidence-pack.md` / `legacy-prefix-teardown-dod-results.json` / `legacy-prefix-teardown-scope-gate.json`
- Inline Verification Matrix：不适用，Goal lane 已有 QA 报告。
- 聚合命令：
  - `python3 .../validate-yaml.py --file legacy-prefix-teardown-checklist.yaml --yaml-only` → exit 0。
  - `python3 .../validate-yaml.py --file theme-system-refactor-items.yaml --yaml-only` → exit 0。
  - `python3 .../validate-yaml.py --file goal-state.yaml --yaml-only` → exit 0。
  - `npm run check:theme-selectors --workspace amis-ui` → exit 0，7 baseline / 0 new violation。
  - `npm test --workspace amis-core -- theme` → exit 0，1 suite / 10 tests pass。
  - `npm test --workspace amis -- --runTestsByPath __tests__/renderers/Tree.test.tsx __tests__/renderers/Form/formula.test.tsx` → exit 0，2 suites / 14 tests / 3 snapshots pass。
  - `npm test --workspace amis -- --runTestsByPath __tests__/renderers/Tabs.test.tsx __tests__/renderers/List.test.tsx __tests__/renderers/Table.test.tsx __tests__/renderers/Form/inputSubForm.test.tsx __tests__/renderers/Video.test.tsx` → exit 0，5 suites / 51 tests / 37 snapshots pass。
  - `git diff --check` → exit 0。
  - `git diff -U0 | rg -n "^\\+.*(TODO|FIXME|XXX|console\\.log|debugger)"` → no matches。
- 场景复核：re-verified 8 / trust-prior-verify 0。
- 交付物复核：代码 / guard / fixtures / tests / ledger / retention record / docs handoff / review / QA / roadmap 回写均通过。
- 完整工作区复核：git status 中全部文件均属于本 feature scope 或本 feature roadmap 回写；scope gate passed。
- diff 清洁度：通过；新增 diff 无 debug / TODO / FIXME / XXX / console.log / debugger。
- 知识沉淀出口：attention 无新增候选；guard alias coverage 经验建议 milestone 收尾时 `cs-keep`。
- 结论：通过。
