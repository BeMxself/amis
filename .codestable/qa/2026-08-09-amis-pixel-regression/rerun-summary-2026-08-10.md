# amis 像素回归复跑摘要

日期：2026-08-10
分支：`refactor-theme-system`
Baseline：`http://127.0.0.1:8889`，merge-base `43a33ee06`
Candidate：`http://127.0.0.1:8888`

## 执行口径

- 页面清单：`.codestable/qa/2026-08-09-amis-pixel-regression/page-manifest.json`
- 覆盖范围：文档、组件、样式、示例四个页签，共 372 个 active routes。
- 首轮输出：`.gstack/visual-regression/full-2026-08-10-rerun/`
- ERROR 复跑输出：`.gstack/visual-regression/full-2026-08-10-rerun-errors-retry/`
- ERROR 复跑清单：`.gstack/visual-regression/full-2026-08-10-rerun/error-retry-manifest.json`

## 结果

- 首轮：`323 pass / 5 warn / 3 fail / 4 error / 37 content-drift`
- ERROR 复跑：`4 pass / 0 warn / 0 fail / 0 error / 0 content-drift`
- 最终有效口径：`327 pass / 5 warn / 3 fail / 0 error / 37 content-drift`

## 点名页面

- `/zh-CN/components/form/options`：PASS
- `/zh-CN/components/form/input-color`：PASS
- `/zh-CN/components/form/input-array`：PASS
- `/zh-CN/components/form/input-month-range`：PASS

## 剩余 FAIL

- `/zh-CN/components/form/input-tree`：max diff ratio `0.0360`
- `/zh-CN/components/property`：max diff ratio `0.0314`
- `/examples/iframe`：max diff ratio `0.0131`

## 剩余 WARN

- `/zh-CN/docs/concepts/linkage`：max diff ratio `0.0011`
- `/zh-CN/docs/concepts/event-action`：max diff ratio `0.0011`
- `/zh-CN/components/form/condition-builder`：max diff ratio `0.0006`
- `/zh-CN/components/search-box`：max diff ratio `0.0010`
- `/examples/crud/keyboards`：max diff ratio `0.0014`

## 备注

- `content-drift` 共 37 页，runner 判定原因均为文本内容漂移，主要集中在文档正文、CRUD/动态数据、轮播和服务加载示例。
- 与早期 `370 fail` 的大面积回归相比，本次复跑没有复现主题作用域 wrapper 导致的系统性布局破坏。

## FAIL follow-up

- 3 个 FAIL 已完成根因审查和 runner 修复，记录见 `.codestable/qa/2026-08-09-amis-pixel-regression/fail-review-fix-2026-08-10.md`。
- 修复后单 worker 与 `--workers 3` 并发复跑 3 页均为 `3 pass / 0 warn / 0 fail / 0 error / 0 content-drift`。
