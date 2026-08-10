---
doc_type: fix-note
topic: amis theme visual regression RCA implementation
status: implemented
created: 2026-08-09
branch: refactor-theme-system
---

# 主题视觉回归 RCA 修复记录

## 根因

本轮像素回归的主要失败不是单一主题样式问题，而是四类信号混在一起：

1. runner 将 `Math.random` 固定为常量，破坏 amis `guid()` 的唯一性，导致 store id 碰撞，错误复用 store 后出现 `setCanAccessSuperData` / `setEntered` 方法缺失。
2. runner 没有健康门禁，页面运行时错误和静态资源错误会被误报为像素 FAIL。
3. 文档页含 GIF 动态示例，截图时不同帧会造成假差异。
4. docs shell 仍用 `theme.ns` 生成 `cxd-Layout-*` 类，而组件库 CSS 已切到稳定 `.amis-*`，导致 headerBar 丢失布局 padding，顶部导航整体左移 8px。
5. 文档内容与 baseline 不一致时，滚动截图会整体错位；这类内容漂移需要从主题样式回归里单独拆出。
6. runner 在滚动后过早检查 spinner；LazyComponent 由 `IntersectionObserver` 稍后触发时，占位符可能在布局等待期间才出现，导致 baseline 截到 loading、candidate 截到完整组件。
7. baseline 首次加载富组件时会触发 Vite 依赖重优化和页面重载；runner 未校验实际 `scrollY`，曾把停在页首甚至空白中的 baseline 与正常 candidate chunk 比较成像素 fail。
8. `MdRenderer.fixHtmlPreview()` 仍使用 `theme.classPrefix` 改写静态 HTML 示例。主题迁移后 candidate 的组件 CSS 已使用稳定 `.amis-*` 选择器，导致静态示例生成 `.cxd-Button` 等旧类名，部分组件规则未命中并退回浏览器默认样式；按钮的 `inline-flex` 丢失后，会在长文档中累积为纵向像素漂移。
9. `ThemeScopeRoot` 为 Root 注入 `data-amis-theme` 时增加了额外 DOM wrapper。examples 的 `schema-wrapper > .amis-Page` 依赖页面根为直接子节点，wrapper 使 Flex 宽度分配和页面主内容区收缩，造成大面积视觉差异。

## 修复

- `.codestable/qa/2026-08-09-amis-pixel-regression/run-pixel-regression.cjs`
  - 增加资源错误、`pageerror`、可见运行时错误健康门禁。
  - 固定随机数改为 seeded PRNG，保持可复现但不破坏唯一 id。
  - 隐藏文档 GIF 与 Log 动态内容，避免动态媒体污染主题像素结论。
  - 增加正文文本指纹；像素不一致且文本指纹不同的页面标为 `content-drift`，不混入主题样式 `fail`。
  - 只等待当前 viewport 内的 LazyComponent loading，并在布局稳定后再次确认；页面展示型 Spinner/overlay 不作为采集阻断。
  - 为每侧 chunk 校验实际滚动位置；页面重载时恢复并重试一次，仍未到达预期位置则阻断像素比较。
  - 预期位置按截图当下页面高度计算，同时关闭滚动锚定并校验页面高度不得低于初始稳定值，兼容正常懒加载增高但拒绝空白重载。
  - Vite 依赖错误键去掉 `/node_modules/.vite/deps` 的 `?v=` 缓存指纹，避免同一资源被两服务误报为非对称。
  - 页面打开/初始稳定失败时关闭失败 page 并重试一次，减少首次依赖优化造成的采集 error。
  - 页面打开成功但发现 Vite 504 `Outdated Optimize Dep` 时也关闭并重试一次，再进入健康门禁。
- `examples/components/App.tsx`
  - docs shell 的 `Layout-*` 壳层类改用稳定 `amis-` 前缀。
  - 保留示例 schema 继续接收当前 `theme.ns`，没有扩大到示例内容迁移。
- `examples/components/MdRenderer.jsx`
  - 静态 HTML 预览改用 `getTheme(theme).componentClassPrefix`，默认回退 `amis-`。
  - 预览示例与 React 组件共用稳定组件类名；没有恢复 `.cxd-*` SCSS 兼容层。
- `packages/amis-core/src/Root.tsx` / `RootRenderer.tsx`
  - 移除 `ThemeScopeRoot` 的布局 wrapper。
  - 在 `RootRenderer` 的真实宿主根节点上应用当前 `data-amis-theme`，并在更新时同步主题值。
  - 作用域注入不改变现有 Root DOM 层级，也不复用 portal scope 的幂等保护逻辑。
- `packages/amis-core/__tests__/RootRenderer.test.tsx`
  - 覆盖无额外 wrapper、根节点 scope 和主题更新三个契约。

## 验证

- `node --check .codestable/qa/2026-08-09-amis-pixel-regression/run-pixel-regression.cjs` 通过。
- 同样 runner 上下文下，`/zh-CN/components/form/input-color` 的 baseline/candidate `pageErrors=0`。
- `/zh-CN/components/form/options` 单页像素回归：`1 pass / 0 warn / 0 fail / 0 error`。
- 8 页窄集像素回归：`7 pass / 0 warn / 1 fail / 0 error`；随后已补充 `content-drift` 分类，复跑会把该类文档内容漂移从主题 FAIL 中拆出。
- `/zh-CN/style/state` 单页像素回归：`1 pass / 0 warn / 0 fail / 0 error`，6 个滚动块全部通过。
- 样式页签 62 页像素回归：`60 pass / 2 content-drift / 0 fail / 0 error`。
- 示例页签 127 页 Root scope 修复后：`103 pass / 1 warn / 1 fail / 22 content-drift / 0 error`。
- `fieldset` 与 `tabs` 单页复测均通过；此前的 Page 宽度压缩和直接子节点布局回归已消失。

## 剩余项

- `/zh-CN/docs/extend/editor` 原先仍 FAIL。已确认 current 比 baseline 多一行“可视化编辑器定制指南”链接文案，造成 scrollHeight 从 `18881` 到 `18959`，属于文档内容差异。runner 已补充 `content-drift` 分类；后续全量回归仍应优先基于迁移后 baseline 重新比较。
- 样式页签的唯一真实 fail 已关闭；`/zh-CN/style/index` 与 `/zh-CN/style/css-vars` 仍是已识别的主题文档内容漂移，不属于本次代码回归。
- 示例剩余高差异来自验证码动态图、轮播时序、异步服务数据或随机表格数据，需作为动态内容基线治理，不应通过恢复主题 wrapper 或 `.cxd-*` SCSS 兼容层处理。
