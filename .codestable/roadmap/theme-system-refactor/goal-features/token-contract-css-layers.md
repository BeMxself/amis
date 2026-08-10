---
doc_type: roadmap-goal-feature
roadmap: theme-system-refactor
feature: token-contract-css-layers
status: pending
---

# token-contract-css-layers Goal Feature

## 1. Paths

- Roadmap item: `token-contract-css-layers`
- Design: `.codestable/features/2026-07-25-token-contract-css-layers/token-contract-css-layers-design.md`
- Checklist: `.codestable/features/2026-07-25-token-contract-css-layers/token-contract-css-layers-checklist.yaml`
- Design review: `.codestable/features/2026-07-25-token-contract-css-layers/token-contract-css-layers-design-review.md`
- Review: `.codestable/features/2026-07-25-token-contract-css-layers/token-contract-css-layers-review.md`
- QA: `.codestable/features/2026-07-25-token-contract-css-layers/token-contract-css-layers-qa.md`
- Acceptance: `.codestable/features/2026-07-25-token-contract-css-layers/token-contract-css-layers-acceptance.md`

## 2. Execution Contract

- Depends on: `theme-runtime-button-pilot`
- Nature: non-functional
- Core path: none; this is a contract/build-time feature. Substitute evidence is compiled SCSS / fixture output, selector grep, token alias inspection, and checklist DoD.
- Deliverables: token contract entry, canonical CSS layer declaration, `--amis-*` taxonomy, old token alias mapping, theme token override boundary, IE11 static downgrade note.
- Cleanliness: no `.cxd-*` SCSS/CSS compatibility output, no editor/helper migration, no full component migration.

## 3. Mandatory Commands

- `npm run stylelint`
- `npm run build --workspace amis-ui`
- `rg -n "@layer amis\\.reset, amis\\.tokens, amis\\.components, amis\\.theme, amis\\.user" packages/amis-ui/scss`
- `rg -n "--amis-(palette|color|Button)" packages/amis-ui/scss`
- `rg -n "\\.cxd-|#\\{\\$ns\\}" packages/amis-ui/scss`
- `python3 /Users/songmingxu/.agents/skills/cs-onboard/tools/validate-yaml.py --file .codestable/features/2026-07-25-token-contract-css-layers/token-contract-css-layers-checklist.yaml --yaml-only`
- `python3 /Users/songmingxu/.agents/skills/cs-onboard/tools/codestable-workflow-next.py epic --roadmap .codestable/roadmap/theme-system-refactor --json`

## 4. Gates And Evidence

- Feature DoD: checklist steps done, checks passed, DoD commands captured with outputs or documented baseline reason.
- Stage gates: implementation.before_review, review.before_pass, qa.before_acceptance, acceptance.before_done.
- Gate inputs: design, checklist, diff, compiled CSS / fixture, command output, selector grep, evidence pack.
- Failure recovery: missing token/layer evidence returns to implementation; unclear compatibility or IE11 boundary returns to implementation and review; evidence-only gaps return to acceptance.
- Acceptance evidence: command output, diff summary, fixture or built CSS, selector grep, baseline notes.
