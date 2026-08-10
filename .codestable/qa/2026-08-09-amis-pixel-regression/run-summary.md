# amis 像素回归执行摘要

日期：2026-08-09
分支：`refactor-theme-system`
Baseline：`http://127.0.0.1:8889`，merge-base `43a33ee06`
Candidate：`http://127.0.0.1:8888`

## 覆盖结论

- 页面清单来自四个导航配置，不手写：文档 28、组件 155、样式 62、示例 127，合计 372 个 active routes。
- 全量运行目录：`.gstack/visual-regression/full-2026-08-09-theme-r3`。
- 首轮结果：372/372 有结果，Pass 2、Fail 342、Error 28。
- Error 复跑目录：`.gstack/visual-regression/retry-errors-2026-08-09-theme-r3`。
- 复跑结果：28/28 均转为 Fail，Error 0。
- 最终可审查口径：Pass 2、Fail 370、Warn 0、Error 0。

## 主要发现

- 视觉差异是系统性的，不是少量页面波动；文档、组件、样式、示例四个页签都大面积 FAIL。
- Diff 最大的首批页面集中在 Grid 2D、可视化编辑器文档、样式文档、Log、基础布局/背景色工具页。
- 用户点名页面均已覆盖并产出截图：Options、InputColor、InputArray、InputMonthRange，四个页面均为 FAIL。
- 首轮 18 个示例 event route 报错来自测试清单缺少前导 `/`，已修正 manifest 和 runner 路径归一化，不计为产品页面不可用。
- 首轮 10 个组件 ERROR 复跑后全部转为 FAIL，说明是采集时导航上下文抖动，不是页面无法访问。

## 重点产物

- 方案与执行说明：`.codestable/qa/2026-08-09-amis-pixel-regression/pixel-regression-plan.md`
- 完整页面清单：`.codestable/qa/2026-08-09-amis-pixel-regression/page-manifest.md`
- 机器页面清单：`.codestable/qa/2026-08-09-amis-pixel-regression/page-manifest.json`
- 截图 runner：`.codestable/qa/2026-08-09-amis-pixel-regression/run-pixel-regression.cjs`
- 首轮报告：`.gstack/visual-regression/full-2026-08-09-theme-r3/report.md`
- 首轮机器结果：`.gstack/visual-regression/full-2026-08-09-theme-r3/results.json`
- Error 复跑报告：`.gstack/visual-regression/retry-errors-2026-08-09-theme-r3/report.md`

## 后续建议

- 先不要逐页修视觉差异；优先审查 token 映射、基础 spacing/color/border、组件容器和 overlay/portal 边界。
- 对 Options、InputColor、InputArray、InputMonthRange 做人工截图 review，确认是否与此前手工观察一致。
- 在修复一轮基础样式后重跑同一 manifest，比较 Fail 总数和 Top Diff Chunks 是否明显下降。

## RCA follow-up：Root scope wrapper

- 根因：`ThemeScopeRoot` 的额外 `<div data-amis-theme>` 插入 `schema-wrapper` 与 `.amis-Page` 之间，破坏 examples 的直接子节点选择器和 Flex 宽度分配。
- 修复：移除 Root wrapper，由 `RootRenderer` 将当前 `data-amis-theme` 直接应用到真实宿主根节点，并在主题更新时同步属性；未恢复 `.cxd-*` SCSS 兼容层。
- 单测：`packages/amis-core/__tests__` 17 个 suite、169 个测试通过；factory snapshot 已更新以包含 Root scope 属性。
- 定向页面：`/examples/form/fieldset` 和 `/examples/form/tabs` 双服务截图均通过。
- 示例页签复测：127 页，`103 pass / 1 warn / 1 fail / 22 content-drift / 0 error`，报告位于 `.gstack/visual-regression/examples-2026-08-09-root-scope-fixed/`。
- 剩余大差异已抽样归因于验证码动态图、轮播时序、异步服务数据或随机表格数据，不再归入 Root scope 布局回归。
