---
doc_type: roadmap-goal-feature
roadmap: theme-system-refactor
feature: theme-system-validation-docs-rollout
status: pending
---

# theme-system-validation-docs-rollout Goal Feature

## 1. Paths

- Roadmap item: `theme-system-validation-docs-rollout`
- Design: `.codestable/features/2026-07-25-theme-system-validation-docs-rollout/theme-system-validation-docs-rollout-design.md`
- Checklist: `.codestable/features/2026-07-25-theme-system-validation-docs-rollout/theme-system-validation-docs-rollout-checklist.yaml`
- Design review: `.codestable/features/2026-07-25-theme-system-validation-docs-rollout/theme-system-validation-docs-rollout-design-review.md`
- Review: `.codestable/features/2026-07-25-theme-system-validation-docs-rollout/theme-system-validation-docs-rollout-review.md`
- QA: `.codestable/features/2026-07-25-theme-system-validation-docs-rollout/theme-system-validation-docs-rollout-qa.md`
- Acceptance: `.codestable/features/2026-07-25-theme-system-validation-docs-rollout/theme-system-validation-docs-rollout-acceptance.md`

## 2. Execution Contract

- Depends on: `legacy-prefix-teardown`
- Nature: non-functional
- Core path: none; this is validation/docs rollout. Substitute evidence is validation matrix, docs migration map, examples inventory, theme override guide, release risk record, and final command output.
- Deliverables: ThemeSystemValidationMatrix, DocsMigrationMap, ExamplesThemeInventory, ThemeOverrideGuide, ReleaseRiskRecord, IE11 static downgrade note, alias review material.
- Cleanliness: do not reopen architecture choices already accepted by ADR-001; do not keep docs/examples recommending theme prefixes as the main extension path.

## 3. Mandatory Commands

- `PYTHONPATH=/Users/songmingxu/Projects/gold-market/.venv/lib/python3.13/site-packages python3 /Users/songmingxu/.agents/skills/cs-onboard/tools/codestable-workflow-next.py epic --roadmap .codestable/roadmap/theme-system-refactor --json`
- `npm run typecheck`
- `npm run stylelint`
- `npm run check:theme-selectors --workspace amis-ui`
- `npm test --workspace amis-core -- theme`
- `npm test --workspace amis -- button`
- `rg -n "#\\{\\$ns\\}|\\.cxd-|\\.antd-|\\.dark-|classPrefix" docs examples`
- `rg -n "IE11|cxd-ie11|CSS 变量|data-amis-theme|--amis-|amis-" docs/zh-CN/start docs/zh-CN/style docs/zh-CN/extend`
- `python3 /Users/songmingxu/.agents/skills/cs-onboard/tools/validate-yaml.py --file .codestable/features/2026-07-25-theme-system-validation-docs-rollout/theme-system-validation-docs-rollout-checklist.yaml --yaml-only`

## 4. Gates And Evidence

- Feature DoD: validation matrix complete, docs migration map reviewed, examples inventory classified, release risk record includes alias / IE11 / migration risks.
- Stage gates: implementation.before_review, review.before_pass, qa.before_acceptance, acceptance.before_done.
- Gate inputs: design, checklist, validation matrix, docs diff, examples inventory, release risk record, evidence pack.
- Failure recovery: docs/examples still teaching old prefix as main path returns to implementation; missing release risk record returns to implementation; command/evidence gaps return to QA or acceptance.
- Acceptance evidence: command output, docs diff, examples inventory, validation matrix, release risk record.
