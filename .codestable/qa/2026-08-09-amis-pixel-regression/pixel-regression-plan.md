# amis 全站像素级回归测试方案

生成时间：2026-08-09T07:32:08.958Z
当前分支：refactor-theme-system
Baseline 服务：http://127.0.0.1:8889（重构前 merge-base `43a33ee06`，worktree `.worktrees/theme-baseline`）
Candidate 服务：http://127.0.0.1:8888（当前 `refactor-theme-system`）
页面清单：./page-manifest.md
机器清单：./page-manifest.json
执行 runner：./run-pixel-regression.cjs

## 1. 核心结论

本轮像素回归的页面全集不手写，直接从四个页签的导航配置生成：文档 28 页、组件 155 页、样式 62 页、示例 127 页，合计 372 个 active routes。注释掉的示例 path 不算有效页面，不进入 gate。

## 2. 覆盖范围

| 页签 | 页面数 | 导航来源 | 起始路由 |
|---|---:|---|---|
| 文档 | 28 | `examples/components/DocNavCN.ts` | `/zh-CN/docs/index` |
| 组件 | 155 | `examples/components/Components.tsx` | `/zh-CN/components/page` |
| 样式 | 62 | `examples/components/CssDocs.tsx` | `/zh-CN/style/index` |
| 示例 | 127 | `examples/components/Example.jsx` | `/examples/index` |
| **合计** | **372** | 4 个页签 | - |

## 3. 对比拓扑

必须用双服务对比，而不是在同一个目录里来回切分支：

1. **baseline 服务**：从目标基线分支或最后确认视觉正确的 commit 建 worktree，启动在 `127.0.0.1:8889`。本轮使用 `master...HEAD` 的 merge-base `43a33ee06`，即主题系统重构前状态。
2. **candidate 服务**：当前 `refactor-theme-system` 分支，启动在 `127.0.0.1:8888`。
3. **同一浏览器上下文顺序采集**：同一个 Playwright worker 对同一个 route 先采 baseline，再采 candidate，减少浏览器字体、DPR、GPU 栅格化差异。
4. **不使用线上页面做 baseline**：线上资源、CDN、接口和字体版本不可控，只能作为人工参照，不作为阻塞 gate。

## 4. 环境固定

- 浏览器：Chromium 固定版本，`deviceScaleFactor: 1`，viewport 主档 `1440x900`。
- 本地状态：每页导航前清理 storage，然后写入 `amis-theme=cxd`、`amis-viewMode=pc`、`amis-locale=zh-CN`。
- 时间与随机数：通过 `addInitScript` 固定 `Date.now`、`new Date()` 和 `Math.random`。
- 动画：注入全局 CSS 禁用 transition / animation / caret blink，并设置 `prefers-reduced-motion`。
- 字体：等待 `document.fonts.ready`；CI 机器必须固定系统字体或使用容器镜像。
- 网络：只允许本地 mock / Vite chunk 请求；外链图片、iframe、视频默认 mask 或标记为 non-blocking。

## 5. 页面稳定等待

每个 route 必须先进入稳定态再截图，不允许滚动完立刻截图：

1. `page.goto(url, {waitUntil: 'domcontentloaded'})`。
2. 等待 React/Suspense fallback 消失：无明显 `.amis-Spinner`、`.amis-Spinner-overlay`、`.amis-Loading`。
3. 等待字体和图片：`document.fonts.ready`，并确认当前 viewport 内图片 `complete && naturalWidth > 0`。
4. 等待布局稳定：连续 3 次采样 `document.scrollingElement.scrollHeight`、`clientWidth`、`clientHeight`，间隔 250ms，数值一致才继续。
5. 再等待 2 个 `requestAnimationFrame` + 500ms，给 mock 数据、图表 resize、代码高亮和 lazy component 收尾。
6. 如果页面有新增 console error，记录但继续采集，最后由 report 聚合。

## 6. 长滚动截图策略

长页面不直接依赖 `fullPage: true`。它容易遇到浏览器最大纹理限制、fixed header 重复、lazy render 没跟上等问题。主策略是 viewport chunk：

1. 先在 `scrollY=0` 稳定后读取 `scrollHeight`。
2. 截图步长：`step = viewportHeight - 120`，保留 120px overlap 用来发现 sticky header / 断层位移。
3. y 序列：`0, step, 2*step, ... maxScroll`，最后强制包含 `maxScroll = scrollHeight - viewportHeight`。
4. 每次 `scrollTo(0, y)` 后执行稳定等待：至少 700ms + 2 rAF + scrollHeight 两次一致；如果发现图片或图表仍在变化，最多重试 3 秒。
5. 只截当前 viewport，不拼接成长图；按 `route/theme/viewport/chunkIndex/y` 单独比较。
6. 如果 chunk diff 超阈值，延迟 1000ms 重拍该 chunk 一次；两次都超阈值才标红，降低 lazy render 抖动。
7. 对特别长页面设置保护：chunk 数超过 80 时仍全量采，但 report 单独标记为 long-page，方便人工优先看最大 diff cluster。

## 7. Pixel Diff 判定

- 比较单位：route + theme + viewport + chunk。
- 工具建议：Playwright screenshot + `pixelmatch` / `pngjs`，阈值 `threshold=0.1`。
- 阻塞阈值：单 chunk diff ratio > 0.30% 或单个连续 diff cluster > 40x40 px。
- 警告阈值：0.05% - 0.30%，进入人工复核。
- 自动忽略：1px 抗锯齿边缘、滚动条轨道差异、被配置 mask 的动态区域。
- 主题系统专项：表单控件、浮层、header/theme selector、PopUp/Drawer/Dialog 相关 diff 默认不降级，必须人工确认。

## 8. 动态区域和特殊组件

- Monaco / code editor：mask 光标和当前行闪烁区域；代码块高亮必须保留比较。
- ECharts / canvas：等待图表容器尺寸稳定；仍抖动时 mask canvas 内部，但保留容器、标题、legend、工具栏比较。
- Video / audio / iframe：默认 mask 媒体画面，保留控件边框和布局比较。
- 表格 / CRUD：等待 mock API 完成和空 loading 消失；滚动类表格只比较初始 viewport 和页面纵向 chunk，不强制内部横向滚动。
- 浮层类页面：除页面静态截图外，给 Options、Select、InputColor、日期/月范围等组件增加 interaction shot，打开下拉/弹层后再比较 portal root。

## 9. 执行分层

1. **Route health pass**：遍历 372 个 URL，确认不是 404、无崩溃、能进入稳定态。
2. **Default visual pass**：372 个 URL × cxd × desktop，全量 chunk pixel diff，作为阻塞 gate。
3. **Theme matrix pass**：全量 URL × dark/antd/ang 可作为 nightly；本轮主题系统重构建议至少 dark 全量，antd/ang 可按风险分批。
4. **Interaction pass**：覆盖下拉、PopUp、Dialog、Drawer、日期/颜色/树/选择类控件，不靠静态页面截图替代。
5. **Manual review pack**：输出 diff 最大的前 50 个 chunk、所有超过阻塞阈值的 chunk、以及用户点名页面。

## 10. 产物结构

```
.gstack/visual-regression/<run-id>/
├── manifest.json                  # route/theme/viewport/chunk 明细
├── route-health.json              # 372 个页面加载状态和 console errors
├── baseline/<route-key>/...png
├── candidate/<route-key>/...png
├── diff/<route-key>/...png
├── report.md
└── report.html                    # 缩略图、diff ratio、跳转链接
```

## 10.1 当前 runner

已落地可执行脚本：`run-pixel-regression.cjs`。它直接读取 `page-manifest.json`，按 route 打开 baseline / candidate 两个服务，逐个滚动 chunk 截图，并用 `pixelmatch` 输出 diff。

依赖不写入项目 `package.json`，安装在临时目录：

```bash
mkdir -p /tmp/amis-visual-regression-deps
npm install --prefix /tmp/amis-visual-regression-deps playwright@1.62.1 pixelmatch pngjs
```

smoke 命令：

```bash
AMIS_VISUAL_NODE_MODULES=/tmp/amis-visual-regression-deps/node_modules \
  node .codestable/qa/2026-08-09-amis-pixel-regression/run-pixel-regression.cjs \
  --baseline http://127.0.0.1:8889 \
  --candidate http://127.0.0.1:8888 \
  --limit 2 \
  --max-chunks 2 \
  --out .gstack/visual-regression/smoke-2026-08-09-theme
```

全量命令：

```bash
AMIS_VISUAL_NODE_MODULES=/tmp/amis-visual-regression-deps/node_modules \
  node .codestable/qa/2026-08-09-amis-pixel-regression/run-pixel-regression.cjs \
  --baseline http://127.0.0.1:8889 \
  --candidate http://127.0.0.1:8888 \
  --no-retry \
  --workers 3 \
  --out .gstack/visual-regression/full-2026-08-09-theme-r3
```

## 11. 漏页防线

- 每次运行前重新从 4 个导航配置解析 route，不依赖旧 manifest。
- 将解析结果与 `page-manifest.json` 比较；新增/删除 route 时，测试报告必须显式列出 manifest drift。
- 每个 route 记录 `tab`、`breadcrumb`、`source`、`path`、`url`，方便定位遗漏来自哪个页签。
- 注释里的 path 不计入 active routes，避免把废弃页面误当失败。

## 12. 当前已完成

- 当前 candidate dev server 已启动：http://127.0.0.1:8888
- 当前 baseline dev server 已启动：http://127.0.0.1:8889
- 探活页面：http://127.0.0.1:8888/zh-CN/components/form/options 与 http://127.0.0.1:8889/zh-CN/docs/index 返回 HTTP 200。
- 完整 active route manifest 已生成：`page-manifest.md` / `page-manifest.json`。
- smoke 对比已跑通：`/zh-CN/docs/index`、`/zh-CN/docs/start/getting-started` 各 2 个滚动块，产物在 `.gstack/visual-regression/smoke-2026-08-09-theme`。
- 第一轮 full run 在第 8 个长文档页中止，原因是所有超阈值 chunk 都会二次重拍，重构前后差异大时成本翻倍；runner 已补 `--no-retry`。
- 第二轮顺序 full run 在 51/372 中止，原因是单 worker 总耗时仍偏高；runner 已补 `--workers` 页级并发。全量改用 `full-2026-08-09-theme-r3`，每个页面内部仍顺序滚动并等待稳定。
- 第三轮 full run 已完成：`.gstack/visual-regression/full-2026-08-09-theme-r3`，372/372 页面均有结果。首轮统计为 Pass 2、Fail 342、Error 28。
- 首轮 28 个 Error 已单独复跑：`.gstack/visual-regression/retry-errors-2026-08-09-theme-r3`，28/28 均转为 Fail，Error 归零。最终可审查结论按 Pass 2、Fail 370、Error 0 处理。
- 复跑过程中发现 18 个示例 event route 在原始清单中缺少前导 `/`，已修正 `page-manifest.json` / `page-manifest.md`，并在 runner 内统一规范化 `page.path` 与 `--path`。
- 本次执行摘要见 `run-summary.md`。

### RCA follow-up 结果：Root scope layout-neutral

- 已确认并修复 `ThemeScopeRoot` 额外 wrapper 导致的 `schema-wrapper > .amis-Page` 直接子节点和 Flex 宽度回归。
- Root 作用域现在附着真实宿主根节点，主题切换时更新 `data-amis-theme`，不新增布局层，也不恢复 `.cxd-*` SCSS 兼容层。
- 示例页签 127 页复测：`103 pass / 1 warn / 1 fail / 22 content-drift / 0 error`。
- 剩余高差异页面已抽样确认是验证码、轮播、异步接口或随机数据时序；后续应建立动态内容专用基线，不通过主题 wrapper 或旧前缀兼容掩盖。
