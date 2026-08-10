---
doc_type: issue-analysis
issue: 2026-07-30-popup-theme-scope
status: confirmed
root_cause_type: missing-guard
related: [popup-theme-scope-report.md]
tags: [theme-system, popup, portal]
---

# PopUp ThemeScope 根因分析

## 1. 问题定位

| 关键位置 | 说明 |
|---|---|
| `packages/amis-ui/src/components/PopUp.tsx:54` | `PopUp` 默认 container 是 `document.body`，脱离 amis root 主题作用域。 |
| `packages/amis-ui/src/components/PopUp.tsx:104` | 直接 `<Portal container={container}>`，没有经过统一 ThemeScope container resolution。 |
| `packages/amis-ui/src/components/PopUp.tsx:116` | PopUp 根节点没有 `data-amis-theme` 注入。 |
| `packages/amis-ui/src/components/ColorPicker.tsx:402` 等 | 多个用户可见组件使用 PopUp，影响不局限于单点。 |

## 2. 失败路径还原

**正常路径**：组件在 amis root 内渲染，root 输出 `data-amis-theme="cxd"`，子节点可通过 scoped token / theme selector 拿到主题样式。

**失败路径**：PopUp 打开 → `Portal` 挂到 `document.body` → PopUp 根节点不再处于 root scope 内 → 根节点也没有补 `data-amis-theme` → scoped token / theme selector 可能失效。

**分叉点**：`packages/amis-ui/src/components/PopUp.tsx:104` — direct portal 绕过了 Overlay / Modal / Drawer 已经使用的 ThemeScope helper。

## 3. 根因

**根因类型**：missing-guard

**根因描述**：roadmap 早期把“浮层 scope 传播”主要等同于 Overlay 主路径，后来 Modal / Drawer 也补了 scope，但 `PopUp` 这种 direct portal 组件没有进入同一个 gate。代码层面缺少统一 ThemeScope resolution 和 root apply 步骤。

**是否有多个根因**：否。主根因是 direct portal path 未纳入 ThemeScope gate。

## 4. 影响面

- **影响范围**：所有默认挂 body 或自定义 container 的 PopUp 实例。
- **潜在受害模块**：`ColorPicker`、`DatePicker`、`DateRangePicker`、`MonthRangePicker`、`SelectMobile`、`LocationPicker`、`CityArea`、`ConfirmBox`、`UserSelect`、`CalendarMobile` 等。
- **数据完整性风险**：无。
- **严重程度复核**：维持 P1；这是用户可见主题样式风险，但修复点集中。

## 5. 修复方案

### 方案 A：在 PopUp 内复用 ThemeScope helper
- **做什么**：PopUp 解析 container 时使用 `resolveOverlayContainer`，并在现有 PopUp 根节点 ref 上调用 `applyThemeScope`。
- **优点**：最小改动；不新增 wrapper；不要求所有调用方改造。
- **缺点 / 风险**：只覆盖 PopUp，不自动治理其他未来 direct portal 组件。
- **影响面**：`packages/amis-ui/src/components/PopUp.tsx` 和回归测试。

### 方案 B：抽象新的 PortalThemeScope 组件
- **做什么**：新增统一 `ScopedPortal` / `PortalThemeScope` 组件，让所有 direct portal 迁移过去。
- **优点**：长期治理能力更强。
- **缺点 / 风险**：本 issue 内改动面偏大，容易把 bug fix 扩成框架重构。
- **影响面**：多个 portal 组件和调用方。

### 推荐方案

**推荐方案 A**，理由：它直接修复当前 P1 根因，不新增 wrapper，不改调用方；方案 B 可作为后续 guard / refactor 继续推进。
