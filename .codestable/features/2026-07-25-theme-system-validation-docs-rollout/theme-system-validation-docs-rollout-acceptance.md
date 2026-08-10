---
doc_type: feature-acceptance
feature: 2026-07-25-theme-system-validation-docs-rollout
status: passed
audit_state: not-started
audit_reason: ""
auditor_id: ""
acceptance_authorization_ref: "approval-report.md#goal-acceptance"
accepted: 2026-07-28
round: 1
---

# theme-system-validation-docs-rollout 验收报告

> 阶段：阶段 3（验收闭环）
> 验收日期：2026-07-28
> 关联方案 doc：`.codestable/features/2026-07-25-theme-system-validation-docs-rollout/theme-system-validation-docs-rollout-design.md`

## 1. 接口契约核对

**接口示例逐项核对**：
- [x] `ThemeSystemValidationMatrix`：ADR-001 核心契约 → owner feature / evidence / rollout status，已落盘在 `theme-system-validation-matrix.md`。
- [x] `DocsMigrationMap`：docs 文件旧心智命中 → action / classification，已落盘在 `theme-system-docs-migration-map.md`。
- [x] `ExamplesThemeInventory`：examples 旧前缀命中 → classification / release decision，已落盘在 `theme-system-examples-inventory.md`。
- [x] `ReleaseRiskRecord`：alias、IE11、examples shell、typecheck baseline → known limits / mitigation，已落盘在 `theme-system-release-risk-record.md`。

**名词层"现状 → 变化"逐项核对**：
- [x] Validation Matrix：从零散前置 feature evidence 收口为发布前整体核对面。
- [x] Theme Override Guide：用户主路径改为 `--amis-*` token、`.amis-*` stable selector、`[data-amis-theme]` scope 和 user layer / 加载顺序。
- [x] Examples Inventory：examples 旧前缀命中不静默遗留，已分为 examples shell risk、runtime compatibility plumbing、generated artifact 等。
- [x] IE11 Static Fallback Notes：IE11 只保留静态 CSS 降级，不承诺 CSS variables 动态 token 切换。

**流程图核对**：
- [x] 确认前置 feature done → 汇总 validation evidence → 建 docs migration map → 建 examples inventory → 更新文档 → 写 IE11 / alias 风险 → 运行 grep / 验证命令 → 形成 release risk record，均有 implementation / QA / artifacts 对应。

## 2. 行为与决策核对

**需求摘要逐项验证**：
- [x] 用户文档主路径不再讲 `#{$ns}` / `.cxd-*` 主题前缀：`contribute.md`、`style/index.md`、`style/css-vars.md` 已改为 token / stable selector / theme scope。
- [x] quick start 解释主题文件名和 selector policy 的区别：`getting-started.md` 明确 CSS 包名不等于 `.cxd-*` 公共 selector API。
- [x] IE11 只写静态降级边界：`getting-started.md`、`style/index.md`、`css-vars.md` 均明确不支持动态 token。
- [x] examples 旧前缀命中已分类：`ExamplesThemeInventory` 记录 risk accepted / follow-up / generated artifact。

**明确不做逐项核对**：
- [x] 未修改 ADR-001 或长期 requirement。
- [x] 未恢复 SCSS/CSS `.cxd-*` legacy selector 双轨。
- [x] 未承诺 IE11 动态 token 主题切换。
- [x] 未 push / merge / release / deploy。

**关键决策落地**：
- [x] implementation admission 依赖 legacy-prefix-teardown done：goal-state 中前置 feature 均 accepted，items.yaml 中 legacy-prefix-teardown 为 done。
- [x] 文档主路径只讲新心智：新增指南以 `--amis-*`、`.amis-*`、`[data-amis-theme]` 为主。
- [x] 旧心智分类处理：DocsMigrationMap / ExamplesThemeInventory / grep output 均已覆盖。
- [x] release risk record 是验收产物：已记录 examples shell、DOM-only alias、IE11、typecheck baseline 和非自动动作。

**编排层"现状 → 变化"逐项核对**：
- [x] Docs rollout artifacts 成为前置 feature evidence 与发布验收之间的交接接口。
- [x] docs/examples grep 残留由分类 artifact 消化，不再靠隐含聊天解释。
- [x] QA 把 review residual risk、DoD warning 和 validation matrix 一并复核。

**流程级约束核对**：
- [x] docs 中保留旧前缀只作为 warning / file-name compatibility / generated artifact / risk accepted。
- [x] examples 旧前缀保留不阻塞本 feature，但已进入 ReleaseRiskRecord。
- [x] `npm run typecheck` baseline 失败不被硬说成通过，按 non-core document-baseline 记录。

**挂载点反向核对（可卸载性）**：
- [x] 挂载点：`docs/zh-CN/start/getting-started.md`、`docs/zh-CN/style/index.md`、`docs/zh-CN/style/css-vars.md`、`docs/zh-CN/extend/contribute.md`、`docs/zh-CN/components/form/transfer.md`。
- [x] 挂载点：`packages/amis-ui/scripts/theme-selectors/fixtures/**` 的 `Sortable` 类型声明用于消除本 feature typecheck 噪音。
- [x] 挂载点：feature artifacts、review、QA、acceptance、scope/evidence/DoD results。
- [x] 反向核查：`git diff --name-only` 与 scope gate changed_files 全部落在允许范围内。
- [x] 拔除沙盘推演：删除本 feature artifacts 后，release risk、examples classification、docs migration 和 final validation packet 均失去证据链；挂载点清单完整。

## 3. 验收场景核对

- [x] **S1**：前置 feature acceptance evidence → Validation Matrix 中每个 ADR-001 核心契约都有命令或手工证据。
  - 证据来源：`theme-system-validation-matrix.md`。
  - 结果：通过。
- [x] **S2**：`contribute.md` 不再推荐 `#{$ns}` 生成 `.cxd-*`。
  - 证据来源：docs diff / grep。
  - 结果：通过。
- [x] **S3**：用户主题覆写方式覆盖 token、`.amis-*`、`[data-amis-theme]`、user layer / 加载顺序和 DOM-only alias 边界。
  - 证据来源：`docs/zh-CN/style/index.md`、`docs/zh-CN/style/css-vars.md`。
  - 结果：通过。
- [x] **S4**：IE11 文档明确静态 CSS 降级，不承诺动态 token。
  - 证据来源：IE11 grep / IE11StaticFallbackNotes。
  - 结果：通过。
- [x] **S5**：examples 旧前缀命中已迁移或进入分类。
  - 证据来源：ExamplesThemeInventory / docs examples grep output。
  - 结果：通过。
- [x] **S6**：docs/examples 中保留的旧心智命中均分类。
  - 证据来源：DocsMigrationMap / ExamplesThemeInventory / generated artifact note。
  - 结果：通过。
- [x] **S7**：ReleaseRiskRecord 列出 alias、IE11、旧前缀迁移、剩余风险和验证摘要。
  - 证据来源：ReleaseRiskRecord。
  - 结果：通过。
- [x] **反向核对**：未修改 ADR 决策，未恢复 SCSS/CSS legacy selector 双轨，未执行远程发布动作。
  - 证据来源：diff / implementation report。
  - 结果：通过。

**review 报告重点复核**：
- [x] Test And QA Focus 已覆盖：docs grep 分类、IE11 静态边界、examples shell 风险、typecheck baseline 均进入 QA。
- [x] residual risk 已处理：local-only review、examples shell、typecheck baseline、generated docs bundle 均进入 QA / release risk，不承载核心验收缺口。

**QA 报告重点复核**：
- [x] 验证证据来源：`theme-system-validation-docs-rollout-qa.md`。
- [x] QA matrix 覆盖 design 关键场景、DoD commands、review QA focus、evidence residual risks。
- [x] feature 性质为 non-functional，替代证据理由合理。
- [x] failed / blocked 项为 none。
- [x] residual-risk 不包含核心验收缺口；browser/rendered docs pass 与 examples shell migration 均为非核心后续风险。
- [x] Evidence pack、DoD Results、Gate Results 已复核；blocking DoD 均有 pass evidence，CMD-002 为 non-core baseline。

## 4. 术语一致性

- `ThemeSystemValidationMatrix`：feature artifact 命名一致。
- `DocsMigrationMap`：feature artifact 命名一致。
- `ExamplesThemeInventory`：feature artifact 命名一致。
- `ReleaseRiskRecord`：feature artifact 命名一致。
- `IE11StaticFallbackNotes`：feature artifact 命名一致。
- 防冲突：新增文档不把 `classPrefix`、`.cxd-*`、`.antd-*`、`.dark-*` 写成推荐主题定制入口。

## 5. 领域影响盘点（提示而非代写）

- [x] 新名词候选：Validation Matrix / DocsMigrationMap / ExamplesThemeInventory / ReleaseRiskRecord。建议：若后续要长期复用 docs rollout 流程，可由 `cs-domain` 或 `cs-keep` 沉淀；本 feature 不直接改 CONTEXT / ADR。
- [x] 结构性选择候选：主题系统最终验证以 feature artifacts 承接，不改 ADR-001。建议：当前为 roadmap 收口证据，不需要新增 ADR。
- [x] 流程级约束候选：old-prefix grep 残留必须分类。建议：可在后续 `cs-keep` 归档为主题迁移审查经验。

## 6. requirement delta / clarification 回写

- 无 requirement 影响。本 feature 是 roadmap 收口与用户文档更新，不新增用户可感能力边界，也不改变 ADR-001 的长期决策。

## 7. roadmap 回写

- [x] `.codestable/roadmap/theme-system-refactor/theme-system-refactor-items.yaml` 中 `theme-system-validation-docs-rollout` 已从 `in-progress` 改为 `done`。
- [x] `.codestable/roadmap/theme-system-refactor/theme-system-refactor-roadmap.md` 第 5 节对应条目已从 planned / 未启动改为 done / feature path。
- [x] `.codestable/roadmap/theme-system-refactor/goal-state.yaml` 中当前 feature 状态已改为 accepted，`current_feature_index` 已推进到 7。
- [x] roadmap YAML 已通过 `validate-yaml.py` 校验。

## 8. attention.md 候选盘点

- [x] 本 feature 未暴露必须新增到 attention.md 的项目级环境规则。local-only review fallback 长期规则已经写入 `.codestable/attention.md`，无需重复。

## 9. 遗留

- examples shell 仍有 `.cxd-*` / `.antd-*` / `.dark-*` selector，已作为 follow-up / risk accepted 记录，不阻塞本 feature。
- `examples/docs.json` 是 generated artifact，可能在下一次 docs bundle regenerate 前保留旧文本。
- `npm run typecheck` broad baseline 仍失败，当前归因为 editor/table/schema 既有基线。
- 本 feature 未跑浏览器截图 / rendered docs pass；作为非功能性文档收口项，使用 source diff、grep、目标命令和前置 accepted feature evidence 替代。

## 10. 最终审计

- 验证证据来源：`theme-system-validation-docs-rollout-qa.md`
- Evidence sources：`theme-system-validation-docs-rollout-evidence-pack.md` / `theme-system-validation-docs-rollout-dod-results.json` / `theme-system-validation-docs-rollout-scope-gate.json`
- Inline Verification Matrix：不适用，Goal lane 已有独立 QA 报告。
- 聚合命令：
  - `npm run check:theme-selectors --workspace amis-ui` → exit 0，0 new violations。
  - `npm test --workspace amis-core -- theme` → exit 0，9 tests passed。
  - `npm test --workspace amis -- button` → exit 0，19 tests / 20 snapshots passed。
  - `npm run stylelint` → exit 0。
  - docs/examples old-prefix grep → exit 0，命中已分类，`examples/docs.json` 为 generated artifact。
  - IE11 / token / scope grep → exit 0，关键文案存在。
  - `validate-yaml.py --file ...checklist.yaml --yaml-only` → exit 0。
  - `npm run typecheck` → DoD prior exit 1，non-core baseline。
- 场景复核：re-verified 9 / trust-prior-verify 1。trust-prior 项为 theme / overlay / editor preview 手工路径，来自已 accepted 前置 feature evidence。
- 交付物复核：docs / feature artifacts / review / QA / acceptance / roadmap writeback 均存在。
- 完整工作区复核：当前 tracked diff 与 untracked files 均属于本 feature 范围；无 staged diff。
- diff 清洁度：通过；无新增 debug output、临时 TODO、注释掉代码或无关文件。
- 知识沉淀出口：无必须写入 attention.md 的新规则；可选沉淀项为 docs rollout grep 分类经验。
- 结论：通过。
