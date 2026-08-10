---
doc_type: feature-evidence-pack
feature: 2026-07-25-overlay-theme-scope-propagation
status: generated
---

# 2026-07-25-overlay-theme-scope-propagation evidence pack

## 1. Scope

- Design: `.codestable/features/2026-07-25-overlay-theme-scope-propagation/overlay-theme-scope-propagation-design.md`
- Checklist: `.codestable/features/2026-07-25-overlay-theme-scope-propagation/overlay-theme-scope-propagation-checklist.yaml`

## 2. DoD Results

```json
{
  "gate_id": "dod-runner",
  "stage": "acceptance",
  "status": "passed",
  "blocking": [],
  "warnings": [],
  "evidence": [
    {
      "command": "npm test --workspace amis-core -- theme",
      "exit_code": 0,
      "stdout": "\n> amis-core@6.13.0 test\n> jest theme\n\n",
      "stderr": "PASS __tests__/theme.test.ts\n  ✓ theme runtime uses stable component classnames by default (1 ms)\n  ✓ theme runtime exposes a data attribute scope (1 ms)\n  ✓ makeStableClassnames prefixes only component tokens (1 ms)\n  ✓ stable class selector helpers prefer the primary component class\n  ✓ explicit legacy DOM alias updates cached theme classnames\n  ✓ legacy DOM alias does not auto-generate non-cxd theme prefixes (1 ms)\n  ✓ overlay theme helpers resolve nearest DOM scope (1 ms)\n  ✓ overlay theme helpers apply scope idempotently\n  ✓ overlay container resolver preserves custom container scope (1 ms)\n\nTest Suites: 1 passed, 1 total\nTests:       9 passed, 9 total\nSnapshots:   0 total\nTime:        0.682 s, estimated 1 s\nRan all test suites matching /theme/i.\n",
      "id": "CMD-001",
      "core": true,
      "failure_handling": "fix-or-block"
    },
    {
      "command": "npm test --workspace amis -- Dialog",
      "exit_code": 0,
      "stdout": "\n> amis@6.13.0 test\n> jest Dialog\n\n",
      "stderr": "PASS __tests__/renderers/Dialog.test.tsx (6.714 s)\nPASS __tests__/event-action/dialog.test.tsx (12.633 s)\n\nTest Suites: 2 passed, 2 total\nTests:       12 passed, 12 total\nSnapshots:   14 passed, 14 total\nTime:        13.162 s, estimated 14 s\nRan all test suites matching /Dialog/i.\n",
      "id": "CMD-002",
      "core": false,
      "failure_handling": "document-baseline"
    },
    {
      "command": "npm test --workspace amis -- Tooltip",
      "exit_code": 0,
      "stdout": "\n> amis@6.13.0 test\n> jest Tooltip\n\n",
      "stderr": "PASS __tests__/renderers/TooltipWrapper.test.tsx (9.788 s)\n  ✓ Renderer:TooltipWrapper with trigger & title (1083 ms)\n  ✓ Renderer:TooltipWrapper with offset (523 ms)\n  ✓ Renderer:TooltipWrapper with showArrow (1024 ms)\n  ✓ Renderer:TooltipWrapper with tooltipTheme (513 ms)\n  ✓ Renderer:TooltipWrapper with mouseEnterDelay & mouseLeaveDelay (1020 ms)\n  ✓ Renderer:TooltipWrapper with context data (522 ms)\n  ✓ Renderer:TooltipWrapper with inline (40 ms)\n  ✓ Renderer:TooltipWrapper with style & tooltipStyle (514 ms)\n  ✓ Renderer:TooltipWrapper with wrapperComponent (8 ms)\n\nTest Suites: 1 passed, 1 total\nTests:       9 passed, 9 total\nSnapshots:   6 passed, 6 total\nTime:        10.075 s, estimated 11 s\nRan all test suites matching /Tooltip/i.\n",
      "id": "CMD-003",
      "core": false,
      "failure_handling": "document-baseline"
    },
    {
      "command": "npm test --workspace amis -- Select",
      "exit_code": 0,
      "stdout": "\n> amis@6.13.0 test\n> jest Select\n\n",
      "stderr": "PASS __tests__/renderers/Form/mobileNestSelect.test.tsx (9.525 s)\nPASS __tests__/renderers/Form/usersSelect.test.tsx (9.584 s)\nPASS __tests__/renderers/Form/chainedSelect.test.tsx (10.08 s)\nPASS __tests__/renderers/Form/buttonGroupSelect.test.tsx (10.182 s)\nPASS __tests__/renderers/Form/listSelect.test.tsx (12.298 s)\nPASS __tests__/renderers/Form/nestedSelect.test.tsx (12.405 s)\nPASS __tests__/renderers/Form/select.test.tsx (13.056 s)\n\nTest Suites: 7 passed, 7 total\nTests:       31 passed, 31 total\nSnapshots:   25 passed, 25 total\nTime:        13.773 s, estimated 20 s\nRan all test suites matching /Select/i.\n",
      "id": "CMD-004",
      "core": false,
      "failure_handling": "document-baseline"
    },
    {
      "command": "npm run stylelint",
      "exit_code": 0,
      "stdout": "\n> stylelint\n> npx stylelint 'packages/**/*.scss'\n\n",
      "stderr": "",
      "id": "CMD-005",
      "core": false,
      "failure_handling": "fix-or-block"
    },
    {
      "command": "rg -n \"data-amis-theme|getNearestThemeScope|applyThemeScope|resolveOverlayContainer\" packages/amis-core packages/amis-ui packages/amis",
      "exit_code": 0,
      "stdout": "sx.snap:254:    data-amis-theme=\"cxd\"\npackages/amis/__tests__/renderers/Form/__snapshots__/select.test.tsx.snap:335:                data-amis-theme=\"cxd\"\npackages/amis/__tests__/renderers/Form/__snapshots__/select.test.tsx.snap:604:    data-amis-theme=\"cxd\"\npackages/amis/__tests__/renderers/Form/__snapshots__/select.test.tsx.snap:728:    data-amis-theme=\"cxd\"\npackages/amis/__tests__/renderers/Form/__snapshots__/select.test.tsx.snap:809:                data-amis-theme=\"cxd\"\npackages/amis/__tests__/renderers/Form/__snapshots__/select.test.tsx.snap:970:    data-amis-theme=\"cxd\"\npackages/amis/__tests__/renderers/Form/__snapshots__/select.test.tsx.snap:1094:    data-amis-theme=\"cxd\"\npackages/amis/__tests__/renderers/Form/__snapshots__/select.test.tsx.snap:1175:                data-amis-theme=\"cxd\"\npackages/amis/__tests__/renderers/Form/__snapshots__/select.test.tsx.snap:1300:    data-amis-theme=\"cxd\"\npackages/amis/__tests__/renderers/Form/__snapshots__/select.test.tsx.snap:1423:    data-amis-theme=\"cxd\"\npackages/amis/__tests__/renderers/Form/__snapshots__/select.test.tsx.snap:1547:    data-amis-theme=\"cxd\"\npackages/amis/__tests__/renderers/Form/__snapshots__/select.test.tsx.snap:1628:                data-amis-theme=\"cxd\"\npackages/amis/__tests__/renderers/Form/__snapshots__/select.test.tsx.snap:1785:    data-amis-theme=\"cxd\"\npackages/amis/__tests__/renderers/Form/__snapshots__/select.test.tsx.snap:1897:                data-amis-theme=\"cxd\"\npackages/amis/__tests__/renderers/Form/__snapshots__/select.test.tsx.snap:2196:    data-amis-theme=\"cxd\"\npackages/amis/__tests__/renderers/Form/__snapshots__/select.test.tsx.snap:2320:    data-amis-theme=\"cxd\"\npackages/amis/__tests__/renderers/Form/__snapshots__/select.test.tsx.snap:2400:                  data-amis-theme=\"cxd\"\npackages/amis/__tests__/renderers/Form/__snapshots__/buttonGroupSelect.test.tsx.snap:6:    data-amis-theme=\"cxd\"\npackages/amis/__tests__/renderers/Form/__snapshots__/buttonGroupSelect.test.tsx.snap:95:    data-amis-theme=\"cxd\"\npackages/amis/__tests__/renderers/Form/__snapshots__/buttonGroupSelect.test.tsx.snap:176:    data-amis-theme=\"cxd\"\npackages/amis/__tests__/renderers/Form/__snapshots__/buttonGroupSelect.test.tsx.snap:257:    data-amis-theme=\"cxd\"\npackages/amis/__tests__/renderers/Form/__snapshots__/buttonGroupSelect.test.tsx.snap:370:    data-amis-theme=\"cxd\"\npackages/amis/__tests__/renderers/Form/__snapshots__/buttonGroupSelect.test.tsx.snap:483:    data-amis-theme=\"cxd\"\npackages/amis/__tests__/renderers/Form/__snapshots__/buttonGroupSelect.test.tsx.snap:596:    data-amis-theme=\"cxd\"\npackages/amis/__tests__/renderers/Form/__snapshots__/inputTable.test.tsx.snap:6:    data-amis-theme=\"cxd\"\npackages/amis/__tests__/renderers/Form/__snapshots__/inputTable.test.tsx.snap:236:    data-amis-theme=\"cxd\"\npackages/amis/__tests__/renderers/Form/__snapshots__/inputTable.test.tsx.snap:581:    data-amis-theme=\"cxd\"\npackages/amis/__tests__/renderers/Form/__snapshots__/inputTable.test.tsx.snap:823:    data-amis-theme=\"cxd\"\npackages/amis/__tests__/renderers/Form/__snapshots__/inputTable.test.tsx.snap:1505:    data-amis-theme=\"cxd\"\npackages/amis/__tests__/renderers/Form/__snapshots__/inputTable.test.tsx.snap:1582:    data-amis-theme=\"cxd\"\npackages/amis/__tests__/renderers/Form/__snapshots__/chainedSelect.test.tsx.snap:6:    data-amis-theme=\"cxd\"\npackages/amis/__tests__/renderers/Form/__snapshots__/formula.test.tsx.snap:6:    data-amis-theme=\"cxd\"\npackages/amis/__tests__/renderers/Form/__snapshots__/inputSubForm.test.tsx.snap:10:      data-amis-theme=\"cxd\"\npackages/amis/__tests__/renderers/Form/__snapshots__/inputSubForm.test.tsx.snap:117:    data-amis-theme=\"cxd\"\npackages/amis/__tests__/renderers/Form/__snapshots__/inputSubForm.test.tsx.snap:267:    data-amis-theme=\"cxd\"\npackages/amis/__tests__/renderers/Form/__snapshots__/inputSubForm.test.tsx.snap:422:    data-amis-theme=\"cxd\"\npackages/amis/__tests__/renderers/Form/__snapshots__/inputSubForm.test.tsx.snap:637:    data-amis-theme=\"cxd\"\n",
      "stderr": "",
      "id": "CMD-006",
      "core": true,
      "failure_handling": "document-baseline"
    },
    {
      "command": "python3 /Users/songmingxu/.agents/skills/cs-onboard/tools/validate-yaml.py --file .codestable/features/2026-07-25-overlay-theme-scope-propagation/overlay-theme-scope-propagation-checklist.yaml --yaml-only",
      "exit_code": 0,
      "stdout": "Validated 1 file(s): 1 passed, 0 failed.\n\n  ✓ .codestable/features/2026-07-25-overlay-theme-scope-propagation/overlay-theme-scope-propagation-checklist.yaml\n\nAll files valid.\n",
      "stderr": "",
      "id": "CMD-007",
      "core": true,
      "failure_handling": "fix-or-block"
    },
    {
      "command": "npm test --workspace amis-core -- Overlay",
      "exit_code": 0,
      "stdout": "\n> amis-core@6.13.0 test\n> jest Overlay\n\n",
      "stderr": "PASS __tests__/components/Overlay.test.tsx\n  ✓ Overlay applies triggering theme scope to body portal child (31 ms)\n  ✓ Overlay applies triggering theme scope to custom container child (5 ms)\n  ✓ Overlay preserves existing custom container theme scope (3 ms)\n  ✓ Overlay prefers target DOM scope over mutable env theme (1 ms)\n  ✓ Overlay scopes body portal children per triggering root (6 ms)\n  ✓ Overlay applies scope inside iframe container document (8 ms)\n\nTest Suites: 1 passed, 1 total\nTests:       6 passed, 6 total\nSnapshots:   0 total\nTime:        0.832 s, estimated 2 s\nRan all test suites matching /Overlay/i.\n",
      "id": "CMD-008",
      "core": true,
      "failure_handling": "fix-or-block"
    },
    {
      "command": "npm test --workspace amis -- renderers/Dialog.test.tsx",
      "exit_code": 0,
      "stdout": "\n> amis@6.13.0 test\n> jest renderers/Dialog.test.tsx\n\n",
      "stderr": "PASS __tests__/renderers/Dialog.test.tsx (6.081 s)\n  ✓ 1. Renderer:dialog inner crud close outter crud component (891 ms)\n  ✓ 2. Renderer:dialog inner component with common action (636 ms)\n  ✓ Renderer:dialog applies theme scope to body portal dialog (25 ms)\n  ✓ Renderer:dialog preserves custom modal container theme scope (19 ms)\n  ✓ Renderer:dialog does not fallback to body when custom modal container is unavailable (114 ms)\n  ✓ Components:Modal closes from stable root class on outside click (2 ms)\n  ✓ Components:Drawer closes from stable overlay class on outside click (2 ms)\n\nTest Suites: 1 passed, 1 total\nTests:       7 passed, 7 total\nSnapshots:   0 total\nTime:        6.367 s, estimated 7 s\nRan all test suites matching /renderers\\/Dialog.test.tsx/i.\n",
      "id": "CMD-009",
      "core": true,
      "failure_handling": "fix-or-block"
    },
    {
      "command": "npm test --workspace amis -- DrawerThemeScope",
      "exit_code": 0,
      "stdout": "\n> amis@6.13.0 test\n> jest DrawerThemeScope\n\n",
      "stderr": "PASS __tests__/renderers/DrawerThemeScope.test.tsx (5.191 s)\n  ✓ Renderer:drawer applies theme scope to portal dialog (130 ms)\n  ✓ Renderer:drawer preserves custom container theme scope (28 ms)\n  ✓ Renderer:drawer does not fallback to body when custom container is unavailable (118 ms)\n\nTest Suites: 1 passed, 1 total\nTests:       3 passed, 3 total\nSnapshots:   0 total\nTime:        5.481 s, estimated 7 s\nRan all test suites matching /DrawerThemeScope/i.\n",
      "id": "CMD-010",
      "core": true,
      "failure_handling": "fix-or-block"
    },
    {
      "command": "npm test --workspace amis -- OverlayThemeScope",
      "exit_code": 0,
      "stdout": "\n> amis@6.13.0 test\n> jest OverlayThemeScope\n\n",
      "stderr": "PASS __tests__/renderers/OverlayThemeScope.test.tsx\n  ✓ Renderer:overlay body portal uses triggering root theme scope with shared env (86 ms)\n\nTest Suites: 1 passed, 1 total\nTests:       1 passed, 1 total\nSnapshots:   0 total\nTime:        4.835 s, estimated 6 s\nRan all test suites matching /OverlayThemeScope/i.\n",
      "id": "CMD-011",
      "core": true,
      "failure_handling": "fix-or-block"
    }
  ],
  "providers": {},
  "feature": "2026-07-25-overlay-theme-scope-propagation",
  "inputs": {
    "checklist": ".codestable/features/2026-07-25-overlay-theme-scope-propagation/overlay-theme-scope-propagation-checklist.yaml"
  },
  "input_digests": {
    "checklist": "5ff0e571bc477460c15ce91d48776869f68d9c7208a2eb0e17b4194aa791b6d3"
  }
}
```

## 3. Validation Commands

Extracted from checklist `dod.commands`; see DoD Results for command status.

## 4. Scope And Cleanliness

Design bytes: 13953
Checklist bytes: 4422

## 5. Residual Risks

- none

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
  "stage": "implementation.before_review",
  "status": "passed",
  "blocking": [],
  "warnings": [],
  "evidence": [
    {
      "changed_files": [
        ".codestable/features/2026-07-25-overlay-theme-scope-propagation/approval-report.md",
        ".codestable/features/2026-07-25-overlay-theme-scope-propagation/overlay-theme-scope-propagation-checklist.yaml",
        ".codestable/features/2026-07-25-overlay-theme-scope-propagation/overlay-theme-scope-propagation-design.md",
        ".codestable/roadmap/theme-system-refactor/goal-state.yaml",
        "packages/amis-core/__tests__/theme.test.ts",
        "packages/amis-core/src/components/Overlay.tsx",
        "packages/amis-core/src/index.tsx",
        "packages/amis-core/src/theme.tsx",
        "packages/amis-ui/src/components/Drawer.tsx",
        "packages/amis-ui/src/components/Modal.tsx",
        "packages/amis/__tests__/renderers/Dialog.test.tsx",
        ".codestable/features/2026-07-25-overlay-theme-scope-propagation/overlay-theme-scope-propagation-evidence-pack.md",
        ".codestable/features/2026-07-25-overlay-theme-scope-propagation/overlay-theme-scope-propagation-implementation.md",
        ".codestable/features/2026-07-25-overlay-theme-scope-propagation/overlay-theme-scope-propagation-review-packet.md",
        ".codestable/features/2026-07-25-overlay-theme-scope-propagation/overlay-theme-scope-propagation-review.md",
        ".codestable/features/2026-07-25-overlay-theme-scope-propagation/overlay-theme-scope-propagation-scope-gate.json",
        "packages/amis-core/__tests__/components/Overlay.test.tsx",
        "packages/amis/__tests__/renderers/DrawerThemeScope.test.tsx",
        "packages/amis/__tests__/renderers/OverlayThemeScope.test.tsx"
      ],
      "ignored_machine_artifacts": [
        ".codestable/features/2026-07-25-overlay-theme-scope-propagation/overlay-theme-scope-propagation-dod-results.json",
        ".codestable/features/2026-07-25-overlay-theme-scope-propagation/overlay-theme-scope-propagation-evidence-pack-results.json"
      ],
      "allowed_prefixes": [
        ".codestable/features/2026-07-25-overlay-theme-scope-propagation",
        ".codestable/features/2026-07-25-overlay-theme-scope-propagation",
        ".codestable/roadmap/theme-system-refactor",
        "packages/amis-core/src/theme.tsx",
        "packages/amis-core/src/index.tsx",
        "packages/amis-core/src/components/Overlay.tsx",
        "packages/amis-core/__tests__/theme.test.ts",
        "packages/amis-core/__tests__/components/Overlay.test.tsx",
        "packages/amis-ui/src/components/Modal.tsx",
        "packages/amis-ui/src/components/Drawer.tsx",
        "packages/amis/__tests__/renderers/Dialog.test.tsx",
        "packages/amis/__tests__/renderers/DrawerThemeScope.test.tsx",
        "packages/amis/__tests__/renderers/OverlayThemeScope.test.tsx"
      ]
    }
  ],
  "providers": {},
  "feature": "2026-07-25-overlay-theme-scope-propagation",
  "inputs": {
    "feature_dir": ".codestable/features/2026-07-25-overlay-theme-scope-propagation"
  },
  "input_digests": {}
}
```
