# React / MobX / MST Upgrade Assessment

Date: 2026-08-10
Repo: `amis`

## Executive recommendation

Do **not** upgrade React, MobX, `mobx-react`, `mobx-react-lite`, and `mobx-state-tree` to their latest versions in one pass.

The worthwhile path is staged:

1. **Short term:** keep React 18 and the existing MobX 4 / MST 3 stack unless there is a security, compatibility, or consumer requirement forcing movement.
2. **First real upgrade tranche:** migrate legacy ReactDOM APIs and `findDOMNode`-style access before attempting React 19.
3. **State stack tranche:** target **MobX 6.x + MST 7.x** first, not MobX 7, because MST latest currently peers on MobX 6.
4. **MobX 7 tranche:** defer until MST publishes compatible peer support, or until the project is prepared to validate/override peer dependency risk explicitly.

## Version snapshot

Captured with `npm view` on 2026-08-10.

| Package | Declared / locked in repo | Latest observed | Notes |
| --- | ---: | ---: | --- |
| `react` | declared `^18.2.0`; root lock `18.3.1` | `19.2.8` | React 19 is a real major migration because removed APIs are used locally. |
| `react-dom` | declared `^18.2.0`; root lock `18.3.1` | `19.2.8` | `render`, `unmountComponentAtNode`, and `findDOMNode` removals matter here. |
| `@types/react` | declared `^18.0.24`; root lock `18.3.3` | `19.2.18` | Type upgrade should follow React runtime/test migration. |
| `@types/react-dom` | declared `^18.0.8`; root lock `18.3.0` | `19.2.4` | Type upgrade should follow ReactDOM API migration. |
| `mobx` | declared `^4.5.0`; root lock `4.15.7` | `7.0.0` | Direct latest conflicts with MST latest peer range. |
| `mobx-react` | declared `^6.3.1`; root lock `6.3.1` | `10.0.0` | Latest peers on MobX `^7.0.0` and React `^18 || ^19`. |
| `mobx-react-lite` | declared `^2.2.0`; root lock `2.2.2` | `5.0.0` | Latest peers on MobX `^7.0.0` and React `^18 || ^19`. |
| `mobx-state-tree` | declared `^3.17.3`; root lock `3.17.3` | `7.3.2` | Latest peers on MobX `^6.3.0`, not MobX 7. |

Current declarations were found in `package.json`, `packages/amis/package.json`, `packages/amis-core/package.json`, `packages/amis-ui/package.json`, `packages/amis-editor/package.json`, `packages/amis-editor-core/package.json`, and `packages/amis-theme-editor-helper/package.json`.

## Source facts

- React 19 removes several legacy `react-dom` APIs including `findDOMNode`, `hydrate`, `render`, and `unmountComponentAtNode`; React documents `createRoot`, `hydrateRoot`, and `root.unmount()` as replacements. Sources: <https://react.dev/blog/2024/04/25/react-19-upgrade-guide>, <https://react.dev/reference/react-dom>.
- React 19 removes `propTypes` checks and `defaultProps` support for function components; class components keep `defaultProps`. Source: <https://react.dev/blog/2024/04/25/react-19-upgrade-guide>.
- MobX documents migration from 4/5 to 6 as a multi-step migration: upgrade within 4/5 first, resolve deprecations, call `configure({ enforceActions: "never" })` initially to emulate older behavior, and add `makeObservable(this)` or run `mobx-undecorate` where decorators are used. Source: <https://mobx.js.org/migrating-from-4-or-5.html>.
- MST documentation positions MST as a MobX-based state container and recommends modern strict TypeScript settings for best type behavior. Sources: <https://mobx-state-tree.js.org/intro/installation>, <https://mobx-state-tree.js.org/tips/typescript>.
- npm registry metadata observed on 2026-08-10: `mobx-react@10.0.0` and `mobx-react-lite@5.0.0` peer on `mobx: ^7.0.0`; `mobx-state-tree@7.3.2` peers on `mobx: ^6.3.0`. That makes “latest everything” internally inconsistent without peer overrides.

## Local coupling scan

One-pass source scan excluding generated `lib` / `esm` output:

| Concern | Matches | Files | Why it matters |
| --- | ---: | ---: | --- |
| `mobx` imports | 33 | 32 | Behavior/config migration needed from MobX 4 to 6/7. |
| `mobx-react` imports | 50 | 50 | Observer wrapper/decorator behavior must be regression-tested. |
| `mobx-react-lite` imports | 1 | 1 | Low direct footprint, but version follows MobX peer constraints. |
| `mobx-state-tree` imports | 64 | 63 | Store model behavior, flows, environments, snapshots, and liveness checks are central. |
| `findDomCompat` / `findDOMNode` | 255 | 76 | React 19 removes official `findDOMNode`; this repo has a custom Fiber fallback but still falls back to `ReactDom.findDOMNode` and depends on private internals. |
| ReactDOM legacy render path | 11 | 9 | React 19 removes `ReactDOM.render`; local code still imports/uses legacy render entry points. |
| `unmountComponentAtNode` | 4 | 3 | React 19 removes this; must be replaced with root ownership tracking. |
| `react-dom/test-utils` | 1 | 1 | Tests need migration to supported `act` import paths. |
| `react-test-renderer` | 20 | 20 | React 19 deprecates/changes expectations around renderer testing; snapshots may churn. |
| `.defaultProps =` | 9 | 9 | Need distinguish class components from function components before React 19. |
| MobX decorators beyond `@observer` | 18 | 1 | `packages/amis-core/src/utils/debug.tsx` uses `@observable` / `@action.bound`; MobX 6+ needs `makeObservable` or codemod. |

Representative high-risk files:

- `packages/amis-core/src/utils/findDomCompat.ts` implements private Fiber traversal and falls back to `ReactDom.findDOMNode`.
- `packages/amis-editor-core/src/component/factory.tsx` imports `render as reactRender` and `unmountComponentAtNode` from `react-dom`.
- `packages/amis/src/renderers/Custom.tsx` calls `ReactDOM.render` and `ReactDOM.unmountComponentAtNode` for child schema rendering.
- `packages/amis-core/src/utils/debug.tsx` has commented React 18 `createRoot` code but currently uses legacy `render` / `unmountComponentAtNode`.
- `packages/amis-core/src/utils/debug.tsx` uses MobX field decorators (`@observable`, `@action.bound`).

## Recommendation matrix

| Upgrade target | Worth doing now? | Risk | Recommended action |
| --- | --- | --- | --- |
| React 18 patch alignment | Yes, low value but safe | Low | Current lock already has `18.3.1`; normalize declared ranges only if the repo wants explicitness. |
| React 19 latest | Not yet | High | First remove legacy ReactDOM APIs, replace root render/unmount ownership, audit `findDomCompat`, migrate affected tests. |
| `@types/react*` 19 | Not before runtime work | Medium | Upgrade with React 19 branch only; otherwise type churn is noise. |
| MobX 6.x | Worth evaluating | Medium-high | Best first state-stack tranche: migrate decorators/config, add `configure({ enforceActions: "never", useProxies: "never"? })` only if compatibility requires it, then tighten later. |
| MST 7.x with MobX 6.x | Worth evaluating after MobX 6 | Medium-high | Aligns with latest MST peer range; validate stores, flows, snapshots, environment access, and liveness behavior. |
| MobX 7 + `mobx-react` 10 + lite 5 | Not yet | High | Defer because `mobx-state-tree@7.3.2` still peers on MobX 6. |
| Latest everything | No | Very high | Peer-inconsistent and crosses React rendering + MobX state semantics simultaneously. |

## Suggested migration plan

1. **React preparation branch**
   - Replace local `ReactDOM.render` / `unmountComponentAtNode` call sites with root-tracking helpers.
   - Decide whether `findDomCompat` private Fiber traversal is acceptable for React 19; ideally reduce call sites via refs where practical.
   - Migrate `react-dom/test-utils` usage and review `react-test-renderer` snapshots.

2. **MobX 6 / MST 7 branch**
   - Upgrade to a MobX 6.x version plus MST 7.x, not MobX 7.
   - Add `makeObservable(this)` or codemod the `@observable` / `@action.bound` debug store.
   - Start with compatibility config matching old semantics, then remove/tighten after tests pass.
   - Run store-focused tests first (`packages/amis/__tests__/stores`, core renderer/store tests), then full workspace tests.

3. **React 19 branch**
   - Upgrade `react`, `react-dom`, `@types/react`, and `@types/react-dom` together.
   - Run full tests and targeted editor/render smoke tests, especially overlays, custom renderer child mounting, debug panel, table/cell rendering, and editor wrapper lifecycle paths.

4. **MobX 7 follow-up**
   - Re-check MST peer dependencies when a compatible MST release exists.
   - Only then evaluate `mobx-react@10` / `mobx-react-lite@5` together.

## Bottom line

Upgrading is worth doing for long-term maintenance, but **not as a latest-version bump**. The project is architecture-coupled to React legacy DOM APIs and MobX/MST runtime behavior. The lowest-risk useful modernization is: React legacy API cleanup first, then MobX 6 + MST 7, then React 19, and MobX 7 only after MST supports it.
