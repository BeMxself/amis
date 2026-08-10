# Attention

本文件是 CodeStable 技能启动必读的项目注意事项入口。所有 CodeStable 子技能开始工作前必须读取它。

## 报告语言

CodeStable 所有落盘产出的正文用**中文**：plan / design、plan review / design-review、code review、QA、验收、issue（report / analysis / fix-note）、refactor、roadmap、goal、沉淀（compound）等所有人读报告都用中文表达。机器状态（YAML / JSON / `state.yaml` / frontmatter 字段）保持机读格式不翻译。如需改默认语言，改这一节。

## 项目碎片知识

<!-- cs-note managed: 用 cs-note 维护，新条目按下面分节追加 -->

### 编译与构建

### 运行与本地起服务

### 测试

### 命令与脚本陷阱

### 路径与目录约定

### 环境变量与凭证

### 其他

- 2026-07-26：owner 已明确授权：CodeStable review gate 中如果独立 reviewer / Task agent 无法启动，不再重复询问 owner，默认允许使用 local-only review fallback；报告必须记录 `reviewer: self`、不可启动原因、OCR 状态和该授权来源。该授权不代表跳过 review、QA、acceptance，也不授权 push / merge / release / deploy。
