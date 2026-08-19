---
doc_type: feature-qa
feature: 2026-07-25-legacy-prefix-teardown
status: passed
runner_state: not-started
runner_reason: ""
runner_id: ""
tested: 2026-07-28
round: 1
---

# legacy-prefix-teardown QA 报告

## 1. Scope And Inputs

- Design: `.codestable/features/2026-07-25-legacy-prefix-teardown/legacy-prefix-teardown-design.md`
- Checklist: `.codestable/features/2026-07-25-legacy-prefix-teardown/legacy-prefix-teardown-checklist.yaml`
- Review: `.codestable/features/2026-07-25-legacy-prefix-teardown/legacy-prefix-teardown-review.md`
- Evidence pack: `.codestable/features/2026-07-25-legacy-prefix-teardown/legacy-prefix-teardown-evidence-pack.md`
- Gate results: `.codestable/features/2026-07-25-legacy-prefix-teardown/legacy-prefix-teardown-scope-gate.json`
- DoD results: `.codestable/features/2026-07-25-legacy-prefix-teardown/legacy-prefix-teardown-dod-results.json`
- Diff basis: `git status --short` + scope gate changed_files。
- Baseline dirty files: none outside current feature scope。
- Feature type: mixed
- Core evidence gate: runtime alias policy、stable behavior selector migration、selector guard false-positive/false-negative boundary、targeted renderer behavior/snapshot tests。

## 2. Verification Matrix

| ID | 来源 | 核心性 | 场景 / 风险 | 证据类型 | 命令或动作 | 期望 | 结果 |
|---|---|---|---|---|---|---|---|
| QA-001 | design CMD-002 | core-functional | `legacyDomClassAlias` 默认关闭、只允许显式 `cxd`，stable helper 在 alias-on 时仍取 `.prismui-*` 主类 | unit | `npm test --workspace amis-core -- theme` | 10 tests pass | pass |
| QA-002 | design CMD-004 / review QA focus | core-functional | 主 selector guard 不允许新增未分类 legacy selector | static guard | `npm run check:theme-selectors --workspace amis-ui` | 7 baseline / 0 new violation | pass |
| QA-003 | review QA focus | core-functional | good fixture 使用 stable selector helper 不应触发 guard | static guard | `node packages/amis-ui/scripts/checkThemeSelectors.js --fixture good` | exit 0 | pass |
| QA-004 | review QA focus | core-functional | bad fixture 必须能抓到 direct alias、props alias、解构 alias、预构造 selector、`cx(...)`、`classList.contains`、Sortable selector | static guard | `node packages/amis-ui/scripts/checkThemeSelectors.js --fixture bad` | expected exit 1 with listed violations | pass |
| QA-005 | design CMD-009 | core-functional | Tabs/List/Table/InputSubForm/Video 行为查询和 snapshot 跟随 stable class 主路径 | unit/snapshot | DoD `CMD-009` | 5 suites / 51 tests / 37 snapshots pass | pass |
| QA-006 | design CMD-010 | core-functional | Tree / FormulaPicker 行为查询和 snapshot 跟随 stable class 主路径 | unit/snapshot | `npm test --workspace amis -- --runTestsByPath __tests__/renderers/Tree.test.tsx __tests__/renderers/Form/formula.test.tsx` | 2 suites / 14 tests / 3 snapshots pass | pass |
| QA-007 | evidence pack residual risk | supporting | broad `npm run typecheck` 既有 baseline 不应被误判成本 feature blocking | typecheck baseline | DoD `CMD-006` | exit 2 recorded as non-core `document-baseline` warning | pass |
| QA-008 | cleanliness | supporting | 不新增 debug 输出、临时 TODO/FIXME/XXX、注释掉代码或 whitespace error | static | `git diff --check`; `git diff -U0 | rg -n "^\\+.*(TODO|FIXME|XXX|console\\.log|debugger)"` | no output / clean | pass |

## 3. Command Results

- `npm test --workspace amis-core -- theme` → exit 0：1 suite / 10 tests pass。
- `npm run check:theme-selectors --workspace amis-ui` → exit 0：7 baseline matches，0 new violations。
- `node packages/amis-ui/scripts/checkThemeSelectors.js --fixture good` → exit 0：0 baseline / 0 violation。
- `node packages/amis-ui/scripts/checkThemeSelectors.js --fixture bad` → exit 1 as expected：命中 `classprefix-dom-selector`、`theme-prefix-selector`，覆盖 props alias / 解构 alias 等反例。
- `npm test --workspace amis -- --runTestsByPath __tests__/renderers/Tree.test.tsx __tests__/renderers/Form/formula.test.tsx` → exit 0：2 suites / 14 tests / 3 snapshots pass。
- DoD runner → status passed；warning 仅 `CMD-006: non-core command failed with exit 2`。
- `git diff --check` → exit 0。
- `git diff -U0 | rg -n "^\\+.*(TODO|FIXME|XXX|console\\.log|debugger)"` → exit 1 / no matches，表示新增 diff 无清洁度命中。

## 4. Scenario Results

- [x] QA-001 alias runtime policy：pass
  - Evidence: `theme.test.ts` 覆盖默认 stable class、显式 `cxd` alias、非法 `antd` 不输出旧类、stable helper 优先 `.prismui-*`。
  - Notes: 证明 DOM-only alias 不会自动扩展成 `antd` / `dark`。
- [x] QA-002 selector guard 主路径：pass
  - Evidence: `npm run check:theme-selectors --workspace amis-ui` 通过，0 new violation。
  - Notes: 剩余 baseline 由 ledger 分类，不作为新公共 API。
- [x] QA-003 good fixture：pass
  - Evidence: fixture good exit 0。
  - Notes: stable selector helper 不被误杀。
- [x] QA-004 bad fixture：pass
  - Evidence: fixture bad expected exit 1，命中 direct / indirect / props / destructured / prebuilt / `cx(...)` / Sortable 反例。
  - Notes: 本轮 review-fix 后新增的 props alias 漏检风险已纳入机器反例。
- [x] QA-005 renderer stable selector suite：pass
  - Evidence: DoD `CMD-009` pass。
  - Notes: 覆盖 Tabs/List/Table/InputSubForm/Video 的相关查询和 snapshot。
- [x] QA-006 Tree / FormulaPicker stable selector suite：pass
  - Evidence: targeted command exit 0。
  - Notes: 覆盖 review 特别点名的 Tree / FormulaPicker。
- [x] QA-007 typecheck baseline handling：pass
  - Evidence: DoD warning 记录为 non-core `document-baseline`。
  - Notes: 当前失败集中在既有 broad baseline，不作为本 feature blocking。
- [x] QA-008 cleanliness：pass
  - Evidence: whitespace clean，diff-only TODO/FIXME/console/debugger grep 无新增命中。
  - Notes: 全路径 grep 命中过既有 TODO/FIXME 和脚本正常 CLI 输出，未归因为本轮新增清洁度缺陷。

## 5. Findings

### failed

none

### blocked

none

### residual-risk

- `reviewer: self` 来自 owner 授权的 local-only review fallback；QA 已复核核心证据，但缺少独立 reviewer 的第二视角。
- OCR CLI 不可用，未执行 OCR 行级扫描。
- broad `npm run typecheck` 仍为既有 non-core baseline warning，后续 roadmap 不应把它解释成本 feature 新增失败。

## 6. Cleanliness

- Debug output: pass
- Temporary TODO/FIXME/XXX: pass
- Commented-out code: pass
- Unused imports / dead code from this feature: pass
- Out-of-scope files: pass

## 7. Verdict

- Status: passed
- Next: `cs-feat` acceptance 阶段；重点复核 checklist checks、roadmap item 回写、review/QA residual risk 和 goal acceptance authorization。
