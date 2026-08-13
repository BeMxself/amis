# amis 全站像素级回归测试方案

生成时间：2026-08-09T07:32:08.958Z
最后更新：2026-08-13（补充 React 19 兼容重构、组件替换、交互浮层截图和启动预热 runbook）
当前分支：`codex/react-dom-legacy-refactor`
Baseline 服务：http://127.0.0.1:8889（固定目标 commit `43a33ee0` / `43a33ee06699`）
Candidate 服务：http://127.0.0.1:8888（当前 `codex/react-dom-legacy-refactor`）
页面清单：./page-manifest.md
机器清单：./page-manifest.json
执行 runner：./run-pixel-regression.cjs

## 1. 核心结论

本轮像素回归的页面全集不手写，直接从四个页签的导航配置生成：文档 28 页、组件 155 页、样式 62 页、示例 127 页，合计 372 个 active routes。注释掉的示例 path 不算有效页面，不进入 gate。

2026-08-13 更新后的 gate 不再只看静态页面截图。React 19 兼容迁移、`react-transition-group` 显式 `nodeRef`、`@rc-component/*` 替换、`react-player` 视频适配、`@uiw/react-json-view` 替换、Froala/TinyMCE/Markdown/ECharts 升级都会影响点击、悬停、focus 后出现的菜单、浮层、portal、遮罩、过渡态和控件内交互。因此全站静态截图仍是基础 pass，交互截图 pass 是本轮必须执行的专项 pass。

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

1. **baseline 服务**：从固定目标 commit `43a33ee0` 建 worktree，启动在 `127.0.0.1:8889`。不要改用当前 merge-base；本轮用户指定的对比目标就是 `43a33ee0`。
2. **candidate 服务**：当前 `codex/react-dom-legacy-refactor` 分支，启动在 `127.0.0.1:8888`。
3. **同一浏览器上下文顺序采集**：同一个 Playwright worker 对同一个 route 先采 baseline，再采 candidate，减少浏览器字体、DPR、GPU 栅格化差异。
4. **不使用线上页面做 baseline**：线上资源、CDN、接口和字体版本不可控，只能作为人工参照，不作为阻塞 gate。

## 4. 环境固定

- 浏览器：Chromium 固定版本，`deviceScaleFactor: 1`，viewport 主档 `1440x900`。
- 本地状态：每页导航前清理 storage，然后写入 `amis-theme=cxd`、`amis-viewMode=pc`、`amis-locale=zh-CN`。
- 时间与随机数：通过 `addInitScript` 固定 `Date.now`、`new Date()` 和 `Math.random`。
- 动画：注入全局 CSS 禁用 transition / animation / caret blink，并设置 `prefers-reduced-motion`。
- 字体：等待 `document.fonts.ready`；CI 机器必须固定系统字体或使用容器镜像。
- 网络：只允许本地 mock / Vite chunk 请求；外链图片、iframe、视频默认 mask 或标记为 non-blocking。

### 4.1 启动流程

启动流程本身要可复现，避免把 Vite 首次编译、依赖安装漂移或端口串线误判为视觉差异。

1. 从主仓库目录创建固定 baseline worktree：

   ```bash
   cd /Users/songmingxu/Projects/amis
   git worktree add .worktrees/react19-baseline-43a33ee0 43a33ee0
   ```

2. 分别在 baseline 和 candidate worktree 安装依赖。依赖安装必须以各自 lockfile 为准，不能让 baseline 复用 candidate 的 `node_modules`：

   ```bash
   cd /Users/songmingxu/Projects/amis/.worktrees/react19-baseline-43a33ee0
   npm ci

   cd /Users/songmingxu/Projects/amis/.worktrees/react-dom-legacy-refactor
   npm ci
   ```

   如果本地为了节省时间使用已有 `node_modules`，报告必须记录这一点，并附 `git rev-parse HEAD`、`npm ls --depth=0` 的摘要，避免之后把环境差异当成代码差异。

3. 启动 baseline 服务，固定端口并开启 strict port：

   ```bash
   cd /Users/songmingxu/Projects/amis/.worktrees/react19-baseline-43a33ee0
   npm run start -- --host 127.0.0.1 --port 8889 --strictPort
   ```

4. 启动 candidate 服务，固定端口并开启 strict port：

   ```bash
   cd /Users/songmingxu/Projects/amis/.worktrees/react-dom-legacy-refactor
   npm run start -- --host 127.0.0.1 --port 8888 --strictPort
   ```

5. 两个服务都出现 Vite local URL 后，再做 HTTP 探活。只要任一服务未 ready，就不要启动截图 runner：

   ```bash
   curl -fsS http://127.0.0.1:8889/zh-CN/docs/index >/dev/null
   curl -fsS http://127.0.0.1:8888/zh-CN/docs/index >/dev/null
   ```

6. 记录本次运行元信息：baseline commit、candidate commit、Node/npm 版本、浏览器路径、viewport、theme、时区、启动命令、是否重用 `node_modules`。

### 4.2 服务预热

Vite 首次访问会触发依赖预构建、路由 chunk 编译、lazy component import 和样式注入。预热必须用浏览器访问完成，单独 `curl` 只能证明 HTTP 可达，不能证明前端 chunk 已稳定。

1. 端口 ready 后，先等待 10 秒，给 Vite dependency optimization 和首批 transform 留出缓冲。
2. 用同一个 Chromium 版本分别访问 baseline 和 candidate 的预热路由。建议固定顺序如下：

   | 预热路由 | 目的 |
   |---|---|
   | `/zh-CN/docs/index` | 基础文档页、导航、Markdown |
   | `/zh-CN/components/page` | amis renderer 基础页面和样式入口 |
   | `/zh-CN/components/form/select` | 下拉、portal、选项列表 |
   | `/zh-CN/components/nav` | @rc-component/menu、submenu、overflow |
   | `/zh-CN/components/dialog` | Modal、transition、mask、portal |
   | `/zh-CN/components/drawer` | Drawer、body scroll lock、transition |
   | `/zh-CN/components/table` | 表格、筛选、横向/纵向滚动 |
   | `/zh-CN/components/chart` | ECharts lazy import、canvas、tooltip |
   | `/zh-CN/components/video` | react-player lazy import、media controls |
   | `/zh-CN/components/form/input-rich-text` | Froala/TinyMCE lazy import、toolbar/dialog |
   | `/zh-CN/components/json` | @uiw/react-json-view lazy import |

3. 每个预热路由至少等待第 5 节稳定条件，再额外等待 1000ms。Chart、Video、RichText、JSON 这类 lazy 第三方组件额外等待 3000ms。
4. 预热完成后再等待 15 秒，并重复访问 `/zh-CN/docs/index` 与 `/zh-CN/components/form/select`。如果第二次访问仍出现明显 chunk 编译等待、长时间 spinner 或新增 console error，需要继续预热或先修复启动问题。
5. 预热必须 baseline 与 candidate 都执行，且顺序一致。只预热 candidate 会让 baseline 首次截图承担编译成本，造成非代码差异。

### 4.3 启动失败和重试规则

- 端口 ready 超时：180 秒。超时后停止本轮，不进入截图阶段。
- 任一服务返回 404、HTML 不是 amis 示例应用、或进入错误 overlay：标记为环境失败，不做视觉判定。
- 任一预热路由在 60 秒内无法达到第 5 节稳定条件：记录 route、console errors、network failures，并把该 route 标记为 `startup-blocked`。
- baseline 和 candidate 依赖安装方式不一致时，允许继续 smoke，但 full run 结果只能作为参考，不可作为阻塞 gate。
- 如果端口已被占用，必须换一组端口并同时更新 runner 参数；不能让 baseline/candidate 轮流占同一端口。

### 4.4 进程、日志和运行身份

每次对比都要有稳定 run id，便于把截图、日志、服务状态和人工判定绑定到同一次运行。

1. run id 格式建议：`react19-compat-<baseline-short>-<candidate-short>-<YYYYMMDD-HHMM>`。示例：`react19-compat-43a33ee06699-d7bab17f9abc-20260813-1530`。
2. 产物目录先创建，再启动服务；服务日志也写入同一个 run id 下：

   ```bash
   RUN_ID=react19-compat-43a33ee06699-$(git rev-parse --short=12 HEAD)-$(date +%Y%m%d-%H%M)
   OUT_DIR=/Users/songmingxu/Projects/amis/.gstack/visual-regression/$RUN_ID
   mkdir -p "$OUT_DIR/logs"
   ```

3. 启动前确认 baseline 和 candidate 指向正确代码，结果写入 `run-env.txt`：

   ```bash
   {
     echo "baseline=$(git -C /Users/songmingxu/Projects/amis/.worktrees/react19-baseline-43a33ee0 rev-parse --short=12 HEAD)"
     echo "candidate=$(git -C /Users/songmingxu/Projects/amis/.worktrees/react-dom-legacy-refactor rev-parse --short=12 HEAD)"
     echo "candidate_status=$(git -C /Users/songmingxu/Projects/amis/.worktrees/react-dom-legacy-refactor status --short | wc -l | tr -d ' ') files dirty"
     node -v
     npm -v
     date
   } > "$OUT_DIR/run-env.txt"
   ```

   `baseline` 必须等于 `43a33ee06699`。candidate 允许有未提交文档改动，但报告必须记录 dirty 文件列表；如果有源码未提交改动，full run 只能对应当前工作区状态，不能宣称代表某个纯 commit。

4. 服务可以在两个独立终端里启动；如果使用后台进程，必须记录 PID，并把 stdout/stderr 写入日志：

   ```bash
   cd /Users/songmingxu/Projects/amis/.worktrees/react19-baseline-43a33ee0
   npm run start -- --host 127.0.0.1 --port 8889 --strictPort > "$OUT_DIR/logs/baseline-vite.log" 2>&1 &
   echo $! > "$OUT_DIR/logs/baseline-vite.pid"

   cd /Users/songmingxu/Projects/amis/.worktrees/react-dom-legacy-refactor
   npm run start -- --host 127.0.0.1 --port 8888 --strictPort > "$OUT_DIR/logs/candidate-vite.log" 2>&1 &
   echo $! > "$OUT_DIR/logs/candidate-vite.pid"
   ```

5. 停止服务时只停止本轮记录的 PID。不要用宽泛的 `killall node` 或清理所有 Vite 进程，避免误杀其他工作区任务。

### 4.5 启动前检查清单

进入截图 runner 前，以下检查必须全部通过：

- `baseline` commit 是 `43a33ee06699`，candidate commit 和 dirty 状态已写入 `run-env.txt`。
- 端口 8888/8889 分别只对应本轮 candidate/baseline 服务。
- 两个服务的 `/zh-CN/docs/index` HTTP 探活通过，且浏览器访问不是 Vite error overlay。
- 第 4.2 节预热路由已经在 baseline 与 candidate 各跑一遍，且顺序一致。
- `AMIS_VISUAL_NODE_MODULES` 指向的临时依赖目录存在，并能解析 `playwright`、`pixelmatch`、`pngjs`。
- 输出目录为空或是本轮新建目录；不要把新结果写入旧 run id。

## 5. 页面稳定等待

每个 route 必须先进入稳定态再截图，不允许滚动完立刻截图：

1. `page.goto(url, {waitUntil: 'domcontentloaded'})`。
2. 等待 React/Suspense fallback 消失：无明显 `.amis-Spinner`、`.amis-Spinner-overlay`、`.amis-Loading`。
3. 等待字体和图片：`document.fonts.ready`，并确认当前 viewport 内图片 `complete && naturalWidth > 0`。
4. 等待布局稳定：连续 3 次采样 `document.scrollingElement.scrollHeight`、`clientWidth`、`clientHeight`，间隔 250ms，数值一致才继续。
5. 再等待 2 个 `requestAnimationFrame` + 500ms，给 mock 数据、图表 resize、代码高亮和 lazy component 收尾。
6. 如果页面有新增 console error，记录但继续采集，最后由 report 聚合。

### 5.1 截图前最后确认

每张截图前都做一次轻量确认，尤其是交互截图：

- 当前 URL 必须与 manifest route 匹配，不能停留在上一页、错误页或登录页。
- `document.readyState === 'complete'`，并且最近 500ms 没有新增 layout-affecting 图片加载。
- 页面内没有覆盖主体内容的 Vite error overlay、React error boundary、全屏 loading 或 toast error。
- 对 portal 浮层，确认 trigger 和 popup 都在截图区域内；如果 popup 超出 viewport，先记录为潜在 bug，不要为了截图强行滚动修正。
- 对 hover/click 交互，触发后至少等待 popup visible + 2 rAF + 300ms；如果等待后仍没有 popup，截图失败态并标记为 `bug` 或 `needs-review`。

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

- 比较单位：静态截图为 route + theme + viewport + chunk；交互截图为 case id + trigger state + theme + viewport。
- 工具建议：Playwright screenshot + `pixelmatch` / `pngjs`，阈值 `threshold=0.1`。
- 阻塞阈值：单 chunk diff ratio > 0.30% 或单个连续 diff cluster > 40x40 px。
- 警告阈值：0.05% - 0.30%，进入人工复核。
- 自动忽略：1px 抗锯齿边缘、滚动条轨道差异、被配置 mask 的动态区域。
- 人工结论必须分为三类：`expected-visual-drift`、`needs-review`、`bug`。超过阈值不自动等于 bug，低于阈值也不能自动通过高风险交互。

### 7.1 可以接受的差异

这些差异可以标记为 `expected-visual-drift`，但报告中必须写明原因和截图位置，不能只写“像素差异可忽略”：

- 字体抗锯齿、canvas/SVG 边缘、阴影羽化产生的 1-2px 边缘差异，且组件内容、尺寸和状态一致。
- 过渡动画禁用或等待稳定后仍存在的极小 transform / opacity 舍入差异，且浮层位置没有影响可用性。
- ECharts 6 在保留 v5 主题后产生的 canvas 抗锯齿差异，前提是 series 数量、legend、坐标轴、tooltip 和数据形态一致。
- 动态内容造成的差异，例如时间戳、随机验证码、光标闪烁、输入 caret、加载 spinner 某一帧、外链媒体画面；这些区域应优先 mask。
- 第三方组件内部 DOM class 或无障碍属性顺序变化导致的不可见差异，前提是截图可见层、交互行为和键盘路径一致。

### 7.2 必须当作 bug 的差异

这些差异即使 pixel ratio 不高，也必须标记为 `bug` 或至少 `needs-review`，不能按阈值自动放过：

- 点击、悬停或 focus 后浮层没有出现、出现后立即关闭、不能保持 enterable、不能二级展开或不能选中。
- 浮层挂载容器错误，导致 z-index 被遮挡、被父容器裁剪、滚动时脱离 trigger、遮罩盖错范围或 body scroll lock 异常。
- 菜单/选项/工具栏项缺失、重复、顺序明显变化、选中态/hover 态错误、禁用态失效。
- Modal / Drawer / PopUp 初始隐藏、打开、关闭、unmountOnExit、mask、焦点陷阱、Esc/外部点击关闭任一行为与 baseline 不一致。
- Table / CRUD 的筛选、列设置、quickEdit、批量操作浮层位置错乱，或在横向/纵向滚动后仍指向旧坐标。
- Chart tooltip 不出现、legend 点击失效、series 缺失、`type: 'wordCloud'` 不渲染或词云布局严重偏离。
- Video 控件不可见、不可点击、hover 后 controls 未出现、poster/play/loading 状态和 baseline 能力不一致。
- RichText 工具栏、下拉菜单、颜色面板、链接/图片弹窗缺失或被裁剪。
- JSON 查看器展开/折叠、编辑、删除、复制 affordance 缺失，或替换组件后默认 collapsed 语义变化。

### 7.3 需要复核的灰区

以下情况默认标记为 `needs-review`，由 reviewer 根据上下文决定是否接受：

- rc-menu / @rc-component/menu 造成的 submenu 宽度、缩进、箭头位置或 popup 动画起点变化。
- @rc-component/input-number 的 percent / formatter 场景出现 DOM remount 引起的焦点或光标位置差异。
- @rc-component/progress 的 SVG 圆环 stroke 端点、抗锯齿或文字居中出现轻微差异。
- react-player 替换 video-react 后控件外观不同但能力链路完整；样式差异可以接受。Video 用例应优先做接口语义断言（video 存在、src/poster 保留、controls 可用、play/pause 状态可切换），不把 native controls 与 video-react 控件皮肤做阻断级像素比较。
- Markdown/Froala/TinyMCE 升级后 HTML sanitizer 或 toolbar DOM 发生合理版本漂移，但可见内容、菜单和编辑入口必须完整。

## 8. 动态区域和特殊组件

- Monaco / code editor：mask 光标和当前行闪烁区域；代码块高亮必须保留比较。
- ECharts / canvas：等待图表容器尺寸稳定；静态 pass 可在抖动时 mask canvas 内部，但交互 pass 必须保留 chart、legend、tooltip、wordCloud 渲染结果比较。
- Video / audio / iframe：默认 mask 外链媒体画面。Video 在 video-react → react-player/native controls 迁移后，用语义断言覆盖 poster、src、controls、play/pause；控件皮肤差异降为人工复核，不作为自动 fail。
- 表格 / CRUD：等待 mock API 完成和空 loading 消失；滚动类表格静态 pass 比较初始 viewport 和页面纵向 chunk，交互 pass 增加筛选、列设置、quickEdit、行操作浮层。
- 浮层类页面：除页面静态截图外，Options、Select、InputColor、日期/月范围、Tooltip、PopOver、Dialog、Drawer、DropDownButton、Nav submenu 都必须有 interaction shot。
- portal / body 浮层：截图不能只 clip 组件根节点，必须包含 `document.body` 中的 overlay/popup/popover/menu 节点；必要时用 trigger + portal union bounding box 截图。

### 8.1 交互截图采集协议

每个交互用例至少采两张图：`before`（稳定静态态）和 `after`（触发后的稳定态）。高风险关闭逻辑再采 `after-close`。

1. 打开页面后执行第 5 节稳定等待。
2. 定位 trigger。优先使用可见文本、role、data-testid、稳定 class；禁止依赖随机生成 id。
3. 长文档页要动态扫描滚动高度；懒加载会改变 `scrollHeight`，不能只在打开页面后一次性计算滚动点。
4. 触发前将 trigger 滚到稳定视口位置（例如 `block: center`），避免 baseline/candidate 因文档高度差产生无意义全页偏移。
5. 对 click 类用例执行 `click()`；对 hover 类用例执行 `hover()` 或移动鼠标到 trigger 中心点；对 focus 类用例执行键盘 Tab 或 `focus()`。
6. 等待浮层出现：至少等待目标 selector visible，再等待 2 个 `requestAnimationFrame` + 300ms；如果未全局禁用动画，则等待 transitionend/animationend 或固定 700ms。
7. 截图必须覆盖 trigger 与浮层。浮层渲染在 body/portal 时，优先截 viewport；必要时另存 popup clip 图辅助定位。
8. 可选步骤如果两边都找不到稳定触发点，应记录 skipped，但不产出该步骤截图；避免把扫描后的页面底部滚动位置当成对比状态。
9. 表单示例中的 debug JSON viewer 可在 interaction runner 中隐藏（`.amis-Form--debug` / `.cxd-Form--debug`），避免 JSON viewer 替换或默认折叠差异污染 Select、Date、NestedSelect 等控件回归。
10. 二级菜单、enterable tooltip、日期时间选择、rich editor toolbar 需要继续移动鼠标或点击二级 trigger，再采 `nested-open`。
11. 关闭态用例执行 Esc、外部点击或再次点击 trigger，确认浮层卸载或隐藏后采 `after-close`。
12. 对 hover 用例，截图前隐藏或 mask 鼠标指针；对输入类用例 mask caret；对动态媒体/canvas 按第 8 节规则 mask 或人工判定。

### 8.2 本轮必须新增的交互截图用例

| ID | 路由/页面 | 触发动作 | 截图状态 | 判定重点 |
|---|---|---|---|---|
| INT-001 | `/zh-CN/components/dropdown-button` | 点击默认 DropDownButton | before / menu-open / after-close | 菜单宽度、位置、z-index、选中/hover 态、关闭行为 |
| INT-002 | `/zh-CN/components/dropdown-button` | hover 触发示例 | before / hover-open / nested-hover | hover trigger、enterable 菜单、二级菜单方向 |
| INT-003 | `/zh-CN/components/nav` | hover/click 展开水平 Nav 子菜单 | before / submenu-open / nested-open | @rc-component/menu popupClassName、缩进、箭头、响应式 overflow |
| INT-004 | `/zh-CN/components/breadcrumb` | 点击带下拉的面包屑项 | before / menu-open | 浮层挂载位置、菜单项顺序、点击外部关闭 |
| INT-005 | `/zh-CN/components/tooltip` | hover TooltipWrapper | before / tooltip-open / leave-close | tooltip 定位、arrow、enterable、延迟关闭 |
| INT-006 | `/zh-CN/components/tooltip` | click/focus tooltip 示例 | before / open / esc-close | focus 管理、键盘关闭、aria 可见性 |
| INT-007 | `/zh-CN/components/popover` | 点击和 hover PopOver 示例 | before / popover-open / after-close | PopOverContainer、portal、遮挡、内容尺寸 |
| INT-008 | `/zh-CN/components/remark` | hover Remark 图标 | before / remark-open | 小浮层定位、arrow、文本换行 |
| INT-009 | `/zh-CN/components/dialog` | 点击打开 Dialog | before / dialog-open / drag-header / after-close | Modal 过渡态、mask、focus trap、拖拽后位置、unmount |
| INT-010 | `/zh-CN/components/drawer` | 点击打开 Drawer | before / drawer-open / after-close | Drawer 方向、尺寸、mask、body scroll lock、关闭按钮 |
| INT-011 | `/zh-CN/components/form/select` | 打开单选和多选 Select | before / dropdown-open / option-hover / selected | 选项列表、selected/checked、搜索框、portal 裁剪 |
| INT-012 | `/zh-CN/components/form/nestedselect` | 打开并 hover 二级级联 | before / level1-open / level2-open | 二级列位置、onlyLeaf、active 路径 |
| INT-013 | `/zh-CN/components/form/treeselect` | 打开 TreeSelect 并展开节点 | before / dropdown-open / node-expanded | 树节点缩进、checkbox、展开箭头、滚动容器 |
| INT-014 | `/zh-CN/components/form/chain-select` | 打开链式选择并选择上级 | before / dropdown-open / child-loaded | 多列联动、loading、选项更新位置 |
| INT-015 | `/zh-CN/components/form/picker` | 打开 Picker 弹层 | before / picker-open / item-selected | Picker modal/popover、表格列表、底部按钮 |
| INT-016 | `/zh-CN/components/form/input-tag` | 打开标签建议/更多标签浮层 | before / suggestions-open / overflow-open | tag overflow、建议列表、hover/selected 态 |
| INT-017 | `/zh-CN/components/form/input-color` | 打开颜色选择器 | before / color-panel-open | 颜色面板、透明度/色相条、定位和关闭 |
| INT-018 | `/zh-CN/components/form/input-date` | 打开日期选择器 | before / calendar-open / month-panel | 日历弹层、今日态、月份切换、时间面板 |
| INT-019 | `/zh-CN/components/form/input-date-range` | 打开日期范围选择器 | before / range-open / selecting-end | 双日历布局、hover range、确认按钮 |
| INT-020 | `/zh-CN/components/table` | 打开表头筛选，再打开列设置 | before / filter-open / after-filter-close / column-menu-open | 表头浮层位置、表格滚动后锚定、选项列表；filter 与 ColumnToggler selector 必须分开 |
| INT-021 | `/zh-CN/components/crud` | 打开 CRUD 列设置菜单 | before / column-menu-open / after-close | CRUD ColumnToggler 浮层位置、列选项、关闭行为 |
| INT-022 | `/zh-CN/components/tabs` | hover tab tooltip 或打开 overflow | before / hover-tip / overflow-open | Tabs nodeRef 迁移后过渡、active bar、浮层定位 |
| INT-023 | `/zh-CN/components/carousel` | hover 轮播区域并点 indicator | before / hover-controls / next-slide | 箭头显示、indicator、切换后 DOM 残留 |
| INT-024 | `/zh-CN/components/images` | hover 图片动作并打开预览 | before / hover-actions / gallery-open | 图片操作浮层、预览 Modal、关闭态 |
| INT-025 | `/zh-CN/components/chart` | hover 图表点、legend click | before / tooltip-open / legend-toggled | ECharts tooltip、legend、series 可见性、v5 theme drift |
| INT-026 | `/zh-CN/components/chart` 或专用 schema fixture | 渲染 `type: 'wordCloud'` 并 hover 词条 | before / wordcloud-rendered / tooltip-open | 词云是否渲染、词条布局、tooltip；验证 ECharts 6 + echarts-wordcloud 兼容风险 |
| INT-027 | `/zh-CN/components/video` | 执行 video 接口能力断言 | interface-ok | video-react → react-player/native controls 后不做阻断级控件皮肤像素比；断言 video、src、poster、controls、play/pause |
| INT-028 | `/zh-CN/components/json` | 展开/折叠 JSON 节点，触发复制/编辑入口 | before / expanded / edit-affordance | @uiw/react-json-view 默认折叠语义、图标、缩进、编辑入口 |
| INT-029 | `/zh-CN/components/form/input-rich-text` | 打开 Froala/TinyMCE toolbar 下拉/对话框 | before / toolbar-menu-open / dialog-open | 富文本工具栏、菜单、颜色/链接/图片弹窗、z-index |
| INT-030 | `/zh-CN/components/form/input-number` | 输入 percent/formatter 场景并 focus/blur | before / focused / changed / blurred | @rc-component/input-number remount caveat、光标、格式化值 |
| INT-031 | `/zh-CN/components/progress` | 截取 line/circle/dashboard 变体 | before / stable | @rc-component/progress SVG 圆环、文字居中、stroke 端点 |
| INT-032 | `/examples/crud/table` | 打开真实 CRUD quickEdit popover | before / quick-edit-open / after-close | QuickEdit forwardedRef、Popover 锚定、提交/取消区域；既有 MST detached store warning 需区分 baseline/candidate 是否共有 |
| INT-033 | `/zh-CN/components/collapse` | 展开/收起第二个 Collapse 面板 | before / expanded-second / collapsed-second | react-transition-group nodeRef 后内容区挂载、展开高度、收起后残留 DOM |
| INT-034 | `/zh-CN/components/toast` | 点击 toast action 并 Esc 关闭 | before / toast-open / toast-closed | Toast 进入/退出态、top-center 定位、icon/content、关闭后残留 |
| INT-035 | `/zh-CN/components/spinner` | 定位容器 overlay spinner 并截图 | before / overlay-stable | Spinner overlay、容器 body 遮罩、tip/icon 尺寸 |
| INT-036 | `/zh-CN/components/form/input-formula` | 打开公式编辑器弹层 | before / editor-open / after-close | Formula Editor 弹层尺寸、z-index、左侧函数列表、编辑器区域 |
| INT-037 | `/zh-CN/components/form/select` mobile viewport | 移动端打开 Select PopUp | before / popup-open / after-close | PopUp transition、底部弹层、overlay、Select mobile 内容区 |
| INT-038 | `/examples/form/rich-text` | 示例页打开 RichText toolbar menu | before / toolbar-menu-open / dialog-open | TinyMCE 示例页菜单/弹窗；Froala 在当前 docs/examples 环境没有稳定可见实例，需 editor/fixture harness 单独覆盖 |
| INT-039 | `/zh-CN/docs/index` synthetic harness | 直接调用真实 `ContextMenu.openContextMenus` 并 hover 子菜单 | before / menu-open / submenu-hover / after-close | ContextMenu body portal、菜单定位、二级菜单 hover、Esc 关闭；不依赖 docs 页面偶然入口 |
| INT-040 | `/zh-CN/docs/index` synthetic harness | 直接渲染真实 Froala 组件并打开 link/table popup | before / link-popup-open / table-popup-open | Froala toolbar、link popup、table popup、z-index、版本升级后的可见菜单能力 |

如果页面文档中没有可稳定触发的目标示例，允许在视觉回归专用 fixture 中补最小 amis schema，但 fixture 必须复用真实 renderer/component，不允许用 mock 组件替代。

交互 runner 对带浮层的新增用例必须配置 `expectSelectors`，即点击/hover 后不仅截图，还要断言目标浮层节点真实可见；否则 baseline/candidate 都没弹出时可能形成假 pass。当前普通 docs/examples 站点没有稳定暴露 `ContextMenu.openContextMenus` 的页面入口，Froala 也没有稳定可见实例，因此二者用 synthetic harness 覆盖：harness 只负责建立稳定宿主 DOM，实际打开/渲染仍调用真实 `ContextMenu` 和真实 Froala 组件。

### 8.3 组件替换专项覆盖

| 变更区域 | 必须覆盖 | 不接受的退化 |
|---|---|---|
| `react-transition-group` `nodeRef` 迁移 | Modal、Drawer、PopUp、Collapse、Toast、Tabs、Carousel、Images 进入/退出态 | 初始隐藏挂载错误、退出后残留 DOM、快速开关错乱 |
| `@rc-component/menu` | Nav、DropDownButton、Breadcrumb、ContextMenu、Table header menu | popup 被裁剪、hover 二级菜单断开、active keyPath 错误 |
| `@rc-component/input-number` | InputNumber、Number 展示、percent/formatter/parser | 焦点丢失、格式化值错误、步进器不可用 |
| `@rc-component/progress` | Progress line/circle/dashboard | 文本错位、进度比例错误、阈值 marker 缺失 |
| `react-player` | Video 普通源、直播/外链源、poster、controls hover | controls 不可用、播放状态错误、poster/loading 退化 |
| `@uiw/react-json-view` | JSON renderer、debug 面板、编辑/删除/复制入口 | collapsed 语义变化、展开图标/编辑入口缺失 |
| Froala / TinyMCE | RichText 工具栏、菜单、弹窗、内容区 | toolbar 缺失、菜单被遮挡、弹窗不能关闭 |
| Markdown / markdown-it | Markdown 页面、HTML5 media、代码块 | sanitizer 行为异常、media 渲染缺失、代码高亮错乱 |
| ECharts 6 | Chart 基础图、tooltip、legend、wordCloud | series 缺失、tooltip 不出现、`wordCloud` 不渲染 |

## 9. 执行分层

1. **Route health pass**：遍历 372 个 URL，确认不是 404、无崩溃、能进入稳定态。
2. **Default visual pass**：372 个 URL × cxd × desktop，全量 chunk pixel diff，作为阻塞 gate。
3. **Theme matrix pass**：全量 URL × dark/antd/ang 可作为 nightly；本轮主题系统重构建议至少 dark 全量，antd/ang 可按风险分批。
4. **Interaction pass**：执行第 8.2 节交互矩阵；覆盖 click、hover、focus、Esc/外部点击关闭、二级浮层和 portal/body 场景，不靠静态页面截图替代。
5. **Manual review pack**：输出 diff 最大的前 50 个 chunk、所有超过阻塞阈值的 chunk、以及用户点名页面。

## 10. 产物结构

```
.gstack/visual-regression/<run-id>/
├── manifest.json                  # route/theme/viewport/chunk 明细
├── route-health.json              # 372 个页面加载状态和 console errors
├── baseline/<route-key>/...png
├── candidate/<route-key>/...png
├── diff/<route-key>/...png
├── interactions/<case-id>/baseline/...png
├── interactions/<case-id>/candidate/...png
├── interactions/<case-id>/diff/...png
├── report.md
└── report.html                    # 缩略图、diff ratio、跳转链接
```

## 10.1 当前 runner

已落地可执行脚本：`run-pixel-regression.cjs`。它直接读取 `page-manifest.json`，按 route 打开 baseline / candidate 两个服务，逐个滚动 chunk 截图，并用 `pixelmatch` 输出 diff。

静态 route + scroll chunk 由 `run-pixel-regression.cjs` 覆盖。交互矩阵由 `run-interaction-regression.cjs` 覆盖：读取内置 case，执行 click/hover/focus/fill/drag/Esc 等 trigger，支持单 case viewport/viewMode，支持 `expectSelectors` 断言 portal/body 浮层真实出现，并输出 `interactions/<case-id>/baseline|candidate|diff/...` 产物。

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
  --out .gstack/visual-regression/smoke-2026-08-13-react19-compat
```

交互 smoke 命令：

```bash
AMIS_VISUAL_NODE_MODULES=/tmp/amis-visual-regression-deps/node_modules \
  node .codestable/qa/2026-08-09-amis-pixel-regression/run-interaction-regression.cjs \
  --baseline http://127.0.0.1:8889 \
  --candidate http://127.0.0.1:8888 \
  --case INT-037 \
  --out .gstack/visual-regression/interactions/smoke-mobile-popup-2026-08-13
```

全量命令：

```bash
AMIS_VISUAL_NODE_MODULES=/tmp/amis-visual-regression-deps/node_modules \
  node .codestable/qa/2026-08-09-amis-pixel-regression/run-pixel-regression.cjs \
  --baseline http://127.0.0.1:8889 \
  --candidate http://127.0.0.1:8888 \
  --no-retry \
  --workers 3 \
  --out .gstack/visual-regression/full-2026-08-13-react19-compat
```

交互全量命令：

```bash
AMIS_VISUAL_NODE_MODULES=/tmp/amis-visual-regression-deps/node_modules \
  node .codestable/qa/2026-08-09-amis-pixel-regression/run-interaction-regression.cjs \
  --baseline http://127.0.0.1:8889 \
  --candidate http://127.0.0.1:8888 \
  --out .gstack/visual-regression/interactions/full-2026-08-13-react19-compat
```

### 10.2 推荐执行顺序

启动对比测试时按这个顺序推进，不要直接跳到 full run：

1. **环境记录**：按第 4.4 节生成 run id、`run-env.txt` 和日志目录。
2. **服务启动**：按第 4.1 节启动 baseline/candidate，确认端口 strict、不串线。
3. **HTTP 探活**：两个服务 `/zh-CN/docs/index` 都返回成功后，继续浏览器预热。
4. **浏览器预热**：按第 4.2 节跑预热路由，确认无启动期 error overlay。
5. **静态 smoke**：执行 `--limit 2 --max-chunks 2`，确认 runner、截图、diff、report 都能产出。
6. **交互 smoke**：先跑 `INT-001`、`INT-003`、`INT-009`、`INT-025`、`INT-027`、`INT-037`，覆盖菜单、Nav、Modal、Chart、Video、Mobile PopUp 六类高风险路径。
7. **静态 full**：执行 372 routes × cxd × desktop 的默认全量截图。
8. **交互 full**：执行第 8.2 节全部交互用例。
9. **人工判定**：按第 7 节把 diff 分成 `expected-visual-drift`、`needs-review`、`bug`，并把 bug 反向关联到组件替换或依赖升级区域。

### 10.3 最小成功标准

一次运行只有同时满足以下条件，才算“启动对比测试成功”，否则只能算环境 smoke 或失败启动：

- baseline 和 candidate 服务在整个 smoke 期间没有退出，日志里没有 Vite fatal error。
- smoke 至少产出 baseline、candidate、diff 三类图片和 report。
- report 中记录了 baseline/candidate commit、viewport、theme、浏览器、run id 和启动命令。
- route health 没有 404 或错误 overlay；如果有，先处理启动/路由问题，不进入像素判定。
- 交互 smoke 至少有一个 portal/body 浮层截图，证明截图方案没有漏掉 body 下挂载的弹层。

## 11. 漏页防线

- 每次运行前重新从 4 个导航配置解析 route，不依赖旧 manifest。
- 将解析结果与 `page-manifest.json` 比较；新增/删除 route 时，测试报告必须显式列出 manifest drift。
- 每个 route 记录 `tab`、`breadcrumb`、`source`、`path`、`url`，方便定位遗漏来自哪个页签。
- 注释里的 path 不计入 active routes，避免把废弃页面误当失败。

## 12. 历史执行记录

以下是 2026-08-09 主题系统视觉回归的历史执行记录，用来说明现有 runner 已经验证过的能力边界。

- 当时 candidate dev server 已启动：http://127.0.0.1:8888
- 当时 baseline dev server 已启动：http://127.0.0.1:8889
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

## 13. 2026-08-13 React 19 兼容交互回归记录

本次针对 commit `43a33ee0` 的交互回归已实际执行，覆盖第 8.2 节交互矩阵，并补入 Collapse、Toast、Spinner overlay、Formula Editor、Mobile PopUp、RichText 示例等新增 case。

- 运行目录：`.gstack/visual-regression/interactions/full-with-extra-overlay-cases-135352`
- 运行命令：`AMIS_VISUAL_NODE_MODULES=/tmp/amis-visual-regression-deps/node_modules node .codestable/qa/2026-08-09-amis-pixel-regression/run-interaction-regression.cjs --baseline http://127.0.0.1:8889 --candidate http://127.0.0.1:8888 --out .gstack/visual-regression/interactions/full-with-extra-overlay-cases-135352`
- 结果：`38 cases / 30 pass / 8 warn / 0 fail / 0 error`
- 新增 case 结果：`INT-033 Collapse pass`、`INT-034 Toast pass`、`INT-035 Spinner pass`、`INT-036 Formula warn`、`INT-037 Mobile PopUp pass`、`INT-038 RichText example warn`。
- `INT-036` 定性：Formula Editor 弹层、遮罩、位置、变量/函数列表、关闭行为均正常；warn 来自 baseline 侧变量 tooltip/focus 残留，按 `expected-visual-drift` 处理。
- `INT-038` 定性：TinyMCE 菜单能打开，位置和菜单内容正常；warn 来自 TinyMCE 版本/皮肤 focus 边框和 hover 高亮差异，按 `expected-visual-drift` 处理。
- 其余 warn：`INT-007` PopOver、`INT-020` Table、`INT-021` CRUD、`INT-028` JSON、`INT-029` RichText docs、`INT-032` QuickEdit 均为已知轻微视觉/动态数据/第三方皮肤漂移；没有发现浮层打不开、被裁剪、z-index 错误、位置脱离 trigger 或关闭后残留的阻塞问题。
- 后续补充：`INT-039` 已用真实 `ContextMenu.openContextMenus` synthetic harness 覆盖 ContextMenu，单 case 结果为 `pass`；`INT-040` 已用真实 Froala 组件 synthetic harness 覆盖 toolbar link/table popup，单 case 结果为 `warn`，定性为 Froala 5.3.1 版本弹窗内容/header 轻微漂移，popup 位置、层级和可见内容正常。
- 最终 40 case 复跑：`.gstack/visual-regression/interactions/full-with-contextmenu-froala-142219`，结果为 `40 cases / 31 pass / 9 warn / 0 fail / 0 error`。`INT-039 ContextMenu` 为 `pass`；`INT-040 Froala` 为 `warn`，其中 link popup 为 `pass/0 diff`，table popup 因 Froala 版本 header/back 区域差异为 `warn/0.3069%`，功能和定位正常。

## 14. 运行经验补充

以下经验来自 2026-08-13 两轮交互回归和单 case 追踪，后续跑视觉回归时应直接按这些规则执行，避免把环境、测试脚本或第三方版本漂移误判为产品 bug。

### 14.1 先跑单 case，再跑 full

- 新增交互用例必须先单独跑 `--case <id>`，确认 trigger、`expectSelectors`、截图状态名和关闭路径都稳定，再进入 full run。
- 单 case 如果出现 `error`，优先修 runner selector、等待条件或 fixture 入口；只有目标 selector 已出现但行为不对，才进入产品代码排查。
- 单 case 如果只是 `warn`，必须打开 baseline/candidate/diff 三张图定性；不能只看 diff ratio。
- full run 只用于验证新增 case 没有破坏全局顺序和共享 runner 状态，不应用 full run 的长日志首次定位 selector 问题。

### 14.2 Synthetic harness 使用边界

- docs/examples 没有稳定入口时，可以用 synthetic harness，但 harness 只能提供稳定宿主 DOM，不能 mock 被测组件行为。
- synthetic harness 必须调用真实模块，例如 `ContextMenu.openContextMenus` 或真实 Froala React 组件；不允许用手写 DOM 假装菜单、弹层或编辑器。
- synthetic harness 的 route 可以选择 `/zh-CN/docs/index` 这类轻量页面，但截图前必须清空页面主体，避免文档内容、滚动位置和导航高亮污染 diff。
- synthetic harness 覆盖结论要写清楚：它证明组件本体和 popup/portal 能力正常，不等同于覆盖某个业务页面里的所有集成路径。

### 14.3 Vite 预热和动态 import

- 第一次动态导入重第三方组件可能触发 Vite `504 Outdated Optimize Dep`，尤其是 Froala/TinyMCE 这类 lazy 依赖；遇到后先预热并重跑同一 case，不要立即判定为产品回归。
- 预热必须通过浏览器执行真实 import/render，单纯 `curl` 只能证明 HTML 可达，不能证明 Vite optimized deps 和 lazy chunks 已经稳定。
- baseline 和 candidate 都要按相同顺序预热；只预热 candidate 会让 baseline 首次截图承担编译/优化成本，制造假差异。

### 14.4 鼠标位置和 hover 噪声

- click 后截图前要注意鼠标仍停在触发点或列表项上，可能额外触发 tooltip、hover 高亮或 focus ring。
- 如果目标状态不是 hover 本身，runner 可以在确认 `expectSelectors` 后把鼠标移到安全角落，再等待 2 rAF + 250ms。
- Formula Editor 的变量 tooltip 就是这种噪声：弹层主体完全一致，但 baseline 侧残留 tooltip 会把 case 推到 warn。

### 14.5 Warn 分类规则

- `warn` 不是失败，也不是自动通过；必须给出 `expected-visual-drift`、`needs-review` 或 `bug` 分类。
- 可以接受的 warn：第三方版本升级带来的菜单文案、header/back 区域、focus 边框、hover 高亮差异，前提是目标 popup 出现、位置正确、内容可用、关闭行为正常。
- 必须升级为 bug：baseline/candidate 任一侧没有命中 `expectSelectors`、popup 被裁剪、z-index 错、定位脱离 trigger、Esc/外部点击不能关闭、关闭后 DOM 残留。
- 共有 console warning 不应单独阻塞，但 candidate-only pageerror 或新增 runtime error 必须进入 `needs-review`，即使截图 diff 很低。

### 14.6 报告可追溯性

- 每轮最终结论必须记录 output dir、case 总数、pass/warn/fail/error 计数，以及新增/变化 case 的单独定性。
- 如果 full run 对应 dirty working tree，报告只能代表当前工作区状态，不能宣称代表某个纯 commit。
- `.gstack/visual-regression/...` 产物用于审查和追溯，但不要默认纳入提交；代码/方案文件与截图产物要分开处理。
