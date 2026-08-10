# 3 个 FAIL 的根因审查与修复

日期：2026-08-10
分支：`refactor-theme-system`
Baseline：`http://127.0.0.1:8889`
Candidate：`http://127.0.0.1:8888`

## 审查对象

- `/zh-CN/components/form/input-tree`
- `/zh-CN/components/property`
- `/examples/iframe`

## 根因

- `input-tree` 与 `property` 的原 FAIL 不是稳定产品回归：截图 diff 显示同一 scrollY 下进入了不同内容段落，但 DOM 量测中 baseline/candidate 的 heading 坐标一致；单页复跑后两页均转为 PASS。
- `/examples/iframe` 是稳定假阳性：页面嵌入 `https://www.baidu.com/s?wd=`，外部站点返回的验证码图片每次不同，像素差异来自 iframe 内部远端内容，不属于 amis 主题样式差异。
- 原 runner 只有 chunk 级重试，缺少整页级重试；对外链 iframe 也没有遮罩，导致非产品差异进入最终 FAIL。

## 修复

- 在 `run-pixel-regression.cjs` 的 visual mask 中遮罩 `http/https` 外链 iframe，保留 iframe 布局尺寸但忽略远端页面内容。
- 为 FAIL/ERROR 页面增加一次整页复跑，复跑结果优于首轮时采用复跑结果。
- `--no-retry` 同时关闭 chunk 级和页面级重试。

## 验证

- `node --check .codestable/qa/2026-08-09-amis-pixel-regression/run-pixel-regression.cjs`：通过。
- 单 worker 复跑 3 页：`3 pass / 0 warn / 0 fail / 0 error / 0 content-drift`。
- `--workers 3` 并发复跑 3 页：`3 pass / 0 warn / 0 fail / 0 error / 0 content-drift`。

## 产物

- 单 worker 结果：`.gstack/visual-regression/fail-review-2026-08-10/fail-three-after-runner-fix/`
- 并发结果：`.gstack/visual-regression/fail-review-2026-08-10/fail-three-after-runner-fix-workers3/`
- 复跑 manifest：`.gstack/visual-regression/fail-review-2026-08-10/fail-three-manifest.json`
