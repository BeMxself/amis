---
doc_type: audit-index
audit: 2026-07-30-theme-hardening-risks
scope: 主题系统 postmortem hardening 隐患扫描：前缀 source-of-truth、ThemeScope portal 传播、示例旧前缀残留
created: 2026-07-30
status: active
total_findings: 3
---

# theme-hardening-risks 审计报告

## 范围

本次只读扫描围绕 ADR-001 和 theme-system-refactor roadmap 的 postmortem gate 展开，重点检查：

- `theme.classPrefix` 是否仍能绕过 `componentClassPrefix || 'amis-'` 进入公开 DOM / plugin API。
- `Overlay` 以外的直接 `Portal` / `ReactDOM.createPortal` 路径是否继承 `data-amis-theme`。
- 示例和文档是否仍把 `classPrefix="cxd-"` 展示成用户可模仿的组件用法。

扫描范围包含 `packages/amis-core`、`packages/amis`、`packages/amis-ui`、`packages/amis-editor-core` 和 `examples/components`。审计后已就地修复 P1 PopUp direct portal ThemeScope 缺失；两条 P2 迁移卫生项仍保留为 follow-up。

## 总评

共发现 3 条隐患：1 条 P1 运行时主题作用域缺失风险，2 条 P2 迁移/API 卫生风险。P1 已通过 PopUp 修复和 `direct-portal-theme-scope` guard 收口；核心问题不是“token 化路线错了”，而是最初 gate 把 `Overlay` 和 helper 当成代表路径，没把 direct portal、editor API、examples 这些旁路纳入同一 source-of-truth 检查。

## 发现清单

| # | 性质 | 严重度 | 置信度 | 标题 | 文件 |
|---|---|---|---|---|---|
| 1 | bug | P1 | high | PopUp 直接 Portal 默认挂 body，未注入 ThemeScope（已修） | [finding-01.md](finding-01.md) |
| 2 | arch-drift | P2 | medium | Editor manager 仍暴露 legacy theme.classPrefix API | [finding-02.md](finding-02.md) |
| 3 | maintainability | P2 | high | examples 仍硬编码 classPrefix="cxd-" | [finding-03.md](finding-03.md) |

## 按维度分布

| 性质 | P0 | P1 | P2 | 合计 |
|---|---|---|---|---|
| bug | 0 | 1 | 0 | 1 |
| security | 0 | 0 | 0 | 0 |
| performance | 0 | 0 | 0 | 0 |
| maintainability | 0 | 0 | 1 | 1 |
| arch-drift | 0 | 0 | 1 | 1 |
| **合计** | **0** | **1** | **2** | **3** |

## 下一步建议

- **P1 已修并加 guard**：PopUp direct portal ThemeScope 缺失已通过 `cs-issue` 修复，复用 shared scope resolution，并新增 `direct-portal-theme-scope` selector guard 防止新增未分类 direct portal。
- **P2 排入迁移卫生**：editor manager legacy prefix API 和 examples 硬编码旧前缀，建议走 `cs-refactor` 或并入下一轮 legacy-prefix-teardown follow-up。
