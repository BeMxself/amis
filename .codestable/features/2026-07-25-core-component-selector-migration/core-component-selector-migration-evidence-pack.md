---
doc_type: feature-evidence-pack
feature: 2026-07-25-core-component-selector-migration
status: generated
---

# 2026-07-25-core-component-selector-migration evidence pack

## 1. Scope

- Design: `.codestable/features/2026-07-25-core-component-selector-migration/core-component-selector-migration-design.md`
- Checklist: `.codestable/features/2026-07-25-core-component-selector-migration/core-component-selector-migration-checklist.yaml`

## 2. DoD Results

```json
{
  "gate_id": "dod-runner",
  "stage": "implementation.before_review",
  "status": "passed",
  "blocking": [],
  "warnings": [],
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
      "command": "npm run check:theme-selectors --workspace amis-ui",
      "exit_code": 0,
      "stdout": "\n> amis-ui@6.13.0 check:theme-selectors\n> node ./scripts/checkThemeSelectors.js\n\nTheme selector guard passed: 1507 legacy baseline match(es), 0 new violation(s).\n",
      "stderr": "",
      "id": "CMD-002",
      "core": true,
      "failure_handling": "fix-or-block"
    },
    {
      "command": "npm test --workspace amis -- button",
      "exit_code": 0,
      "stdout": "\n> amis@6.13.0 test\n> jest button\n\n",
      "stderr": "PASS __tests__/renderers/ButtonToolbar.test.tsx (10.364 s)\nPASS __tests__/renderers/Form/buttonToolBar.test.tsx (10.638 s)\nPASS __tests__/renderers/Form/button.test.tsx (10.656 s)\nPASS __tests__/renderers/Form/buttonGroupSelect.test.tsx (11.071 s)\nPASS __tests__/renderers/DropDownButton.test.tsx (12.651 s)\n\nTest Suites: 5 passed, 5 total\nTests:       19 passed, 19 total\nSnapshots:   20 passed, 20 total\nTime:        13.922 s\nRan all test suites matching /button/i.\n",
      "id": "CMD-003",
      "core": true,
      "failure_handling": "fix-or-block"
    },
    {
      "command": "npm test --workspace amis -- Dialog",
      "exit_code": 0,
      "stdout": "\n> amis@6.13.0 test\n> jest Dialog\n\n",
      "stderr": "PASS __tests__/renderers/Dialog.test.tsx (7.86 s)\nPASS __tests__/event-action/dialog.test.tsx (13.936 s)\n\nTest Suites: 2 passed, 2 total\nTests:       12 passed, 12 total\nSnapshots:   14 passed, 14 total\nTime:        14.704 s\nRan all test suites matching /Dialog/i.\n",
      "id": "CMD-004",
      "core": true,
      "failure_handling": "fix-or-block"
    },
    {
      "command": "npm test --workspace amis -- Tooltip",
      "exit_code": 0,
      "stdout": "\n> amis@6.13.0 test\n> jest Tooltip\n\n",
      "stderr": "PASS __tests__/renderers/TooltipWrapper.test.tsx (10.425 s)\n  ✓ Renderer:TooltipWrapper with trigger & title (1073 ms)\n  ✓ Renderer:TooltipWrapper with offset (520 ms)\n  ✓ Renderer:TooltipWrapper with showArrow (1016 ms)\n  ✓ Renderer:TooltipWrapper with tooltipTheme (521 ms)\n  ✓ Renderer:TooltipWrapper with mouseEnterDelay & mouseLeaveDelay (1036 ms)\n  ✓ Renderer:TooltipWrapper with context data (520 ms)\n  ✓ Renderer:TooltipWrapper with inline (48 ms)\n  ✓ Renderer:TooltipWrapper with style & tooltipStyle (512 ms)\n  ✓ Renderer:TooltipWrapper with wrapperComponent (10 ms)\n\nTest Suites: 1 passed, 1 total\nTests:       9 passed, 9 total\nSnapshots:   6 passed, 6 total\nTime:        10.883 s\nRan all test suites matching /Tooltip/i.\n",
      "id": "CMD-005",
      "core": true,
      "failure_handling": "fix-or-block"
    },
    {
      "command": "npm test --workspace amis -- Select",
      "exit_code": 0,
      "stdout": "\n> amis@6.13.0 test\n> jest Select\n\n",
      "stderr": "PASS __tests__/renderers/Form/mobileNestSelect.test.tsx (15.313 s)\nPASS __tests__/renderers/Form/usersSelect.test.tsx (15.588 s)\nPASS __tests__/renderers/Form/chainedSelect.test.tsx (15.968 s)\nPASS __tests__/renderers/Form/buttonGroupSelect.test.tsx (16.183 s)\nPASS __tests__/renderers/Form/listSelect.test.tsx (17.955 s)\nPASS __tests__/renderers/Form/nestedSelect.test.tsx (18.122 s)\nPASS __tests__/renderers/Form/select.test.tsx (19.12 s)\n\nTest Suites: 7 passed, 7 total\nTests:       31 passed, 31 total\nSnapshots:   25 passed, 25 total\nTime:        20.537 s\nRan all test suites matching /Select/i.\n",
      "id": "CMD-006",
      "core": true,
      "failure_handling": "fix-or-block"
    },
    {
      "command": "npm test --workspace amis -- DropDownButton",
      "exit_code": 0,
      "stdout": "\n> amis@6.13.0 test\n> jest DropDownButton\n\n",
      "stderr": "PASS __tests__/renderers/DropDownButton.test.tsx (8.071 s)\n  ✓ Renderer:dropdown-button (71 ms)\n  ✓ Renderer:dropdown-button with buttons group (25 ms)\n  ✓ Renderer:dropdown-button with closeOnClick & closeOnOutside (2062 ms)\n  ✓ Renderer:dropdown-button with trigger (213 ms)\n  ✓ Renderer:dropdown-button with icon & rightIcon (8 ms)\n  ✓ Renderer:dropdown-button with hideCaret (7 ms)\n  ✓ Renderer:dropdown-button with defaultIsOpened (14 ms)\n  ✓ Renderer:dropdown-button with align (10 ms)\n  ✓ Renderer:dropdown-button with block & size (10 ms)\n  ✓ Renderer:dropdown-button buttons with className & level (10 ms)\n\nTest Suites: 1 passed, 1 total\nTests:       10 passed, 10 total\nSnapshots:   8 passed, 8 total\nTime:        8.619 s, estimated 13 s\nRan all test suites matching /DropDownButton/i.\n",
      "id": "CMD-007",
      "core": false,
      "failure_handling": "fix-or-block"
    },
    {
      "command": "npm test --workspace amis -- Table",
      "exit_code": 0,
      "stdout": "\n> amis@6.13.0 test\n> jest Table\n\n",
      "stderr": "PASS __tests__/renderers/Table/index.test.tsx (9.079 s)\nPASS __tests__/renderers/TableView.test.tsx (9.161 s)\nPASS __tests__/renderers/Table/Cell.test.tsx (9.388 s)\nPASS __tests__/renderers/Table.test.tsx (11.911 s)\nPASS __tests__/renderers/Form/inputTable.test.tsx (20.987 s)\n\nTest Suites: 5 passed, 5 total\nTests:       49 passed, 49 total\nSnapshots:   22 passed, 22 total\nTime:        21.902 s\nRan all test suites matching /Table/i.\n",
      "id": "CMD-008",
      "core": true,
      "failure_handling": "fix-or-block"
    },
    {
      "command": "npm test --workspace amis -- drawer",
      "exit_code": 0,
      "stdout": "\n> amis@6.13.0 test\n> jest drawer\n\n",
      "stderr": "PASS __tests__/renderers/DrawerThemeScope.test.tsx (6.76 s)\nPASS __tests__/event-action/drawer.test.tsx (16.606 s)\n\nTest Suites: 2 passed, 2 total\nTests:       7 passed, 7 total\nSnapshots:   14 passed, 14 total\nTime:        17.564 s\nRan all test suites matching /drawer/i.\n",
      "id": "CMD-012",
      "core": true,
      "failure_handling": "fix-or-block"
    },
    {
      "command": "rg -n -F '#{$ns}' packages/amis-ui/scss/components packages/amis-ui/scss/_mixins.scss",
      "exit_code": 0,
      "stdout": "number.scss:300:.#{$ns}Form-control--sizeMd > .#{$ns}Number {\npackages/amis-ui/scss/components/form/_number.scss:304:.#{$ns}Form-control--sizeLg > .#{$ns}Number {\npackages/amis-ui/scss/components/form/_number.scss:308:.#{$ns}NumberControl {\npackages/amis-ui/scss/components/form/_number.scss:309:  &:not(.is-inline) > .#{$ns}Number {\npackages/amis-ui/scss/components/form/_number.scss:314:.#{$ns}Number--borderHalf,\npackages/amis-ui/scss/components/form/_number.scss:315:.#{$ns}Number--borderNone {\npackages/amis-ui/scss/components/form/_number.scss:316:  .#{$ns}Number-handler-wrap {\npackages/amis-ui/scss/components/form/_number.scss:321:.#{$ns}NumberControl--withUnit {\npackages/amis-ui/scss/components/form/_number.scss:325:    .#{$ns}Number,\npackages/amis-ui/scss/components/form/_number.scss:326:    .#{$ns}NumberControl-unit {\npackages/amis-ui/scss/components/form/_number.scss:347:    .#{$ns}NumberControl-readonly {\npackages/amis-ui/scss/components/form/_number.scss:351:  .#{$ns}Number {\npackages/amis-ui/scss/components/form/_number.scss:358:  .#{$ns}Number-focused + .#{$ns}NumberControl-unit {\npackages/amis-ui/scss/components/form/_number.scss:376:  .#{$ns}Number-focused + .#{$ns}NumberControl-readonly {\npackages/amis-ui/scss/components/form/_number.scss:380:  & .#{$ns}NumberControl-unit {\npackages/amis-ui/scss/components/form/_number.scss:389:    .#{$ns}Select-valueWrap {\npackages/amis-ui/scss/components/form/_number.scss:393:  .#{$ns}NumberControl-single-unit {\npackages/amis-ui/scss/components/form/_number.scss:400:.#{$ns}Number--enhance {\npackages/amis-ui/scss/components/form/_number.scss:423:  .#{$ns}Number--enhance-input {\npackages/amis-ui/scss/components/form/_number.scss:444:    .#{$ns}Number--enhance-input {\npackages/amis-ui/scss/components/form/_number.scss:466:    .#{$ns}Number--enhance-input {\npackages/amis-ui/scss/components/form/_number.scss:488:    .#{$ns}Number--enhance-input {\npackages/amis-ui/scss/components/form/_number.scss:493:  .#{$ns}Number-input {\npackages/amis-ui/scss/components/form/_number.scss:500:  .#{$ns}Number--enhance-left-icon,\npackages/amis-ui/scss/components/form/_number.scss:501:  .#{$ns}Number--enhance-right-icon {\npackages/amis-ui/scss/components/form/_number.scss:513:  .#{$ns}Number--enhance-left-icon {\npackages/amis-ui/scss/components/form/_number.scss:537:  .#{$ns}Number--enhance-right-icon {\npackages/amis-ui/scss/components/form/_number.scss:561:  .#{$ns}Number--enhance-left-icon {\npackages/amis-ui/scss/components/form/_number.scss:565:  .#{$ns}Number--enhance-right-icon {\npackages/amis-ui/scss/components/form/_number.scss:569:  .#{$ns}Number--enhance-input {\npackages/amis-ui/scss/components/form/_number.scss:577:    .#{$ns}Number-handler-wrap {\npackages/amis-ui/scss/components/form/_number.scss:584:  .#{$ns}Number--enhance-border-min,\npackages/amis-ui/scss/components/form/_number.scss:585:  .#{$ns}Number--enhance-border-max {\npackages/amis-ui/scss/components/form/_number.scss:594:  .#{$ns}Number--enhance-border-disabled {\npackages/amis-ui/scss/components/form/_number.scss:602:  .#{$ns}Number--enhance-border-readOnly,\npackages/amis-ui/scss/components/form/_number.scss:603:  .#{$ns}Number--enhance-border-readOnly {\npackages/amis-ui/scss/components/form/_number.scss:610:.#{$ns}Number--enhance-no-steps {\npackages/amis-ui/scss/components/form/_number.scss:611:  .#{$ns}Number--enhance-left-icon,\npackages/amis-ui/scss/components/form/_number.scss:612:  .#{$ns}Number--enhance-right-icon {\npackages/amis-ui/scss/components/form/_number.scss:615:  .#{$ns}Number--enhance-input {\npackages/amis-ui/scss/components/form/_number.scss:621:.#{$ns}Number--enhance-disabled {\npackages/amis-ui/scss/components/form/_number.scss:622:  .#{$ns}Number--enhance-input {\npackages/amis-ui/scss/components/form/_number.scss:630:.#{$ns}Number--enhance-borderNone,\npackages/amis-ui/scss/components/form/_number.scss:631:.#{$ns}Number--enhance-borderHalf {\npackages/amis-ui/scss/components/form/_sub-form.scss:1:.#{$ns}SubForm {\n",
      "stderr": "",
      "id": "CMD-009",
      "core": true,
      "failure_handling": "document-baseline"
    },
    {
      "command": "rg -n \"\\.cxd-|\\.antd-|\\.dark-|classPrefix\" packages/amis-core/src packages/amis-ui/src packages/amis/src packages/amis-ui/scss",
      "exit_code": 0,
      "stdout": "le/index.tsx:739:        classPrefix={classPrefix}\npackages/amis-ui/src/components/table/index.tsx:1017:      classPrefix,\npackages/amis-ui/src/components/table/index.tsx:1095:        classPrefix={classPrefix}\npackages/amis-ui/src/components/table/index.tsx:1120:      classPrefix\npackages/amis-ui/src/components/table/index.tsx:1144:              classPrefix={classPrefix}\npackages/amis-ui/src/components/table/index.tsx:1164:              classPrefix={classPrefix}\npackages/amis-ui/src/components/table/index.tsx:1222:    const {classnames: cx, classPrefix, dataSource} = this.props;\npackages/amis-ui/src/components/table/index.tsx:1236:        classPrefix={classPrefix}\npackages/amis-ui/src/components/schema-editor/Object.tsx:281:      classPrefix,\npackages/amis-ui/src/components/schema-editor/Object.tsx:373:                classPrefix={classPrefix}\npackages/amis-ui/src/components/schema-editor/Object.tsx:408:                  classPrefix={classPrefix}\npackages/amis-ui/src/components/schema-editor/Object.tsx:461:      classPrefix,\npackages/amis-ui/src/components/schema-editor/Object.tsx:493:                    classPrefix={classPrefix}\npackages/amis-ui/src/components/Picker.tsx:55:    classPrefix: ns,\npackages/amis-ui/src/components/Picker.tsx:100:        classPrefix={ns}\npackages/amis-ui/src/components/SearchBox.tsx:288:      classPrefix,\npackages/amis-ui/src/components/SearchBox.tsx:357:                classPrefix={classPrefix}\npackages/amis-ui/src/components/MonthRangePicker.tsx:337:    const {classPrefix: ns} = this.props;\npackages/amis-ui/src/components/MonthRangePicker.tsx:481:      classPrefix: ns,\npackages/amis-ui/src/components/MonthRangePicker.tsx:571:      classPrefix: ns,\npackages/amis-ui/src/components/MonthRangePicker.tsx:715:                classPrefix={ns}\npackages/amis-ui/src/components/schema-editor/Array.tsx:38:      classPrefix,\npackages/amis-ui/src/components/schema-editor/Array.tsx:78:          classPrefix={classPrefix}\npackages/amis-ui/src/components/schema-editor/Array.tsx:99:      classPrefix,\npackages/amis-ui/src/components/schema-editor/Array.tsx:123:                    classPrefix={classPrefix}\npackages/amis-ui/src/components/Drawer.tsx:46:  classPrefix: string;\npackages/amis-ui/src/components/TimelineItem.tsx:179:    classPrefix,\npackages/amis-ui/src/components/TimelineItem.tsx:215:            classPrefix={classPrefix}\npackages/amis-ui/src/components/schema-editor/index.tsx:179:      classPrefix,\npackages/amis-ui/src/components/schema-editor/index.tsx:244:          classPrefix={classPrefix}\npackages/amis-ui/src/components/menu/index.tsx:60:  classPrefix: string;\npackages/amis-ui/src/components/menu/index.tsx:680:      classPrefix,\npackages/amis-ui/src/components/menu/index.tsx:738:          prefixCls={`${classPrefix}Nav-Menu`}\npackages/amis-ui/src/components/Tree.tsx:304:      treeElement?.parentElement?.matches('.cxd-TreeControl') &&\npackages/amis-ui/src/components/Tree.tsx:1680:        treeElement?.parentElement?.matches('.cxd-TreeControl') &&\npackages/amis-ui/src/components/menu/SubMenu.tsx:37:  classPrefix: string;\npackages/amis-ui/src/components/AsideNav.tsx:38:  classPrefix: string;\npackages/amis-ui/src/components/condition-builder/index.tsx:359:      classPrefix,\npackages/amis-ui/src/components/condition-builder/index.tsx:388:        classPrefix={classPrefix}\npackages/amis-ui/src/components/condition-builder/index.tsx:404:            classPrefix={classPrefix}\npackages/amis-ui/src/components/CalendarMobile.tsx:157:    const {classPrefix: ns} = props;\npackages/amis-ui/src/components/Rating.tsx:32:  classPrefix: string;\npackages/amis-ui/src/components/CityArea.tsx:317:          classPrefix={props.classPrefix}\npackages/amis-ui/src/components/BarCode.tsx:13:  classPrefix: string;\npackages/amis-ui/src/components/UserSelect.tsx:247:    const ns = this.props.classPrefix;\npackages/amis-ui/src/components/PopUp.tsx:84:      classPrefix: ns,\npackages/amis-ui/src/components/ListGroup.tsx:34:      classPrefix,\n",
      "stderr": "",
      "id": "CMD-010",
      "core": true,
      "failure_handling": "document-baseline"
    },
    {
      "command": "python3 /Users/songmingxu/.agents/skills/cs-onboard/tools/validate-yaml.py --file .codestable/features/2026-07-25-core-component-selector-migration/core-component-selector-migration-checklist.yaml --yaml-only",
      "exit_code": 0,
      "stdout": "Validated 1 file(s): 1 passed, 0 failed.\n\n  ✓ .codestable/features/2026-07-25-core-component-selector-migration/core-component-selector-migration-checklist.yaml\n\nAll files valid.\n",
      "stderr": "",
      "id": "CMD-011",
      "core": true,
      "failure_handling": "fix-or-block"
    }
  ],
  "providers": {},
  "feature": "2026-07-25-core-component-selector-migration",
  "inputs": {
    "checklist": ".codestable/features/2026-07-25-core-component-selector-migration/core-component-selector-migration-checklist.yaml"
  },
  "input_digests": {
    "checklist": "11ab4099d8121efe8c950101843a834b3b0827116a9d1a871d7124e8fee23005"
  }
}
```

## 3. Validation Commands

Extracted from checklist `dod.commands`; see DoD Results for command status.

## 4. Scope And Cleanliness

Design bytes: 14593
Checklist bytes: 5361

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
        ".codestable/features/2026-07-25-core-component-selector-migration/core-component-selector-migration-checklist.yaml",
        ".codestable/roadmap/theme-system-refactor/goal-state.yaml",
        "packages/amis-core/__tests__/theme.test.ts",
        "packages/amis-core/src/index.tsx",
        "packages/amis-core/src/renderers/Form.tsx",
        "packages/amis-core/src/theme.tsx",
        "packages/amis-ui/scripts/theme-selectors/policy.json",
        "packages/amis-ui/scss/_mixins.scss",
        "packages/amis-ui/scss/components/_button-group.scss",
        "packages/amis-ui/scss/components/_button.scss",
        "packages/amis-ui/scss/components/_drawer.scss",
        "packages/amis-ui/scss/components/_dropdown.scss",
        "packages/amis-ui/scss/components/_modal.scss",
        "packages/amis-ui/scss/components/_page.scss",
        "packages/amis-ui/scss/components/_popover.scss",
        "packages/amis-ui/scss/components/_popoverable.scss",
        "packages/amis-ui/scss/components/_table.scss",
        "packages/amis-ui/scss/components/_table2.scss",
        "packages/amis-ui/scss/components/_tooltip.scss",
        "packages/amis-ui/scss/components/form/_form.scss",
        "packages/amis-ui/scss/components/form/_select.scss",
        "packages/amis-ui/scss/layout/_layout.scss",
        "packages/amis-ui/src/components/Drawer.tsx",
        "packages/amis-ui/src/components/Modal.tsx",
        "packages/amis/__tests__/event-action/__snapshots__/dialog.test.tsx.snap",
        "packages/amis/__tests__/event-action/__snapshots__/drawer.test.tsx.snap",
        "packages/amis/__tests__/renderers/Dialog.test.tsx",
        "packages/amis/__tests__/renderers/Form/__snapshots__/button.test.tsx.snap",
        "packages/amis/__tests__/renderers/Form/__snapshots__/buttonToolBar.test.tsx.snap",
        "packages/amis/__tests__/renderers/Form/__snapshots__/chainedSelect.test.tsx.snap",
        "packages/amis/__tests__/renderers/Form/__snapshots__/inputTable.test.tsx.snap",
        "packages/amis/__tests__/renderers/Form/__snapshots__/listSelect.test.tsx.snap",
        "packages/amis/__tests__/renderers/Form/__snapshots__/select.test.tsx.snap",
        "packages/amis/__tests__/renderers/Form/__snapshots__/usersSelect.test.tsx.snap",
        "packages/amis/__tests__/renderers/Form/chainedSelect.test.tsx",
        "packages/amis/__tests__/renderers/Form/inputTable.test.tsx",
        "packages/amis/__tests__/renderers/Form/listSelect.test.tsx",
        "packages/amis/__tests__/renderers/Form/nestedSelect.test.tsx",
        "packages/amis/__tests__/renderers/Form/select.test.tsx",
        "packages/amis/__tests__/renderers/Table.test.tsx",
        "packages/amis/__tests__/renderers/Table/Cell.test.tsx",
        "packages/amis/__tests__/renderers/Table/index.test.tsx",
        "packages/amis/__tests__/renderers/TooltipWrapper.test.tsx",
        "packages/amis/__tests__/renderers/__snapshots__/Table.test.tsx.snap",
        "packages/amis/__tests__/renderers/__snapshots__/TableView.test.tsx.snap",
        "packages/amis/__tests__/renderers/__snapshots__/TooltipWrapper.test.tsx.snap",
        "packages/amis/src/renderers/Dialog.tsx",
        "packages/amis/src/renderers/Drawer.tsx",
        "packages/amis/src/renderers/Form/ChainedSelect.tsx",
        "packages/amis/src/renderers/Form/Select.tsx",
        "packages/amis/src/renderers/Table/VirtualTableBody.tsx",
        ".codestable/features/2026-07-25-core-component-selector-migration/core-component-selector-migration-evidence-pack.md",
        ".codestable/features/2026-07-25-core-component-selector-migration/core-component-selector-migration-implementation.md",
        ".codestable/features/2026-07-25-core-component-selector-migration/core-component-selector-migration-ledger.md",
        ".codestable/features/2026-07-25-core-component-selector-migration/core-component-selector-migration-review-packet.md",
        ".codestable/features/2026-07-25-core-component-selector-migration/core-component-selector-migration-scope-gate.json"
      ],
      "ignored_machine_artifacts": [
        ".codestable/features/2026-07-25-core-component-selector-migration/core-component-selector-migration-dod-results.json",
        ".codestable/features/2026-07-25-core-component-selector-migration/core-component-selector-migration-evidence-pack-results.json"
      ],
      "allowed_prefixes": [
        ".codestable/features/2026-07-25-core-component-selector-migration",
        ".codestable/features/2026-07-25-core-component-selector-migration",
        ".codestable/roadmap/theme-system-refactor/goal-state.yaml",
        "packages/amis-core",
        "packages/amis-ui",
        "packages/amis"
      ]
    }
  ],
  "providers": {},
  "feature": "2026-07-25-core-component-selector-migration",
  "inputs": {
    "feature_dir": ".codestable/features/2026-07-25-core-component-selector-migration"
  },
  "input_digests": {}
}
```
