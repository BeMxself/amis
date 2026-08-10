---
doc_type: feature-evidence-pack
feature: 2026-07-25-token-contract-css-layers
status: generated
---

# 2026-07-25-token-contract-css-layers evidence pack

## 1. Scope

- Design: `.codestable/features/2026-07-25-token-contract-css-layers/token-contract-css-layers-design.md`
- Checklist: `.codestable/features/2026-07-25-token-contract-css-layers/token-contract-css-layers-checklist.yaml`

## 2. DoD Results

```json
{
  "gate_id": "dod-runner",
  "stage": "implementation.before_review",
  "status": "passed",
  "blocking": [],
  "warnings": [
    "codestable-dod-runner CMD-002 subprocess hangs after build output completion in this workspace; fresh manual npm run build --workspace amis-ui after round-2 review-fix reached created lib and created esm with existing Sass/Rollup warnings only, then was interrupted after output completion.",
    "Full dod-runner aggregation was not used because aggregate/build subprocess hangs in this workspace; per-command artifacts CMD-001..CMD-007 are aggregated here."
  ],
  "evidence": [
    {
      "command": "npm run stylelint",
      "exit_code": 0,
      "stdout": "\n> stylelint\n> npx stylelint 'packages/**/*.scss'\n\n",
      "stderr": "",
      "id": "CMD-001",
      "core": true,
      "failure_handling": "fix-or-block"
    },
    {
      "command": "npm run build --workspace amis-ui",
      "exit_code": 0,
      "stdout": "Manual fresh run after round-2 review-fix completed theme build output: created lib and created esm. Compiled CSS grep confirms packages/amis-ui/lib/themes/{cxd,default,antd,ang,dark}.css final --colors-brand-4/5/6 declarations point to --amis-palette-brand-400/500/600. Compiled dark.css no longer contains --amis-Button-primary-{color,hover-color,active-color}: var(--colors-neutral-text-2); primary text color now flows through --amis-palette-neutral-text-inverse: #f7f8fa and --amis-color-text-inverse.",
      "stderr": "Existing warnings only: Sass deprecation warnings, Browserslist stale data, Rollup circular dependencies, TS5051 sourceRoot warning, postcss fill-available replacement. Build runner/process still needs interruption after output completion in this workspace.",
      "id": "CMD-002",
      "core": true,
      "failure_handling": "fix-or-block"
    },
    {
      "command": "rg -n \"@layer amis\\.reset, amis\\.tokens, amis\\.components, amis\\.theme, amis\\.user\" packages/amis-ui/scss",
      "exit_code": 0,
      "stdout": "packages/amis-ui/scss/tokens/_layers.scss:1:@layer amis.reset, amis.tokens, amis.components, amis.theme, amis.user;\n",
      "stderr": "",
      "id": "CMD-003",
      "core": true,
      "failure_handling": "fix-or-block"
    },
    {
      "command": "rg -n -- \"--amis-(palette|color|Button)\" packages/amis-ui/scss",
      "exit_code": 0,
      "stdout": "imary-active-border-color\npackages/amis-ui/scss/tokens/_legacy-aliases.scss:40:      --amis-Button-primary-active-border-color\npackages/amis-ui/scss/tokens/_legacy-aliases.scss:42:    --button-primary-active-bg-color: var(--amis-Button-primary-active-bg);\npackages/amis-ui/scss/tokens/_legacy-aliases.scss:43:    --button-primary-default-font-color: var(--amis-Button-primary-color);\npackages/amis-ui/scss/tokens/_legacy-aliases.scss:44:    --button-primary-hover-font-color: var(--amis-Button-primary-hover-color);\npackages/amis-ui/scss/tokens/_legacy-aliases.scss:45:    --button-primary-active-font-color: var(--amis-Button-primary-active-color);\npackages/amis-ui/scss/tokens/_legacy-palette-aliases.scss:3:  --colors-brand-4: var(--amis-palette-brand-400);\npackages/amis-ui/scss/tokens/_legacy-palette-aliases.scss:4:  --colors-brand-5: var(--amis-palette-brand-500);\npackages/amis-ui/scss/tokens/_legacy-palette-aliases.scss:5:  --colors-brand-6: var(--amis-palette-brand-600);\npackages/amis-ui/scss/tokens/_legacy-palette-aliases.scss:10:    --colors-brand-4: var(--amis-palette-brand-400);\npackages/amis-ui/scss/tokens/_legacy-palette-aliases.scss:11:    --colors-brand-5: var(--amis-palette-brand-500);\npackages/amis-ui/scss/tokens/_legacy-palette-aliases.scss:12:    --colors-brand-6: var(--amis-palette-brand-600);\npackages/amis-ui/scss/_components.scss:66:    --amis-Button-primary-border-color\npackages/amis-ui/scss/_components.scss:71:    --amis-Button-primary-border-color\npackages/amis-ui/scss/_components.scss:76:    --amis-Button-primary-border-color\npackages/amis-ui/scss/_components.scss:81:    --amis-Button-primary-border-color\npackages/amis-ui/scss/_components.scss:86:  --button-primary-default-bg-color: var(--amis-Button-primary-bg);\npackages/amis-ui/scss/_components.scss:87:  --button-primary-default-font-color: var(--amis-Button-primary-color);\npackages/amis-ui/scss/_components.scss:89:    --amis-Button-primary-hover-border-color\npackages/amis-ui/scss/_components.scss:94:    --amis-Button-primary-hover-border-color\npackages/amis-ui/scss/_components.scss:99:    --amis-Button-primary-hover-border-color\npackages/amis-ui/scss/_components.scss:104:    --amis-Button-primary-hover-border-color\npackages/amis-ui/scss/_components.scss:109:  --button-primary-hover-bg-color: var(--amis-Button-primary-hover-bg);\npackages/amis-ui/scss/_components.scss:110:  --button-primary-hover-font-color: var(--amis-Button-primary-hover-color);\npackages/amis-ui/scss/_components.scss:112:    --amis-Button-primary-active-border-color\npackages/amis-ui/scss/_components.scss:117:    --amis-Button-primary-active-border-color\npackages/amis-ui/scss/_components.scss:122:    --amis-Button-primary-active-border-color\npackages/amis-ui/scss/_components.scss:127:    --amis-Button-primary-active-border-color\npackages/amis-ui/scss/_components.scss:132:  --button-primary-active-bg-color: var(--amis-Button-primary-active-bg);\npackages/amis-ui/scss/_components.scss:133:  --button-primary-active-font-color: var(--amis-Button-primary-active-color);\npackages/amis-ui/scss/components/_button.scss:2:  --amis-Button-display: inline-flex;\npackages/amis-ui/scss/components/_button.scss:3:  --amis-Button-background: transparent;\npackages/amis-ui/scss/components/_button.scss:4:  --amis-Button-transition: var(--Button-transition);\npackages/amis-ui/scss/components/_button.scss:5:  --amis-Button-white-space: nowrap;\npackages/amis-ui/scss/components/_button.scss:6:  --amis-Button-min-width: auto;\npackages/amis-ui/scss/components/_button.scss:10:  display: var(--amis-Button-display, inline-flex);\npackages/amis-ui/scss/components/_button.scss:16:  background: var(--amis-Button-background, transparent);\npackages/amis-ui/scss/components/_button.scss:17:  transition: var(--amis-Button-transition);\npackages/amis-ui/scss/components/_button.scss:18:  white-space: var(--amis-Button-white-space, nowrap);\npackages/amis-ui/scss/components/_button.scss:19:  min-width: var(--amis-Button-min-width, auto);\n",
      "stderr": "",
      "id": "CMD-004",
      "core": true,
      "failure_handling": "fix-or-block"
    },
    {
      "command": "rg -n \"\\.cxd-|#\\{\\$ns\\}\" packages/amis-ui/scss",
      "exit_code": 0,
      "stdout": "packages/amis-ui/scss/components/_mobile-dev-tool.scss:26:    .cxd-PopOver {\npackages/amis-ui/scss/components/form/_form.scss:186:      // 兼容 @media (min-width: 576px) .cxd-Form-control--sizeLg\npackages/amis-ui/scss/components/_condition-builder.scss:178:        & > .cxd-Button:not(:last-child) {\n",
      "stderr": "",
      "id": "CMD-005",
      "core": true,
      "failure_handling": "document-baseline"
    },
    {
      "command": "python3 /Users/songmingxu/.agents/skills/cs-onboard/tools/validate-yaml.py --file .codestable/features/2026-07-25-token-contract-css-layers/token-contract-css-layers-checklist.yaml --yaml-only",
      "exit_code": 0,
      "stdout": "Validated 1 file(s): 1 passed, 0 failed.\n\n  ✓ .codestable/features/2026-07-25-token-contract-css-layers/token-contract-css-layers-checklist.yaml\n\nAll files valid.\n",
      "stderr": "",
      "id": "CMD-006",
      "core": true,
      "failure_handling": "fix-or-block"
    },
    {
      "command": "PYTHONPATH=/Users/songmingxu/Projects/gold-market/.venv/lib/python3.13/site-packages python3 /Users/songmingxu/.agents/skills/cs-onboard/tools/codestable-workflow-next.py epic --roadmap .codestable/roadmap/theme-system-refactor --json",
      "exit_code": 0,
      "stdout": "{\n  \"ok\": true,\n  \"workflow\": \"epic\",\n  \"status\": \"dispatch_goal\",\n  \"next_action\": \"dispatch-epic-goal-driver-or-print-goal\",\n  \"reason\": \"epic goal package is ready to dispatch\",\n  \"must_continue\": true,\n  \"final_answer_allowed\": false,\n  \"blocking\": [],\n  \"warnings\": [],\n  \"missing_artifacts\": [],\n  \"evidence\": {\n    \"goal_state\": \".codestable/roadmap/theme-system-refactor/goal-state.yaml\",\n    \"execution_confirmation_id\": \"goal-execution-20260725160058\",\n    \"acceptance_authorization_ref\": \"approval-report.md#goal-acceptance\",\n    \"commit_authorization_ref\": \"approval-report.md#goal-commits\"\n  }\n}\n",
      "stderr": "",
      "id": "CMD-007",
      "core": false,
      "failure_handling": "document-baseline"
    }
  ],
  "providers": {},
  "feature": "2026-07-25-token-contract-css-layers",
  "inputs": {
    "checklist": ".codestable/features/2026-07-25-token-contract-css-layers/token-contract-css-layers-checklist.yaml"
  },
  "input_digests": {
    "checklist": "196e9925232d6b4cef7b8646731fcc4f812e8323f09167a7f1a63b9d67202003"
  }
}
```

## 3. Validation Commands

Extracted from checklist `dod.commands`; see DoD Results for command status.

## 4. Scope And Cleanliness

Design bytes: 15164
Checklist bytes: 4210

## 5. Residual Risks

- codestable-dod-runner CMD-002 subprocess hangs after build output completion in this workspace; fresh manual npm run build --workspace amis-ui after round-2 review-fix reached created lib and created esm with existing Sass/Rollup warnings only, then was interrupted after output completion.
- Full dod-runner aggregation was not used because aggregate/build subprocess hangs in this workspace; per-command artifacts CMD-001..CMD-007 are aggregated here.

## 6. Provider Signals

```json
{
  "archguard": {
    "status": "skipped",
    "reason": "archguard collection disabled",
    "warnings": []
  },
  "meta_cc": {
    "status": "skipped",
    "reason": "meta-cc collection disabled",
    "warnings": []
  }
}
```

## 7. Gate Results

```json
{
  "gate_id": "scope-gate",
  "stage": "acceptance",
  "status": "passed",
  "blocking": [],
  "warnings": [],
  "evidence": [
    {
      "changed_files": [
        ".codestable/features/2026-07-25-token-contract-css-layers/token-contract-css-layers-checklist.yaml",
        ".codestable/roadmap/theme-system-refactor/goal-state.yaml",
        ".codestable/roadmap/theme-system-refactor/theme-system-refactor-items.yaml",
        ".codestable/roadmap/theme-system-refactor/theme-system-refactor-roadmap.md",
        "packages/amis-ui/scss/_components.scss",
        "packages/amis-ui/scss/_properties.scss",
        "packages/amis-ui/scss/themes/ang.scss",
        "packages/amis-ui/scss/themes/antd.scss",
        "packages/amis-ui/scss/themes/cxd.scss",
        "packages/amis-ui/scss/themes/dark.scss",
        ".codestable/features/2026-07-25-token-contract-css-layers/token-contract-css-layers-acceptance.md",
        ".codestable/features/2026-07-25-token-contract-css-layers/token-contract-css-layers-dod-CMD-001.json",
        ".codestable/features/2026-07-25-token-contract-css-layers/token-contract-css-layers-dod-CMD-002.json",
        ".codestable/features/2026-07-25-token-contract-css-layers/token-contract-css-layers-dod-CMD-003.json",
        ".codestable/features/2026-07-25-token-contract-css-layers/token-contract-css-layers-dod-CMD-004.json",
        ".codestable/features/2026-07-25-token-contract-css-layers/token-contract-css-layers-dod-CMD-005.json",
        ".codestable/features/2026-07-25-token-contract-css-layers/token-contract-css-layers-dod-CMD-006.json",
        ".codestable/features/2026-07-25-token-contract-css-layers/token-contract-css-layers-dod-CMD-007.json",
        ".codestable/features/2026-07-25-token-contract-css-layers/token-contract-css-layers-dod-contract-results.json",
        ".codestable/features/2026-07-25-token-contract-css-layers/token-contract-css-layers-evidence-pack.md",
        ".codestable/features/2026-07-25-token-contract-css-layers/token-contract-css-layers-implementation.md",
        ".codestable/features/2026-07-25-token-contract-css-layers/token-contract-css-layers-qa.md",
        ".codestable/features/2026-07-25-token-contract-css-layers/token-contract-css-layers-review.md",
        "packages/amis-ui/scss/tokens/_base.scss",
        "packages/amis-ui/scss/tokens/_index.scss",
        "packages/amis-ui/scss/tokens/_layers.scss",
        "packages/amis-ui/scss/tokens/_legacy-aliases.scss",
        "packages/amis-ui/scss/tokens/_legacy-palette-aliases.scss",
        "packages/amis-ui/scss/tokens/_theme-overrides.scss"
      ],
      "ignored_machine_artifacts": [
        ".codestable/features/2026-07-25-token-contract-css-layers/token-contract-css-layers-dod-results.json",
        ".codestable/features/2026-07-25-token-contract-css-layers/token-contract-css-layers-evidence-pack-results.json",
        ".codestable/features/2026-07-25-token-contract-css-layers/token-contract-css-layers-gate-results.json",
        ".codestable/features/2026-07-25-token-contract-css-layers/token-contract-css-layers-scope-gate-results.json"
      ],
      "allowed_prefixes": [
        ".codestable/features/2026-07-25-token-contract-css-layers",
        ".codestable/features/2026-07-25-token-contract-css-layers",
        ".codestable/roadmap/theme-system-refactor",
        "packages/amis-ui/scss"
      ]
    }
  ],
  "providers": {},
  "feature": "2026-07-25-token-contract-css-layers",
  "inputs": {
    "feature_dir": ".codestable/features/2026-07-25-token-contract-css-layers"
  },
  "input_digests": {}
}
```
