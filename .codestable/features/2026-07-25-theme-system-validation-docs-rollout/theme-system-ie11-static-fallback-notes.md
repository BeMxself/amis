---
doc_type: feature-artifact
artifact_type: IE11StaticFallbackNotes
feature: 2026-07-25-theme-system-validation-docs-rollout
status: current
updated: 2026-07-28
---

# IE11 Static Fallback Notes

## 1. Boundary

IE11 只保留静态 CSS 降级边界。用户如果需要 IE11，应加载对应静态 CSS 文件，例如 `amis/sdk/cxd-ie11.css`，并接受不支持 CSS custom properties 动态 token theme switching。

## 2. Must Say

- `*-ie11.css` 是静态 CSS fallback。
- `cxd-ie11.css` 是文件名兼容，不代表 `.cxd-*` selector compatibility。
- IE11 不支持 `--amis-*` token 的运行时动态切换。

## 3. Must Not Say

- 不承诺 IE11 下可以用 `cssVars` 动态切换主题。
- 不用 IE11 fallback 为理由恢复 `.cxd-*` SCSS/CSS 双编译。
- 不把 `theme: 'cxd'` 解释成 DOM selector 前缀 API。

## 4. Updated Surfaces

| Path | Change |
|---|---|
| `docs/zh-CN/start/getting-started.md` | 明确 IE11 只能引入静态 CSS 降级文件，不支持动态 token。 |
| `docs/zh-CN/style/css-vars.md` | 明确 CSS 变量动态主题切换不支持 IE11。 |
| `docs/zh-CN/style/index.md` | 旧前缀兼容边界中说明 IE11 静态降级。 |
