---
doc_type: issue-fix
issue: 2026-07-30-theme-visual-regression
status: confirmed
path: fast-track
fix_date: 2026-07-30
related:
  - theme-visual-regression-report.md
tags:
  - theme-system
  - visual-regression
  - overlay
---

# 主题重构后的表单视觉回归修复记录

## 1. 问题描述

主题系统改为稳定 `amis-*` 组件前缀后，部分表单控件和弹层仍沿旧 `cxd-*` 前缀或额外作用域 wrapper 渲染，造成用户可见的样式和定位回归。

## 2. 根因

- `packages/amis-core/src/Root.tsx`：根渲染器仍把 `theme.classPrefix` 下发为组件 `classPrefix`，使 FormItem 控件继续生成旧 `cxd-*` 根类。
- `packages/amis-core/src/theme.tsx`：`getClassPrefix()` 和 `themeable()` 暴露旧 `classPrefix`，而不是稳定 `componentClassPrefix`。
- `packages/amis-core/src/components/Overlay.tsx`：portal 子节点外层新增主题 scope wrapper，改变弹层定位时的 `offsetParent`。

## 3. 修复方案

- `Root` 下发 `theme.componentClassPrefix || 'amis-'`，保留 `theme.classnames` 继续负责主题 classnames 策略。
- `getClassPrefix()` 与 `themeable()` 统一暴露稳定组件前缀。
- `Overlay` 将 `data-amis-theme` 直接加到 `Position` 子节点上，并移除额外 wrapper，保持 portal 子节点原有布局结构。
- 更新 theme / Overlay 单测，补充“Overlay 不插入布局 wrapper”的回归用例。
- 更新 Options、InputColor、InputArray、InputMonthRange、Number 相关测试选择器和快照，验证新稳定 DOM 前缀。

## 4. 改动文件清单

- `packages/amis-core/src/Root.tsx`
- `packages/amis-core/src/theme.tsx`
- `packages/amis-core/src/components/Overlay.tsx`
- `packages/amis-core/__tests__/theme.test.ts`
- `packages/amis-core/__tests__/components/Overlay.test.tsx`
- `packages/amis/__tests__/renderers/Form/color.test.tsx`
- `packages/amis/__tests__/renderers/Form/inputArray.test.tsx`
- `packages/amis/__tests__/renderers/Form/inputMonthRange.test.tsx`
- `packages/amis/__tests__/renderers/Form/number.test.tsx`
- `packages/amis/__tests__/renderers/Form/__snapshots__/inputArray.test.tsx.snap`
- `packages/amis/__tests__/renderers/Form/__snapshots__/inputMonthRange.test.tsx.snap`
- `packages/amis/__tests__/renderers/Form/__snapshots__/number.test.tsx.snap`
- `packages/amis/__tests__/renderers/Form/__snapshots__/options.test.tsx.snap`

## 5. 验证结果

- 单测快照刷新：`npx jest packages/amis/__tests__/renderers/Form/options.test.tsx packages/amis/__tests__/renderers/Form/color.test.tsx packages/amis/__tests__/renderers/Form/inputArray.test.tsx packages/amis/__tests__/renderers/Form/inputMonthRange.test.tsx packages/amis/__tests__/renderers/Form/number.test.tsx --config packages/amis/package.json --runInBand -u` 通过，更新 18 个快照。
- 单测复验：`npx jest packages/amis/__tests__/renderers/Form/options.test.tsx packages/amis/__tests__/renderers/Form/color.test.tsx packages/amis/__tests__/renderers/Form/inputArray.test.tsx packages/amis/__tests__/renderers/Form/inputMonthRange.test.tsx packages/amis/__tests__/renderers/Form/number.test.tsx --config packages/amis/package.json --runInBand` 通过，27 个测试和 18 个快照通过。
- 单测复验：`npx jest packages/amis-core/__tests__/theme.test.ts packages/amis-core/__tests__/components/Overlay.test.tsx --config packages/amis-core/package.json --runInBand` 通过，18 个测试通过。
- 选择器守卫：`node packages/amis-ui/scripts/checkThemeSelectors.js` 通过，`1503 legacy baseline match(es), 0 new violation(s)`。
- 空白检查：`git diff --check` 通过。
- 浏览器验证：通过本地 CDP 检查 `options`、`input-color`、`input-array`、`input-month-range` 四页，控件根类已为 `amis-*`，`badControls: []`。
- 浏览器验证：`options` 弹层 offsetParent 为 `.amis-Select is-opened is-focused has-popover`，`input-color` 弹层 offsetParent 为 `.amis-ColorPicker is-focused is-opened has-popover`。
- 视觉对照：与 `8889` 基线服务对比，相关控件宽高和弹层宽高一致；截图保存在 `/private/tmp/amis-visual-regression/`。

## 6. 遗留事项

- 文档站局部内容纵向位置与基线仍有差异，但不属于本次用户点名的控件样式/弹层定位回归修复范围；如需追平，应另开文档布局专项。
- 本次没有实现 `.cxd-*` DOM 兼容层；当前路线仍是稳定 `amis-*` DOM 前缀为主。
