---
doc_type: feature-review-packet
feature: 2026-07-25-stylesheet-stable-selector-build
status: ready
created: 2026-07-26
---

# stylesheet-stable-selector-build review packet

## 1. Scope

- Design: `.codestable/features/2026-07-25-stylesheet-stable-selector-build/stylesheet-stable-selector-build-design.md`
- Checklist: `.codestable/features/2026-07-25-stylesheet-stable-selector-build/stylesheet-stable-selector-build-checklist.yaml`
- Implementation: `.codestable/features/2026-07-25-stylesheet-stable-selector-build/stylesheet-stable-selector-build-implementation.md`
- Scope gate: `.codestable/features/2026-07-25-stylesheet-stable-selector-build/stylesheet-stable-selector-build-scope-gate.json`
- DoD results: `.codestable/features/2026-07-25-stylesheet-stable-selector-build/stylesheet-stable-selector-build-dod-results.json`
- Evidence pack: `.codestable/features/2026-07-25-stylesheet-stable-selector-build/stylesheet-stable-selector-build-evidence-pack.md`

## 2. Diff Summary

- Added stable selector helper: `packages/amis-ui/scss/_stable-selectors.scss`.
- Wired helper into component SCSS entry: `packages/amis-ui/scss/_components.scss`.
- Converted Button pilot proof to helper usage without changing intended selector output: `packages/amis-ui/scss/components/_button.scss`.
- Added selector guard command: `packages/amis-ui/scripts/checkThemeSelectors.js`.
- Added npm script: `packages/amis-ui/package.json` -> `check:theme-selectors`.
- Added machine inventory / allowlist and fixtures under `packages/amis-ui/scripts/theme-selectors/`.
- Updated CodeStable checklist, implementation report, gates, evidence pack, and roadmap goal-state.

## 3. Policy Summary

- Policy file: `packages/amis-ui/scripts/theme-selectors/policy.json`.
- Total baseline matches: 2233.
- By scan: `scss-ns-selector=2185`, `theme-prefix-selector=42`, `classprefix-dom-selector=6`.
- By category: `migration-target=2163`, `docs-historical=33`, `internal-legacy=37`.
- Category taxonomy present: `public-forbidden`, `migration-target`, `internal-legacy`, `dom-alias-generated`, `docs-historical`, `generated-artifact`.
- Guard comparison key: `scan + file + pattern + normalized line + count`; removals are allowed, new unmatched lines fail.

## 4. Verification

- `npm run stylelint` -> exit 0.
- `npm run build --workspace amis-ui` -> reached `created lib` and `created esm`; existing runner hangs after output completion and was interrupted after a short wait.
- `npm run check:theme-selectors --workspace amis-ui` -> exit 0, 2233 baseline matches, 0 new violations.
- `node packages/amis-ui/scripts/checkThemeSelectors.js --fixture good` -> exit 0.
- `node packages/amis-ui/scripts/checkThemeSelectors.js --fixture bad` -> exit 1 as expected for `.#{$ns}GuardFixture` and `.cxd-GuardFixture`.
- `validate-yaml.py --file ...stylesheet-stable-selector-build-checklist.yaml --yaml-only` -> exit 0.
- `git diff --check` -> exit 0.

## 5. Review Focus

- Check whether `--update` on the guard script creates a bypass risk that should be narrowed or documented.
- Check whether policy entries are too broad, especially `classprefix-dom-selector` and editor/helper classification.
- Check whether fixture files containing `.cxd-*` are safely excluded from normal guard scans and product CSS.
- Check whether `_button.scss` helper conversion preserves CSS selector semantics and build compatibility.
- Check whether build runner manual interruption is acceptable as a baseline warning for this feature.

## 6. Known Residual Risks

- OCR lane is unavailable in this environment (`ocr not found`).
- `npm run build --workspace amis-ui` still requires manual interruption after output completion in this workspace.
- Existing `#{$ns}` / `.cxd-*` selector debt remains intentionally baseline-locked for later component/editor migration.
