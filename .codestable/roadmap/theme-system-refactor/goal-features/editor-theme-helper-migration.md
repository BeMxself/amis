---
doc_type: roadmap-goal-feature
roadmap: theme-system-refactor
feature: editor-theme-helper-migration
status: pending
---

# editor-theme-helper-migration Goal Feature

## 1. Paths

- Roadmap item: `editor-theme-helper-migration`
- Design: `.codestable/features/2026-07-25-editor-theme-helper-migration/editor-theme-helper-migration-design.md`
- Checklist: `.codestable/features/2026-07-25-editor-theme-helper-migration/editor-theme-helper-migration-checklist.yaml`
- Design review: `.codestable/features/2026-07-25-editor-theme-helper-migration/editor-theme-helper-migration-design-review.md`
- Review: `.codestable/features/2026-07-25-editor-theme-helper-migration/editor-theme-helper-migration-review.md`
- QA: `.codestable/features/2026-07-25-editor-theme-helper-migration/editor-theme-helper-migration-qa.md`
- Acceptance: `.codestable/features/2026-07-25-editor-theme-helper-migration/editor-theme-helper-migration-acceptance.md`

## 2. Execution Contract

- Depends on: `token-contract-css-layers`, `stylesheet-stable-selector-build`, `overlay-theme-scope-propagation`
- Nature: mixed
- Core path: generated theme CSS and editor / iframe preview consume ThemeScope, stable `.amis-*`, and `--amis-*` tokens instead of `.cxd-*` / `.AMISCSSWrapper` theme identity.
- Deliverables: generated CSS migration, preview scope migration, historical schema migration boundary, helper SCSS inventory, editor migration notes.
- Cleanliness: `.AMISCSSWrapper` may remain as preview/user CSS container alias but not theme identity; do not redesign editor UI or silently rewrite old user schemas without a migration boundary.

## 3. Mandatory Commands

- `npm run build --workspace amis-theme-editor-helper`
- `npm run build --workspace amis-editor-core`
- `npm run build --workspace amis-editor`
- `npm run check:theme-selectors --workspace amis-ui`
- `rg -n "\\.cxd-" packages/amis-theme-editor-helper packages/amis-editor-core packages/amis-editor`
- `rg -n "AMISCSSWrapper|getCssVarById|data-amis-theme|ParseThemeData|style2ThemeCss" packages/amis-editor-core packages/amis-theme-editor-helper packages/amis-editor`
- `python3 /Users/songmingxu/.agents/skills/cs-onboard/tools/validate-yaml.py --file .codestable/features/2026-07-25-editor-theme-helper-migration/editor-theme-helper-migration-checklist.yaml --yaml-only`

## 4. Gates And Evidence

- Feature DoD: four evidence lanes covered: generated CSS, preview scope, historical schema migration, helper SCSS inventory.
- Stage gates: implementation.before_review, review.before_pass, qa.before_acceptance, acceptance.before_done.
- Gate inputs: design, checklist, generated CSS output, preview DOM evidence, schema migration evidence, helper SCSS inventory, evidence pack.
- Failure recovery: generated CSS old-prefix output or preview scope leakage returns to implementation; missing schema boundary returns to implementation/review; report-only gaps return to acceptance.
- Acceptance evidence: command output, generated CSS sample, preview DOM assertion or screenshot, helper inventory, migration notes.
