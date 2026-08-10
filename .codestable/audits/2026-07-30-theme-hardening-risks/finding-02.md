---
doc_type: audit-finding
audit: 2026-07-30-theme-hardening-risks
finding_id: "arch-drift-02"
nature: arch-drift
severity: P2
confidence: medium
suggested_action: cs-refactor
status: open
---

# Finding 02：Editor manager 仍暴露 legacy theme.classPrefix API

## 速答

`EditorManager.getThemeClassPrefix()` 直接返回 `getTheme(...).classPrefix`，与 ADR-001 中“最终用户不再需要理解或依赖主题类名前缀”的方向冲突；当前未发现内部调用，但作为 manager API 仍可能被插件或外部 editor 扩展使用。

## 关键证据

- `packages/amis-editor-core/src/manager.ts:2495` — 定义 `getThemeClassPrefix()`。
- `packages/amis-editor-core/src/manager.ts:2496` — 返回 `getTheme(this.config.theme || 'cxd').classPrefix`，而不是 `componentClassPrefix` / stable selector / ThemeScope。
- `packages/amis-editor-core/src/manager.ts:2499` — 邻近的 `getThemeClassName(name)` 使用 `theme.classnames(name)`，当前 classnames 已经走稳定 `amis-*` 和显式 alias 规则，说明同类需求已经有更接近新契约的 API。
- `rg "getThemeClassPrefix"` 只发现定义，未发现仓库内调用；因此风险主要来自外部插件 API，而不是当前内部 DOM 主链路。

## 影响

这个 API 会继续把 `cxd-` / `antd-` / `dark-` 当作可读取能力暴露给 editor 插件。即使当前内部未使用，它也会鼓励扩展方继续拼旧前缀 DOM selector，延缓从 `.cxd-*` 到 `.amis-*` / `[data-amis-theme]` / token 的迁移。

## 修复方向

将该 API 标注为 legacy/internal，或改名拆分为 `getComponentClassPrefix()` / `getStableThemeClassName()` / `getThemeScopeProps()`；如需兼容外部插件，提供迁移说明并避免把 legacy prefix 写进新文档。

## 建议动作

`cs-refactor`，因为当前没有确认的运行时触发 bug，更像 API 表面和架构契约收敛问题。
