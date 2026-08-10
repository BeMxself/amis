---
doc_type: feature-qa
feature: 2026-07-25-token-contract-css-layers
status: passed
runner_state: not-started
runner_reason: ""
runner_id: ""
tested: 2026-07-25
round: 1
---

# token-contract-css-layers QA 报告

## 1. Scope And Inputs

- Design: `.codestable/features/2026-07-25-token-contract-css-layers/token-contract-css-layers-design.md`
- Checklist: `.codestable/features/2026-07-25-token-contract-css-layers/token-contract-css-layers-checklist.yaml`
- Review: `.codestable/features/2026-07-25-token-contract-css-layers/token-contract-css-layers-review.md`
- Evidence pack: `.codestable/features/2026-07-25-token-contract-css-layers/token-contract-css-layers-evidence-pack.md`
- Gate results: `.codestable/features/2026-07-25-token-contract-css-layers/token-contract-css-layers-gate-results.json`
- DoD results: `.codestable/features/2026-07-25-token-contract-css-layers/token-contract-css-layers-dod-results.json`
- Diff basis: 当前工作区 diff + 本 feature untracked artifacts。
- Baseline dirty files: none outside this feature scope。
- Feature type: non-functional。
- Core evidence gate: 本 feature 固化 SCSS token / CSS layer / legacy alias / theme override 契约，不改变用户运行时交互路径；端到端浏览器验证不是核心证据。核心证据为 stylelint、amis-ui build、编译 CSS 最终声明断言、负向 grep、scope/evidence gates 和 workflow gate。

## 2. Verification Matrix

| ID | 来源 | 核心性 | 场景 / 风险 | 证据类型 | 命令或动作 | 期望 | 结果 |
|---|---|---|---|---|---|---|---|
| QA-001 | design layer | non-functional | canonical layer 顺序可观察 | grep / compiled CSS | `rg -n -- "@layer amis\\.reset|--amis-|data-amis-theme" packages/amis-ui/lib/themes/{cxd,dark,default,antd,ang}.css` | 编译主题 CSS 含 layer 声明和 token/theme scope 输出 | pass |
| QA-002 | design token taxonomy | non-functional | `--amis-palette-*` 为源，不反向依赖旧 `--colors-*` | negative grep | `rg -n -- "--amis-palette-[^:]+:\\s*var\\(--colors-" packages/amis-ui/scss packages/amis-ui/lib/themes/dark.css` | 无命中 | pass |
| QA-003 | review QA focus | non-functional | 旧 `--colors-brand-4/5/6` 最终声明指向新 palette | compiled CSS assertion | Node final-declaration assertion over `lib/themes/{cxd,default,antd,ang,dark}.css` | 每个主题最后一次 `--colors-brand-4/5/6` 为 `var(--amis-palette-brand-400/500/600)` | pass |
| QA-004 | review QA focus | non-functional | dark primary 文本色经新 token 链路生效 | grep / compiled CSS | `rg -n -- "--amis-palette-neutral-text-inverse|--amis-color-text-inverse|--amis-Button-primary-(color|hover-color|active-color)|--button-primary-(default|hover|active)-font-color" packages/amis-ui/lib/themes/dark.css` | 可观察 palette -> semantic -> component -> old token 链路 | pass |
| QA-005 | review negative | non-functional | dark 未分层 root 旁路不回流 | negative grep | `rg -n -- "--amis-Button-primary-(color|hover-color|active-color):\\s*var\\(--colors-neutral-text-2\\)|--button-primary-(default|hover|active)-font-color:\\s*var\\(--colors-neutral-text-2\\)" packages/amis-ui/scss packages/amis-ui/lib/themes/dark.css` | 无命中 | pass |
| QA-006 | 范围守护 | non-functional | 不新增 `.cxd-*` / `$ns` legacy selector 兼容 | diff grep | `git diff -G "\\.cxd-|#\\{\\$ns\\}" -- packages/amis-ui/scss` | 无输出 | pass |
| QA-007 | 范围守护 | non-functional | 不迁移 editor/theme-editor helper | diff review | `git diff -- packages/amis-theme-editor-helper packages/amis-editor-core` | 无输出 | pass |
| QA-008 | IE11 boundary | non-functional | IE11 只保留静态降级边界，本 feature 不改 IE11 入口 | diff / grep | `git diff --name-only -- packages/amis-ui/scss/themes/*-ie11.scss packages/amis/build.sh` + `rg` IE11 entries | 无 IE11 文件 diff；`*-ie11.scss` 未直接引入 token/layer 动态入口 | pass |
| QA-009 | DoD commands | non-functional | stylelint / build / YAML / workflow gate | command | 见第 3 节 | 核心命令通过，build runner hang 作为 warning 记录 | pass |
| QA-010 | 清洁度 | non-functional | 无 debug / 临时 TODO / 注释残留 / scope 外文件 | grep / diff check | `rg -n "console\\.log|console\\.error|TODO|FIXME|XXX" ...` + `git diff --check` | 无命中，diff check 通过 | pass |

## 3. Command Results

- `npm run stylelint` -> exit 0：通过。
- `npm run build --workspace amis-ui` -> output completed：fresh run reached `created lib` and `created esm`；进程在输出完成后仍不退出，按既有 workspace runner hang 记录 warning，Ctrl-C 后 exit 0。输出仅包含既有 Sass deprecation、Browserslist、Rollup circular、TS5051 和 postcss warning。
- `node -e "<final brand alias assertion>"` -> exit 0：`final brand aliases OK for cxd, default, antd, ang, dark`。
- `rg -n -- "--amis-palette-[^:]+:\\s*var\\(--colors-|--amis-Button-primary-(color|hover-color|active-color):\\s*var\\(--colors-neutral-text-2\\)|--button-primary-(default|hover|active)-font-color:\\s*var\\(--colors-neutral-text-2\\)" packages/amis-ui/scss packages/amis-ui/lib/themes/dark.css` -> exit 1 / no output：负向 grep 通过。
- `rg -n -- "--amis-palette-neutral-text-inverse|--amis-color-text-inverse|--amis-Button-primary-(color|hover-color|active-color)|--button-primary-(default|hover|active)-font-color" packages/amis-ui/lib/themes/dark.css | tail -n 80` -> exit 0：可观察 dark token 链路，`--amis-palette-neutral-text-inverse: #f7f8fa`，`--amis-Button-primary-*` 指向 `--amis-color-text-inverse`，旧 primary font token 指向 `--amis-Button-*`。
- `git diff -G "\\.cxd-|#\\{\\$ns\\}" -- packages/amis-ui/scss` -> exit 0 / no output：未新增 legacy selector 兼容。
- `git diff -- packages/amis-theme-editor-helper packages/amis-editor-core` -> exit 0 / no output：未修改 editor/helper。
- `git diff --name-only -- packages/amis-ui/scss/themes/*-ie11.scss packages/amis/build.sh` -> exit 0 / no output：本 feature 未改 IE11 入口或发布链脚本。
- `rg -n -- "@layer|data-amis-theme|--amis-|CSS custom properties|CSS 变量" packages/amis-ui/scss/themes/*-ie11.scss` -> exit 1 / no output：IE11 SCSS entry 自身未直接引入动态 token/layer 文案；它们仍是 inline modern theme 后进入发布链 postcss 的静态边界。
- `python3 /Users/songmingxu/.agents/skills/cs-onboard/tools/validate-yaml.py --file .codestable/features/2026-07-25-token-contract-css-layers/token-contract-css-layers-checklist.yaml --yaml-only` -> exit 0：通过；本机 PyYAML 不在系统 Python，工具使用 builtin fallback parser。
- `PYTHONPATH=/Users/songmingxu/Projects/gold-market/.venv/lib/python3.13/site-packages python3 /Users/songmingxu/.agents/skills/cs-onboard/tools/codestable-workflow-next.py epic --roadmap .codestable/roadmap/theme-system-refactor --json` -> exit 0：`status: dispatch_goal`，authorization refs 可见。
- `git diff --check` -> exit 0：通过。

## 4. Scenario Results

- [x] QA-001 canonical layer order 可观察：pass。
  - Evidence: 编译主题 CSS 含 `@layer amis.reset, amis.tokens, amis.components, amis.theme, amis.user` 和 `--amis-*` token 输出。
  - Notes: 只证明本 feature 的最小 layer declaration，不证明全量 `amis.components` / `amis.user` 覆写闭环。
- [x] QA-002 `--amis-*` 分层链路存在：pass。
  - Evidence: `tokens/_base.scss` 与编译 dark.css 证明 palette -> semantic -> component token 链。
- [x] QA-003 旧 brand token alias 最终获胜方向：pass。
  - Evidence: Node final-declaration assertion 覆盖 `cxd/default/antd/ang/dark`。
- [x] QA-004 dark primary Button 文本色：pass。
  - Evidence: dark.css 中 `--amis-palette-neutral-text-inverse: #f7f8fa` -> `--amis-color-text-inverse` -> `--amis-Button-primary-*` -> `--button-primary-*font-color`。
- [x] QA-005 forbidden 回流：pass。
  - Evidence: 负向 grep 无命中。
- [x] QA-006 不新增 `.cxd-*` SCSS/CSS legacy selector：pass。
  - Evidence: `git diff -G` 无输出；普通 selector grep 的命中仍是既有 baseline。
- [x] QA-007 不迁移 editor/helper：pass。
  - Evidence: editor/helper diff 为空。
- [x] QA-008 IE11 static boundary：pass。
  - Evidence: IE11 entry / build script 无 diff；本 feature 未承诺 IE11 动态 token switching。

## 5. Findings

### failed

none

### blocked

none

### residual-risk

- Full `amis.components` / `amis.user` cascade wrapping is not completed in this feature. 这是 design 明确的范围边界，后续由 `stylesheet-stable-selector-build` 和 docs rollout 验证。
- `npm run build --workspace amis-ui` 在输出完成后进程不退出，需要手工中断；本次 build 已到 `created lib` / `created esm`，作为 workspace runner warning 记录。
- IE11 仅确认本 feature 未改入口和不承诺动态 token；完整 IE11 发布产物回归留给 docs/validation rollout 或发布链 feature。

## 6. Cleanliness

- Debug output: pass。
- Temporary TODO/FIXME/XXX: pass。
- Commented-out code: pass。
- Unused imports / dead code from this feature: pass（SCSS 无 import 删除风险）。
- Out-of-scope files: pass。

## 7. Verdict

- Status: passed
- Next: `cs-feat` acceptance 阶段。
