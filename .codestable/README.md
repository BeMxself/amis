# amis 设计文档体系

本目录保存面向维护者的设计、决策、需求、问题分析和长期知识。公开产品文档仍保留在仓库现有 `docs/` 下；本目录只承载工程决策和内部设计上下文。

## 文档入口

- `.codestable/attention.md`：每次启动 CodeStable 工作流前必读的项目注意事项。
- `.codestable/requirements/`：能力愿景、领域术语和架构决策记录。
- `.codestable/requirements/adrs/`：架构决策记录，使用 3 位编号和 Nygard 四节。
- `.codestable/features/`：单个功能或改造的设计稿、检查清单、评审和验收记录。
- `.codestable/issues/`：问题报告、根因分析和修复说明。
- `.codestable/compound/`：可复用经验沉淀，适合保存调研结论和跨任务知识。
- `.codestable/reference/`：CodeStable 共享规范，由 `cs-onboard` 同步，避免手工改写。

## 使用约定

- 新的架构选择写入 `.codestable/requirements/adrs/NNN-{slug}.md`。
- 新功能或大改造先在 `.codestable/features/YYYY-MM-DD-{slug}/` 写设计，再实现。
- 术语冲突或主题概念变化先更新 `.codestable/requirements/CONTEXT.md`。
- 公开用户文档、组件 API 文档、示例说明仍写入现有 `docs/` 体系。

## 当前重点决策

- ADR-001：采用 token 与主题作用域选择器的双通道主题系统，避免最终用户感知主题类名前缀。
