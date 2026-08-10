---
doc_type: feature-implementation
feature: 2026-07-25-overlay-theme-scope-propagation
roadmap: theme-system-refactor
roadmap_item: overlay-theme-scope-propagation
status: ready-for-review
implemented: 2026-07-25
blocked_gate: null
---

# overlay-theme-scope-propagation 实现记录

## 1. Scope

本轮实现完成 Overlay / Modal / Drawer portal 边界的 `data-amis-theme` 传播：body container、自定义 container、custom container 已有 scope、多 root、iframe container、真实 `amisRender` 共享 env 和 custom container 不可用场景均有 targeted DOM 断言。

本轮没有修改 Overlay 定位、RootClose、offset、scroll parent、Modal 动画/拖拽/closeOnOutside、editor/theme-editor CSS 或组件 SCSS。

## 2. Step Evidence

| Step | 退出信号 | 证据 |
|---|---|---|
| S1 基线预检 | 列出默认 body、自定义 container、`env.getModalContainer`、`containerSelector` 现状 | `Overlay.tsx` 当前按 `containerSelector` / `props.container` / `env.getModalContainer` / body fallback 解析；`Modal.tsx` / `Drawer.tsx` 经 `getContainerWithFullscreen(container)` 进入 Portal。基线命令 `Dialog` / `Tooltip` / `Select` 已在动代码前因旧 `.cxd-*` selector 和 snapshot 失败。 |
| S2 Scope helper | helper 单测覆盖 nearest / apply / custom container scope | `packages/amis-core/src/theme.tsx` 新增 `getNearestThemeScope`、`applyThemeScope`、`resolveOverlayContainer`；`npm test --workspace amis-core -- theme` 通过。 |
| S3 Overlay 接入 | body/custom container 下可观察 scope | `Overlay` 优先从 target DOM 最近 `[data-amis-theme]` 取 scope，其次取 `ThemeContext`，`EnvContext.theme` 只兜底；Portal child 外层包 scoped ancestor，保证 `[data-amis-theme] .amis-*` 后代选择器命中；`npm test --workspace amis-core -- Overlay` 通过。 |
| S4 Modal / Drawer 接入 | Dialog/Drawer 默认和自定义 container 可观察 scope | `Modal.tsx` 新增 fullscreen+scope 组合 helper，`Drawer.tsx` 复用；显式 custom container 返回 `null` 时保持旧 `null` 语义，不改写为 body fallback；`npm test --workspace amis -- renderers/Dialog.test.tsx` 和 `npm test --workspace amis -- DrawerThemeScope` 通过。 |
| S5 多 root / preview | 多 root、iframe container 有 DOM 断言 | `Overlay.test.tsx` 覆盖同一 body 下 `cxd` / `dark` 两个 portal wrapper 不串线，以及 iframe `contentDocument.body` container 不跨 document；`OverlayThemeScope.test.tsx` 覆盖真实 `amisRender` 多 root + shared env + body portal。 |
| S6 范围收口 | diff 未触碰无关迁移 | `git diff --name-only` 仅命中 helper、Overlay、Modal、Drawer、targeted tests、checklist、design、review/implementation/evidence artifacts 和 goal-state；`packages/amis-editor-core`、`packages/amis-theme-editor-helper`、`packages/amis-ui/scss` 无源码 diff。 |

## 3. TDD Evidence

- S2 RED：`npm test --workspace amis-core -- theme` 因 helper 未实现失败；GREEN 后同命令通过。
- S3 RED：`npm test --workspace amis-core -- Overlay` 因 portal child 缺 `data-amis-theme` 失败；GREEN 后 body/custom/custom-scope、target DOM priority、descendant selector、multi-root 和 iframe 用例通过。
- S4 RED：`npm test --workspace amis -- renderers/Dialog.test.tsx` 新增 Dialog scope 用例失败；GREEN 后 Dialog scope 用例和既有 Dialog 行为用例通过。
- Review-fix RED：独立审查提出 REV-001 / REV-002 / REV-003 后，新增真实 `OverlayThemeScope` renderer 级测试、Modal/Drawer null custom container 测试和 scoped descendant selector 断言；修复后 targeted tests 均通过。

## 4. Commands

通过：

- `npm test --workspace amis-core -- theme`
- `npm test --workspace amis-core -- Overlay`
- `npm test --workspace amis -- renderers/Dialog.test.tsx`
- `npm test --workspace amis -- DrawerThemeScope`
- `npm test --workspace amis -- OverlayThemeScope`
- `npm run stylelint`
- `rg -n "data-amis-theme|getNearestThemeScope|applyThemeScope|resolveOverlayContainer" packages/amis-core packages/amis-ui packages/amis`
- `PYTHONPATH=/Users/songmingxu/Projects/gold-market/.venv/lib/python3.13/site-packages python3 /Users/songmingxu/.agents/skills/cs-onboard/tools/validate-yaml.py --file .codestable/features/2026-07-25-overlay-theme-scope-propagation/overlay-theme-scope-propagation-checklist.yaml --yaml-only`
- `git diff --check`

已批准为 baseline risk：

- `npm test --workspace amis -- Dialog`：`renderers/Dialog.test.tsx` 通过，但 `event-action/dialog.test.tsx` 14 个旧 snapshot 失败；差异包含进入前已有的 `cxd-* -> amis-*` / Root scope 变化，以及本次 Modal root 新增 `data-amis-theme`。
- `npm test --workspace amis -- Tooltip`：旧 `.cxd-Tooltip*` / `.cxd-TooltipWrapper` DOM 查询和 1 个旧 snapshot 失败。
- `npm test --workspace amis -- Select`：旧 `.cxd-*` DOM 查询和旧 snapshots 失败；源码仍存在 `classPrefix` 拼接的 Select / ChainedSelect 等 DOM 类依赖，不能在本 feature 内只改测试解决。

上述三条已由 `approval-report.md#overlay-dod-baseline-narrowing` 批准降为 non-core `document-baseline`，继续由后续 `core-component-selector-migration` 清理。

## 5. Gate Results

- `scope-gate`: passed。
- `dod-runner`: passed；CMD-002 / CMD-003 / CMD-004 真实执行失败，但按已批准 DoD 窄化记录为 non-core warnings。
- `evidence-pack`: passed；见 `overlay-theme-scope-propagation-evidence-pack.md`。
- `npm run typecheck`: failed in existing unrelated areas（`packages/amis-editor`、`packages/amis/src/renderers`、`scripts/build-schemas.ts`）；未出现当前 feature 文件失败，作为 baseline risk 记录，不纳入本 feature core DoD。

## 6. Review-Fix Record

- REV-001 fixed：Overlay scope 来源改为 target DOM nearest scope → `ThemeContext` → `EnvContext.theme.scope` → `EnvContext.theme.name`，并新增真实 `amisRender` 多 root + shared env + body portal 测试。
- REV-002 fixed：Modal/Drawer custom container resolver 返回 `null` 时继续返回 `null`，只记录待应用 trigger scope，不 fallback 到 body。
- REV-003 fixed：Overlay portal child 外层增加 scoped ancestor wrapper，targeted tests 断言 `[data-amis-theme="cxd"] .amis-PopOver` / `.amis-DropDown-popover` 后代选择器可命中。
- Wrapper safety：`Position`、Transition、RootClose 的原有 child 组合顺序保持，scope wrapper 是 Portal 边界的最外层 DOM 祖先；定位仍由 `Position` 注入到原 overlay child，RootClose ref 仍挂到原 child。

## 7. Cleanliness

- 未新增 debug output。
- 未新增临时 TODO / FIXME / XXX。
- 未注释掉代码。
- 未修改 editor/theme-editor helper。
- 未修改组件 SCSS。
- 未新增 legacy `.cxd-*` SCSS/CSS selector 兼容层。

## 8. Baseline Risk

当前代码实现已满足本 feature 的 targeted overlay scope 行为。full `Dialog` / `Tooltip` / `Select` 在当前阶段仍暴露既有 selector/snapshot 迁移债，且 `Select` 涉及源码中的 `classPrefix` DOM 类依赖。该风险已由 owner 批准在本 feature 降为 baseline risk，并作为后续 `core-component-selector-migration` 的输入。
