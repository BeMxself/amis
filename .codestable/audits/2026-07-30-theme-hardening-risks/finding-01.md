---
doc_type: audit-finding
audit: 2026-07-30-theme-hardening-risks
finding_id: "bug-01"
nature: bug
severity: P1
confidence: high
suggested_action: cs-issue
status: fixed
fixed_by: .codestable/issues/2026-07-30-popup-theme-scope/popup-theme-scope-fix-note.md
---

# Finding 01：PopUp 直接 Portal 未注入 ThemeScope

## 速答

`PopUp` 默认直接 portal 到 `document.body`，但没有复用 Overlay / Modal / Drawer 的 ThemeScope resolution，因此移动端 picker、ColorPicker、DatePicker 等使用 PopUp 的路径在 scoped token 主题下可能丢失主题作用域。

## 关键证据

- `packages/amis-ui/src/components/PopUp.tsx:54` — 默认 `container: document.body`，这是脱离 amis root DOM 树的渲染路径。
- `packages/amis-ui/src/components/PopUp.tsx:104` — 直接 `<Portal container={container}>`，没有调用 `resolveOverlayContainer`、`applyThemeScope` 或同等 helper。
- `packages/amis-ui/src/components/PopUp.tsx:116` — portal 根节点只设置 className / style / rest props，没有补 `data-amis-theme`。
- `packages/amis-ui/src/components/ColorPicker.tsx:402`、`packages/amis-ui/src/components/DatePicker.tsx:1203`、`packages/amis-ui/src/components/SelectMobile.tsx:498` 等多处使用 `PopUp`，实际影响不局限于单个组件。

## 影响

当 PopUp 挂到 `body`，且主题 token / 主题覆写依赖 `[data-amis-theme] .amis-*` 作用域时，PopUp 内容可能无法拿到正确主题变量或主题覆写。移动端选择类控件、颜色选择、日期选择、用户选择等都可能出现视觉不一致。这个问题与本次 Overlay wrapper 回归同源：ThemeScope gate 只覆盖了 Overlay 主路径，没有覆盖直接 portal 旁路。

## 修复方向

把 PopUp 纳入统一 ThemeScope helper：解析 container 时继承已有 container scope，否则使用当前 theme scope，并把 scope 直接施加到 PopUp 根节点或既有 portal root，避免新增 layout wrapper。

## 建议动作

已按 `cs-issue` 修复。修复复用 `resolveOverlayContainer` / `applyThemeScope`，并把 direct `Portal` / `ReactDOM.createPortal` 纳入 `direct-portal-theme-scope` 静态 guard；后续 mobile popup 真实页面证据仍应在对应视觉 QA 阶段补齐。
