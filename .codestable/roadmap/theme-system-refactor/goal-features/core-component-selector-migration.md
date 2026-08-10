---
doc_type: roadmap-goal-feature
roadmap: theme-system-refactor
feature: core-component-selector-migration
status: pending
---

# core-component-selector-migration Goal Feature

## 1. Paths

- Roadmap item: `core-component-selector-migration`
- Design: `.codestable/features/2026-07-25-core-component-selector-migration/core-component-selector-migration-design.md`
- Checklist: `.codestable/features/2026-07-25-core-component-selector-migration/core-component-selector-migration-checklist.yaml`
- Design review: `.codestable/features/2026-07-25-core-component-selector-migration/core-component-selector-migration-design-review.md`
- Review: `.codestable/features/2026-07-25-core-component-selector-migration/core-component-selector-migration-review.md`
- QA: `.codestable/features/2026-07-25-core-component-selector-migration/core-component-selector-migration-qa.md`
- Acceptance: `.codestable/features/2026-07-25-core-component-selector-migration/core-component-selector-migration-acceptance.md`

## 2. Execution Contract

- Depends on: `stylesheet-stable-selector-build`, `overlay-theme-scope-propagation`
- Nature: mixed
- Core path: render Button/Form/Select/Dialog/Table/Page representative surfaces and verify stable `.amis-*` classes, no default `.cxd-*` dependency, and no behavior regressions in selector-driven interactions.
- Deliverables: migration ledger, wave-based SCSS selector migration, DOM query migration, targeted snapshots/tests, selector guard cleanup.
- Cleanliness: do not migrate every component opportunistically, do not create a second selector inventory, do not remove explicit DOM-only alias support outside the teardown feature.

## 3. Mandatory Commands

- `npm run stylelint`
- `npm run check:theme-selectors --workspace amis-ui`
- `npm test --workspace amis -- button`
- `npm test --workspace amis -- Dialog`
- `npm test --workspace amis -- Tooltip`
- `npm test --workspace amis -- Select`
- `npm test --workspace amis -- DropDownButton`
- `npm test --workspace amis -- Table`
- `rg -n -F '#{$ns}' packages/amis-ui/scss/components packages/amis-ui/scss/_mixins.scss`
- `rg -n "\\.cxd-|\\.antd-|\\.dark-|classPrefix" packages/amis-core/src packages/amis-ui/src packages/amis/src packages/amis-ui/scss`
- `python3 /Users/songmingxu/.agents/skills/cs-onboard/tools/validate-yaml.py --file .codestable/features/2026-07-25-core-component-selector-migration/core-component-selector-migration-checklist.yaml --yaml-only`

## 4. Gates And Evidence

- Feature DoD: dependency gate passed, migration ledger complete for target waves, checklist steps done, checks passed.
- Stage gates: implementation.before_review, review.before_pass, qa.before_acceptance, acceptance.before_done.
- Gate inputs: design, checklist, migration ledger, selector guard, component snapshots/tests, diff, evidence pack.
- Failure recovery: behavior regression or unexplained selector hit returns to implementation; broad scope drift returns to handoff or implementation scoping; evidence-only gaps return to acceptance.
- Acceptance evidence: command output, migration ledger, snapshots/tests, selector grep, diff summary.
