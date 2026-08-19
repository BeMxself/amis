# FIS3 构建链路维护风险与迁移调研

日期：2026-08-13

## 结论摘要

FIS3 不能简单判定为“仓库已归档/完全停止维护”：`fex-team/fis3` GitHub 仓库仍未归档，主分支 `package.json` 已到 `3.5.0-beta.4`，npm 当前可见最新版本为 `3.5.0-beta.3`。但从工程风险角度看，FIS3 及 amis 当前依赖的 FIS3 插件生态已经处于低活跃维护状态：核心包仍带大量老依赖，项目 README 仍保留 “Node 低于 4.x 用旧版本” 的年代痕迹，amis 使用的关键插件大多最后一次 npm metadata 修改在 2022 年左右。

本项目里的 FIS3 不只是“打包器”，而是承担了 SDK 发布协议的一部分：资源映射表、`amis.require` 模块注册、`deps-pack` 规则式拆包、`__uri`/`__inline` 资源定位、第三方大包分拆、主题 CSS 抽取/加作用域、Monaco/PDF worker 相对路径改写、`sdk/thirds` 目录布局和文档示例页发布。因此迁移不宜做成一次性替换工具；更稳妥的路线是先冻结 SDK 产物契约，再用 Rollup/Vite 插件化重建这套产物协议。

推荐方向：短期保留 FIS3，但不要再扩大 FIS3 配置；中期先替换 `publish-sdk` 的 SDK 构建；长期再处理 `gh-pages` 发布链路。候选工具里，Rollup 直接承接 SDK 最合适，Vite 可以继续承担开发和站点构建，Rspack/Webpack 更适合应用型 runtime chunk 体系，不建议作为第一选择。

当前分支已先落地 Phase 0/1 的第一步：把 `publish-sdk` 的分包契约抽到 `scripts/sdk-build/chunk-plan.js`，新增 `npm run check-sdk-contract` 校验当前 `packages/amis/sdk` 的关键文件、resource map、主题 CSS scope 和 third-party runtime 文件；同时补齐现有 FIS3 链路对现代 CSS/ESM/React 类型的兼容修复，保证 contract check 有可复现的构建输入。

## 一手资料信号

### FIS3 维护状态

- GitHub `fex-team/fis3`：未归档，README 定义 FIS3 是面向前端的工程构建系统，覆盖性能优化、资源加载、依赖管理、合并、内嵌、模块化开发、自动化工具和部署等问题。来源：<https://github.com/fex-team/fis3>
- GitHub raw `package.json`：主分支版本为 `3.5.0-beta.4`，依赖仍包括 `commander@1.3.2`、`glob@5.0.3`、`iconv-lite@0.2.10`、`liftoff@2.2.1`、`minimatch@3.0.4`、`minimist@1.2.3`、`fis-optimizer-uglify-js@0.2.2` 等老依赖。来源：<https://raw.githubusercontent.com/fex-team/fis3/master/package.json>
- npm metadata（本地 `npm view`，2026-08-13）：`fis3` 当前 npm latest 为 `3.5.0-beta.3`，`time.modified=2023-11-22T09:39:16.620Z`。
- amis 当前锁定的是 `fis3@^3.5.0-beta.2`，实际依赖由 lockfile 解析到 FIS3 及一组插件。来源：`package.json`、`package-lock.json`。

### amis 使用的 FIS3 插件维护信号

以下数据来自 2026-08-13 执行的 `npm view <pkg> version time.modified time.created repository.url --json`。

| 包 | 当前 npm 版本 | npm metadata 最近修改 | 备注 |
| --- | ---: | --- | --- |
| `fis3` | `3.5.0-beta.3` | 2023-11-22 | 核心包仍是 beta 版本线 |
| `fis3-postpackager-loader` | `2.1.12` | 2022-06-18 | amis 用于资源表/loader 后处理 |
| `fis3-hook-commonjs` | `0.1.34` | 2022-06-18 | amis 用于 CommonJS 依赖分析和 `define` 注入 |
| `fis3-hook-node_modules` | `2.3.1` | 2022-06-18 | amis 用于 node_modules 解析 |
| `fis3-hook-relative` | `2.0.3` | 2022-06-18 | 相对路径处理 |
| `fis3-packager-deps-pack` | `0.1.2` | 2022-06-18 | amis SDK 分包核心 |
| `fis3-parser-typescript` | `1.5.0` | 2022-06-18 | TS/JSX 编译路径之一 |
| `fis3-prepackager-stand-alone-pack` | `1.0.3` | 2022-05-02 | 独立包相关 |
| `fis3-preprocessor-js-require-css` | `0.1.3` | 2022-06-18 | JS require CSS 依赖标记 |
| `fis3-preprocessor-js-require-file` | `0.1.3` | 2022-06-18 | JS require file 依赖标记 |
| `fis3-deploy-skip-packed` | `0.0.5` | 2022-06-18 | 发布过滤 |
| `fis-optimizer-terser` | `1.3.0` | 2023-12-21 | 压缩插件相对较新 |
| `fis-parser-sass` | `1.2.0` | 2022-09-06 | SCSS 编译 |
| `fis-parser-svgr` | `1.0.1` | 2022-05-02 | SVG React 转换 |

判断：这不是“包已下架”的风险，而是“维护带宽不足 + 老依赖 + 新生态兼容滞后”的风险。React 19、现代 ESM 包、Node 新版本、npm audit 供应链治理都会持续放大这类风险。

## FIS3 当前在 amis 中承担的职责

### 1. 根脚本与构建入口

- 根目录 `start` 已是 Vite；`fis3`、`fis3-dev`、`fis3-serve` 仍保留开发预览入口。来源：`package.json`。
- workspace 库包构建主要是 Rollup。来源：各 `packages/*/package.json`。
- `packages/amis/build.sh` 先执行库包 Rollup，再默认执行 Rollup SDK builder 生成 `packages/amis/sdk`；旧的 `fis3 release publish-sdk` 已降级为 `AMIS_SDK_BUILDER=fis3` fallback。来源：`packages/amis/build.sh`。

### 2. 资源映射和运行时模块协议

FIS3 官方文档说明，FIS3 用静态资源映射表记录依赖、打包和 URL 信息；`__RESOURCE_MAP__` 可在任意文件中被替换为该表。FIS3 的模块化支持会在构建期分析 `define()`、`require()`、`require.async()` 等依赖，把依赖结果交给 loader 插件用于页面资源加载。来源：<https://fex-team.github.io/fis3/docs/lv3.html>

amis 在 `fis-conf.js` 中扩展 `fis3-postpackager-loader` 的 Resource，改写 resource map：

- 给 `pkg` 名加 `versionHash` 前缀。
- 将 `map.pkg` key 重写为带版本 hash 的包名。
- 输出形态是 `amis.require.resourceMap(...)`。

这说明 SDK 消费端并不是只需要静态 bundle 文件，还依赖 `amis.require` 运行时知道模块 id、包文件和异步资源之间的映射关系。

### 3. 规则式拆包能力

FIS3 官方 `deps-pack` 文档支持按入口、同步依赖 `:deps`、异步依赖 `:asyncs` 和 `!` 排除规则进行细粒度打包。来源：<https://fex-team.github.io/fis3/docs/pack.html>

amis 的 `publish-sdk` media 中大量使用该能力：

- `sdk.js` 包含 `examples/mod.js`、`examples/embed.tsx`、`examples/embed.tsx:deps`、`examples/loadMonacoEditor.ts`，同时排除 ECharts、Tinymce、Froala、CodeMirror、PDF、Office、Excel 等大模块。
- 将重模块拆成 `rich-text.js`、`tinymce.js`、`codemirror.js`、`exceljs.js`、`xlsx.js`、`markdown.js`、`color-picker.js`、`pdf-viewer.js`、`charts.js`、`office-viewer.js`、`json-view.js`、`rest.js` 等。
- 对 `*.{js,jsx,ts,tsx}` 生成基于 `package.version + 'amis-sdk' + path` 的 `moduleId`。

这部分是迁移难点之一：现代 bundler 能手工拆 chunk，但 FIS3 的 `:deps`/排除规则是以“构建期依赖图 + 文件 glob DSL”的方式表达，不能机械替换成一组 `manualChunks` 后就宣称等价。

### 4. `__uri` / `__inline` 与静态资源定位

仓库里存在大量 `__uri(...)` 和少量 `__inline(...)` 用法，覆盖示例图片、音视频、Monaco 路径、PDF worker、HTML 主题 CSS 等。

当前 Vite dev 已有 `scripts/fis3plugin.ts`，在 serve 模式把：

- `__uri('x')` 转成 `new URL('x', import.meta.url).href`。
- `__inline('x')` 转成 `import ... from 'x?inline'`。

这证明该能力在开发侧已经能用 Vite 插件表达，但发布侧还在 FIS3 中通过资源表和 `domain/release/url` 规则处理。

### 5. SDK 聚合与 CSS 作用域

`scripts/embed-packager.js` 会读取 `examples/sdk-placeholder.html`，把其中 script/link/style 对应的资源合并为 SDK 产物：

- 合并 JS 为 `sdk.js`。
- 按 `ang`、`cxd`、`dark`、`antd` 主题输出 `sdk.css`/`ang.css`/`dark.css`/`antd.css`，并保留 `prismui.css` 作为 cxd 的兼容别名。
- 对 CSS selector 加 `.prismui-scope` 前缀，同时排除 `fr-`、`fa`、`tox`、`monaco`、`vs`、`colorpicker` 等第三方全局 selector。
- 对 resource map 中相对 URL 改写为 `amis['sdk@<version>BasePath'] + ...`。

这部分本质上是一个自定义 SDK assembler，不是 FIS3 独有能力；但迁移时必须保留产物文件名、CSS 前缀策略、运行时 basePath 语义。

### 6. 特殊第三方资源布局

`publish-sdk` 将 `/node_modules/**` 发布到 `/thirds/**`，并对 `/node_modules/(*)/dist/**` 做扁平化。构建后还手工复制：

- `monaco-editor/min/vs/base/browser` 到 `sdk/thirds/monaco-editor/min/vs/base`。
- `pdfjs-dist/build/pdf.worker.min.mjs` 到 `sdk/thirds/pdfjs-dist/build/pdf.worker.min.mjs`。

Monaco 和 PDF worker 的 `filterUrl` 在 FIS3 optimizer 阶段被替换成基于 `amis['sdk@<version>BasePath']` 的同目录相对加载逻辑。迁移时必须重点做浏览器端验证。

## 替代工具能力对照

### Vite

Vite 已经是本仓库默认开发入口，且官方支持生产构建、library mode、manifest、静态资源 URL 改写、`?url`/`?raw`/`?inline`、worker 导入、legacy 插件等能力。官方文档说明 `build.manifest` 可生成“源文件名到 hash 后文件名”的映射，JS/CSS/HTML 中的资源 URL 会随 `base` 自动改写，legacy 插件可生成旧浏览器 chunk。来源：<https://vite.dev/config/build-options>、<https://vite.dev/guide/build>、<https://vite.dev/guide/assets.html>

限制：Vite library mode 是“简单且带观点”的库构建预设；官方也建议高级构建流可以直接用 tsdown 或 Rolldown。并且 Vite library mode 会让资产内联策略和 CSS split 默认行为与普通 app build 不同，这与 amis SDK 需要保留独立 thirds/worker 文件、独立主题 CSS、resource map 的诉求存在张力。

结论：Vite 适合继续负责 dev server、示例站和可能的 docs/app 构建；不建议直接用 Vite library mode 一步替换 `publish-sdk`，除非大量自定义插件绕过它的默认库模式行为。

### Rollup

Rollup 是本仓库各 package 已使用的发布构建工具，官方支持 `format: 'amd'`、AMD id/autoId/basePath/define 配置、多入口、`manualChunks`、`assetFileNames`，插件生命周期里 `generateBundle` 可以访问完整输出 bundle 并 emit 新 asset。来源：<https://rollupjs.org/configuration-options/>、<https://rollupjs.org/plugin-development/>

结论：Rollup 是替代 FIS3 SDK 发布链路的第一候选。它不能原生理解 FIS3 的 `:deps` DSL 和 `amis.require.resourceMap`，但可以通过项目内插件实现：扫描入口依赖图、输出 chunk/resource manifest、生成 `amis.require.resourceMap(...)`、复制 thirds、重写 `__uri`/`__inline`、生成 scoped theme CSS。

### Webpack / Rspack

Webpack 官方支持 AMD library 输出、asset modules、publicPath、动态 import 分包和 compilation/processAssets 插件 API。Rspack 主打 Webpack 兼容和更快构建，也有对应 chunk loading runtime 和插件模型。来源：<https://webpack.js.org/configuration/output/>、<https://webpack.js.org/configuration/module/>、<https://webpack.js.org/contribute/writing-a-plugin/>、<https://rspack.rs/>

结论：Webpack/Rspack 可以覆盖“应用 bundle + runtime chunk loading”问题，但会引入另一套 runtime 语义。amis SDK 现在依赖的是 `amis.require`/resourceMap，而不是 Webpack runtime。除非决定重写 SDK loader 协议，否则 Webpack/Rspack 不是最小迁移路径。

### esbuild / tsup / tsdown

esbuild 适合快速转译和压缩，但插件生命周期和输出图后处理能力不如 Rollup/Webpack 细。tsup/tsdown 更偏库发布封装，适合普通 ESM/CJS 包，不适合直接重建 amis SDK 的 resource map 和多主题/thirds 产物协议。

结论：可作为局部加速器或未来普通包构建候选，不适合作为 FIS3 SDK 迁移主控工具。

## 风险判断

### 继续使用 FIS3 的风险

1. **供应链风险**：FIS3 核心依赖和插件依赖偏旧，安全补丁和 Node 新版本兼容修复很难依赖上游及时提供。
2. **现代包兼容风险**：越来越多第三方包转向 ESM、exports map、条件导出、worker/module 资源；FIS3 主要靠 CommonJS hook、正则式 require 分析和 TS parser 补丁，适配成本会逐步升高。
3. **人员维护风险**：FIS3 的心智模型、插件 API、resource map/runtime 协议都偏老，新增维护者理解成本高。
4. **验证风险**：SDK 产物依赖隐式运行时协议；任何依赖升级都可能在 FIS3 编译期被误判、漏包或错包。

### 迁移 FIS3 的风险

1. **产物契约风险**：SDK 消费者可能依赖文件名、目录结构、`amis.require` 行为、basePath、主题 CSS 名称、thirds 路径。
2. **异步模块风险**：FIS3 resourceMap 与 Rollup/Webpack chunk 图不是同一个模型，异步组件、大包懒加载、CSS 依赖顺序必须逐项对齐。
3. **CSS 风险**：`embed-packager` 的 `.prismui-scope` 前缀规则不是普通 CSS bundler 行为，迁移时容易造成样式泄漏或第三方组件样式失效。
4. **Monaco/PDF worker 风险**：这类资源最容易出现路径正确但运行时加载失败的问题，需要真实浏览器验证。
5. **IE11/legacy 风险**：当前 build.sh 仍生成 `*-ie11.css`。如果仍要求 IE11 或老 WebView，需要明确 JS/CSS legacy 策略；Vite 的 legacy 插件能处理旧浏览器 chunk，但不等同于现有 SDK 的 IE11 CSS patch。

## 推荐迁移路线

### Phase 0：冻结当前契约

目标是不改构建工具，先把 FIS3 产物行为变成可对比的 golden baseline。

- 在当前分支跑一次 `packages/amis/build.sh`，保存产物清单：文件名、大小、hash、resourceMap、SDK HTML 引用、主题 CSS 列表、thirds 文件列表。
- 增加一个只读检查脚本：解析 `sdk/sdk.js` 中的 `amis.require.resourceMap(...)`，校验关键包名和关键模块是否存在。
- 当前已新增 `npm run check-sdk-contract`，它读取 `scripts/sdk-build/chunk-plan.js` 中抽出的 `publish-sdk` 分包契约，检查构建后的 `packages/amis/sdk` 目录、关键 JS/CSS/thirds 文件、resource map chunk 引用和 scoped CSS 前缀。
- 用浏览器跑 SDK smoke：embed 加载、主题切换、Monaco、PDF viewer、ECharts/wordCloud、Tinymce/Froala、Markdown、Excel/Xlsx、Office viewer、图片/音视频 `__uri`。

当前验证记录：2026-08-13 在 Node `v22.23.1` 下重新跑 `npm run build --workspace amis`，完整构建退出码为 0，随后 `npm run check-sdk-contract` 通过，输出 `SDK resource map: 1479 resources, 16 packages` 和 `SDK contract OK: 40 expected files checked.`。这说明 Phase 0 的最小 SDK 产物契约已经可在当前分支复现。

本轮为让 Phase 0 可复现，修掉了几处“继续依赖 FIS3 时会越来越常见”的兼容问题：

- `fis-optimizer-terser -> deasync` 在 Node `v22.23.1` 下缺原生 binding，需要先执行 `npm rebuild deasync` 才能运行 FIS3 optimizer。
- `scripts/embed-packager.js` 原先用旧 `css` parser 做 SDK CSS scope 前缀，遇到现代 CSS cascade layer 语法（例如 `@layer prismui.reset, prismui.tokens, prismui.components, prismui.theme, prismui.user;`）会报 `missing '}'`；当前已改为 PostCSS parse/walk，保留原有 selector prefix 规则。
- `react-player@3.4.0` 发布为 ESM，FIS3/Terser 会对 `node_modules/react-player/dist/index.js` 报 `"Import" statement may only appear at the top level`；当前已把 `react-player/**.js` 加入 `fis-conf.js` 既有 ESM TypeScript parser 匹配。
- `scripts/build-schemas.ts` 原先 `main().catch(console.error)` 会吞掉 schema 生成失败，导致 `npm run build --workspace amis` 可能打印异常但退出码仍为 0；当前已让异常设置非零退出码，并把 schema 无关的 React/JSX 展示层类型按 `any` 处理，避免 React 19 类型下 `ts-json-schema-generator` 卡在 `JSX.Element`。

当前仍存在但未阻断构建的 warning：Dart Sass slash division deprecation；FIS3 对 `xlsx` 的可选 Node 依赖 `fs`/`stream` 解析告警；`amis-ui/lib/components/Tinymce.js` 中 `tinymce/plugins/template` 解析告警；以及 rc 系列包的 `rc-motion`、`rc-resize-observer` 解析告警。这些应记录为后续迁移/依赖清理事项，但不属于本轮 SDK 契约冻结的阻塞项。

### Phase 1：把 FIS3 配置中的职责拆成显式模块

不先替换工具，先抽出可测试逻辑。

- 将 `scripts/embed-packager.js` 中 CSS prefix、HTML script/link 收集、resourceMap URL 改写拆成独立纯函数并加测试。当前已先抽出 `scripts/sdk-build/prefix-sdk-css.js`、`scripts/sdk-build/build-sdk-theme-css.js`、`scripts/sdk-build/rewrite-sdk-css-urls.js`、`scripts/sdk-build/rewrite-sdk-resource-map.js`、`scripts/sdk-build/collect-sdk-placeholder-assets.js` 和 `scripts/sdk-build/prepare-sdk-js.js`，让 FIS3 `embed-packager` 和未来 SDK builder 共享同一套 `.prismui-scope` 前缀规则、主题 CSS 输出规则、package CSS URL 到 SDK `thirds/` 的改写规则、`sdk@<version>BasePath` URL 改写协议、placeholder 资源分类逻辑和 SDK JS 后处理规则。
- 将 `fis-conf.js` 中 `publish-sdk` 的包规则整理成数据文件，例如 `scripts/sdk-build/chunks.ts`。当前已先用 CommonJS 数据文件 `scripts/sdk-build/chunk-plan.js` 承接现有分包契约，供 contract check 和未来 Rollup/Vite SDK builder 共享。
- 将 `__uri`/`__inline` 转换规则统一到可复用插件，避免 Vite dev 和 FIS publish 双轨漂移。

### Phase 2：Rollup 并行产出 SDK vNext

新增 `scripts/sdk-build`，先并行输出到 `sdk-next/`，不替换正式 `sdk/`。

当前已新增第一版 `npm run build-sdk-next`，先以 `contract-mirror` 模式从当前已验证的 `packages/amis/sdk` 物化 `packages/amis/sdk-next` 并生成 `sdk-next-manifest.json`，再通过 `npm run check-sdk-next-contract` 复用同一套 SDK 契约检查。这一步还不是 Rollup 打包本体，而是先把并行输出目录、忽略规则、文件清单和契约校验链路固定下来，后续再把输入侧从 FIS3 产物替换为 Rollup 产物。

当前还新增 `npm run build-sdk-next-rollup-entry`，在默认镜像契约文件的基础上，把真实 `examples/embed.tsx` 的 Rollup 内存构建产物写入 `packages/amis/sdk-next/rollup-entry/`，并在 `sdk-next-manifest.json` 里记录 Rollup 入口、入口 alias、chunk、resource/package 数和输出文件。`rollup-entry/sdk.js` 当前会先注入现有 `examples/mod.js` loader，再通过一个局部 AMD bridge 把 Rollup 标准 AMD 签名适配为 `amis.define(id, factory)`，然后只暴露当前确实有 Rollup AMD module 支撑的 `amis/embed` 与 `amis@<version>/embed` alias，随后内嵌 `amis.require.resourceMap(...)` 并使用现有 SDK 的 `amis['sdk@<version>BasePath']` URL 表达式；同时保留独立 `resource-map.js` 作为诊断产物。这一步仍故意不覆盖顶层 public `sdk.js` 或发布目录，CSS 与静态/runtime 资源已开始在嵌套的 `rollup-entry/` overlay 中由源码/依赖生成或复制，但还不声称 `react`、`amis-core` 等完整 FIS aliasMapping 已经等价，因此 `npm run check-sdk-next-contract` 仍然验证当前 FIS3 public contract；`rollup-entry/` 只是并行迁移产物，用来逐步收敛真实 Rollup SDK builder。

核心插件建议：

1. `legacyResourcePlugin`：生成兼容 `amis.require.resourceMap(...)` 的 map，保持 module id 规则。
   - 当前已先新增 `scripts/sdk-build/rollup-resource-map.js` 和 `scripts/sdk-build/rollup-sdk-resource-map-plugin.js`，用 synthetic Rollup bundle 验证从 chunk/imports/modules 生成 `pkg`/`res` 的最小 resourceMap 形态，并通过 Rollup `generateBundle` 插件壳 `emitFile` 输出 `amis.require.resourceMap(...)`。
2. `sdkChunkPlanPlugin`：用显式 chunk plan 替代 FIS3 `deps-pack` DSL，初期按现有 `sdk.js`、`charts.js`、`tinymce.js` 等文件名一一对应。
   - 当前已先新增 `scripts/sdk-build/rollup-sdk-chunk-manifest.js`，通过 Rollup `generateBundle` 输出 `sdk-chunk-manifest.json`，把实际 chunk 列表与 `chunk-plan` 的必需/可选 chunk 做对照。
   - 当前还新增 `scripts/sdk-build/rollup-sdk-manual-chunks.js`，把 `chunk-plan` 中的正向专用分包规则转换为 Rollup `manualChunks` 函数，并在 smoke check 中验证 `echarts`/`zrender` 进入 `charts.js`、Markdown 组件进入 `markdown.js`、当前 `@uiw/react-json-view` 依赖进入 `json-view.js`；`amis-core` 的 JsonView wrapper 保持在正常依赖图中，避免人为挪入专用 chunk 后改变执行顺序。第一版故意不映射 `sdk.js`、`!` 排除规则和 `:deps`/`:asyncs` 语义，避免把 FIS3 依赖图 DSL 误声明为已完整等价；这些需要等 Rollup 输入图和完整 SDK builder 接上后再做严格对齐。
   - 当前还新增 `scripts/sdk-build/rollup-sdk-rest-pack.js`，在 Rollup 已生成 AMD chunk 后，把非预期的动态入口 chunk 物理合并进 `rest.js`，把非计划的静态入口辅助 chunk 合入 `sdk.js`，并重写 `resource-map.js` 和 `sdk-chunk-manifest.json`。这里故意不使用 broad `manualChunks` 兜底，因为它会改变 Rollup 依赖图，把依赖一并吸入 `rest`，形成类似 `color-picker -> rest -> json-view -> color-picker` 的 chunk 循环，并触发 CommonJS exports 半初始化问题。

当前还新增 `npm run check-sdk-rollup-plugins`，使用 Rollup JS API 和虚拟入口真实跑一遍 `generateBundle`，确认 resource map 插件、chunk manifest 插件和 manualChunks 映射能在 Rollup 生命周期里 emit 可解析 asset。

当前还新增 `npm run check-sdk-rollup-entry`，使用真实 `examples/embed.tsx` 入口跑一次内存 Rollup 构建，并把 workspace 包显式锚到当前 SDK/FIS3 依赖的 `lib` 入口，避免 package `exports.import` 把 `amis-ui/lib/*` 重定向到 `esm/*` 后产生与现有 SDK 路径不同的导出校验结果。现在该检查还会用 jsdom 执行 embedded `sdk.js`，验证 `window.amisRequire`、`amis/embed` 和 `amis@<version>/embed` 在 runtime 下能拿到 `embed()`，并拦截动态 script 加载来渲染一个最小 `page` schema，覆盖 lazy renderer chunk 加载链路；resource map 也会额外声明 `hls.js`、`mpegts.js` 和 `node_modules/pdfjs-dist/build/pdf.mjs` 三个外部 runtime entry，指向 `sdk/thirds` 兼容目录。Rollup entry helper 也已把 FIS CJS 产物里的 `require(['./renderers/X.js', 'tslib'], cb)` 转成 Rollup 可见的 dynamic import，并让 resource map 使用 chunk module id 而不是 package id 表达依赖。这一步依赖先按正式发布顺序生成 fresh workspace `lib`；它只证明真实入口、SWC TS/TSX transform、asset 空模块、loader bridge、entry alias、resource map、chunk manifest、基础 lazy renderer 和外部 runtime resourceMap entry 的最小链路能跑通，尚不声明 `sdk-next` 已具备完整 SDK 分包能力。

当前还新增 `npm run check-sdk-theme-css`，专门验证已抽出的 SDK 主题 CSS helper：主题文件互斥组合、`prismui` 输出为 `sdk.css`、常规选择器加 `.prismui-scope`、`body/html` 根选择器重写、`:root`/`@keyframes`/Froala/TinyMCE/Monaco 这类全局或第三方选择器保持不被误加前缀，并覆盖 Font Awesome 这类 package CSS 相对字体 URL 改写到 SDK `thirds/` 的规则。它仍只是 CSS 产物协议护栏，不代表 Rollup 已正式接管 SDK CSS 打包。

当前还新增 `npm run check-sdk-theme-css-source-parity`，用真实 `examples/sdk-placeholder.html` 入口重新收集 SDK CSS 源、编译 `amis-ui` SCSS、执行 package CSS URL 改写、简单 `calc()` 算术规约和 `.prismui-scope` 前缀后，与正式 `packages/amis/sdk` 中四套主题 CSS 做声明级对比。该检查现在能确认源码生成的主题 CSS 声明集合与正式 SDK CSS 对齐，并把剩余差异收窄分类为：颜色表示/舍入差异、可由同一 `calc()` 规约器证明等价的算术表达式差异、CSS `min/max/clamp` 中是否保留 `calc()` wrapper 的等价差异，以及正式 SDK CSS 中遗留的预处理表达式（例如 `$i`、`px2rem(...)`、`var($zindex-top)`）。2026-08-14 在当前分支下修复了 source SCSS 中这类未插值表达式后，验证结果为 `211973 declarations compared`、`132 color representation differences classified`、`740 calc arithmetic representation differences classified`、`4 CSS math calc wrapper differences classified`、`52 formal CSS preprocessor expression differences classified`。最后一类现在代表正式 `packages/amis/sdk` 基线里尚未重建的预处理残留，不是普通像素噪声；切换 CSS 来源前需要单独决定是重建/修正式 SDK 基线、接受 source CSS 的修正行为，还是增加面向相关组件的视觉/交互回归确认。因此不能把该检查通过等同于已经可以直接替换正式 CSS 产物。

当前还新增 `npm run check-sdk-rollup-directives` 和 Rollup entry 内的 `sdk-fis-directives` 插件，先覆盖 SDK 真实入口里已经出现的 FIS 专有资源语义：`examples/loadPdfjsWorker.ts` 的 `__uri('pdfjs-dist/...')` 会被改写成 SDK 内 `/thirds/...` URL，`filterUrl(url)` 会按正式 SDK 行为拼上 `amis['sdk@<version>BasePath'] + url.substring(1)`；`packages/amis-ui/lib/components/Editor.js` 的 Monaco worker `/pkg/*.js` 也复用同一 `filterUrl` 改写。插件同时覆盖 `examples/loadMonacoEditor.ts` 这条后续可能进入 Rollup 图的 Monaco loader 路径，并支持当前 examples 中实际出现的相对 JSON `__inline('./*.json')` 形态。这个插件目前只覆盖 worker/thirds URL 和 JSON inline，不处理 examples 普通图片音视频，也不做通用文件内联器。

`build-sdk-next-rollup-entry` 现在还会把 `iconfont.*` 从 `examples/static` 复制、`locale/de-DE.js` 由 `packages/amis-ui/src/locale/de-DE.ts` 生成、Font Awesome webfonts / moment-timezone packed data / Monaco `min/vs` 已发布子集 / PDF worker 从对应 `node_modules` 直接复制到 `sdk-next/rollup-entry/`，让 embedded `sdk.js` 按自身 `currentScript` 推导出的 basePath 加载 pdf/Monaco worker、Font Awesome 字体、iconfont 与 locale 资源时有同目录静态资源可用。`thirds/hls.js/hls.js`、`thirds/mpegts.js/mpegts.js` 现在由对应依赖的发布版 UMD 文件包成 `amis.define('hls.js'| 'mpegts.js')`，`thirds/pdfjs-dist/build/pdf.js` 则由 `pdfjs-dist/build/pdf.mjs` 通过 Rollup 转成 CommonJS 后包成 `amis.define('node_modules/pdfjs-dist/build/pdf.mjs')`；这三项仍保持正式 SDK 的 `thirds` 文件布局，但不再复用 FIS 已包装产物。`check-sdk-next-contract` 在检测到 manifest 里存在 `rollupEntry` 时，会校验静态文件被列入 manifest、`thirds` 文件集合与正式 SDK 对齐、外部 runtime resourceMap entry 指向正确文件，并用 jsdom 直接加载三份 runtime AMD 文件确认 HLS / mpegts / pdfjs 关键 API 可用。

`build-sdk-next-rollup-entry` 同时会把 `sdk.css`、`ang.css`、`dark.css`、`antd.css` 四套主主题 CSS 由 `buildSdkThemeCssFromSource` 直接生成到 `sdk-next/rollup-entry/`，并把 `prismui.css` 作为 `sdk.css` 的兼容别名同步写出；`sdk-ie11.css`、`ang-ie11.css`、`dark-ie11.css`、`antd-ie11.css` 则用 source 主题 CSS 追加 `ie11-patch.css` 后跑 `postcss-custom-properties({preserve: false})` 生成到同一个 SDK 目录（next overlay 为 `sdk-next/rollup-entry/`，正式 Rollup SDK 为 `packages/amis/sdk/`），并同步写出 `prismui-ie11.css` 兼容别名；`helper.css` 由 `amis-ui/scss/helper.scss` 通过 Sass + autoprefixer 生成。manifest 的 `rollupEntry.cssFiles` 会列出默认加载的主 SDK CSS，`rollupEntry.ie11CssFiles` 会列出同目录内可选加载的 IE11 静态 CSS fallback，contract 会验证它们存在、非空、主要主题文件仍包含 `.prismui-scope`、`sdk.css`/`prismui.css` 与 `sdk-ie11.css`/`prismui-ie11.css` 兼容别名一致，并确认 rollup-entry CSS 没有未解析 Sass 表达式。这一步代表 Rollup entry overlay 的 SDK CSS 已脱离直接复制 FIS3 产物；IE11 fallback 会进入 SDK 发布目录，但默认示例不加载它，因此影响的是发布目录总尺寸，不是现代浏览器激活加载尺寸。

Rollup entry 还会输出 `sdk-empty-assets.json`，记录被 `emptyAssetImports` 占位掉的裸 CSS/图片/font import；当前 contract 要求该列表为空，避免迁移过程中新增资源依赖被静默替换成空字符串。

runtime smoke 曾暴露过两个边界：正式 FIS SDK 在同一 jsdom 环境下会先遇到 `Cannot find module "util"` 的基线问题；Rollup entry 如果使用未重新构建的 checked-in `lib`，会触发 `registerRenderer({getComponent})` 与 `packages/amis-core/lib/factory.js` 旧实现不兼容的问题。当前采用“先运行 workspace build 生成 fresh lib”的路线通过检查，并在 Rollup entry helper 中显式校验 `packages/amis-core/lib/factory.js` 已包含 async renderer 支持；另一条“让 Rollup 输入图直接吃 `src`”会继续牵涉 decorators、type-only import 等 TS 语义，暂不在 entry overlay 里临时补丁化。
3. `fisDirectivePlugin`：处理 `__uri`/`__inline`。
4. `sdkCssPlugin`：输出四套主题 CSS 并执行 `.prismui-scope` 前缀逻辑。
5. `thirdsCopyPlugin`：复制 Monaco、PDF worker 和需要保留路径的第三方资源。
6. `sdkPlaceholderPlugin`：替代 `embed-packager`，生成/合并 SDK 入口文件。

验收标准：`sdk-next/` 的 public contract 与 `sdk/` 等价，而不是字节级完全相同。

### Phase 3：切换 publish-sdk

当前已完成 SDK 发布路径切换：`packages/amis/build.sh` 默认使用 `node ../../scripts/sdk-build/build-sdk-next.js --mode rollup-sdk` 直接生成正式 `packages/amis/sdk`，`npm run build --workspace amis` 因此不再默认进入 `fis3 release publish-sdk`。

为了降低发布窗口内的排障风险，短期仍保留 FIS3 fallback：可以通过 `AMIS_SDK_BUILDER=fis3 npm run build --workspace amis` 或根脚本 `npm run build-sdk-fis3` 复现旧路径。这个 fallback 只应服务于一两个版本内的产物差异定位，不应继续作为长期双主路径。

当前 Rollup SDK 输出仍复用前面抽出的 SDK 契约和检查链路，已覆盖入口 `sdk.js`、resource map、16 个计划 chunk、四套主题 CSS、IE11 CSS 兼容别名、locale、iconfont、Monaco/PDF/HLS/mpegts 等 `thirds` 静态/runtime 资源。

2026-08-14 对比 Rollup 默认产物与 FIS3 fallback 产物，结论是“发布契约一致，但不是字节级一致”：

- 构建命令均退出 0：Rollup 使用 `node scripts/sdk-build/build-sdk-next.js --mode rollup-sdk --out-dir /tmp/amis-sdk-compare/rollup`，FIS3 使用 `AMIS_SDK_BUILDER=fis3 npm run build --workspace packages/amis` 后复制 `packages/amis/sdk`。
- 文件集合一致：两边均为 106 个文件，公共文件 106 个，Rollup-only/FIS3-only 均为 0；其中 72 个文件 hash 相同，34 个文件内容不同。
- SDK contract 均通过：Rollup 为 `5975 resources, 16 packages`，FIS3 为 `1439 resources, 16 packages`；16 个 package chunk URL 集合一致，均指向 `sdk.js`、`rest.js`、`charts.js`、`tinymce.js`、`xlsx.js` 等计划 chunk。
- 静态资源大体一致：`helper.css`、`locale/de-DE.js`、`iconfont.*`、`thirds/pdfjs-dist/build/pdf.worker.min.mjs` 等关键静态文件 hash 相同；`pdf.js`、HLS、mpegts、Monaco loader/runtime 文件因包装或生成方式不同而 hash 不同。
- CSS 是小幅生成差异：四套主题 CSS 的 Rollup 产物比 FIS3 每个约多 5.6KB raw、约多 2KB gzip；`helper.css` 完全一致。
- JS chunk 是主要差异：Rollup `sdk.js/rest.js/charts.js/tinymce.js/color-picker.js/pdf-viewer.js` 等 raw/gzip 体积明显大于 FIS3。当前这不是文件契约失败，但属于发布体积和加载性能风险，后续需要用 SDK smoke、交互回归和体积预算单独判定是否可接受。

随后已给 Rollup SDK 输出补上生产环境常量内联和 SWC 压缩，并将 `resourceMap` 从 Rollup 内部 module id 收敛到真实 AMD define id。该阶段的正式 Rollup SDK 基线为 `60.504 MiB raw / 11.957 MiB gzip`，比未压缩 Rollup 少约 `25.753 MiB raw / 3.451 MiB gzip`；对比 FIS3 fallback 仍多 `2.481 MiB raw / 0.791 MiB gzip`。根目录 JS chunk 是主要收益来源：从 `41.978 MiB raw / 7.858 MiB gzip` 降到 `16.225 MiB raw / 4.408 MiB gzip`。resourceMap 已从初始 Rollup 的几千个内部模块条目收敛到 SDK 运行时实际可 require 的 AMD module id，而不是 Rollup 中间模块。

压缩策略采用顺序 SWC `compress + mangle`，并保持现有 `sdk.js`、`rest.js`、`color-picker.js` 等 chunk 拓扑不变。曾尝试新增内嵌 `sdk-shared` chunk 把 React/MobX/MST/lodash 等公共模块从 `color-picker.js` 抽回入口，体积上能继续降低 `color-picker.js`，但会在 `check-sdk-rollup-entry` 的 jsdom runtime smoke 中触发 CommonJS 初始化顺序错误，因此本轮不纳入正式方案。剩余体积差异应优先看拆包语义和懒加载边界，而不是继续堆压缩强度。

2026-08-14 继续追问的是 SDK 发布目录的 raw 打包原始尺寸，而不是 gzip/Brotli 传输压缩率。按当前 `packages/amis/sdk` 与 FIS3 fallback `/tmp/amis-sdk-compare/fis3-1786693063` 对比：当前 Rollup SDK 为 `60.504 MiB raw`，FIS3 为 `58.023 MiB raw`，净多 `2.481 MiB raw`。分层看，根目录 JS chunk 从 `13.336 MiB` 增到 `16.245 MiB`，多 `2.909 MiB`；`thirds` JS 反而少 `0.480 MiB`，CSS 只多 `0.052 MiB`，fonts/icons/worker/other 基本持平。因此 raw 尺寸问题几乎全部集中在根目录 JS chunk。

同名文件 raw 增量最大的是：

- `rest.js`：多 `1.859 MiB`。未压缩 Rollup 图显示主要来源包括 `hls-video-element/node_modules/hls.js/dist/hls.mjs` 约 `1.410 MiB`、`dashjs` 约 `0.794 MiB`、`moment-timezone/data/packed/latest.json` 约 `0.693 MiB`、`media-chrome`/Mux/Vimeo 等播放器生态。来源：`packages/amis/src/renderers/VideoPlayer.tsx`、`node_modules/react-player/dist/players.js`、`scripts/sdk-build/rollup-sdk-rest-pack.js`。
- `color-picker.js`：多 `1.205 MiB`。它不只是颜色组件和 `react-color`，还承接了 `amis-core`、`react-dom`、MobX/MST、lodash、moment、formula 等共享运行时。来源：`scripts/sdk-build/rollup-sdk-manual-chunks.js` 的 chunk 归属规则和 Rollup module graph。
- `charts.js`：多 `0.323 MiB`。Rollup 图里同时出现 `echarts/dist/echarts.js` 和大量 `echarts/lib/*` 模块，`echarts-wordcloud` 源码也从 `echarts/lib/echarts` 入口接入，需要进一步统一入口验证。来源：`packages/amis/src/renderers/Chart.tsx`、`node_modules/echarts-wordcloud/src/*.js`。
- `pdf-viewer.js`：多 `0.292 MiB`。`pdfjs-dist/build/pdf.mjs` 被打进 chunk，同时 SDK 目录还发布 `thirds/pdfjs-dist/build/pdf.js` runtime。来源：`packages/amis-ui/src/components/PdfViewer.tsx`、`scripts/sdk-build/sdk-runtime-assets.js`。
- `sdk.js`：多 `0.152 MiB`。当前最终入口会同步内嵌 `barcode.js`、`color-picker.js`、`json-view.js`、`pdf-viewer.js`，而这些文件仍作为独立 chunk 发布；四个独立文件合计约 `1.765 MiB raw`。`examples/mod.js` 的 `require.async` 在模块已经被 `factoryMap` 定义时不会再拉对应 package，所以标准 `<script src="sdk.js">` 路径下这部分很可能是实质重复；风险是 public chunk URL 契约和直接加载这些文件的用户。

还能继续压 raw 的候选方向，按优先级和风险排序：

- 选择一种 PDF runtime 形态。要么让 `react-pdf`/`pdfjs-dist` 真正 external 到 `thirds/pdfjs-dist/build/pdf.js`，要么不再发布未被正式 `pdf-viewer.js` 消费的同功能 runtime。预计 raw 收益约 `0.3-0.6 MiB`，需要真实浏览器验证 PDF worker、`react-pdf` module shape 和 basePath。
- 处理 moment-timezone 数据。`packages/amis/src/renderers/Date.tsx` 同步 `import 'moment-timezone'`，会把完整 packed data 打进 JS；SDK 目录还复制了一份 `thirds/moment-timezone/data/packed/latest.json`，但源码搜索只看到构建和 contract 直接引用这份静态 JSON。如果这不是公开兼容契约，可以先移除静态 JSON，收益约 `0.693 MiB raw`；如果要继续减 `rest.js`，可评估 alias 到 `moment-timezone-with-data-1970-2030` 或 `10-year-range`，但会改变远年份时区语义。
- 处理入口内嵌重复。不能简单禁止内嵌，因为 `amisRequire('amis/embed')` 是同步 API，入口同步依赖必须已定义；但可以在“内嵌后不再发布重复 chunk”和“保持独立 chunk、入口改成真正 lazy 边界”两条路中选一条，前者影响 public 文件契约，后者要改 renderer 注册/loader 同步语义。理论 raw 上限约 `1.7-1.8 MiB`。
- 暂不建议重试全局 `sdk-shared`。此前把 React/MobX/MST/lodash 等硬抽公共 chunk 虽然能降 `color-picker.js`，但已在 `check-sdk-rollup-entry` jsdom runtime smoke 中触发 CommonJS 初始化顺序错误；若要做，只能围绕单个库做小范围 external，并配套 runtime smoke。

不建议的方向：继续换 Terser/esbuild、追 `unsafe`/property mangling、单纯把 `rest.js` 拆成更多文件、或者只讨论 gzip/Brotli。前两者对 raw 收益小且风险高；单纯拆文件会改善首轮加载口径，但全 SDK raw 总量不降；Brotli 是传输层收益，不改变发布目录原始尺寸。

2026-08-14 已先落地第一项低侵入瘦身：`VideoPlayer` 不再直接 lazy import 默认 `react-player` 入口，而是使用项目内 `VideoReactPlayer` wrapper，只保留 `VideoPlayer` 实际会路由过去的 DASH、Mux、YouTube、Vimeo、Wistia 和 HTML fallback provider。HLS/FLV 继续走现有原生 `<video>` + `hls.js`/`mpegts.js` runtime。重建 `packages/amis/sdk` 后，全量 raw 从 `60.504 MiB` 降到 `59.917 MiB`，减少约 `0.587 MiB`；`rest.js` 从 `4.600 MiB` 降到 `4.014 MiB`。Rollup module graph 复核显示 `hls-video-element` 和其 nested `hls.js` 均为 `0`，DASH/YouTube/Vimeo/Wistia/Mux 仍保留。验证命令：`npm test --workspace packages/amis -- --runTestsByPath __tests__/renderers/Video.test.tsx`、`NODE_ENV=production ../../node_modules/.bin/rollup -c`、`npm run build-sdk-rollup`、`npm run check-sdk-contract`、`npm run check-sdk-rollup-entry`。

2026-08-14 随后落地第二项瘦身：Rollup SDK 构建内将 `echarts`、`echarts/lib/echarts(.js)` 和 `echarts-wordcloud/dist/echarts-wordcloud` 统一到 ECharts ESM full entry 与 `echarts-wordcloud` 源码入口，消除 `charts.js` 中 `echarts/dist/echarts.js` 与 `echarts/lib/*` 并存的重复。未压缩 Rollup 图显示 `echarts/dist` 从 `3.836 MiB` 降到 `0`，`echarts-wordcloud/dist` 从 `0.047 MiB` 降到 `0`；正式落盘后 `charts.js` 从 `2.195 MiB raw / 0.727 MiB gzip` 降到 `1.107 MiB raw / 0.366 MiB gzip`，并且比 FIS3 fallback 的 `1.871 MiB raw / 0.610 MiB gzip` 更小。全量 SDK raw 从 `59.917 MiB` 降到 `58.829 MiB`，对比 FIS3 fallback `58.023 MiB` 只多 `0.806 MiB raw`。`check-sdk-rollup-entry` 已新增 chart runtime smoke，会在 jsdom 中触发 chart lazy renderer、加载 `charts.js` 并确认 ECharts 实例创建；同一检查还断言 Rollup SDK 不再打包 `node_modules/echarts/dist/` 或 `echarts-wordcloud/dist/echarts-wordcloud`。验证命令：`npm run build-sdk-rollup`、`npm run check-sdk-contract`、`npm run check-sdk-rollup-entry`。

### Phase 4：处理 gh-pages 和删除 FIS3

SDK 链路已经由 Rollup 接管，但仓库还没有完全摆脱 FIS3：根目录 dev 脚本、`fis-conf.js` 和 `gh-pages` media 仍在承担文档站 markdown 编译、示例页复制、API mock 地址替换、路由页面复制等职责。这部分适合单独迁移到 Vite 多页面构建 + 现有 markdown/mock 插件承接，不应混入 SDK 发布路径切换提交。

最后删除根目录 FIS3 脚本和 FIS3 插件依赖。

## 是否需要马上迁移？

SDK 发布路径已经启动并完成 Phase 3 切换；后续不要再把 FIS3 作为 SDK 主路径。剩余是否马上继续迁移 gh-pages/dev FIS3，需要单独评估发布站点验证成本。理由：

- 风险真实存在：FIS3 生态老化，未来依赖升级会越来越被动。
- 迁移复杂度也真实存在：当前 FIS3 承载了 amis SDK 的运行时协议，不是普通 bundler 替换。
- SDK 的最小正确动作已经完成：先把产物协议文档化、测试化，再用 Rollup 按协议复刻并切到默认发布路径。

优先级建议：下一条主线应从 “FIS3 gh-pages/dev 迁移” 开始，而不是继续改 SDK builder。第一批只迁移站点构建与路径发布规则，并继续保留 SDK contract / Rollup entry 检查作为回归护栏。
