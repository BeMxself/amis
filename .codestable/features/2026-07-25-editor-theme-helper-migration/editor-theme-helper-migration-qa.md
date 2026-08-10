---
doc_type: feature-qa
feature: 2026-07-25-editor-theme-helper-migration
status: passed
runner_state: not-started
runner_reason: ""
runner_id: ""
tested: 2026-07-26
round: 1
---

# editor-theme-helper-migration QA 报告

## 1. Scope And Inputs

- Design: `.codestable/features/2026-07-25-editor-theme-helper-migration/editor-theme-helper-migration-design.md`
- Checklist: `.codestable/features/2026-07-25-editor-theme-helper-migration/editor-theme-helper-migration-checklist.yaml`
- Review: `.codestable/features/2026-07-25-editor-theme-helper-migration/editor-theme-helper-migration-review.md`
- Implementation: `.codestable/features/2026-07-25-editor-theme-helper-migration/editor-theme-helper-migration-implementation.md`
- Inventory: `.codestable/features/2026-07-25-editor-theme-helper-migration/editor-theme-helper-migration-helper-scss-inventory.md`
- Evidence pack: `.codestable/features/2026-07-25-editor-theme-helper-migration/editor-theme-helper-migration-evidence-pack.md`
- Gate results: `.codestable/features/2026-07-25-editor-theme-helper-migration/editor-theme-helper-migration-scope-gate.json`
- DoD results: `.codestable/features/2026-07-25-editor-theme-helper-migration/editor-theme-helper-migration-dod-results.json`
- Diff basis: 当前 workspace unstaged + untracked diff；scope gate passed，均属于本 feature scope。
- Core evidence gate: 本 feature 改动 generated CSS、editor preview scope、historical schema migration 和 helper/editor legacy inventory，必须以 generated CSS fixture、preview scope fixture、schema fixture、selector guard、build 和 grep baseline 作为核心证据。

## 2. Verification Matrix

| ID | 来源 | 核心性 | 场景 / 风险 | 证据类型 | 命令或动作 | 期望 | 结果 |
|---|---|---|---|---|---|---|---|
| QA-001 | DoD CMD-001 | core-functional | theme-editor helper 构建不破 | build | `npm run build --workspace amis-theme-editor-helper` | exit 0 | pass |
| QA-002 | DoD CMD-002 | core-functional | editor-core preview / util / themeScope 构建不破 | build | `npm run build --workspace amis-editor-core` | exit 0 | pass |
| QA-003 | DoD CMD-003 | supporting | editor plugin 入口和 Collapse DOM selector 改动不破 | build | `npm run build --workspace amis-editor` | exit 0 | pass |
| QA-004 | DoD CMD-004 | core-functional | 不新增未分类 legacy selector | guard | `npm run check:theme-selectors --workspace amis-ui` | 0 new violation | pass |
| QA-005 | DoD CMD-008 | core-functional | generated CSS 不含 `.cxd-`，custom Button / size 走 `[data-amis-theme] .amis-*` | Jest fixture | `npx jest packages/amis-theme-editor-helper/__tests__/ParseThemeData.test.ts` | pass | pass |
| QA-006 | DoD CMD-009 | core-functional | preview scope helper 保留 custom theme key 并写入 DOM attrs | Jest fixture | `npx jest packages/amis-editor-core/__tests__/themeScope.test.ts` | pass | pass |
| QA-007 | DoD CMD-010 | core-functional | 旧 schema 清理 `.cxd-*` dirty selector 并记录 warning；CSS var 读取不污染普通属性 | Jest fixture | `npx jest packages/amis-editor-core/__tests__/themeCssMigration.test.ts` | pass | pass |
| QA-008 | DoD CMD-005 | core-functional | 剩余 `.cxd-*` 命中可解释 | grep / inventory | `rg -n "\\.cxd-" ...` | 有输出但已分类 | pass |
| QA-009 | DoD CMD-006 | core-functional | preview scope / schema migration / container alias 命中可追踪 | grep / inventory | `rg -n "AMISCSSWrapper|getCssVarById|data-amis-theme|ParseThemeData|style2ThemeCss" ...` | 有输出且符合范围 | pass |
| QA-010 | DoD CMD-007 | supporting | checklist YAML 可解析 | YAML | `validate-yaml.py --yaml-only` | exit 0 | pass |
| QA-011 | scope/evidence gate | supporting | 当前 dirty scope 无越界 | gate | scope gate + evidence pack | passed | pass |
| QA-012 | cleanliness | supporting | 无 whitespace error / debug output / 临时 TODO | diff | `git diff --check` + review diff | exit 0 | pass |

## 3. Command Results

- `npm run build --workspace amis-theme-editor-helper` → exit 0；仍有既有 Sass deprecation / Rollup TypeScript warning。
- `npm run build --workspace amis-editor-core` → exit 0；仍有既有 i18n / Sass deprecation / Rollup TypeScript warning。
- `npm run build --workspace amis-editor` → exit 0；仍有既有 i18n / Rollup TypeScript warning。
- `npm run check:theme-selectors --workspace amis-ui` → exit 0：`Theme selector guard passed: 1503 legacy baseline match(es), 0 new violation(s).`
- `npx jest packages/amis-theme-editor-helper/__tests__/ParseThemeData.test.ts` → exit 0：1 test passed。
- `npx jest packages/amis-editor-core/__tests__/themeScope.test.ts` → exit 0：2 tests passed。
- `npx jest packages/amis-editor-core/__tests__/themeCssMigration.test.ts` → exit 0：2 tests passed。
- `validate-yaml.py --file editor-theme-helper-migration-checklist.yaml --yaml-only` → exit 0。
- `codestable-dod-runner.py --stage implementation.before_review` → status passed，blocking/warnings 为空。
- `codestable-scope-gate.py --stage implementation.before_review` → status passed，blocking/warnings 为空。
- `codestable-evidence-pack.py --stage implementation.before_review` → status passed。
- `git diff --check` → exit 0。

## 4. Scenario Results

- [x] **generated CSS**：`ParseThemeData` custom Button / size selector 生成 `[data-amis-theme="custom"] .amis-Button--*`，fixture 明确断言 selectorCss 不含 `.cxd-`。
- [x] **preview scope**：`Preview`、`IFramePreview`、`ScaffoldModal`、`RightPanels` 使用 `getEditorThemeScopeProps` / `applyEditorThemeScope` 写入 `data-amis-theme`。
- [x] **iframe preview**：iframe initial body 和 `.ae-IFramePreview` 写入 `data-amis-theme`，contentDidMount 再按当前 props apply scope，`.ae-PageWrapper` 也带 scope。
- [x] **historical schema migration**：`JSONPipeIn` fixture 覆盖旧 style 转入 `themeCss`、`.cxd-*` dirty selector key 删除和 migration warning。
- [x] **cssVars 读取**：review 中发现并修复 `[data-amis-theme]` 宽匹配可能读入普通属性的问题；现在只收集 `--*` custom properties，并有回归测试。
- [x] **helper SCSS inventory**：28 个文件 / 78 处 helper/editor 命中已按 internal-legacy、themeCss-config-legacy、container-alias-retained、docs-historical 分类。
- [x] **范围反向核对**：未迁移 core component SCSS，未删除 DOM-only alias，未执行 legacy-prefix-teardown。

## 5. Findings

### failed

none

### blocked

none

### residual-risk

- 本轮 code review 使用 owner 授权的 `reviewer: self` fallback；独立 Task reviewer 启动失败，OCR 未安装。QA 通过 targeted builds/tests/guard/gates 补偿，但 acceptance 应继续记录该降级。
- 真实浏览器视觉 / iframe runtime 切换未做截图 QA；当前证据覆盖 DOM attr helper、initialContent、contentDidMount 和 targeted unit tests。
- `.AMISCSSWrapper` 容器别名仍保留在多个 editor/plugin 入口；本轮已明确不作为 theme identity，后续由 `legacy-prefix-teardown` / docs rollout 接管。

## 6. Cleanliness

- Debug output: pass。
- Temporary TODO/FIXME/XXX: pass。
- Commented-out code: pass；既有历史注释已进入 inventory / docs-historical，不作为新增问题处理。
- Unused imports / dead code from this feature: pass。
- Out-of-scope files: pass；scope gate 限定在 feature 目录、`packages/amis-editor-core`、`packages/amis-editor`、`packages/amis-theme-editor-helper`。

## 7. Verdict

- Status: passed
- Next: 进入 acceptance，回写 roadmap 中 `editor-theme-helper-migration` 状态，并将剩余 editor/helper legacy 命中交给 `legacy-prefix-teardown`。
