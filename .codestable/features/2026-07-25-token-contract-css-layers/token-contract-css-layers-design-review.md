---
doc_type: feature-design-review
feature: 2026-07-25-token-contract-css-layers
status: passed
review_state: passed
review_reason: ""
reviewer_id: "local-only:user-approved-2026-07-25"
reviewed: 2026-07-25
round: 1
---

# token-contract-css-layers feature design 审查报告

## 1. Scope And Inputs

- Design: `.codestable/features/2026-07-25-token-contract-css-layers/token-contract-css-layers-design.md`
- Checklist: `.codestable/features/2026-07-25-token-contract-css-layers/token-contract-css-layers-checklist.yaml`
- Roadmap: `.codestable/roadmap/theme-system-refactor/theme-system-refactor-roadmap.md`
- Roadmap item: `token-contract-css-layers`
- ADR: `.codestable/requirements/adrs/001-tokenized-theme-system.md`
- Compound: `.codestable/compound/2026-07-24-explore-cxd-compat-compile-switch.md`
- Code facts checked: `packages/amis-ui/scss/_properties.scss`, `packages/amis-ui/scss/_variables.scss`, `packages/amis-ui/scss/themes/*.scss`, `packages/amis-ui/rollup.config.js`, `packages/amis-theme-editor-helper/src/helper/ParseThemeData.ts`, `packages/amis-editor-core/src/util.ts`

### Independent Review

- Status: local-only
- Detection: local-only
- Provider / agent: none
- Raw output summary: `spawn_agent` repeatedly rejected payloads with `Provide either message or items, but not both` / empty-field validation errors before an agent id was created.
- Merge policy: 本地逐项核验 design、checklist、roadmap、ADR、compound 和关键代码事实。
- Gate effect: owner 已批准 local-only 降级，允许本轮 design review 给出最终 verdict。

## 2. Design Summary

- Goal: 固化 TokenContract，包括 `--amis-*` 命名、palette → semantic → component → state 分层、CSS layer 顺序、旧 token alias、主题 token 覆写入口和 IE11 静态降级边界。
- Key contracts: canonical layer order、`--amis-*` namespace、legacy alias map、`[data-amis-theme]` theme override、`amis.user` user override boundary。
- Steps: 6 步；从 token 入口微重构到 layer/token 骨架、旧 token alias、主题覆写、构建验证和范围收口。
- Checks: 14 项；覆盖名词契约、编排骨架、流程级约束、挂载点、范围守护和验收场景。

## 3. Findings

### blocking

- none

### important

- none

### nit

- none

### suggestion

- [ ] FDR-001 实现阶段应优先把 `npm run build --workspace amis-ui` 作为预检，确认 token entry 接入不会扩大到全 workspace build 红灯。
  - Evidence: design 第 3.3 节将该命令列为 core，当前 feature 尚未实现。
  - Impact: 不阻塞 design；这是实现阶段证据计划。

### learning

- TokenContract 这一项最关键的价值是先把 layer 顺序、`--amis-*` 命名和旧 token alias 的治理点固定住，而不是提前迁移全部组件；design 的范围边界与 roadmap 约束一致。
- `packages/amis-ui/scss/_properties.scss` 已经承担过多 token 职责，独立 token 入口是合理的结构健康度结论，但实现阶段仍应保持“最小入口 + 旧导入链可用”，不要借机重写全量变量。

### praise

- design 明确把全组件 selector 迁移、editor/theme-editor 迁移和 SCSS `.cxd-*` legacy selector 兼容排除在本 feature 外，避免第二项范围失控。
- checklist 的 steps 都有可独立验证的 exit signal，且 checks 能追溯到名词契约、编排骨架、流程约束、挂载点、范围守护和验收场景。

## 4. User Review Focus

- 用户需要重点拍板：是否认可 `packages/amis-ui/scss/tokens/` 作为 token 公共契约目录，以及“旧 token alias 集中治理、不做 SCSS legacy selector 兼容”的边界。
- implement 需要重点遵守：先建立 layer/token/alias 最小入口，保持旧 `_properties.scss` 导入链可用，不迁移全组件和 editor/helper。
- code review / QA / acceptance 需要重点复核：layer 顺序是否可在产物或 fixture 观察，新增 `--amis-*` 是否归层，`.cxd-*` / `#{$ns}` 新增命中是否都可解释为既有或禁止。

## 5. Evidence Confidence Ledger

| Check | Verdict | Evidence Class | Basis | Follow-up |
|---|---|---|---|---|
| Acceptance Coverage Matrix | pass | E | design 第 3.2 节覆盖 layer order、`--amis-*` 链路、旧 token alias、主题覆写、IE11 静态边界、editor/helper 反向核对和 SCSS legacy selector 反向核对 | implementation 按矩阵落证据 |
| DoD Contract | pass | E | design 第 3.3 节和 checklist `dod.commands` 均列出 stylelint、amis-ui build、layer grep、token grep、selector grep、YAML 和 workflow hook | `workflow-next` 需用带 PyYAML 环境运行或记录基线 |
| Steps and checks traceability | pass | E | checklist 6 steps / 14 checks 均能回到 design 第 1-3 节 | none |
| Roadmap contract compliance | pass | E/C | roadmap item 要求 token 分层、`--amis-*` 命名、CSS layer、主题包覆写、旧 token 映射和 IE11 静态降级；design 均覆盖且未迁移全部组件 | none |
| Module interface design | pass | E/C | design 第 2.1 节覆盖 TokenContract 的 module/interface、seam、depth/locality、dependency category、adapter 和 test surface | implementation 复核目录命名与入口拆分 |
| Validation and artifacts | pass | E | checklist YAML 和 roadmap items YAML 已用 `validate-yaml.py --yaml-only` 校验通过；design-review local-only 授权已记录在 approval-report | none |

Summary: E=6, C=2, H=0, H-only core checks=none。

## 6. Residual Risk

- local-only design review 缺少独立 reviewer 视角；实现前用户 review 应重点看 token 目录约定和旧 token alias 方向是否符合预期。
- CSS layer 在不同浏览器和构建链中的输出细节仍需实现阶段用 fixture/build 证明；design 已把该项列为 core validation。
- PyYAML 缺失会让 `codestable-workflow-next.py` 在默认 Python 环境误报 artifact parse error；后续 workflow hook 需要使用可导入 PyYAML 的环境或记录为工具环境基线。

## 7. Verdict

- Status: passed
- Next: 交给用户整体 review；用户确认 design 后才能把 design `status` 改为 `approved` 并进入 goal-package / implementation 后续阶段。
