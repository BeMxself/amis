---
doc_type: roadmap-goal-feature
roadmap: theme-system-refactor
feature: stylesheet-stable-selector-build
status: accepted
---

# stylesheet-stable-selector-build Goal Feature

## 1. Paths

- Roadmap item: `stylesheet-stable-selector-build`
- Design: `.codestable/features/2026-07-25-stylesheet-stable-selector-build/stylesheet-stable-selector-build-design.md`
- Checklist: `.codestable/features/2026-07-25-stylesheet-stable-selector-build/stylesheet-stable-selector-build-checklist.yaml`
- Design review: `.codestable/features/2026-07-25-stylesheet-stable-selector-build/stylesheet-stable-selector-build-design-review.md`
- Review: `.codestable/features/2026-07-25-stylesheet-stable-selector-build/stylesheet-stable-selector-build-review.md`
- QA: `.codestable/features/2026-07-25-stylesheet-stable-selector-build/stylesheet-stable-selector-build-qa.md`
- Acceptance: `.codestable/features/2026-07-25-stylesheet-stable-selector-build/stylesheet-stable-selector-build-acceptance.md`

## 2. Execution Contract

- Depends on: `theme-runtime-button-pilot`, `token-contract-css-layers`
- Nature: non-functional
- Core path: none; this is a stylesheet tooling and guard feature. Substitute evidence is SCSS helper fixture, selector inventory / allowlist, guard command, and compiled CSS inspection.
- Deliverables: stable selector SCSS helper, `[data-amis-theme]` theme helper, selector inventory, allowlist categories, `check:theme-selectors` or equivalent guard.
- Cleanliness: no `.cxd-*` SCSS compatibility output, no React component business migration, no editor/theme-editor migration beyond classification.

## 3. Mandatory Commands

- `npm run stylelint`
- `npm run build --workspace amis-ui`
- `rg -n -F '#{$ns}' packages/amis-ui/scss`
- `rg -n "\\.cxd-|\\.antd-|\\.dark-" packages/amis-ui/scss packages/amis-theme-editor-helper packages/amis-editor-core`
- `npm run check:theme-selectors --workspace amis-ui`
- `python3 /Users/songmingxu/.agents/skills/cs-onboard/tools/validate-yaml.py --file .codestable/features/2026-07-25-stylesheet-stable-selector-build/stylesheet-stable-selector-build-checklist.yaml --yaml-only`

## 4. Gates And Evidence

- Feature DoD: checklist steps done, checks passed, inventory and allowlist explain every old-prefix hit.
- Stage gates: implementation.before_review, review.before_pass, qa.before_acceptance, acceptance.before_done.
- Gate inputs: design, checklist, selector inventory, allowlist, guard output, compiled fixture, evidence pack.
- Failure recovery: guard false-negative or unclassified old prefix returns to implementation; unclear provider warning returns to review / QA; evidence-only gaps return to acceptance.
- Acceptance evidence: command output, inventory diff, allowlist diff, fixture CSS, guard result.
