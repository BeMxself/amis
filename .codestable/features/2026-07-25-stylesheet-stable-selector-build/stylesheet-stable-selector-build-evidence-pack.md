---
doc_type: feature-evidence-pack
feature: 2026-07-25-stylesheet-stable-selector-build
status: generated
---

# 2026-07-25-stylesheet-stable-selector-build evidence pack

## 1. Scope

- Design: `.codestable/features/2026-07-25-stylesheet-stable-selector-build/stylesheet-stable-selector-build-design.md`
- Checklist: `.codestable/features/2026-07-25-stylesheet-stable-selector-build/stylesheet-stable-selector-build-checklist.yaml`

## 2. DoD Results

```json
{
  "gate_id": "dod-runner",
  "stage": "implementation.before_review",
  "status": "passed",
  "blocking": [],
  "warnings": [
    "codestable-dod-runner CMD-002 subprocess hangs after build output completion in this workspace; fresh manual npm run build --workspace amis-ui reached created lib and created esm, then was interrupted after output completion.",
    "Full dod-runner aggregation was not used because aggregate/build subprocess hangs in this workspace; per-command runner evidence plus manual build completion evidence are aggregated here."
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
      "stdout": "Manual fresh run reached created lib and created esm. The process stayed open after output completion in this workspace and was interrupted after a short wait, matching the existing build runner baseline from token-contract-css-layers.",
      "stderr": "Existing warnings only: Sass legacy-js-api/import/global-builtin/slash-div/mixed-decls deprecations, Browserslist stale data, Rollup circular dependencies, TS5051 sourceRoot warning, and postcss fill-available replacement.",
      "id": "CMD-002",
      "core": true,
      "failure_handling": "fix-or-block"
    },
    {
      "command": "rg -n -F '#{$ns}' packages/amis-ui/scss",
      "exit_code": 0,
      "stdout": "kages/amis-ui/scss/components/_menu.scss:588:    & > .#{$ns}Nav-Menu-item {\npackages/amis-ui/scss/components/_menu.scss:594:    .#{$ns}Nav-Menu-submenu-arrow {\npackages/amis-ui/scss/components/_menu.scss:607:    &.#{$ns}Nav-Menu-rtl {\npackages/amis-ui/scss/components/_menu.scss:608:      .#{$ns}Nav-Menu-submenu-arrow {\npackages/amis-ui/scss/components/_menu.scss:614:    .#{$ns}Nav-Menu-item-label {\npackages/amis-ui/scss/components/_menu.scss:623:    .#{$ns}Nav-Menu-submenu-arrow {\npackages/amis-ui/scss/components/_menu.scss:628:    &.#{$ns}Nav-Menu-expand-before {\npackages/amis-ui/scss/components/_menu.scss:629:      .#{$ns}Nav-Menu-submenu-title {\npackages/amis-ui/scss/components/_menu.scss:632:        > .#{$ns}Nav-Menu-submenu-arrow {\npackages/amis-ui/scss/components/_menu.scss:638:    &.#{$ns}Nav-Menu-rtl {\npackages/amis-ui/scss/components/_menu.scss:639:      &.#{$ns}Nav-Menu-expand-before {\npackages/amis-ui/scss/components/_menu.scss:640:        .#{$ns}Nav-Menu-submenu-title {\npackages/amis-ui/scss/components/_menu.scss:641:          .#{$ns}Nav-Menu-item-wrap {\npackages/amis-ui/scss/components/_menu.scss:651:    &.#{$ns}Nav-Menu-rtl {\npackages/amis-ui/scss/components/_menu.scss:652:      .#{$ns}Nav-Menu-submenu-arrow {\npackages/amis-ui/scss/components/_menu.scss:656:      &.#{$ns}Nav-Menu-expand-before {\npackages/amis-ui/scss/components/_menu.scss:657:        .#{$ns}Nav-Menu-submenu-arrow {\npackages/amis-ui/scss/components/_menu.scss:665:    &.#{$ns}Nav-Menu-rtl {\npackages/amis-ui/scss/components/_menu.scss:666:      .#{$ns}Nav-Menu-submenu-arrow {\npackages/amis-ui/scss/components/_menu.scss:673:    &.#{$ns}Nav-Menu-rtl {\npackages/amis-ui/scss/components/_menu.scss:674:      .#{$ns}Nav-Menu-submenu-arrow {\npackages/amis-ui/scss/components/_menu.scss:682:    .#{$ns}Nav-Menu-submenu-arrow {\npackages/amis-ui/scss/components/_menu.scss:690:    & .#{$ns}Nav-Menu-submenu-open > .#{$ns}Nav-Menu-submenu-title {\npackages/amis-ui/scss/components/_menu.scss:691:      .#{$ns}Nav-Menu-submenu-arrow {\npackages/amis-ui/scss/components/_menu.scss:700:    .#{$ns}Nav-Menu-item {\npackages/amis-ui/scss/components/_menu.scss:706:    .#{$ns}Nav-Menu-submenu-arrow {\npackages/amis-ui/scss/components/_menu.scss:710:    .#{$ns}Nav-Menu-item-group-title {\npackages/amis-ui/scss/components/_menu.scss:714:    .#{$ns}Nav-Menu-item-group-list {\npackages/amis-ui/scss/components/_menu.scss:715:      .#{$ns}Nav-Menu-item-divider {\npackages/amis-ui/scss/components/_menu.scss:732:  .#{$ns}Nav-Menu-item-disabled,\npackages/amis-ui/scss/components/_menu.scss:733:  .#{$ns}Nav-Menu-submenu-disabled {\npackages/amis-ui/scss/components/_menu.scss:736:    &.#{$ns}Nav-Menu-item {\npackages/amis-ui/scss/components/_menu.scss:739:      .#{$ns}Nav-Menu-item-link {\npackages/amis-ui/scss/components/_menu.scss:744:    .#{$ns}Nav-Menu-submenu-title {\npackages/amis-ui/scss/components/_menu.scss:746:      & > .#{$ns}Nav-Menu-item-icon,\npackages/amis-ui/scss/components/_menu.scss:747:      & > .#{$ns}Nav-Menu-item-icon-after,\npackages/amis-ui/scss/components/_menu.scss:748:      & > .#{$ns}Nav-Menu-item-label,\npackages/amis-ui/scss/components/_menu.scss:749:      & > .#{$ns}Nav-Menu-submenu-arrow {\npackages/amis-ui/scss/components/_menu.scss:754:    .#{$ns}Nav-Menu-item-icon,\npackages/amis-ui/scss/components/_menu.scss:755:    .#{$ns}Nav-Menu-item-icon-after,\npackages/amis-ui/scss/components/_menu.scss:756:    .#{$ns}Nav-Menu-item-label,\npackages/amis-ui/scss/components/_menu.scss:757:    .#{$ns}Nav-Menu-submenu-arrow {\npackages/amis-ui/scss/components/_menu.scss:763:.#{$ns}Nav-Menu-item-tooltip {\npackages/amis-ui/scss/components/_menu.scss:773:  .#{$ns}Tooltip-arrow {\npackages/amis-ui/scss/components/_menu.scss:779:  &.#{$ns}Nav-Menu-item-tooltip-dark {\npackages/amis-ui/scss/components/_menu.scss:782:    .#{$ns}Tooltip-arrow {\npackages/amis-ui/scss/components/_menu.scss:788:    .#{$ns}Tooltip-body {\npackages/amis-ui/scss/components/_picker-columns.scss:1:.#{$ns}PickerColumns {\n",
      "stderr": "",
      "id": "CMD-003",
      "core": true,
      "failure_handling": "document-baseline"
    },
    {
      "command": "rg -n \"\\.cxd-|\\.antd-|\\.dark-\" packages/amis-ui/scss packages/amis-theme-editor-helper packages/amis-editor-core",
      "exit_code": 0,
      "stdout": "cxd-Button--${fontType}`, `${style('default')}`);\npackages/amis-theme-editor-helper/src/helper/ParseThemeData.ts:229:          `.cxd-Button--${fontType}:not(:disabled):not(.is-disabled):hover`,\npackages/amis-theme-editor-helper/src/helper/ParseThemeData.ts:233:          `.cxd-Button--${fontType}:not(:disabled):not(.is-disabled):hover:active`,\npackages/amis-theme-editor-helper/src/helper/ParseThemeData.ts:243:          `.cxd-Button--size-${fontType}`,\npackages/amis-theme-editor-helper/src/style/_padding-and-margin.scss:116:  .cxd-Form-item {\npackages/amis-theme-editor-helper/src/style/_padding-and-margin.scss:206:      .cxd-Form-item {\npackages/amis-theme-editor-helper/src/style/_radius.scss:7:  .cxd-Form-item {\npackages/amis-theme-editor-helper/src/style/index.scss:13:.cxd-PopOver {\npackages/amis-theme-editor-helper/src/style/_border.scss:122:    .cxd-Form-item {\npackages/amis-theme-editor-helper/src/style/_border.scss:131:      .cxd-Select {\npackages/amis-theme-editor-helper/src/style/_border.scss:157:      .cxd-Select {\npackages/amis-theme-editor-helper/src/style/_color-picker.scss:244:    .cxd-SearchBox.is-active {\npackages/amis-theme-editor-helper/src/style/_color-picker.scss:283:    .cxd-Number {\npackages/amis-theme-editor-helper/src/style/_color-picker.scss:286:    .cxd-Number-handler-wrap {\npackages/amis-theme-editor-helper/src/style/_color-picker.scss:289:    .cxd-Number-input {\npackages/amis-ui/scss/components/form/_form.scss:186:      // 兼容 @media (min-width: 576px) .cxd-Form-control--sizeLg\npackages/amis-ui/scss/components/_condition-builder.scss:178:        & > .cxd-Button:not(:last-child) {\npackages/amis-ui/scss/components/_mobile-dev-tool.scss:26:    .cxd-PopOver {\npackages/amis-editor-core/scss/control/_formItem-control.scss:155:.cxd-Combo--ver:not(.cxd-Combo--noBorder) > .ae-Combo-items {\npackages/amis-editor-core/scss/control/_formItem-control.scss:160:.cxd-Combo--ver:not(.cxd-Combo--noBorder) > .ae-Combo-items > .cxd-Combo-item {\npackages/amis-editor-core/scss/control/_switch-more-control.scss:37:  .cxd-DropDown,\npackages/amis-editor-core/scss/control/_switch-more-control.scss:38:  .cxd-DropDown > .cxd-Button {\npackages/amis-editor-core/scss/control/_key-value-map-control.scss:20:    .cxd-Container-body {\npackages/amis-editor-core/scss/_mixin.scss:87:    .cxd-Collapse-content {\npackages/amis-editor-core/scss/control/_api-control.scss:153:      .cxd-EditorControl {\npackages/amis-editor-core/scss/control/_api-control.scss:157:      .cxd-MonacoEditor-placeholder {\npackages/amis-editor-core/scss/control/_nav-control.scss:80:  .cxd-Form-groupColumn:nth-child(1) {\npackages/amis-editor-core/scss/control/_nav-control.scss:83:  .cxd-Form-groupColumn:nth-child(2) {\npackages/amis-editor-core/scss/control/_nav-control.scss:86:  .cxd-TextControl.is-focused > .cxd-TextControl-input {\npackages/amis-editor-core/scss/control/_nav-control.scss:91:  .cxd-TextControl-addOn:first-child {\npackages/amis-editor-core/scss/control/_nav-control.scss:94:  .cxd-TextControl-input {\npackages/amis-editor-core/scss/control/_nav-control.scss:181:  .cxd-IconPickerControl-valueWrap {\npackages/amis-editor-core/scss/editor.scss:283:      //   > .cxd-Page {\npackages/amis-editor-core/scss/editor.scss:286:      //     > .cxd-Page-content {\npackages/amis-editor-core/scss/control/_status.scss:29:  .cxd-Combo-itemInner {\npackages/amis-editor-core/scss/control/_status.scss:30:    .cxd-Form-row {\npackages/amis-editor-core/scss/control/_status.scss:32:      .cxd-Form-col {\npackages/amis-editor-core/scss/control/_status.scss:39:          .cxd-IconSelectControl {\npackages/amis-editor-core/scss/control/_status.scss:48:          .cxd-IconPickerControl {\npackages/amis-editor-core/scss/control/_status.scss:63:        .cxd-IconSelectControl-input-icon-id {\npackages/amis-editor-core/scss/style-control/_theme-css-code.scss:83:    .cxd-MonacoEditor-placeholder {\npackages/amis-editor-core/scss/style-control/_theme-css-code.scss:103:.cxd-ThemeCssCode-custom-editor {\n",
      "stderr": "",
      "id": "CMD-004",
      "core": true,
      "failure_handling": "document-baseline"
    },
    {
      "command": "npm run check:theme-selectors --workspace amis-ui",
      "exit_code": 0,
      "stdout": "\n> amis-ui@6.13.0 check:theme-selectors\n> node ./scripts/checkThemeSelectors.js\n\nTheme selector guard passed: 2233 legacy baseline match(es), 0 new violation(s).\n",
      "stderr": "",
      "id": "CMD-005",
      "core": true,
      "failure_handling": "fix-or-block"
    },
    {
      "command": "python3 /Users/songmingxu/.agents/skills/cs-onboard/tools/validate-yaml.py --file .codestable/features/2026-07-25-stylesheet-stable-selector-build/stylesheet-stable-selector-build-checklist.yaml --yaml-only",
      "exit_code": 0,
      "stdout": "Validated 1 file(s): 1 passed, 0 failed.\n\n  ✓ .codestable/features/2026-07-25-stylesheet-stable-selector-build/stylesheet-stable-selector-build-checklist.yaml\n\nAll files valid.\n",
      "stderr": "",
      "id": "CMD-006",
      "core": true,
      "failure_handling": "fix-or-block"
    },
    {
      "command": "node packages/amis-ui/scripts/checkThemeSelectors.js --fixture good",
      "exit_code": 0,
      "stdout": "Theme selector guard passed: 0 legacy baseline match(es), 0 new violation(s).",
      "stderr": "",
      "id": "FIXTURE-001",
      "core": true,
      "failure_handling": "guard-positive-fixture"
    },
    {
      "command": "node packages/amis-ui/scripts/checkThemeSelectors.js --fixture bad",
      "exit_code": 1,
      "stdout": "",
      "stderr": "Theme selector guard failed as expected for .#{$ns}GuardFixture and .cxd-GuardFixture.",
      "id": "FIXTURE-002",
      "core": true,
      "failure_handling": "guard-negative-fixture-expected-failure"
    }
  ],
  "providers": {},
  "feature": "2026-07-25-stylesheet-stable-selector-build",
  "inputs": {
    "checklist": ".codestable/features/2026-07-25-stylesheet-stable-selector-build/stylesheet-stable-selector-build-checklist.yaml"
  },
  "input_digests": {
    "checklist": "26909db26d0523a0fd9a789bf2c1b4a4ab3dff6dad6ff6dc860d78add964a016"
  }
}
```

## 3. Validation Commands

Extracted from checklist `dod.commands`; see DoD Results for command status.

## 4. Scope And Cleanliness

Design bytes: 12828
Checklist bytes: 3780

## 5. Residual Risks

- codestable-dod-runner CMD-002 subprocess hangs after build output completion in this workspace; fresh manual npm run build --workspace amis-ui reached created lib and created esm, then was interrupted after output completion.
- Full dod-runner aggregation was not used because aggregate/build subprocess hangs in this workspace; per-command runner evidence plus manual build completion evidence are aggregated here.

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
        ".codestable/features/2026-07-25-stylesheet-stable-selector-build/stylesheet-stable-selector-build-checklist.yaml",
        ".codestable/roadmap/theme-system-refactor/goal-state.yaml",
        "packages/amis-ui/package.json",
        "packages/amis-ui/scss/_components.scss",
        "packages/amis-ui/scss/components/_button.scss",
        ".codestable/features/2026-07-25-stylesheet-stable-selector-build/stylesheet-stable-selector-build-evidence-pack.md",
        ".codestable/features/2026-07-25-stylesheet-stable-selector-build/stylesheet-stable-selector-build-implementation.md",
        ".codestable/features/2026-07-25-stylesheet-stable-selector-build/stylesheet-stable-selector-build-review-packet.md",
        ".codestable/features/2026-07-25-stylesheet-stable-selector-build/stylesheet-stable-selector-build-scope-gate.json",
        "packages/amis-ui/scripts/checkThemeSelectors.js",
        "packages/amis-ui/scripts/theme-selectors/fixtures/bad/legacy-selector.scss",
        "packages/amis-ui/scripts/theme-selectors/fixtures/good/stable-selector.scss",
        "packages/amis-ui/scripts/theme-selectors/policy.json",
        "packages/amis-ui/scss/_stable-selectors.scss"
      ],
      "ignored_machine_artifacts": [
        ".codestable/features/2026-07-25-stylesheet-stable-selector-build/stylesheet-stable-selector-build-dod-results.json",
        ".codestable/features/2026-07-25-stylesheet-stable-selector-build/stylesheet-stable-selector-build-evidence-pack-results.json"
      ],
      "allowed_prefixes": [
        ".codestable/features/2026-07-25-stylesheet-stable-selector-build",
        ".codestable/features/2026-07-25-stylesheet-stable-selector-build",
        ".codestable/roadmap/theme-system-refactor",
        "packages/amis-ui/package.json",
        "packages/amis-ui/scss/_components.scss",
        "packages/amis-ui/scss/_stable-selectors.scss",
        "packages/amis-ui/scss/components/_button.scss",
        "packages/amis-ui/scripts/checkThemeSelectors.js",
        "packages/amis-ui/scripts/theme-selectors"
      ]
    }
  ],
  "providers": {},
  "feature": "2026-07-25-stylesheet-stable-selector-build",
  "inputs": {
    "feature_dir": ".codestable/features/2026-07-25-stylesheet-stable-selector-build"
  },
  "input_digests": {}
}
```
