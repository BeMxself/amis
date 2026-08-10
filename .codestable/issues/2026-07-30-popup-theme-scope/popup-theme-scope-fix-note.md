---
doc_type: issue-fix-note
issue: 2026-07-30-popup-theme-scope
status: fixed
related:
  - popup-theme-scope-report.md
  - popup-theme-scope-analysis.md
---

# PopUp ThemeScope 修复记录

## 根因

`PopUp` 是 direct portal 组件，默认挂到 `document.body`，但没有像 Overlay / Modal / Drawer 一样解析和注入 ThemeScope，导致 scoped token / theme selector 在 PopUp 脱树渲染时可能失效。

## 改动

- `packages/amis-ui/src/components/PopUp.tsx`
  - 新增 `getScopedContainer()`：解析 `container`，通过 `resolveOverlayContainer` 继承已有 container scope 或使用当前 theme scope。
  - 新增 `popupRef()`：在现有 PopUp 根节点上调用 `applyThemeScope`，不新增 layout wrapper。
  - 隐藏态下不向 container 写入 `data-amis-theme`。
- `packages/amis/__tests__/renderers/PopUpThemeScope.test.tsx`
  - 覆盖 body portal 根节点 scope、自定义 container scope 保留、隐藏态无副作用。
- `packages/amis/__tests__/renderers/OverlayThemeScope.test.tsx`
  - 更新断言口径，允许浮层根节点自己携带 `data-amis-theme`，符合 layout-neutral contract。
- `packages/amis-ui/scripts/checkThemeSelectors.js` 与 `packages/amis-ui/scripts/theme-selectors/policy.json`
  - 新增 `direct-portal-theme-scope` scan / category，将 `<Portal` 与 `ReactDOM.createPortal(` 纳入主题系统 guard。
  - 当前 baseline 为 1510 matches，其中 direct portal baseline 7 处；新增未分类 direct portal 会让 `npm run check:theme-selectors --workspace amis-ui` 失败。

## 验证

- `npx jest packages/amis/__tests__/renderers/PopUpThemeScope.test.tsx --config packages/amis/package.json --runInBand` — pass，3 tests。
- `npx jest packages/amis/__tests__/renderers/PopUpThemeScope.test.tsx packages/amis/__tests__/renderers/OverlayThemeScope.test.tsx packages/amis/__tests__/renderers/DrawerThemeScope.test.tsx --config packages/amis/package.json --runInBand` — pass，7 tests。
- `npx jest packages/amis-core/__tests__/components/Overlay.test.tsx --config packages/amis-core/package.json --runInBand` — pass，8 tests。
- `npm run check:theme-selectors --workspace amis-ui` — pass，policy baseline 1510。
- `npx tsc -p packages/amis-ui/tsconfig.json --noEmit` — fail，非本次新增阻塞；当前 runner 依赖 `amis-core/lib` 预构建产物且存在大量历史 themeable props 类型错误。过滤 touched files 后仅见同类既有链路错误。
- `npx jest packages/amis-ui/__tests__/404.test.tsx --config packages/amis-ui/package.json --runInBand` — fail，非本次新增阻塞；`amis-ui` Jest setup 中 `loadAllAsyncRenderers is not a function`，404 既有测试同样失败。

## 遗留风险

- 本次只修 PopUp，不抽象新的 `ScopedPortal`。direct portal 静态 guard 已落地；是否抽象统一 `ScopedPortal` 留给后续 refactor，避免把 P1 bug fix 扩成框架改造。
- `EditorManager.getThemeClassPrefix()` 和 examples `classPrefix="cxd-"` 已在 audit 中记录为 P2 follow-up，未在本 issue 中顺手修改。
