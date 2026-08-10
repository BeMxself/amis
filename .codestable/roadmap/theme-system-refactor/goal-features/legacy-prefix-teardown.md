---
doc_type: roadmap-goal-feature
roadmap: theme-system-refactor
feature: legacy-prefix-teardown
status: pending
---

# legacy-prefix-teardown Goal Feature

## 1. Paths

- Roadmap item: `legacy-prefix-teardown`
- Design: `.codestable/features/2026-07-25-legacy-prefix-teardown/legacy-prefix-teardown-design.md`
- Checklist: `.codestable/features/2026-07-25-legacy-prefix-teardown/legacy-prefix-teardown-checklist.yaml`
- Design review: `.codestable/features/2026-07-25-legacy-prefix-teardown/legacy-prefix-teardown-design-review.md`
- Review: `.codestable/features/2026-07-25-legacy-prefix-teardown/legacy-prefix-teardown-review.md`
- QA: `.codestable/features/2026-07-25-legacy-prefix-teardown/legacy-prefix-teardown-qa.md`
- Acceptance: `.codestable/features/2026-07-25-legacy-prefix-teardown/legacy-prefix-teardown-acceptance.md`

## 2. Execution Contract

- Depends on: `core-component-selector-migration`, `editor-theme-helper-migration`
- Nature: mixed
- Core path: default runtime and library CSS no longer expose old prefix as public styling contract; explicit DOM-only `.cxd-*` alias remains migration-only if retained.
- Deliverables: legacy prefix ledger, prefix teardown decisions, public API guard, alias retention record, migration docs hook, manual review/exit material.
- Cleanliness: no SCSS/CSS `.cxd-*` compatibility layer, no auto alias for `.antd-*` / `.dark-*`, no hidden legacy public API.

## 3. Mandatory Commands

- `PYTHONPATH=/Users/songmingxu/Projects/gold-market/.venv/lib/python3.13/site-packages python3 /Users/songmingxu/.agents/skills/cs-onboard/tools/codestable-workflow-next.py epic --roadmap .codestable/roadmap/theme-system-refactor --json`
- `npm test --workspace amis-core -- theme`
- `npm test --workspace amis -- button`
- `npm run check:theme-selectors --workspace amis-ui`
- `npm run stylelint`
- `npm run typecheck`
- `rg -n "\\.cxd-|\\.antd-|\\.dark-|classPrefix" packages/amis-core/src packages/amis-ui/src packages/amis-ui/scss packages/amis/src packages/amis-editor-core/src packages/amis-theme-editor-helper/src`
- `python3 /Users/songmingxu/.agents/skills/cs-onboard/tools/validate-yaml.py --file .codestable/features/2026-07-25-legacy-prefix-teardown/legacy-prefix-teardown-checklist.yaml --yaml-only`

## 4. Gates And Evidence

- Feature DoD: ledger complete, allowlist-backed teardown decisions captured, alias retention record present if alias remains, public API guard active.
- Stage gates: implementation.before_review, review.before_pass, qa.before_acceptance, acceptance.before_done.
- Gate inputs: design, checklist, prefix ledger, selector guard, alias tests, docs hooks, evidence pack.
- Failure recovery: unclassified old-prefix public dependency returns to implementation; retained alias without review/exit material returns to implementation; evidence-only gaps return to acceptance.
- Acceptance evidence: command output, ledger, alias retention record, guard result, migration notes.
