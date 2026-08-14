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
- `packages/amis/build.sh` 先执行 Rollup，再执行 `fis3 release publish-sdk -c -f ../../fis-conf.js`，所以 SDK 产物仍依赖 FIS3。来源：`packages/amis/build.sh`。

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
- 按 `ang`、`cxd`、`dark`、`antd` 主题输出 `sdk.css`/`ang.css`/`dark.css`/`antd.css`。
- 对 CSS selector 加 `.amis-scope` 前缀，同时排除 `fr-`、`fa`、`tox`、`monaco`、`vs`、`colorpicker` 等第三方全局 selector。
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
3. **CSS 风险**：`embed-packager` 的 `.amis-scope` 前缀规则不是普通 CSS bundler 行为，迁移时容易造成样式泄漏或第三方组件样式失效。
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
- `scripts/embed-packager.js` 原先用旧 `css` parser 做 SDK CSS scope 前缀，遇到现代 CSS cascade layer 语法（例如 `@layer amis.reset, amis.tokens, amis.components, amis.theme, amis.user;`）会报 `missing '}'`；当前已改为 PostCSS parse/walk，保留原有 selector prefix 规则。
- `react-player@3.4.0` 发布为 ESM，FIS3/Terser 会对 `node_modules/react-player/dist/index.js` 报 `"Import" statement may only appear at the top level`；当前已把 `react-player/**.js` 加入 `fis-conf.js` 既有 ESM TypeScript parser 匹配。
- `scripts/build-schemas.ts` 原先 `main().catch(console.error)` 会吞掉 schema 生成失败，导致 `npm run build --workspace amis` 可能打印异常但退出码仍为 0；当前已让异常设置非零退出码，并把 schema 无关的 React/JSX 展示层类型按 `any` 处理，避免 React 19 类型下 `ts-json-schema-generator` 卡在 `JSX.Element`。

当前仍存在但未阻断构建的 warning：Dart Sass slash division deprecation；FIS3 对 `xlsx` 的可选 Node 依赖 `fs`/`stream` 解析告警；`amis-ui/lib/components/Tinymce.js` 中 `tinymce/plugins/template` 解析告警；以及 rc 系列包的 `rc-motion`、`rc-resize-observer` 解析告警。这些应记录为后续迁移/依赖清理事项，但不属于本轮 SDK 契约冻结的阻塞项。

### Phase 1：把 FIS3 配置中的职责拆成显式模块

不先替换工具，先抽出可测试逻辑。

- 将 `scripts/embed-packager.js` 中 CSS prefix、HTML script/link 收集、resourceMap URL 改写拆成独立纯函数并加测试。当前已先抽出 `scripts/sdk-build/prefix-sdk-css.js`、`scripts/sdk-build/build-sdk-theme-css.js`、`scripts/sdk-build/rewrite-sdk-resource-map.js`、`scripts/sdk-build/collect-sdk-placeholder-assets.js` 和 `scripts/sdk-build/prepare-sdk-js.js`，让 FIS3 `embed-packager` 和未来 SDK builder 共享同一套 `.amis-scope` 前缀规则、主题 CSS 输出规则、`sdk@<version>BasePath` URL 改写协议、placeholder 资源分类逻辑和 SDK JS 后处理规则。
- 将 `fis-conf.js` 中 `publish-sdk` 的包规则整理成数据文件，例如 `scripts/sdk-build/chunks.ts`。当前已先用 CommonJS 数据文件 `scripts/sdk-build/chunk-plan.js` 承接现有分包契约，供 contract check 和未来 Rollup/Vite SDK builder 共享。
- 将 `__uri`/`__inline` 转换规则统一到可复用插件，避免 Vite dev 和 FIS publish 双轨漂移。

### Phase 2：Rollup 并行产出 SDK vNext

新增 `scripts/sdk-build`，先并行输出到 `sdk-next/`，不替换正式 `sdk/`。

当前已新增第一版 `npm run build-sdk-next`，先以 `contract-mirror` 模式从当前已验证的 `packages/amis/sdk` 物化 `packages/amis/sdk-next` 并生成 `sdk-next-manifest.json`，再通过 `npm run check-sdk-next-contract` 复用同一套 SDK 契约检查。这一步还不是 Rollup 打包本体，而是先把并行输出目录、忽略规则、文件清单和契约校验链路固定下来，后续再把输入侧从 FIS3 产物替换为 Rollup 产物。

当前还新增 `npm run build-sdk-next-rollup-entry`，在默认镜像契约文件的基础上，把真实 `examples/embed.tsx` 的 Rollup 内存构建产物写入 `packages/amis/sdk-next/rollup-entry/`，并在 `sdk-next-manifest.json` 里记录 Rollup 入口、入口 alias、chunk、resource/package 数和输出文件。`rollup-entry/sdk.js` 当前会先注入现有 `examples/mod.js` loader，再通过一个局部 AMD bridge 把 Rollup 标准 AMD 签名适配为 `amis.define(id, factory)`，然后只暴露当前确实有 Rollup AMD module 支撑的 `amis/embed` 与 `amis@<version>/embed` alias，随后内嵌 `amis.require.resourceMap(...)` 并使用现有 SDK 的 `amis['sdk@<version>BasePath']` URL 表达式；同时保留独立 `resource-map.js` 作为诊断产物。这一步故意不覆盖顶层 `sdk.js`、CSS、thirds 或 locale 文件，也不声称 `react`、`amis-core` 等完整 FIS aliasMapping 已经等价，因此 `npm run check-sdk-next-contract` 仍然验证当前 FIS3 public contract；`rollup-entry/` 只是并行迁移产物，用来逐步收敛真实 Rollup SDK builder。

核心插件建议：

1. `legacyResourcePlugin`：生成兼容 `amis.require.resourceMap(...)` 的 map，保持 module id 规则。
   - 当前已先新增 `scripts/sdk-build/rollup-resource-map.js` 和 `scripts/sdk-build/rollup-sdk-resource-map-plugin.js`，用 synthetic Rollup bundle 验证从 chunk/imports/modules 生成 `pkg`/`res` 的最小 resourceMap 形态，并通过 Rollup `generateBundle` 插件壳 `emitFile` 输出 `amis.require.resourceMap(...)`。
2. `sdkChunkPlanPlugin`：用显式 chunk plan 替代 FIS3 `deps-pack` DSL，初期按现有 `sdk.js`、`charts.js`、`tinymce.js` 等文件名一一对应。
   - 当前已先新增 `scripts/sdk-build/rollup-sdk-chunk-manifest.js`，通过 Rollup `generateBundle` 输出 `sdk-chunk-manifest.json`，把实际 chunk 列表与 `chunk-plan` 的必需/可选 chunk 做对照。
   - 当前还新增 `scripts/sdk-build/rollup-sdk-manual-chunks.js`，把 `chunk-plan` 中的正向专用分包规则转换为 Rollup `manualChunks` 函数，并在 smoke check 中验证 `echarts`/`zrender` 进入 `charts.js`、Markdown 组件进入 `markdown.js`。第一版故意不映射 `sdk.js`、`rest.js`、`!` 排除规则和 `:deps`/`:asyncs` 语义，避免把 FIS3 依赖图 DSL 误声明为已完整等价；这些需要等 Rollup 输入图和完整 SDK builder 接上后再做严格对齐。

当前还新增 `npm run check-sdk-rollup-plugins`，使用 Rollup JS API 和虚拟入口真实跑一遍 `generateBundle`，确认 resource map 插件、chunk manifest 插件和 manualChunks 映射能在 Rollup 生命周期里 emit 可解析 asset。

当前还新增 `npm run check-sdk-rollup-entry`，使用真实 `examples/embed.tsx` 入口跑一次内存 Rollup 构建，并把 workspace 包显式锚到当前 SDK/FIS3 依赖的 `lib` 入口，避免 package `exports.import` 把 `amis-ui/lib/*` 重定向到 `esm/*` 后产生与现有 SDK 路径不同的导出校验结果。现在该检查还会用 jsdom 执行 embedded `sdk.js`，验证 `window.amisRequire`、`amis/embed` 和 `amis@<version>/embed` 在 runtime 下能拿到 `embed()`，并拦截动态 script 加载来渲染一个最小 `page` schema，覆盖 lazy renderer chunk 加载链路。Rollup entry helper 也已把 FIS CJS 产物里的 `require(['./renderers/X.js', 'tslib'], cb)` 转成 Rollup 可见的 dynamic import，并让 resource map 使用 chunk module id 而不是 package id 表达依赖。这一步依赖先按正式发布顺序生成 fresh workspace `lib`；它只证明真实入口、SWC TS/TSX transform、asset 空模块、loader bridge、entry alias、resource map、chunk manifest 和基础 lazy renderer 的最小链路能跑通，尚不声明 `sdk-next` 已具备完整 SDK 分包能力。

当前还新增 `npm run check-sdk-theme-css`，专门验证已抽出的 SDK 主题 CSS helper：主题文件互斥组合、`cxd` 输出为 `sdk.css`、常规选择器加 `.amis-scope`、`body/html` 根选择器重写、`:root`/`@keyframes`/Froala/TinyMCE/Monaco 这类全局或第三方选择器保持不被误加前缀。它仍只是 CSS 产物协议护栏，不代表 Rollup 已正式接管 SDK CSS 打包。

当前还新增 `npm run check-sdk-rollup-directives` 和 Rollup entry 内的 `sdk-fis-directives` 插件，先覆盖 SDK 真实入口里已经出现的 FIS 专有资源语义：`examples/loadPdfjsWorker.ts` 的 `__uri('pdfjs-dist/...')` 会被改写成 SDK 内 `/thirds/...` URL，`filterUrl(url)` 会按正式 SDK 行为拼上 `amis['sdk@<version>BasePath'] + url.substring(1)`；`packages/amis-ui/lib/components/Editor.js` 的 Monaco worker `/pkg/*.js` 也复用同一 `filterUrl` 改写。插件同时覆盖 `examples/loadMonacoEditor.ts` 这条后续可能进入 Rollup 图的 Monaco loader 路径，并支持当前 examples 中实际出现的相对 JSON `__inline('./*.json')` 形态。这个插件目前只覆盖 worker/thirds URL 和 JSON inline，不处理 examples 普通图片音视频，也不做通用文件内联器。

`build-sdk-next-rollup-entry` 现在还会把正式 SDK 已生成的 `thirds/` 静态目录复制到 `sdk-next/rollup-entry/thirds/`，让 embedded `sdk.js` 按自身 `currentScript` 推导出的 basePath 加载 pdf/Monaco worker 时有同目录静态资源可用；`check-sdk-next-contract` 在检测到 manifest 里存在 `rollupEntry` 时，会校验关键 worker 静态文件被列入 manifest 且非空。这仍然是复用当前正式 SDK 静态产物，不代表 Rollup 已重新构建这些 third-party assets。

Rollup entry 还会输出 `sdk-empty-assets.json`，记录被 `emptyAssetImports` 占位掉的裸 CSS/图片/font import；当前 contract 要求该列表为空，避免迁移过程中新增资源依赖被静默替换成空字符串。

runtime smoke 曾暴露过两个边界：正式 FIS SDK 在同一 jsdom 环境下会先遇到 `Cannot find module "util"` 的基线问题；Rollup entry 如果使用未重新构建的 checked-in `lib`，会触发 `registerRenderer({getComponent})` 与 `packages/amis-core/lib/factory.js` 旧实现不兼容的问题。当前采用“先运行 workspace build 生成 fresh lib”的路线通过检查，并在 Rollup entry helper 中显式校验 `packages/amis-core/lib/factory.js` 已包含 async renderer 支持；另一条“让 Rollup 输入图直接吃 `src`”会继续牵涉 decorators、type-only import 等 TS 语义，暂不在 entry overlay 里临时补丁化。
3. `fisDirectivePlugin`：处理 `__uri`/`__inline`。
4. `sdkCssPlugin`：输出四套主题 CSS 并执行 `.amis-scope` 前缀逻辑。
5. `thirdsCopyPlugin`：复制 Monaco、PDF worker 和需要保留路径的第三方资源。
6. `sdkPlaceholderPlugin`：替代 `embed-packager`，生成/合并 SDK 入口文件。

验收标准：`sdk-next/` 的 public contract 与 `sdk/` 等价，而不是字节级完全相同。

### Phase 3：切换 publish-sdk

当 SDK smoke 和视觉/交互回归通过后，将 `packages/amis/build.sh` 的 `fis3 release publish-sdk` 替换为新的 `node scripts/sdk-build/build.ts` 或 `rollup -c scripts/sdk-build/rollup.config.mjs`。

切换后保留一个短期 fallback 脚本，例如 `build-sdk:fis3`，仅用于一两个版本内排查差异；不要长期保留双主路径。

### Phase 4：处理 gh-pages 和删除 FIS3

SDK 链路稳定后，再迁移 `gh-pages` media。它包含 docs markdown 编译、示例页复制、API mock 地址替换、路由页面复制等职责，适合用 Vite 多页面构建 + 现有 markdown/mock 插件承接。

最后删除根目录 FIS3 脚本和 FIS3 插件依赖。

## 是否需要马上迁移？

建议“启动迁移，但不要一口气切完”。理由：

- 风险真实存在：FIS3 生态老化，未来依赖升级会越来越被动。
- 迁移复杂度也真实存在：当前 FIS3 承载了 amis SDK 的运行时协议，不是普通 bundler 替换。
- 最小正确动作不是“换成 Vite build”，而是先把 SDK 产物协议文档化、测试化，再用 Rollup 插件按协议复刻。

优先级建议：在 React 19 兼容债务完成后，将 “FIS3 publish-sdk 迁移” 作为下一条主线技术债。第一张 PR 应该只做 Phase 0/1：冻结契约、抽离 chunk plan、补检查脚本，不改变发布产物。
