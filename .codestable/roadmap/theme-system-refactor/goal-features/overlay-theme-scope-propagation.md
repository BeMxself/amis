---
doc_type: roadmap-goal-feature
roadmap: theme-system-refactor
feature: overlay-theme-scope-propagation
status: pending
---

# overlay-theme-scope-propagation Goal Feature

## 1. Paths

- Roadmap item: `overlay-theme-scope-propagation`
- Design: `.codestable/features/2026-07-25-overlay-theme-scope-propagation/overlay-theme-scope-propagation-design.md`
- Checklist: `.codestable/features/2026-07-25-overlay-theme-scope-propagation/overlay-theme-scope-propagation-checklist.yaml`
- Design review: `.codestable/features/2026-07-25-overlay-theme-scope-propagation/overlay-theme-scope-propagation-design-review.md`
- Review: `.codestable/features/2026-07-25-overlay-theme-scope-propagation/overlay-theme-scope-propagation-review.md`
- QA: `.codestable/features/2026-07-25-overlay-theme-scope-propagation/overlay-theme-scope-propagation-qa.md`
- Acceptance: `.codestable/features/2026-07-25-overlay-theme-scope-propagation/overlay-theme-scope-propagation-acceptance.md`

## 2. Execution Contract

- Depends on: `theme-runtime-button-pilot`
- Nature: mixed
- Core path: render Dialog / Tooltip / Select / Dropdown representative overlays from themed roots and verify portal DOM carries the correct `data-amis-theme`.
- Deliverables: ThemeScope DOM helper, Overlay portal scope application, Modal/Dialog/Drawer scope application, multi-root and preview evidence.
- Cleanliness: do not change positioning, RootClose, offset, scroll parent, draggable, animation, editor CSS, theme-editor CSS, or component SCSS migration.

## 3. Mandatory Commands

- `npm test --workspace amis-core -- theme`
- `npm test --workspace amis -- Dialog`
- `npm test --workspace amis -- Tooltip`
- `npm test --workspace amis -- Select`
- `npm run stylelint`
- `rg -n "data-amis-theme|getNearestThemeScope|applyThemeScope|resolveOverlayContainer" packages/amis-core packages/amis-ui packages/amis`
- `python3 /Users/songmingxu/.agents/skills/cs-onboard/tools/validate-yaml.py --file .codestable/features/2026-07-25-overlay-theme-scope-propagation/overlay-theme-scope-propagation-checklist.yaml --yaml-only`

## 4. Gates And Evidence

- Feature DoD: checklist steps done, checks passed, targeted overlay tests or DOM assertions captured.
- Stage gates: implementation.before_review, review.before_pass, qa.before_acceptance, acceptance.before_done.
- Gate inputs: design, checklist, diff, DOM assertions, multi-root fixture, preview boundary notes, evidence pack.
- Failure recovery: scope leakage or changed overlay behavior returns to implementation; incomplete QA coverage returns to QA; report-only gaps return to acceptance.
- Acceptance evidence: command output, DOM assertions, multi-root fixture, preview boundary notes, diff summary.
