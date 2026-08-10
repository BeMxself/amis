---
doc_type: audit-finding
audit: 2026-07-30-theme-hardening-risks
finding_id: "maintainability-03"
nature: maintainability
severity: P2
confidence: high
suggested_action: cs-refactor
status: open
---

# Finding 03：examples 仍硬编码 classPrefix="cxd-"

## 速答

示例代码仍直接给组件传 `classPrefix="cxd-"`，容易让示例读者把旧主题前缀当成仍推荐的组件接入方式。

## 关键证据

- `examples/components/Test.jsx:9`、`examples/components/Test.jsx:13`、`examples/components/Test.jsx:17` 等多处直接 `<Button ... classPrefix="cxd-">`。
- `examples/components/MdRenderer.jsx:207` 直接给 `PopOver` 传 `classPrefix="cxd-"`。
- `packages/amis-ui/src/components/Button.tsx:30` 暴露 `classPrefix` prop，且 Button 实现主要使用 `classnames` 生成类名；示例硬编码旧前缀不是新主题主路径的必要输入。

## 影响

examples 虽不是库运行时主路径，但它们会被开发者复制。继续展示 `classPrefix="cxd-"` 会削弱 roadmap 中“最终用户不关心主题前缀”的迁移叙事，也可能让新定制代码继续依赖 `.cxd-*`。

## 修复方向

把示例改为通过主题上下文 / `themeable` 注入稳定 classnames，或在确实需要裸组件示例时使用稳定 `amis-` / `getTheme('cxd').classnames`；如果某些 examples 是历史兼容样板，应加到 ExamplesThemeInventory 并标注 migration-only。

## 建议动作

`cs-refactor`，因为这是迁移卫生和示例可信度问题，适合和 legacy-prefix-teardown follow-up 或 docs rollout follow-up 一起处理。
