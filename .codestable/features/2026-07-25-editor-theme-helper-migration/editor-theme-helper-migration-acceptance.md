---
doc_type: feature-acceptance
feature: 2026-07-25-editor-theme-helper-migration
status: passed
audit_state: completed
audit_reason: ""
auditor_id: ""
acceptance_authorization_ref: "approval-report.md#goal-acceptance"
accepted: 2026-07-26
round: 1
---

# editor-theme-helper-migration 验收报告

> 阶段：阶段 3（验收闭环）
> 验收日期：2026-07-26
> 关联方案 doc：`.codestable/features/2026-07-25-editor-theme-helper-migration/editor-theme-helper-migration-design.md`

## 1. 接口契约核对

对照方案第 2.1 节名词层，本 feature 的四条核心接口已经落盘。

- [x] `ThemeCssGenerationOptions`：落在 `packages/amis-theme-editor-helper/src/helper/ParseThemeData.ts`，支持 theme、scope、stable component class prefix 和 legacy selector policy 字段；本轮保持构造参数后向兼容。
- [x] `GeneratedThemeCss`：落在 `ParseThemeData#getGeneratedCss()`，分离 tokenCss、selectorCss、customCss、migrationWarnings。
- [x] `PreviewThemeScope`：落在 `packages/amis-editor-core/src/themeScope.ts`，并由 Preview、IFramePreview、ScaffoldModal、RightPanels 消费。
- [x] `HistoricalThemeCssMigration`：落在 `JSONPipeIn -> style2ThemeCss -> clearDirtyCssKey` 路径，旧 `.cxd-*` dirty selector key 被清理并产生 migration warning。
- [x] `HelperScssInventory`：落在 `editor-theme-helper-migration-helper-scss-inventory.md`，包含 selector、文件、分类、owner、保留原因和退出条件。

## 2. 行为与决策核对

**需求摘要逐项验证**：

- [x] generated CSS 不再输出 `.cxd-Button--*`：`ParseThemeData` fixture 断言 selectorCss 不含 `.cxd-`，并包含 `[data-amis-theme="custom"] .amis-Button--accent` / `.amis-Button--size-compact`。
- [x] preview root / iframe preview root 写入主题作用域：`Preview`、`IFramePreview`、iframe body、`.ae-IFramePreview`、`.ae-PageWrapper` 均接入 `data-amis-theme`。
- [x] `.AMISCSSWrapper` 降级为容器别名：代码仍保留 className，但主题身份由 `data-amis-theme` 提供；`getAllCssVar()` 读取 `[data-amis-theme]`。
- [x] 历史 schema 迁移显式处理旧 selector：`themeCssMigration.test.ts` 覆盖旧 selector key 删除、warning 记录和 style 转 themeCss。
- [x] helper/editor SCSS 剩余命中有 inventory：28 个文件 / 78 处命中均有分类和退出条件。

**明确不做逐项核对**：

- [x] 未删除 `.AMISCSSWrapper` 容器别名。
- [x] 未实现 SCSS/CSS `.cxd-*` legacy selector 双轨兼容。
- [x] 未迁移 core component SCSS。
- [x] 未提前执行 `legacy-prefix-teardown`。
- [x] 未重写 editor/plugin schema 体系。

## 3. 验收场景核对

- [x] **S1 generated CSS 不含 `.cxd-`**：
  - 证据：`ParseThemeData.test.ts`，DoD CMD-008 passed。
  - 结果：custom Button 类型和尺寸输出 `[data-amis-theme] .amis-Button--*`。
- [x] **S2 preview root 带 `data-amis-theme`**：
  - 证据：`themeScope.test.ts`、Preview / IFramePreview / ScaffoldModal / RightPanels diff。
  - 结果：editor preview scope helper 可保留 raw custom theme key 并写入 DOM attrs。
- [x] **S3 iframe preview 带 `data-amis-theme`**：
  - 证据：`IFramePreview.tsx` initialContent、contentDidMount 和 `.ae-PageWrapper` props。
  - 结果：iframe document 内 body / root / page wrapper 均有 theme scope。
- [x] **S4 historical schema migration**：
  - 证据：`themeCssMigration.test.ts`，DoD CMD-010 passed。
  - 结果：旧 style 转入 themeCss，旧 `.cxd-*` dirty selector key 被删除并记录 stable candidate warning。
- [x] **S5 helper SCSS inventory 分类完整**：
  - 证据：`editor-theme-helper-migration-helper-scss-inventory.md`、selector guard。
  - 结果：guard 1503 baseline / 0 new violation；剩余命中交给 teardown/docs。
- [x] **S6 范围守护**：
  - 证据：scope gate passed。
  - 结果：dirty scope 仅在 feature dir、amis-editor-core、amis-editor、amis-theme-editor-helper。

## 4. review / QA 重点复核

- [x] Code review status `passed`，blocking / important 为 none。
- [x] Review 中发现的 cssVars 污染风险已修复：`getCssVarById()` 只收集 `--*` custom properties，并兼容 jsdom `ownerNode` 缺失。
- [x] QA status `passed`，failed / blocked 为 none。
- [x] DoD、scope gate、evidence pack 均为 passed。
- [x] local-only review fallback 已记录：Task reviewer 启动失败，OCR 不可用；授权来源为 `.codestable/attention.md`。

## 5. roadmap 回写

- [x] `.codestable/roadmap/theme-system-refactor/theme-system-refactor-items.yaml` 中 `editor-theme-helper-migration` 已从 `in-progress` 回写为 `done`。
- [x] `.codestable/roadmap/theme-system-refactor/theme-system-refactor-roadmap.md` 第 6 个子 feature 已同步为 `done`，对应 feature 为 `2026-07-25-editor-theme-helper-migration`。
- [x] `.codestable/roadmap/theme-system-refactor/goal-state.yaml` 中当前 feature 已回写为 `accepted`，`current_feature_index` 推进到 5，下一项为 `legacy-prefix-teardown`。
- [x] YAML 校验和最终 `git diff --check` 在最终审计中记录。

## 6. 遗留

- `legacy-prefix-teardown` 需要消费本 inventory，继续处理 `.AMISCSSWrapper` 容器别名、editor/plugin 旧 themeCss selector 和 DOM-only alias 退出策略。
- 真实浏览器 / iframe 动态切换截图 QA 未做；本轮用 jsdom fixture、build、selector guard 和代码审查覆盖核心契约。
- `ParseThemeData` 新增的 `legacySelectorPolicy` / `tokenNamespace` 当前是契约字段，未形成复杂策略分支；后续如启用 reject-new，应单独加 fixture。

## 7. 最终审计

- Evidence sources：`editor-theme-helper-migration-evidence-pack.md`、`editor-theme-helper-migration-dod-results.json`、`editor-theme-helper-migration-scope-gate.json`、`editor-theme-helper-migration-evidence-pack-results.json`。
- 聚合命令：helper/editor/editor-core builds、selector guard、3 个 targeted Jest、grep baseline、YAML validation、scope gate、evidence pack、`git diff --check` 均 passed。
- 场景复核：generated CSS、preview scope、iframe scope、historical schema、helper SCSS inventory、范围守护全部满足。
- diff 清洁度：无 whitespace error；未发现新增 debug output、临时 TODO/FIXME、注释掉代码或范围外实现。
- 结论：通过。`editor-theme-helper-migration` 已满足 design、checklist、review、QA、DoD、roadmap 回写和 Goal acceptance 授权要求。
