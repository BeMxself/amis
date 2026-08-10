---
doc_type: feature-evidence-pack
feature: 2026-07-24-theme-runtime-button-pilot
status: generated
---

# 2026-07-24-theme-runtime-button-pilot evidence pack

## 1. Scope

- Design: `.codestable/features/2026-07-24-theme-runtime-button-pilot/theme-runtime-button-pilot-design.md`
- Checklist: `.codestable/features/2026-07-24-theme-runtime-button-pilot/theme-runtime-button-pilot-checklist.yaml`

## 2. DoD Results

```json
{
  "gate_id": "dod-runner",
  "stage": "acceptance",
  "status": "passed",
  "blocking": [],
  "warnings": [
    "CMD-003: non-core command failed with exit 1"
  ],
  "evidence": [
    {
      "command": "npm test --workspace amis-core -- theme",
      "exit_code": 0,
      "stdout": "\n> amis-core@6.13.0 test\n> jest theme\n\n",
      "stderr": "PASS __tests__/theme.test.ts\n  ✓ theme runtime uses stable component classnames by default (1 ms)\n  ✓ theme runtime exposes a data attribute scope (1 ms)\n  ✓ makeStableClassnames prefixes only component tokens\n  ✓ stable class selector helpers prefer the primary component class\n  ✓ explicit legacy DOM alias updates cached theme classnames (1 ms)\n  ✓ legacy DOM alias does not auto-generate non-cxd theme prefixes\n  ✓ overlay theme helpers resolve nearest DOM scope (1 ms)\n  ✓ overlay theme helpers apply scope idempotently (1 ms)\n  ✓ overlay container resolver preserves custom container scope\n\nTest Suites: 1 passed, 1 total\nTests:       9 passed, 9 total\nSnapshots:   0 total\nTime:        1.062 s\nRan all test suites matching /theme/i.\n",
      "id": "CMD-001",
      "core": true,
      "failure_handling": "fix-or-block"
    },
    {
      "command": "npm test --workspace amis -- button",
      "exit_code": 0,
      "stdout": "\n> amis@6.13.0 test\n> jest button\n\n",
      "stderr": "PASS __tests__/renderers/ButtonToolbar.test.tsx (7.076 s)\nPASS __tests__/renderers/Form/buttonToolBar.test.tsx (7.334 s)\nPASS __tests__/renderers/Form/button.test.tsx (7.351 s)\nPASS __tests__/renderers/Form/buttonGroupSelect.test.tsx (7.766 s)\nPASS __tests__/renderers/DropDownButton.test.tsx (9.38 s)\n\nTest Suites: 5 passed, 5 total\nTests:       19 passed, 19 total\nSnapshots:   20 passed, 20 total\nTime:        10.046 s\nRan all test suites matching /button/i.\n",
      "id": "CMD-002",
      "core": true,
      "failure_handling": "fix-or-block"
    },
    {
      "command": "npm run typecheck",
      "exit_code": 1,
      "stdout": "e: string; id: string; parentId: string; key: string; pristine: any; data: any; rowSpans: any; index: number; newIndex: number; path: string; expandable: boolean; checkdisable: boolean; isHover: boolean; children: IMSTArray<...> & IStateTreeNode<...>; depth: number; } & NonEmptyObject & { ...; } & { ...; }...'.\npackages/amis/src/renderers/Table/TableRow.tsx(370,21): error TS2339: Property 'loading' does not exist on type '{ storeType: string; id: string; parentId: string; key: string; pristine: any; data: any; rowSpans: any; index: number; newIndex: number; path: string; expandable: boolean; checkdisable: boolean; isHover: boolean; children: IMSTArray<...> & IStateTreeNode<...>; depth: number; } & NonEmptyObject & { ...; } & { ...; }...'.\npackages/amis/src/renderers/Table/TableRow.tsx(371,19): error TS2339: Property 'error' does not exist on type '{ storeType: string; id: string; parentId: string; key: string; pristine: any; data: any; rowSpans: any; index: number; newIndex: number; path: string; expandable: boolean; checkdisable: boolean; isHover: boolean; children: IMSTArray<...> & IStateTreeNode<...>; depth: number; } & NonEmptyObject & { ...; } & { ...; }...'.\npackages/amis/src/renderers/Table/VirtualTableBody.tsx(91,29): error TS2339: Property 'height' does not exist on type '{ storeType: string; id: string; parentId: string; key: string; pristine: any; data: any; rowSpans: any; index: number; newIndex: number; path: string; expandable: boolean; checkdisable: boolean; isHover: boolean; children: IMSTArray<...> & IStateTreeNode<...>; depth: number; } & NonEmptyObject & { ...; } & { ...; }...'.\npackages/amis/src/renderers/Wizard.tsx(564,31): error TS2345: Argument of type 'false | AMISApi | undefined' is not assignable to parameter of type 'Api'.\n  Type 'undefined' is not assignable to type 'Api'.\nscripts/build-schemas.ts(28,3): error TS2305: Module '\"ts-json-schema-generator\"' has no exported member 'getAllOfDefinitionReducer'.\nscripts/build-schemas.ts(32,3): error TS2305: Module '\"ts-json-schema-generator\"' has no exported member 'IndexedAccessTypeNodeParser'.\nscripts/build-schemas.ts(108,9): error TS2345: Argument of type 'MyIndexedAccessTypeNodeParser' is not assignable to parameter of type 'SubNodeParser'.\n  Property 'supportsNode' is missing in type 'MyIndexedAccessTypeNodeParser' but required in type 'SubNodeParser'.\nscripts/build-schemas.ts(109,11): error TS2554: Expected 0 arguments, but got 2.\nscripts/build-schemas.ts(151,27): error TS2339: Property 'typeChecker' does not exist on type 'MyIndexedAccessTypeNodeParser'.\nscripts/build-schemas.ts(155,18): error TS2339: Property 'childNodeParser' does not exist on type 'MyIndexedAccessTypeNodeParser'.\nscripts/build-schemas.ts(156,16): error TS18046: 'member' is of type 'unknown'.\nscripts/build-schemas.ts(168,7): error TS2415: Class 'MyObjectTypeFormatter' incorrectly extends base class 'ObjectTypeFormatter'.\n  Property 'childTypeFormatter' is private in type 'ObjectTypeFormatter' but not in type 'MyObjectTypeFormatter'.\nscripts/build-schemas.ts(179,19): error TS2341: Property 'getObjectDefinition' is private and only accessible within class 'ObjectTypeFormatter'.\nscripts/build-schemas.ts(184,14): error TS2341: Property 'getObjectDefinition' is private and only accessible within class 'ObjectTypeFormatter'.\nscripts/build-schemas.ts(270,46): error TS2339: Property 'getPreserveLiterals' does not exist on type 'StringType'.\nscripts/build-schemas.ts(272,63): error TS2339: Property 'isString' does not exist on type 'LiteralType'.\nscripts/build-schemas.ts(292,32): error TS2341: Property 'childTypeFormatter' is private and only accessible within class 'IntersectionTypeFormatter'.\nscripts/build-schemas.ts(294,36): error TS2341: Property 'childTypeFormatter' is private and only accessible within class 'IntersectionTypeFormatter'.\nscripts/build-schemas.ts(307,42): error TS2341: Property 'childTypeFormatter' is private and only accessible within class 'IntersectionTypeFormatter'.\n",
      "stderr": "",
      "id": "CMD-003",
      "core": false,
      "failure_handling": "document-baseline"
    },
    {
      "command": "npm run stylelint",
      "exit_code": 0,
      "stdout": "\n> stylelint\n> npx stylelint 'packages/**/*.scss'\n\n",
      "stderr": "",
      "id": "CMD-004",
      "core": true,
      "failure_handling": "fix-or-block"
    },
    {
      "command": "rg -n \"\\.cxd-Button|#\\{\\$ns\\}Button|legacyDomClassAlias|componentClassPrefix|data-amis-theme\" packages/amis-core packages/amis-ui packages/amis",
      "exit_code": 0,
      "stdout": "renderers/__snapshots__/List.test.tsx.snap:6:    data-amis-theme=\"cxd\"\npackages/amis/__tests__/renderers/__snapshots__/List.test.tsx.snap:783:      data-amis-theme=\"cxd\"\npackages/amis/__tests__/renderers/__snapshots__/List.test.tsx.snap:969:    data-amis-theme=\"cxd\"\npackages/amis/__tests__/renderers/__snapshots__/List.test.tsx.snap:1037:    data-amis-theme=\"cxd\"\npackages/amis/__tests__/renderers/__snapshots__/List.test.tsx.snap:1256:    data-amis-theme=\"cxd\"\npackages/amis/__tests__/renderers/__snapshots__/List.test.tsx.snap:1463:    data-amis-theme=\"cxd\"\npackages/amis/__tests__/renderers/__snapshots__/List.test.tsx.snap:1703:    data-amis-theme=\"cxd\"\npackages/amis/__tests__/renderers/Form/__snapshots__/select.test.tsx.snap:6:    data-amis-theme=\"cxd\"\npackages/amis/__tests__/renderers/Form/__snapshots__/select.test.tsx.snap:130:    data-amis-theme=\"cxd\"\npackages/amis/__tests__/renderers/Form/__snapshots__/select.test.tsx.snap:254:    data-amis-theme=\"cxd\"\npackages/amis/__tests__/renderers/Form/__snapshots__/select.test.tsx.snap:335:                data-amis-theme=\"cxd\"\npackages/amis/__tests__/renderers/Form/__snapshots__/select.test.tsx.snap:604:    data-amis-theme=\"cxd\"\npackages/amis/__tests__/renderers/Form/__snapshots__/select.test.tsx.snap:728:    data-amis-theme=\"cxd\"\npackages/amis/__tests__/renderers/Form/__snapshots__/select.test.tsx.snap:809:                data-amis-theme=\"cxd\"\npackages/amis/__tests__/renderers/Form/__snapshots__/select.test.tsx.snap:970:    data-amis-theme=\"cxd\"\npackages/amis/__tests__/renderers/Form/__snapshots__/select.test.tsx.snap:1094:    data-amis-theme=\"cxd\"\npackages/amis/__tests__/renderers/Form/__snapshots__/select.test.tsx.snap:1175:                data-amis-theme=\"cxd\"\npackages/amis/__tests__/renderers/Form/__snapshots__/select.test.tsx.snap:1300:    data-amis-theme=\"cxd\"\npackages/amis/__tests__/renderers/Form/__snapshots__/select.test.tsx.snap:1423:    data-amis-theme=\"cxd\"\npackages/amis/__tests__/renderers/Form/__snapshots__/select.test.tsx.snap:1547:    data-amis-theme=\"cxd\"\npackages/amis/__tests__/renderers/Form/__snapshots__/select.test.tsx.snap:1628:                data-amis-theme=\"cxd\"\npackages/amis/__tests__/renderers/Form/__snapshots__/select.test.tsx.snap:1785:    data-amis-theme=\"cxd\"\npackages/amis/__tests__/renderers/Form/__snapshots__/select.test.tsx.snap:1897:                data-amis-theme=\"cxd\"\npackages/amis/__tests__/renderers/Form/__snapshots__/select.test.tsx.snap:2196:    data-amis-theme=\"cxd\"\npackages/amis/__tests__/renderers/Form/__snapshots__/select.test.tsx.snap:2320:    data-amis-theme=\"cxd\"\npackages/amis/__tests__/renderers/Form/__snapshots__/select.test.tsx.snap:2400:                  data-amis-theme=\"cxd\"\npackages/amis/__tests__/renderers/__snapshots__/Table.test.tsx.snap:6:    data-amis-theme=\"cxd\"\npackages/amis/__tests__/renderers/__snapshots__/Table.test.tsx.snap:337:    data-amis-theme=\"cxd\"\npackages/amis/__tests__/renderers/__snapshots__/Table.test.tsx.snap:691:    data-amis-theme=\"cxd\"\npackages/amis/__tests__/renderers/__snapshots__/Table.test.tsx.snap:1252:    data-amis-theme=\"cxd\"\npackages/amis/__tests__/renderers/__snapshots__/Table.test.tsx.snap:1583:    data-amis-theme=\"cxd\"\npackages/amis/__tests__/renderers/__snapshots__/Table.test.tsx.snap:1925:    data-amis-theme=\"cxd\"\npackages/amis/__tests__/renderers/__snapshots__/Table.test.tsx.snap:2465:    data-amis-theme=\"cxd\"\npackages/amis/__tests__/renderers/__snapshots__/Table.test.tsx.snap:3075:    data-amis-theme=\"cxd\"\npackages/amis/__tests__/renderers/__snapshots__/Table.test.tsx.snap:3819:    data-amis-theme=\"cxd\"\npackages/amis/__tests__/renderers/__snapshots__/Table.test.tsx.snap:4567:    data-amis-theme=\"cxd\"\npackages/amis/__tests__/renderers/__snapshots__/Table.test.tsx.snap:5303:    data-amis-theme=\"cxd\"\npackages/amis/__tests__/renderers/__snapshots__/Table.test.tsx.snap:6047:    data-amis-theme=\"cxd\"\npackages/amis/__tests__/renderers/__snapshots__/Table.test.tsx.snap:6389:    data-amis-theme=\"cxd\"\n",
      "stderr": "",
      "id": "CMD-005",
      "core": true,
      "failure_handling": "document-baseline"
    }
  ],
  "providers": {},
  "feature": "2026-07-24-theme-runtime-button-pilot",
  "inputs": {
    "checklist": ".codestable/features/2026-07-24-theme-runtime-button-pilot/theme-runtime-button-pilot-checklist.yaml"
  },
  "input_digests": {
    "checklist": "a36acd359d43d6cde7660fd02b9bd0145ac445d2a55a0a2574802870cd6c4b6f"
  }
}
```

## 3. Validation Commands

Extracted from checklist `dod.commands`; see DoD Results for command status.

## 4. Scope And Cleanliness

Design bytes: 17314
Checklist bytes: 3720

## 5. Residual Risks

- CMD-003: non-core command failed with exit 1

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
        ".codestable/features/2026-07-24-theme-runtime-button-pilot/theme-runtime-button-pilot-checklist.yaml",
        ".codestable/roadmap/theme-system-refactor/goal-state.yaml"
      ],
      "ignored_machine_artifacts": [
        ".codestable/features/2026-07-24-theme-runtime-button-pilot/theme-runtime-button-pilot-dod-results.json"
      ],
      "allowed_prefixes": [
        ".codestable/features/2026-07-24-theme-runtime-button-pilot",
        ".codestable/features/2026-07-24-theme-runtime-button-pilot",
        ".codestable/roadmap/theme-system-refactor/goal-state.yaml"
      ]
    }
  ],
  "providers": {},
  "feature": "2026-07-24-theme-runtime-button-pilot",
  "inputs": {
    "feature_dir": ".codestable/features/2026-07-24-theme-runtime-button-pilot"
  },
  "input_digests": {}
}
```
