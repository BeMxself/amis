---
id: 001
title: 采用 token 与主题作用域选择器的双通道主题系统
status: accepted
date: 2026-07-24
relates_to: [requirements/CONTEXT.md]
---

# 采用 token 与主题作用域选择器的双通道主题系统

## Context

amis 现有主题体系长期依赖类名前缀：运行时通过 `classPrefix` 生成 `cxd-Button`、`antd-Button` 等主题化组件类名，SCSS 通过 `$ns` 编译对应选择器。这一模式提供了强隔离、多主题 CSS 包并存和早期浏览器时代的工程可行性。

但主题名前缀进入组件类名后，会把主题身份暴露为 DOM API。编辑器、插件、用户自定义 CSS 和内部样式选择器容易直接依赖 `.cxd-*`，导致主题机制与组件身份耦合。未来希望最终用户只关心主题名、token 和稳定组件接口，不再关心主题类名前缀。

同时，纯 token 化也不足以表达完整主题系统。Token 擅长表达颜色、圆角、字号、间距、阴影、边框和状态值，不擅长表达某些主题下组件结构、视觉形态、默认行为或第三方库主题差异。浮层、Toast、Popover、Dialog、ECharts、Monaco、CodeMirror 等也需要主题作用域和 JS 行为对象协同。

## Decision

采用双通道主题系统：

1. 标准化样式值通过 Design Token 表达，并以 CSS custom properties 落地。
2. 组件输出稳定组件类名，例如 `.prismui-Button`、`.prismui-Form`，不把主题名编码进组件类名。
3. 主题身份由主题作用域表达，例如 `[data-prismui-theme="cxd"]`、`[data-prismui-theme="dark"]`。
4. 非标准结构、形态或主题特定视觉差异通过主题作用域下的选择器覆写表达，例如 `[data-prismui-theme="antd"] .prismui-Tabs`。
5. Token 按 palette、semantic、component、state 分层管理；组件内部优先消费 component/state token，避免直接依赖 palette token。
6. 保留主题行为对象，用于承载 CSS 无法表达的主题差异，例如 renderer 默认配置、组件默认配置、图表主题、代码编辑器主题和浮层容器策略。
7. 统一主题作用域传播：Root 的 `data-prismui-theme` 必须附着在真实宿主根节点上，不能为了注入作用域增加影响布局的 DOM wrapper；主题变更时该属性必须跟随当前 root 更新。Overlay root、Dialog、Toast、Tooltip、Popover、Select 下拉层等脱离普通 DOM 树的节点必须携带或继承对应主题作用域。直接 `Portal` / `createPortal` 调用点必须进入 ThemeScope 分类：渲染公开 amis UI 的路径接入 shared ThemeScope helper；仅渲染 editor 内部非主题 UI 的路径可作为显式例外，但必须有测试和 selector policy 分类说明。
8. CSS 层级采用固定顺序：`amis.reset`、`amis.tokens`、`amis.components`、`amis.theme`、`amis.user`，让用户覆写拥有明确优先级。
9. 稳定组件类名前缀的默认品牌标识确定为 `prismui-`，例如 `.prismui-Button`、`.prismui-Form`。该前缀不是主题能力，也不支持运行时切换；它是项目级品牌 build-time constant。未来如果品牌需要更名，只允许通过统一构建配置整体切换 runtime、SCSS、theme-editor helper、文档站 shell 和测试基线，不允许同一产物内按主题或用户配置动态切换组件前缀。
10. `.cxd-*` 的 SCSS/CSS legacy selector 兼容编译期开关已评估为高影响，不作为公开兼容层实现；允许评估并实现显式开启的 DOM-only legacy class alias，让迁移期通过 `classnames()` 生成的 DOM 可同时带 `.prismui-*` 与 `.cxd-*`。该 alias 是 best-effort 迁移桥，仅用于老定制页面自己的 `.cxd-*` CSS 继续命中，不覆盖所有手写 `${classPrefix}Xxx` 拼接路径，不生成 `.cxd-*` 库 CSS，也不把 `.cxd-*` 重新定义为公共样式 API。
11. IE11 只保留静态 CSS 降级边界，不承诺基于 CSS custom properties 的动态 token 主题切换。
12. selector guard 不只是防新增，也承担债务退出压力：普通 baseline update 只能保持或减少 legacy match；如果必须增长 baseline，必须显式开启增长参数并经过人工审查。

## Consequences

最终用户不再需要理解或依赖 `cxd-`、`antd-`、`dark-` 这类主题类名前缀。主题切换的公共 API 可以收敛到主题名、主题作用域、token 覆写和少量稳定组件选择器。

组件身份与主题身份解耦后，同一组件的 DOM、测试、插件选择器和用户自定义样式更稳定。主题差异通过 token 和 theme-scoped selector 分别承载，可以避免把所有差异都塞进全局变量，也避免回到旧的主题前缀类名体系。

该决定引入新的治理成本。Token 需要分层命名、文档、校验和废弃策略，否则容易产生 token 爆炸和语义漂移。主题特定选择器仍然存在，但它们必须被限制在主题作用域下，且不能重新暴露主题类名前缀作为用户 API。

DOM-only `.cxd-*` alias 可以降低老定制页面迁移断点，但它必须被治理为过渡能力。实现上应默认走 `.prismui-*` 稳定类名，只有显式开启迁移开关时才在 `classnames()` 生成路径附加 `.cxd-*`；文档需要把它描述为旧 CSS 迁移辅助，而不是推荐的定制入口。它不能被理解为完整兼容层，因为历史代码中仍存在手写 `classPrefix` 拼接路径，迁移验收应以 `.prismui-*` / token / `[data-prismui-theme]` 主路径为准。

`prismui-` 的稳定性是默认公共契约，不是不可变的技术事实。若未来进行品牌级前缀更名，该更名必须被当作破坏性发布或受控迁移：统一替换构建期组件前缀、同步 CSS 选择器产物、更新测试选择器和截图基线，并明确影响用户自定义 CSS、自动化测试和第三方集成。主题切换 API 不承担这个能力。

Root 和浮层都是高风险区域。Root 如果用额外 wrapper 注入作用域，会破坏既有的直接子节点布局契约、offsetParent 或尺寸计算；任何渲染到 `body` 或独立容器的节点，如果没有同步主题作用域，就可能拿不到 scoped token 或主题覆写。因此作用域必须附着真实 Root 宿主节点，浮层必须由统一的 overlay manager 传播，不能靠额外布局 wrapper 补救。

直接 portal 的治理以分类为准，而不是只看是否出现 `Portal` 字符串。公开 amis UI 的 portal 必须携带或继承 ThemeScope；editor-only 调试、尺寸手柄或非主题控制面板可以作为内部例外，但例外必须在 selector policy 中标为 exception，并用测试证明它不承载公共 amis 主题样式契约。

第三方库和非 CSS 行为不能强行 token 化。ECharts、Monaco、CodeMirror、富文本编辑器、canvas、iframe preview 等仍需要主题行为对象或专门适配层。

## Alternatives Considered

继续使用类名前缀主题系统：保留现有隔离能力和历史兼容性，但继续把主题身份编码进组件类名，用户和插件仍会依赖 `.cxd-*` 等内部细节。

采用纯 token 主题系统：可以最大程度标准化样式值，但无法优雅表达结构差异、复杂状态选择器、第三方库主题和组件默认行为，最终可能导致 token 过度膨胀。

采用根主题类加组件类交叉选择器：比类名前缀更解耦，但如果没有 token 分层，样式值仍会散落在主题 CSS 中，难以支持主题编辑器、动态切换和系统化校验。

把组件前缀做成运行时配置：可以提供最大灵活性，但会让 CSS 产物、DOM 查询、用户覆写和测试选择器无法稳定匹配，并把品牌迁移误导成普通主题切换能力。本 ADR 拒绝该方案；只保留 build-time 品牌前缀整体切换的可能性。
