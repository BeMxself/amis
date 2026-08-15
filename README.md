# PrismUI

[English](./README-en.md) | [在线文档](https://prismui.io/docs/zh-CN/docs/index) | [快速开始](https://prismui.io/docs/zh-CN/docs/start/getting-started)

PrismUI 是基于 [baidu/amis](https://github.com/baidu/amis) 的独立维护 fork，面向企业应用的 UI Schema 驱动前端框架。项目继续围绕 UI Schema、React 渲染器、组件体系、JS SDK 和可视化编辑能力演进。

PrismUI 不是 baidu/amis 的官方发布渠道。原项目版权和许可声明会继续保留；PrismUI 后续修改由 PrismUI contributors 独立维护。

## 当前状态

- **包名过渡**：当前 npm 包仍保留 `amis`、`amis-ui`、`amis-core` 等兼容包名；计划在 2026-09-15 前完成 `prismui` 系列包名迁移。
- **兼容策略**：迁移期优先保持现有 UI Schema、渲染器 API、主题样式和 SDK 接入方式稳定。
- **文档口径**：新文档使用 PrismUI 名称；历史文档、代码示例或运行时 API 中仍可能出现 `amis`，会随包名迁移逐步收敛。
- **维护方式**：采用轻量社区协作模式，贡献默认按对应文件或子包的现有开源许可证授权。

## 能力概览

- 使用 UI Schema 描述页面结构、数据、动作和交互逻辑。
- 提供表单、表格、CRUD、弹窗、流程动作等企业应用常用组件。
- 支持 JS SDK 渐进接入，也支持在 React 工程中直接使用渲染器。
- 提供可视化编辑器能力，让配置、预览和代码协作围绕同一份 UI Schema 展开。
- 保留自定义 renderer、主题和运行时 env 扩展能力，便于接入现有业务系统。

## 快速开始

### 当前兼容包名

在包名迁移完成前，安装命令仍沿用 amis 包名：

```bash
npm install amis amis-ui
```

React 工程中可以继续使用现有入口：

```tsx
import 'amis/lib/themes/cxd.css';
import 'amis/lib/helper.css';
import 'amis/sdk/iconfont.css';
import {render as renderUI} from 'amis';
import {ToastComponent, AlertComponent} from 'amis-ui';

const schema = {
  type: 'page',
  title: '客户管理',
  body: {
    type: 'crud',
    api: '/api/customers',
    columns: [
      {name: 'company', label: '客户'},
      {name: 'owner', label: '负责人'},
      {name: 'status', label: '阶段'}
    ]
  }
};

const env = {
  fetcher,
  notify,
  jumpTo,
  getModalContainer: () => document.body,
  theme: 'cxd'
};

export function App() {
  return <>
    <ToastComponent theme="cxd" position="top-right" />
    <AlertComponent theme="cxd" />
    {renderUI(schema, {data: {}}, env)}
  </>;
}
```

### JS SDK 接入

```html
<link rel="stylesheet" href="/sdk/sdk.css" />
<link rel="stylesheet" href="/sdk/helper.css" />
<link rel="stylesheet" href="/sdk/iconfont.css" />
<div id="root"></div>
<script src="/sdk/sdk.js"></script>
<script>
  const runtime = amisRequire('amis/embed');
  runtime.embed('#root', schema, {data: {}}, env);
</script>
```

### PrismUI 包名迁移

目标包名会以 release notes 为准，预计核心映射如下：

| 当前包名 | 计划包名 |
| --- | --- |
| `amis` | `prismui` |
| `amis-core` | `prismui-core` |
| `amis-ui` | `prismui-ui` |
| `amis-formula` | `prismui-formula` |
| `amis-editor` | `prismui-editor` |
| `amis-editor-core` | `prismui-editor-core` |
| `amis-theme-editor-helper` | `prismui-theme-editor-helper` |

迁移完成前，请不要在生产文档或安装脚本中假设 PrismUI 包已经发布。

## 仓库结构

```text
packages/amis                   UI Schema 渲染器、SDK 和主包
packages/amis-core              数据域、事件、渲染器注册和运行时核心
packages/amis-ui                基础 UI 组件与主题样式
packages/amis-formula           表达式和公式能力
packages/amis-editor            可视化编辑器
packages/amis-editor-core       编辑器核心模型和插件能力
packages/amis-theme-editor-helper 主题编辑辅助能力
examples                        文档站和本地示例
scripts/sdk-build               SDK 构建、契约检查和迁移工具
```

## 本地开发

本仓库使用 npm workspaces。建议使用当前 LTS Node.js 与 npm 7+；如果历史依赖出现 peer dependency 冲突，继续使用 `--legacy-peer-deps`。

```bash
npm i --legacy-peer-deps
npm start
```

启动后访问：

```text
http://127.0.0.1:8888/examples/pages/simple
http://127.0.0.1:8888/packages/amis-editor/
```

常用检查命令：

```bash
npm run typecheck
npm run stylelint
npm run build
npm test --workspaces
npm run check-sdk-contract
```

单包或单测示例：

```bash
npm test --workspace amis -- -t <spec-name>
./node_modules/.bin/jest packages/amis/__tests__/renderers/Form/buttonToolBar.test.tsx
npm run update-snapshot --workspace amis -- -t <spec-name>
```

## 贡献

欢迎提交 issue、讨论、文档修正、bug fix、组件能力和测试用例。请先阅读 [CONTRIBUTING.md](./CONTRIBUTING.md)。

本项目采用宽松的 inbound = outbound 贡献规则：提交贡献即表示你同意该贡献按其所修改文件或子包适用的同一开源许可证授权。

## 安全问题

请不要在公开 issue 中披露可利用的安全细节。报告方式见 [SECURITY.md](./SECURITY.md)。

## 来源与许可

PrismUI 源自 [baidu/amis](https://github.com/baidu/amis)。原项目版权、许可和 attribution 声明会按适用许可证保留。

仓库主体遵循 Apache-2.0，部分自维护子包另有 MIT 或 ISC 声明：

| 许可证 | 当前子包 |
| --- | --- |
| Apache-2.0 | `amis`, `amis-core`, `amis-ui`, `office-viewer` |
| MIT | `amis-formula`, `vite-plugin-amisr` |
| ISC | `amis-editor`, `amis-editor-core`, `amis-theme-editor-helper`, `amis-mock` |

请在再分发源码、npm 包、SDK、镜像或其它产物时保留对应的版权和许可声明。修改源自 Apache-2.0 授权的文件时，也请保留必要的修改说明。
