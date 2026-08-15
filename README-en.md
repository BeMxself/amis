# PrismUI

[中文](./README.md) | [Docs](https://prismui.io/docs/zh-CN/docs/index) | [Getting Started](https://prismui.io/docs/zh-CN/docs/start/getting-started)

PrismUI is an independently maintained fork of [baidu/amis](https://github.com/baidu/amis), focused on UI Schema driven front-end development for enterprise applications. The project continues to evolve the UI Schema runtime, React renderer, component system, JS SDK, and visual editor.

PrismUI is not an official baidu/amis release channel. Original copyright and license notices are retained, and PrismUI changes are maintained independently by PrismUI contributors.

The Chinese README is the primary project document. This English version is kept in sync for international contributors.

## Current Status

- **Package transition**: current npm packages still use compatible names such as `amis`, `amis-ui`, and `amis-core`; PrismUI package names are planned by 2026-09-15.
- **Compatibility**: during the transition, existing UI Schema, renderer APIs, theme assets, and SDK integration remain the priority.
- **Docs**: new docs use the PrismUI name. Historical pages, examples, and runtime APIs may still mention `amis` until the package migration is complete.
- **Contribution model**: contributions use a lightweight inbound = outbound model and are licensed under the same license as the relevant file or package.

## Capabilities

- Describe page structure, data, actions, and interactions with UI Schema.
- Build enterprise interfaces with forms, tables, CRUD, overlays, and workflow actions.
- Integrate progressively through the JS SDK or directly inside React applications.
- Use the visual editor to configure, preview, and collaborate around the same UI Schema model.
- Extend renderers, themes, and runtime env hooks for existing business systems.

## Getting Started

### Current Compatible Package Names

Before the PrismUI package migration is complete, install the existing amis packages:

```bash
npm install amis amis-ui
```

React applications can continue to use the existing entry points:

```tsx
import 'amis/lib/themes/cxd.css';
import 'amis/lib/helper.css';
import 'amis/sdk/iconfont.css';
import {render as renderUI} from 'amis';
import {ToastComponent, AlertComponent} from 'amis-ui';

const schema = {
  type: 'page',
  title: 'Customers',
  body: {
    type: 'crud',
    api: '/api/customers',
    columns: [
      {name: 'company', label: 'Company'},
      {name: 'owner', label: 'Owner'},
      {name: 'status', label: 'Status'}
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

### JS SDK Integration

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

### Planned PrismUI Package Names

Final names will be confirmed in release notes. The current plan is:

| Current package | Planned package |
| --- | --- |
| `amis` | `prismui` |
| `amis-core` | `prismui-core` |
| `amis-ui` | `prismui-ui` |
| `amis-formula` | `prismui-formula` |
| `amis-editor` | `prismui-editor` |
| `amis-editor-core` | `prismui-editor-core` |
| `amis-theme-editor-helper` | `prismui-theme-editor-helper` |

Do not assume the PrismUI npm packages are published until the migration release notes say so.

## Repository Layout

```text
packages/amis                   UI Schema renderer, SDK, and main package
packages/amis-core              data scope, events, renderer registry, and runtime core
packages/amis-ui                base UI components and theme styles
packages/amis-formula           expression and formula support
packages/amis-editor            visual editor
packages/amis-editor-core       editor model and plugin system
packages/amis-theme-editor-helper theme editor helper package
examples                        docs site and local examples
scripts/sdk-build               SDK build, contract checks, and migration tooling
```

## Local Development

This repository uses npm workspaces. Use a current LTS Node.js release with npm 7+. If historical peer dependency constraints fail, keep using `--legacy-peer-deps`.

```bash
npm i --legacy-peer-deps
npm start
```

Then open:

```text
http://127.0.0.1:8888/examples/pages/simple
http://127.0.0.1:8888/packages/amis-editor/
```

Common checks:

```bash
npm run typecheck
npm run stylelint
npm run build
npm test --workspaces
npm run check-sdk-contract
```

Focused examples:

```bash
npm test --workspace amis -- -t <spec-name>
./node_modules/.bin/jest packages/amis/__tests__/renderers/Form/buttonToolBar.test.tsx
npm run update-snapshot --workspace amis -- -t <spec-name>
```

## Contributing

Issues, discussions, documentation fixes, bug fixes, component work, and tests are welcome. Read [CONTRIBUTING.md](./CONTRIBUTING.md) before opening a pull request.

This project uses a lightweight inbound = outbound contribution model: by submitting a contribution, you agree that it is licensed under the same license that applies to the relevant file or package.

## Security

Do not disclose exploitable security details in public issues. See [SECURITY.md](./SECURITY.md) for reporting guidance.

## Origin And License

PrismUI is derived from [baidu/amis](https://github.com/baidu/amis). Original copyright, license, and attribution notices are retained under their applicable licenses.

Most of the repository is Apache-2.0. Some self-maintained packages declare MIT or ISC:

| License | Current packages |
| --- | --- |
| Apache-2.0 | `amis`, `amis-core`, `amis-ui`, `office-viewer` |
| MIT | `amis-formula`, `vite-plugin-amisr` |
| ISC | `amis-editor`, `amis-editor-core`, `amis-theme-editor-helper`, `amis-mock` |

When redistributing source code, npm packages, SDK archives, images, or other artifacts, keep the relevant copyright and license notices. When modifying files derived from Apache-2.0 licensed code, keep appropriate modification notices.
