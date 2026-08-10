---
doc_type: fix-plan
topic: amis theme visual regression RCA follow-up
status: in-progress
created: 2026-08-09
branch: refactor-theme-system
---

# 主题视觉回归 RCA 修正方案

## 目标

把当前像素回归从“海量 FAIL”收敛为可信的产品回归信号：先阻断测试基线污染，再隔离预期内的前缀/文档变化，最后只修真实样式或运行时问题。

## 已证实根因

1. **baseline 静态资源不完整**：旧 worktree 服务曾缺少 `github-markdown-css`、`prismjs`、`@fortawesome/fontawesome-free`、`katex` 等 `/node_modules` 静态资源，导致文档样式、代码高亮、图标与布局差异被像素 runner 误判为主题回归。
2. **比较口径未识别预期迁移**：baseline 使用 `.cxd-*`，candidate 使用稳定 `.amis-*`。这是 ADR-001 目标，不应按旧 DOM 文本做逐像素等价断言。
3. **文档内容变更污染视觉差异**：如 `docs/zh-CN/extend/editor.md` 新增段落，导致后续整页滚动截图纵向错位。
4. **runner 确定性脚本破坏 store 唯一性**：runner 曾把 `Math.random` 固定为 `0.42`，而 amis 的 `guid()` 依赖 `Math.random` 生成 store id，导致同一页面内多个 store id 碰撞；`RootStore.addStore()` 复用已有 store 后，`FormRenderer`、`DialogRenderer`、`DrawerRenderer` 分别拿到错误 store，出现 `store.setCanAccessSuperData is not a function` 与 `props.store.setEntered is not a function`。
5. **已排除的点名症状**：`options` 和 `input-month-range` 的弹层坐标、尺寸、边框、z-index 在当前 candidate 与旧 baseline 对齐；当前没有证据表明 Overlay/PopOver 定位仍坏。
6. **Root 主题作用域 wrapper 破坏布局**：`ThemeScopeRoot` 为注入 `data-amis-theme` 增加了额外 `<div>`，使 examples 的 `schema-wrapper > .amis-Page` 直接子节点契约失效，并改变 Flex 宽度分配；这不是 CSS token 值错误，而是作用域注入位置错误。

## 修复顺序

1. **像素 runner 健康门禁**
   - 记录 baseline/candidate 的 HTTP 4xx/5xx 资源响应。
   - 非对称资源错误直接标为 `error`，不进入像素结论。
   - 页面级 `pageerror` 或可见运行时错误面板直接标为 `error`。
   - 报告中展示 blocked reason，防止 `FAIL` 数字被误读为产品视觉回归。
2. **测试基线 deterministic 化**
   - 在回归方案中要求 baseline worktree 具备完整依赖或明确 asset parity 清单。
   - 禁止在依赖 404 的状态下发布全量视觉结论。
3. **迁移口径分层**
   - 主题迁移后建立 post-migration baseline，用于真实视觉回归。
   - 文档页另设 class-prefix/content normalization 或单独评审，不与组件视觉等价混算。
   - runner 对正文文本指纹不一致且像素不一致的页面输出 `content-drift`，不计入主题样式 `fail`。
4. **runner 确定性修复**
   - 将固定 `Math.random` 改为每个页面独立的 seeded PRNG。
   - 保持截图可复现，同时不破坏 amis 依赖随机数生成唯一 id 的运行时不变量。
5. **代码卫生清理**
   - 清理 `Root.tsx` 重复 `classPrefix` 属性，避免后续审查噪声。
6. **滚动懒加载稳定门禁**
   - 只等待当前 viewport 内的 LazyComponent 占位符，不把页面明确展示的 Spinner/overlay 组件误判为加载中。
   - 布局稳定与固定延时后再次检查 loading，覆盖滚动后才由 `IntersectionObserver` 触发的懒加载。
   - loading 超时直接输出 `error`，不允许在占位符尚未退出时生成像素 `fail`。
7. **截图位置完整性门禁**
   - 每个 chunk 按截图当下的页面高度计算预期 `scrollY`，允许懒组件正常撑高页面。
   - 禁用浏览器滚动锚定，避免上方异步内容加载后静默改写 `scrollY`。
   - 当前页面高度低于初始稳定高度时视为页面重载/坍塌，不进入像素比较。
   - 页面被 Vite 依赖重优化触发重载时，等待恢复并重试一次滚动。
   - 实际 `scrollY` 与预期不符时直接输出 `error`，禁止比较空白页、页首或错误 chunk。
8. **资源错误键规范化**
   - `/node_modules/.vite/deps` 的 `?v=` 是服务实例缓存指纹，不是资源身份；对比资源健康时去掉该参数。
9. **依赖首次优化重试**
   - 页面打开或初始稳定阶段因 Vite 首次依赖优化触发导航重载时，关闭失败 page 并重试一次。
   - 页面已打开但产生 Vite 504 `Outdated Optimize Dep` 时，同样关闭并重试一次。
   - 两次都失败才记录 error，避免把一次性的优化窗口当成页面不可用。
10. **静态 HTML 预览类名迁移**

- `MdRenderer.fixHtmlPreview()` 必须使用主题配置中的 `componentClassPrefix`。
- 不得使用 `theme.classPrefix` 生成静态示例的组件 DOM 类名；主题身份只由主题作用域和 token 表达。
- 该修正只改变文档示例的 DOM 输出，不新增 `.cxd-*` SCSS 兼容层。

11. **Root scope layout-neutral 修正**

- 移除 `Root.tsx` 中包住 `RootRenderer` 的主题 `<div>`。
- `RootRenderer` 在真实宿主根节点挂载和更新时写入当前 `data-amis-theme`，避免新增布局节点。
- 主题更新必须覆盖已有属性，不能直接复用 portal 场景的幂等 `applyThemeScope` 语义。
- 增加 RootRenderer 单测，锁定“无额外 wrapper、根节点带 scope、主题更新同步 scope”。

## 验收

- runner 对非对称缺失资源页面输出 `error`，不会输出 `fail`。
- runner 对可见运行时错误页面输出 `error`，不会输出像素结论。
- runner 对内容漂移导致的像素错位页面输出 `content-drift`，不会把文档变更误报为主题样式回归。
- `options`、`input-month-range` 仍能证明弹层定位与 baseline 对齐。
- `setCanAccessSuperData` / `setEntered` 错误消失后，表单页重新进入像素比较。
- 不恢复 `.cxd-*` 库 CSS 兼容层，不把 DOM alias 当作主路径。
- 静态 HTML 预览必须命中稳定组件 CSS；`/zh-CN/style/state` 的 `Button` 示例应同时保持组件规则和页面高度。

## 当前状态

- 已完成 RCA 证据收敛。
- 已完成第 1 项健康门禁：非对称资源错误、页面级运行时错误、可见错误面板都会阻断像素结论并输出 `error`。
- 已完成第 4 项 runner 确定性修复：固定随机数改为 seeded PRNG，保留可复现性，不再让 store id 碰撞。
- 已完成动态媒体降噪：文档页 GIF 示例与 Log 动态内容不再进入主题像素结论。
- 已完成 docs shell 类名前缀修复：顶部布局壳层改用稳定 `.amis-*` 组件类，避免 `cxd-Layout-headerBar` 找不到库 CSS 后丢失 `padding: 0 8px`。
- 已完成内容漂移分类：当正文文本指纹不同且像素不一致时，runner 将结果标为 `content-drift`，单独暴露为文档/示例内容基线问题。
- 已完成滚动懒加载稳定门禁：当前 viewport 内的 LazyComponent 占位符在截图前必须退出；布局等待后会二次确认，超时按采集错误处理。
- 已完成截图位置完整性门禁：记录并校验每侧实际 `scrollY`；依赖重优化导致页面重载时先恢复重试，仍错位则阻断像素比较。
- 已完成静态 HTML 预览类名迁移：`MdRenderer` 从 `theme.classPrefix` 切换到 `componentClassPrefix`，避免 `.cxd-Button` 漏掉稳定 `.amis-Button` 组件规则。
- 已完成 Root scope layout-neutral 修正：移除 `ThemeScopeRoot` 布局 wrapper，RootRenderer 直接作用于真实宿主根节点，并覆盖主题更新。

## 本轮验证结果

- `run-pixel-regression.cjs --path /zh-CN/components/form/options`：`1 pass / 0 warn / 0 fail / 0 error`，输出目录 `.gstack/visual-regression/rca-options-header-fixed`。
- 8 页窄集：`7 pass / 0 warn / 1 fail / 0 error`，输出目录 `.gstack/visual-regression/rca-narrow-shell-fixed`。
- 8 页窄集唯一剩余 FAIL：`/zh-CN/docs/extend/editor`。已确认 current 相比 baseline 多一行“可视化编辑器定制指南”链接文案，属于文档内容变化导致的滚动截图错位，不是主题样式回归；runner 已补充 `content-drift` 分类，后续复跑应从主题样式 FAIL 中拆出该类信号。

## 本轮修复结果

- 根因证据：baseline 静态示例按钮为 `.cxd-Button` 且 `display: inline-flex`；candidate 原为 `.cxd-Button` 但未命中稳定组件 CSS，退回 `inline-block`，从 Active 区域开始造成累计高度漂移。
- 修复：`examples/components/MdRenderer.jsx` 使用 `getTheme(theme).componentClassPrefix || 'amis-'` 生成静态 HTML 预览类名。
- 单页：`/zh-CN/style/state`，`1 pass / 0 warn / 0 fail / 0 error`，6 个滚动块全部通过。
- 样式页签：62 页，`60 pass / 2 content-drift / 0 fail / 0 error`。

## Root scope 修复验证

- 单测：`packages/amis-core/__tests__/RootRenderer.test.tsx`、`theme.test.ts` 共 `11 pass`。
- 单页：`/examples/form/fieldset` 为 `1 pass / 0 warn / 0 fail / 0 error`；`/examples/form/tabs` 为 `1 pass / 0 warn / 0 fail / 0 error`。
- 示例页签全量：127 页，`103 pass / 1 warn / 1 fail / 22 content-drift / 0 error`。
- 失败/漂移页面均已抽样检查：`iframe` 为验证码动态图，`carousel` 为轮播时序，`crud/columns` 与 `services/data` 为异步/随机示例数据；它们不呈现 Root wrapper 导致的宽度压缩。
