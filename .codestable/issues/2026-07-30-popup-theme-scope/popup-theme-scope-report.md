---
doc_type: issue-report
issue: 2026-07-30-popup-theme-scope
status: confirmed
issue_path: fast-track
severity: P1
summary: PopUp direct portal 默认挂到 body 时未携带 ThemeScope
tags: [theme-system, popup, portal]
---

# PopUp ThemeScope Issue Report

## 1. 问题现象

主题系统改为稳定 `.amis-*` + `[data-amis-theme]` 后，`PopUp` 仍直接 portal 到 `document.body`，但 portal 根节点没有 `data-amis-theme`。依赖 scoped token 或主题覆写的 PopUp 内容可能拿不到正确主题。

## 2. 复现步骤

1. 渲染一个 `PopUp`，使用默认 `container: document.body`。
2. 打开 PopUp。
3. 观察到：PopUp 根节点不在 amis root DOM 树下，且缺少 `data-amis-theme`。

复现频率：稳定。

## 3. 期望 vs 实际

**期望行为**：所有脱离普通 DOM 树的浮层根节点都携带或继承正确 `data-amis-theme`，且不通过额外 wrapper 改变布局。

**实际行为**：`PopUp` 使用 `<Portal container={container}>` 直接挂载，根节点只带 class / style / rest props，没有 ThemeScope。

## 4. 环境信息

- 涉及模块 / 功能：`amis-ui` PopUp、移动端 picker、ColorPicker、DatePicker、SelectMobile 等 PopUp 调用方。
- 相关文件 / 函数：`packages/amis-ui/src/components/PopUp.tsx`
- 运行环境：本地 dev / Jest jsdom 复现。
- 其他上下文：该问题来自 2026-07-30 theme visual regression postmortem audit。

## 5. 严重程度

**P1** — 用户可见浮层主题作用域缺失，影响面覆盖多个移动端 / picker 组件；有明确小范围根因和修复方案。

## 备注

关联审计：`.codestable/audits/2026-07-30-theme-hardening-risks/finding-01.md`。
