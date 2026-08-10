---
doc_type: issue-report
issue: 2026-07-30-theme-visual-regression
status: confirmed
reported: 2026-07-30
path: fast-track
tags:
  - theme-system
  - visual-regression
  - overlay
---

# 主题重构后的表单视觉回归报告

## 1. 问题描述

主题系统重构后，组件文档中的若干表单控件出现视觉回归：

- `/zh-CN/components/form/options`：下拉弹层位置错误，且类似问题影响其他下拉类弹层。
- `/zh-CN/components/form/input-color`：颜色选择器样式异常。
- `/zh-CN/components/form/input-array`：数组输入框内部控件样式异常。
- `/zh-CN/components/form/input-month-range`：月份范围输入框样式异常。

## 2. 复现路径

在本地开发服务 `http://127.0.0.1:8888/` 打开上述四个页面，分别点击下拉、颜色选择器或月份范围输入区域，观察控件根类、弹层定位和主体样式。

## 3. 期望行为

- 表单控件 DOM 使用稳定组件前缀 `amis-*`，不再从 `cxd` 主题名派生为 `cxd-*`。
- 弹层保持主题作用域，但不能插入额外布局 wrapper 改变 `offsetParent` 或定位坐标。
- Options、InputColor、InputArray、InputMonthRange 的主体结构、输入框宽高、弹层宽高与重构前一致。

## 4. 根因摘要

本问题根因明确，走快速通道修复：

- `Root` 仍将 `theme.classPrefix` 作为 `classPrefix` 下发给 renderer，导致表单控件继续生成 `cxd-ColorControl`、`cxd-NumberControl`、`cxd-DateRangeControl` 等根类。
- `themeable()` 和 `getClassPrefix()` 仍暴露 legacy `classPrefix`，与稳定组件前缀目标不一致。
- `Overlay` 为 portal 子节点额外包了一层带 `data-amis-theme` 的 `div`，改变弹层定位链路，导致下拉弹层相对错误 wrapper 计算位置。

## 5. 修复边界

- 只修复主题前缀下发和 Overlay 作用域传播，不扩大到文档站布局、旧 `.cxd-*` DOM 兼容层或 SCSS 兼容输出策略。
- 本次不处理文档示例纵向内容位置差异；当前验证聚焦用户点名的控件样式和弹层定位回归。
