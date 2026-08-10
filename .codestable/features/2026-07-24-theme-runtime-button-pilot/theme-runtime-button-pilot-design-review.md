---
doc_type: feature-design-review
feature: 2026-07-24-theme-runtime-button-pilot
status: passed
review_state: passed
review_reason: ""
reviewer_id: "local-only:user-approved-2026-07-24"
reviewed: 2026-07-24
round: 1
---

# theme-runtime-button-pilot feature design 审查报告

## 1. Scope And Inputs

- Design: `.codestable/features/2026-07-24-theme-runtime-button-pilot/theme-runtime-button-pilot-design.md`
- Checklist: `.codestable/features/2026-07-24-theme-runtime-button-pilot/theme-runtime-button-pilot-checklist.yaml`
- Intent / brainstorm: none
- Roadmap: `.codestable/roadmap/theme-system-refactor/theme-system-refactor-roadmap.md`
- Related docs: `.codestable/requirements/CONTEXT.md`, `.codestable/requirements/adrs/001-tokenized-theme-system.md`, `.codestable/compound/2026-07-24-explore-cxd-compat-compile-switch.md`
- Code facts checked: `packages/amis-core/src/theme.tsx`, `packages/amis-core/src/Root.tsx`, `packages/amis-core/src/RootRenderer.tsx`, `packages/amis-core/src/index.tsx`, `packages/amis-ui/src/components/Button.tsx`, `packages/amis-ui/scss/components/_button.scss`, `packages/amis/src/preset.tsx`, root / workspace package scripts

### Independent Review

- Status: local-only
- Detection: local-only
- Provider / agent: none
- Raw output: previous independent reviewer launch failed before agent id was created; owner approved local-only downgrade in chat on 2026-07-24
- Merge policy: 本地逐项核验 design、checklist、roadmap 契约和关键代码事实
- Gate effect: user-approved downgrade; local review may produce final verdict

## 2. Design Summary

- Goal: 用 Button pilot 证明 ThemeScope、稳定 `.amis-*` classnames、Root `data-amis-theme`、DOM-only `.cxd-*` alias 和最小 token 样式闭环可执行。
- Key contracts: `ThemeScope`、`componentClassPrefix: 'amis-'`、`legacyDomClassAlias: false | 'cxd'`、Root scope container、stable classnames、alias 缓存失效语义。
- Steps: 7 步；从基线预检到运行时契约、Root scope、Button 样式 proof、alias 验证、范围守护和收尾验证。
- Checks: 14 项；覆盖名词契约、编排骨架、流程约束、挂载点、范围守护和验收场景。
- Baseline / validation: checklist YAML 和 roadmap items YAML 均已通过 `validate-yaml.py --yaml-only`。

## 3. Findings

### blocking

- none

### important

- none

### nit

- none

### suggestion

- [ ] FDR-001 `theme-runtime-button-pilot-design.md#Validation Commands` targeted jest 命令需要在实现阶段确认测试匹配策略
  - Evidence: design 使用 `npm test --workspace amis-core -- theme`，当前 `packages/amis-core/__tests__` 尚无 `theme.test.tsx`；implementation 计划新增测试后该命令才有稳定匹配对象。
  - Impact: 不阻塞 design；实现阶段若测试文件命名偏离 `theme`，命令可能跑不到目标或失败。
  - Expected fix scope: implementation 新增 theme runtime 测试时确保文件名 / test name 可被 `-- theme` 匹配，或同步更新 checklist 命令。

### learning

- RootRenderer 当前不是固定 DOM 根；ThemeScope 需要通过 root scope container / root wrapper 链路落地，不能假设组件实例可直接挂 DOM attribute。
- `getTheme()` 当前缓存 `config.classnames`；alias 这种运行时配置若允许后续 `theme()` 更新，必须显式处理缓存失效。

### praise

- design 把 pilot 限制在运行时契约、Root scope、Button 和最小样式 proof，没有把 token 全量治理、overlay、editor 或全组件迁移塞进第一项。
- checklist 的 steps 都有 yes/no 退出信号，且核心验收场景能追踪到具体 step 和命令。

## 4. User Review Focus

- 用户需要重点拍板：是否认可 `ThemeScopeRoot` / root wrapper 作为 Root scope 的实现方向，以及 DOM-only alias 只作为迁移开关。
- implement 需要重点遵守：Root scope 必须有稳定 DOM 挂点，`theme()` 更新后 classnames 缓存不得陈旧，DOM-only alias 不得生成库 CSS。
- code review / QA / acceptance 需要重点复核：新增 `.cxd-*` 命中只能来自 DOM alias 测试或 legacy/internal 允许路径；不得扩到 editor / overlay / 全组件迁移。

## 5. Evidence Confidence Ledger

| Check | Verdict | Evidence Class | Basis | Follow-up |
|---|---|---|---|---|
| Acceptance Coverage Matrix | pass | E | design 第 3 节覆盖默认稳定类名、modifier、Root scope、alias 开启/关闭、样式边界、source-of-truth、缓存更新顺序 | implementation 按 matrix 落测试 |
| DoD Contract | pass | E | design 第 3 节 DoD 和 checklist `dod.commands` 对齐，且已补 local-only downgrade 口径 | none |
| Steps and checks traceability | pass | E | checklist 7 steps / 14 checks 均能回到 design 第 1-3 节 | none |
| Roadmap contract compliance | pass | E/C | roadmap item 限定 Button、最小 token alias、runtime scope、DOM-only alias；design 未扩到 SCSS legacy、全量 token、其他组件 | none |
| Module interface design | pass | E/C | design 已覆盖 Theme Runtime seam、depth/locality、dependency strategy、adapter=none、test surface | implementation 复核缓存失效与 root wrapper 顺序 |
| Validation and artifacts | pass | E | checklist YAML 与 roadmap items YAML 校验通过；artifact 路径完整 | none |

Summary: E=6, C=3, H=0, H-only core checks=none。

## 6. Residual Risk

- local-only 降级缺少异构 reviewer 视角；code review 阶段应重点复核 Root scope 挂点和 classnames 缓存语义。
- Button 最小样式 proof 可能不足以暴露全量 `_button.scss` 迁移风险；这是 roadmap 有意延后到 `stylesheet-stable-selector-build` / `core-component-selector-migration` 的风险。

## 7. Verdict

- Status: passed
- Next: 交给用户整体 review；用户确认 design 后才能把 design `status` 改为 `approved` 并进入实现 / goal-package 后续阶段。

## 8. Focused Closure

- none
