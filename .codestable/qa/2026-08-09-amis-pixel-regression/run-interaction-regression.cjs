#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const {createRequire} = require('module');
const {pathToFileURL} = require('url');

const ROOT = path.resolve(__dirname, '../../../..');
const DEFAULT_NODE_MODULES = '/tmp/amis-visual-regression-deps/node_modules';
const NODE_MODULES = process.env.AMIS_VISUAL_NODE_MODULES || DEFAULT_NODE_MODULES;
const requireFromDeps = createRequire(path.join(NODE_MODULES, 'index.js'));

const CASES = [
  {
    id: 'INT-001',
    route: '/zh-CN/components/dropdown-button',
    title: 'DropDownButton click menu',
    steps: [
      {state: 'menu-open', action: 'click', selectors: dropdownSelectors()},
      {state: 'after-close', action: 'escape'}
    ]
  },
  {
    id: 'INT-002',
    route: '/zh-CN/components/dropdown-button',
    title: 'DropDownButton hover menu',
    steps: [
      {state: 'hover-open', action: 'hover', selectors: dropdownSelectors()},
      {state: 'nested-hover', action: 'hover', selectors: menuItemSelectors(), optional: true}
    ]
  },
  {
    id: 'INT-003',
    route: '/zh-CN/components/nav',
    title: 'Nav submenu',
    steps: [
      {state: 'submenu-open', action: 'hover', selectors: navSubmenuSelectors()},
      {state: 'nested-open', action: 'hover', selectors: menuItemSelectors(), optional: true}
    ]
  },
  {
    id: 'INT-004',
    route: '/zh-CN/components/breadcrumb',
    title: 'Breadcrumb dropdown',
    steps: [{state: 'menu-open', action: 'click', selectors: breadcrumbSelectors()}]
  },
  {
    id: 'INT-005',
    route: '/zh-CN/components/tooltip',
    title: 'TooltipWrapper hover',
    steps: [
      {state: 'tooltip-open', action: 'hover', selectors: tooltipSelectors()},
      {state: 'leave-close', action: 'mouse-away'}
    ]
  },
  {
    id: 'INT-006',
    route: '/zh-CN/components/tooltip',
    title: 'TooltipWrapper focus/click',
    steps: [
      {state: 'open', action: 'click', selectors: tooltipSelectors()},
      {state: 'esc-close', action: 'escape'}
    ]
  },
  {
    id: 'INT-007',
    route: '/zh-CN/components/popover',
    title: 'PopOver click/hover',
    steps: [
      {state: 'popover-open', action: 'click', selectors: popoverSelectors()},
      {state: 'after-close', action: 'escape'}
    ]
  },
  {
    id: 'INT-008',
    route: '/zh-CN/components/remark',
    title: 'Remark hover',
    steps: [{state: 'remark-open', action: 'hover', selectors: remarkSelectors()}]
  },
  {
    id: 'INT-009',
    route: '/zh-CN/components/dialog',
    title: 'Dialog open/close',
    steps: [
      {state: 'dialog-open', action: 'click', selectors: dialogButtonSelectors()},
      {state: 'drag-header', action: 'drag', selectors: ['.amis-Modal-header', '.cxd-Modal-header', '[role="dialog"] .modal-header'], optional: true},
      {state: 'after-close', action: 'escape'}
    ]
  },
  {
    id: 'INT-010',
    route: '/zh-CN/components/drawer',
    title: 'Drawer open/close',
    steps: [
      {state: 'drawer-open', action: 'click', selectors: drawerButtonSelectors()},
      {state: 'after-close', action: 'escape'}
    ]
  },
  {
    id: 'INT-011',
    route: '/zh-CN/components/form/select',
    title: 'Select dropdown',
    steps: [
      {state: 'dropdown-open', action: 'click', selectors: selectSelectors()},
      {state: 'option-hover', action: 'hover', selectors: optionSelectors(), optional: true},
      {state: 'selected', action: 'click', selectors: optionSelectors(), optional: true}
    ]
  },
  {
    id: 'INT-012',
    route: '/zh-CN/components/form/nestedselect',
    title: 'NestedSelect levels',
    steps: [
      {state: 'level1-open', action: 'click', selectors: nestedSelectSelectors()},
      {state: 'level2-open', action: 'hover', selectors: ['.amis-NestedSelect-option', '.cxd-NestedSelect-option', '.amis-NestedSelect-optionArrowRight', '.cxd-NestedSelect-optionArrowRight'], optional: true}
    ]
  },
  {
    id: 'INT-013',
    route: '/zh-CN/components/form/treeselect',
    title: 'TreeSelect dropdown',
    steps: [
      {state: 'dropdown-open', action: 'click', selectors: treeSelectSelectors()},
      {state: 'node-expanded', action: 'click', selectors: treeExpandSelectors(), optional: true}
    ]
  },
  {
    id: 'INT-014',
    route: '/zh-CN/components/form/chain-select',
    title: 'ChainedSelect dropdown',
    steps: [
      {state: 'dropdown-open', action: 'click', selectors: selectSelectors()},
      {state: 'child-loaded', action: 'click', selectors: optionSelectors(), optional: true}
    ]
  },
  {
    id: 'INT-015',
    route: '/zh-CN/components/form/picker',
    title: 'Picker popover/modal',
    steps: [
      {state: 'picker-open', action: 'click', selectors: pickerSelectors()},
      {state: 'item-selected', action: 'click', selectors: ['.amis-Table tbody tr', '.cxd-Table tbody tr', '.amis-ListItem', '.cxd-ListItem'], optional: true}
    ]
  },
  {
    id: 'INT-016',
    route: '/zh-CN/components/form/input-tag',
    title: 'InputTag suggestions',
    steps: [
      {state: 'suggestions-open', action: 'click', selectors: ['.amis-TagControl input', '.cxd-TagControl input', '.amis-ResultBox', '.cxd-ResultBox']},
      {state: 'overflow-open', action: 'hover', selectors: ['.amis-Tags-more', '.cxd-Tags-more', '.amis-Tag', '.cxd-Tag'], optional: true}
    ]
  },
  {
    id: 'INT-017',
    route: '/zh-CN/components/form/input-color',
    title: 'InputColor panel',
    steps: [{state: 'color-panel-open', action: 'click', selectors: ['.amis-ColorPicker', '.cxd-ColorPicker', '.amis-ColorControl', '.cxd-ColorControl', '.amis-ColorField', '.cxd-ColorField']}]
  },
  {
    id: 'INT-018',
    route: '/zh-CN/components/form/input-date',
    title: 'InputDate calendar',
    steps: [
      {state: 'calendar-open', action: 'click', selectors: dateSelectors()},
      {state: 'month-panel', action: 'click', selectors: ['.rdtSwitch', '.amis-DatePicker-toggler', '.cxd-DatePicker-toggler'], optional: true}
    ]
  },
  {
    id: 'INT-019',
    route: '/zh-CN/components/form/input-date-range',
    title: 'InputDateRange calendar',
    steps: [
      {state: 'range-open', action: 'click', selectors: dateSelectors()},
      {state: 'selecting-end', action: 'hover', selectors: ['.rdtDay:not(.rdtDisabled)', '.amis-Calendar-date', '.cxd-Calendar-date'], optional: true}
    ]
  },
  {
    id: 'INT-020',
    route: '/zh-CN/components/table',
    title: 'Table filter/column menu',
    steps: [
      {state: 'filter-open', action: 'click', selectors: tableFilterSelectors()},
      {state: 'after-filter-close', action: 'escape'},
      {state: 'column-menu-open', action: 'click', selectors: columnTogglerSelectors(), optional: true}
    ]
  },
  {
    id: 'INT-021',
    route: '/zh-CN/components/crud',
    title: 'CRUD column toggler menu',
    steps: [
      {state: 'column-menu-open', action: 'click', selectors: columnTogglerSelectors()},
      {state: 'after-close', action: 'escape'}
    ]
  },
  {
    id: 'INT-022',
    route: '/zh-CN/components/tabs',
    title: 'Tabs tooltip/overflow',
    steps: [
      {state: 'hover-tip', action: 'hover', selectors: ['.amis-Tabs-link', '.cxd-Tabs-link', '.amis-Tabs-tab', '.cxd-Tabs-tab']},
      {state: 'overflow-open', action: 'click', selectors: ['.amis-Tabs-togglor', '.cxd-Tabs-togglor'], optional: true}
    ]
  },
  {
    id: 'INT-023',
    route: '/zh-CN/components/carousel',
    title: 'Carousel controls',
    steps: [
      {state: 'hover-controls', action: 'hover', selectors: ['.amis-Carousel', '.cxd-Carousel', '.slick-slider']},
      {state: 'next-slide', action: 'click', selectors: ['.slick-next', '.amis-Carousel-next', '.cxd-Carousel-next', '.amis-Carousel-arrow--right', '.cxd-Carousel-arrow--right'], optional: true}
    ]
  },
  {
    id: 'INT-024',
    route: '/zh-CN/components/images',
    title: 'Images hover/gallery',
    steps: [
      {state: 'hover-actions', action: 'hover', selectors: ['.amis-Images-item', '.cxd-Images-item', '.amis-Image-thumb', '.cxd-Image-thumb', 'img']},
      {state: 'gallery-open', action: 'click', selectors: ['.amis-Images-item img', '.cxd-Images-item img', '.amis-Image-thumb img', '.cxd-Image-thumb img', 'img'], optional: true}
    ]
  },
  {
    id: 'INT-025',
    route: '/zh-CN/components/chart',
    title: 'Chart tooltip/legend',
    steps: [
      {state: 'tooltip-open', action: 'hover-center', selectors: chartSelectors()},
      {state: 'legend-toggled', action: 'click', selectors: chartSelectors(), optional: true}
    ]
  },
  {
    id: 'INT-026',
    route: '/zh-CN/components/chart',
    title: 'Chart wordCloud coverage',
    steps: [{state: 'wordcloud-rendered', action: 'screenshot-only'}]
  },
  {
    id: 'INT-027',
    route: '/zh-CN/components/video',
    title: 'Video capability interface',
    compareScreenshots: false,
    steps: [{state: 'interface-ok', action: 'assert-video-interface'}]
  },
  {
    id: 'INT-028',
    route: '/zh-CN/components/json',
    title: 'JSON expand/collapse',
    steps: [
      {state: 'expanded', action: 'click', selectors: jsonViewSelectors()},
      {state: 'edit-affordance', action: 'hover', selectors: ['[class*="w-rjv"]', '.react-json-view', '.amis-JsonField', '.cxd-JsonField'], optional: true}
    ]
  },
  {
    id: 'INT-029',
    route: '/zh-CN/components/form/input-rich-text',
    title: 'RichText toolbar/menu',
    failRatio: 0.02,
    steps: [
      {state: 'toolbar-menu-open', action: 'click', selectors: richTextMenuSelectors()},
      {state: 'dialog-open', action: 'click', selectors: richTextDialogMenuItemSelectors(), optional: true}
    ]
  },
  {
    id: 'INT-030',
    route: '/zh-CN/components/form/input-number',
    title: 'InputNumber focus/change',
    steps: [
      {state: 'focused', action: 'focus', selectors: ['.amis-NumberInput input', '.cxd-NumberInput input', 'input[type="number"]', 'input[type="text"]']},
      {state: 'changed', action: 'fill', selectors: ['.amis-NumberInput input', '.cxd-NumberInput input', 'input[type="number"]', 'input[type="text"]'], value: '42'},
      {state: 'blurred', action: 'blur'}
    ]
  },
  {
    id: 'INT-031',
    route: '/zh-CN/components/progress',
    title: 'Progress stable variants',
    steps: [{state: 'stable', action: 'screenshot-only'}]
  },
  {
    id: 'INT-032',
    route: '/examples/crud/table',
    title: 'CRUD quick edit popover',
    steps: [
      {state: 'quick-edit-open', action: 'click', selectors: quickEditSelectors()},
      {state: 'after-close', action: 'escape'}
    ]
  },
  {
    id: 'INT-033',
    route: '/zh-CN/components/collapse',
    title: 'Collapse expand/collapse transition',
    steps: [
      {state: 'expanded-second', action: 'click', selectors: collapseHeaderSelectors(), expectSelectors: collapseExpandedSelectors()},
      {state: 'collapsed-second', action: 'click', selectors: collapseActiveHeaderSelectors(), expectSelectors: collapseCollapsedSelectors()}
    ]
  },
  {
    id: 'INT-034',
    route: '/zh-CN/components/toast',
    title: 'Toast transition and placement',
    steps: [
      {state: 'toast-open', action: 'click', selectors: toastButtonSelectors(), expectSelectors: toastVisibleSelectors()},
      {state: 'toast-closed', action: 'escape'}
    ]
  },
  {
    id: 'INT-035',
    route: '/zh-CN/components/spinner',
    title: 'Spinner overlay/container state',
    beforeSelectors: spinnerOverlaySelectors(),
    steps: [{state: 'overlay-stable', action: 'screenshot-only'}]
  },
  {
    id: 'INT-036',
    route: '/zh-CN/components/form/input-formula',
    title: 'Formula editor popup panel',
    steps: [
      {state: 'editor-open', action: 'click', selectors: formulaActionSelectors(), expectSelectors: formulaEditorSelectors(), quietMouse: true},
      {state: 'after-close', action: 'escape'}
    ]
  },
  {
    id: 'INT-037',
    route: '/zh-CN/components/form/select',
    title: 'Mobile PopUp select sheet',
    viewport: '390x844',
    viewMode: 'mobile',
    steps: [
      {state: 'popup-open', action: 'click', selectors: selectSelectors(), expectSelectors: popupVisibleSelectors()},
      {state: 'after-close', action: 'escape'}
    ]
  },
  {
    id: 'INT-038',
    route: '/examples/form/rich-text',
    title: 'RichText example toolbar/menu',
    failRatio: 0.02,
    steps: [
      {state: 'toolbar-menu-open', action: 'click', selectors: richTextMenuSelectors(), expectSelectors: richTextMenuVisibleSelectors()},
      {state: 'dialog-open', action: 'click', selectors: richTextDialogMenuItemSelectors(), optional: true}
    ]
  },
  {
    id: 'INT-039',
    route: '/zh-CN/docs/index',
    title: 'ContextMenu synthetic harness',
    syntheticSetup: 'context-menu',
    steps: [
      {state: 'menu-open', action: 'open-context-menu', expectSelectors: contextMenuVisibleSelectors()},
      {state: 'submenu-hover', action: 'hover', selectors: contextMenuNestedItemSelectors(), expectSelectors: contextMenuSubmenuSelectors()},
      {state: 'after-close', action: 'escape'}
    ]
  },
  {
    id: 'INT-040',
    route: '/zh-CN/docs/index',
    title: 'Froala synthetic toolbar/popup',
    syntheticSetup: 'froala',
    failRatio: 0.02,
    steps: [
      {state: 'link-popup-open', action: 'click', selectors: froalaLinkButtonSelectors(), expectSelectors: froalaPopupSelectors()},
      {state: 'table-popup-open', action: 'click', selectors: froalaTableButtonSelectors(), expectSelectors: froalaTablePopupSelectors()}
    ]
  }
];

function dropdownSelectors() {
  return ['.amis-DropDown-button', '.cxd-DropDown-button', '.amis-DropDown .amis-Button', '.cxd-DropDown .cxd-Button', '.amis-Button:has-text("下拉")', '.cxd-Button:has-text("下拉")', 'button:has-text("下拉")'];
}

function menuItemSelectors() {
  return ['[role="menuitem"]', '.amis-DropDown-menu > li', '.cxd-DropDown-menu > li', '.amis-Menu-item', '.cxd-Menu-item', '.rc-menu-item'];
}

function navSubmenuSelectors() {
  return ['.amis-Menu-submenu-title', '.cxd-Menu-submenu-title', '.rc-menu-submenu-title', '.amis-Nav-item:has(ul)', '.cxd-Nav-item:has(ul)', '.amis-Nav a', '.cxd-Nav a'];
}

function breadcrumbSelectors() {
  return ['.amis-Breadcrumb li button', '.cxd-Breadcrumb li button', '.amis-Breadcrumb li a', '.cxd-Breadcrumb li a', '.amis-Breadcrumb', '.cxd-Breadcrumb'];
}

function tooltipSelectors() {
  return ['[data-tooltip]', '[title]', '.amis-TooltipWrapper', '.cxd-TooltipWrapper', '.amis-Button:has-text("提示")', '.cxd-Button:has-text("提示")', 'button'];
}

function popoverSelectors() {
  return ['[data-popover]', '.amis-PopOverAble', '.cxd-PopOverAble', '.amis-Button:has-text("弹出")', '.cxd-Button:has-text("弹出")', 'button'];
}

function remarkSelectors() {
  return ['.amis-Remark', '.cxd-Remark', '.fa-question-circle', '.icon-question', '[class*="Remark"]'];
}

function dialogButtonSelectors() {
  return ['.amis-Button:has-text("打开")', '.cxd-Button:has-text("打开")', '.amis-Button:has-text("弹框")', '.cxd-Button:has-text("弹框")', 'button:has-text("打开")', 'button:has-text("Dialog")', 'button'];
}

function drawerButtonSelectors() {
  return ['.amis-Button:has-text("打开")', '.cxd-Button:has-text("打开")', '.amis-Button:has-text("抽屉")', '.cxd-Button:has-text("抽屉")', 'button:has-text("打开")', 'button:has-text("Drawer")', 'button'];
}

function selectSelectors() {
  return ['.amis-Select', '.cxd-Select', '.amis-ResultBox', '.cxd-ResultBox', '.amis-TransferDropDown', '.cxd-TransferDropDown', '[role="combobox"]'];
}

function nestedSelectSelectors() {
  return ['.amis-NestedSelect', '.cxd-NestedSelect', '.amis-ResultBox', '.cxd-ResultBox'];
}

function treeSelectSelectors() {
  return ['.amis-TreeSelect', '.cxd-TreeSelect', '.amis-ResultBox', '.cxd-ResultBox'];
}

function treeExpandSelectors() {
  return ['.amis-Tree-itemArrow', '.cxd-Tree-itemArrow', '.amis-Tree-itemLabel', '.cxd-Tree-itemLabel'];
}

function optionSelectors() {
  return ['[role="option"]', '.amis-Select-option', '.cxd-Select-option', '.amis-Transfer-option', '.cxd-Transfer-option', '.amis-NestedSelect-option', '.cxd-NestedSelect-option'];
}

function pickerSelectors() {
  return ['.amis-PickerControl .amis-ResultBox', '.cxd-PickerControl .cxd-ResultBox', '.amis-Picker', '.cxd-Picker', '.amis-ResultBox', '.cxd-ResultBox'];
}

function tableFilterSelectors() {
  return ['.amis-TableCell-filterBtn', '.cxd-TableCell-filterBtn', '.amis-TableCell--filterable .table-filter-icon', '.cxd-TableCell--filterable .table-filter-icon', '[class*="TableCell-filterBtn"]'];
}

function columnTogglerSelectors() {
  return ['.amis-ColumnToggler button', '.cxd-ColumnToggler button', '.amis-ColumnToggler .amis-Button', '.cxd-ColumnToggler .cxd-Button', '[class*="ColumnToggler"] button'];
}

function quickEditSelectors() {
  return ['.amis-Field-quickEditBtn', '.cxd-Field-quickEditBtn', '.amis-Field--quickEditable .amis-Button', '.cxd-Field--quickEditable .cxd-Button'];
}

function collapseHeaderSelectors() {
  return ['.amis-Collapse:not(.is-active):not(.is-disabled) .amis-Collapse-header', '.cxd-Collapse:not(.is-active):not(.is-disabled) .cxd-Collapse-header', '[class*="Collapse"]:not(.is-active):not(.is-disabled) [class*="Collapse-header"]'];
}

function collapseActiveHeaderSelectors() {
  return ['.amis-Collapse.is-active .amis-Collapse-header', '.cxd-Collapse.is-active .cxd-Collapse-header', '[class*="Collapse"].is-active [class*="Collapse-header"]'];
}

function collapseExpandedSelectors() {
  return ['.amis-Collapse.is-active .amis-Collapse-contentWrapper', '.cxd-Collapse.is-active .cxd-Collapse-contentWrapper', '[class*="Collapse"].is-active [class*="Collapse-contentWrapper"]'];
}

function collapseCollapsedSelectors() {
  return ['.amis-Collapse:not(.is-active) .amis-Collapse-header', '.cxd-Collapse:not(.is-active) .cxd-Collapse-header', '[class*="Collapse"]:not(.is-active) [class*="Collapse-header"]'];
}

function toastButtonSelectors() {
  return ['.amis-Button:has-text("提示")', '.cxd-Button:has-text("提示")', 'button:has-text("提示")'];
}

function toastVisibleSelectors() {
  return ['.amis-Toast.in', '.cxd-Toast.in', '.amis-Toast-wrap', '.cxd-Toast-wrap', '[class*="Toast"]:has-text("轻提示")'];
}

function spinnerOverlaySelectors() {
  return ['.amis-Spinner-overlay', '.cxd-Spinner-overlay', '.amis-Spinner-wrap .amis-Spinner', '.cxd-Spinner-wrap .cxd-Spinner', '[class*="Spinner-overlay"]'];
}

function formulaActionSelectors() {
  return ['.amis-FormulaPicker-action', '.cxd-FormulaPicker-action', '[class*="FormulaPicker-action"]'];
}

function formulaEditorSelectors() {
  return ['.amis-FormulaEditor', '.cxd-FormulaEditor', '[class*="FormulaEditor"]'];
}

function popupVisibleSelectors() {
  return ['.amis-PopUp.in', '.cxd-PopUp.in', '.amis-Select-popup', '.cxd-Select-popup', '[class*="PopUp"][class*="in"]'];
}

function richTextMenuVisibleSelectors() {
  return ['.tox-menu', '.tox-collection', '.fr-dropdown-menu', '.fr-popup'];
}

function contextMenuVisibleSelectors() {
  return ['.amis-ContextMenu-menu.in', '.cxd-ContextMenu-menu.in', '[class*="ContextMenu-menu"][class*="in"]'];
}

function contextMenuNestedItemSelectors() {
  return ['.amis-ContextMenu-item.has-child > a', '.cxd-ContextMenu-item.has-child > a', '[class*="ContextMenu-item"][class*="has-child"] > a'];
}

function contextMenuSubmenuSelectors() {
  return ['.amis-ContextMenu-subList', '.cxd-ContextMenu-subList', '[class*="ContextMenu-subList"]'];
}

function froalaLinkButtonSelectors() {
  return ['.fr-command[data-cmd="insertLink"]'];
}

function froalaTableButtonSelectors() {
  return ['.fr-command[data-cmd="insertTable"]'];
}

function froalaPopupSelectors() {
  return ['.fr-popup.fr-active', '.fr-link-insert-layer.fr-active', '.fr-dropdown-menu'];
}

function froalaTablePopupSelectors() {
  return ['.fr-popup.fr-active .fr-table-size', '.fr-popup.fr-active .fr-select-table-size', '.fr-table-size'];
}

function jsonViewSelectors() {
  return ['[class*="w-rjv"] svg', '[class*="w-rjv"] [role="button"]', '[class*="w-rjv"]', '.react-json-view .icon-container', '.react-json-view .collapsed-icon', '.react-json-view .expanded-icon', '.react-json-view .object-key-val', '.amis-JsonField svg', '.cxd-JsonField svg', '.amis-JsonField', '.cxd-JsonField'];
}

function richTextMenuSelectors() {
  return ['.tox-mbtn:has-text("插入")', '.tox-mbtn:has-text("Insert")', '.fr-command:has-text("Insert")', '.fr-command:has-text("插入")'];
}

function richTextDialogMenuItemSelectors() {
  return ['.tox-collection__item:has-text("链接")', '.tox-collection__item:has-text("Link")', '[role="menuitem"]:has-text("链接")', '[role="menuitem"]:has-text("Link")'];
}

function dateSelectors() {
  return ['.amis-DatePicker input', '.cxd-DatePicker input', '.amis-DateRangePicker input', '.cxd-DateRangePicker input', '.amis-DatePicker', '.cxd-DatePicker', '.amis-DateRangePicker', '.cxd-DateRangePicker'];
}

function chartSelectors() {
  return ['.amis-Chart canvas', '.cxd-Chart canvas', '.amis-Chart', '.cxd-Chart', 'canvas'];
}

function videoSelectors() {
  return ['.amis-Video video', '.cxd-Video video', '.amis-Video', '.cxd-Video', '[class*="Video"] video', '[class*="Video"]'];
}

function parseArgs(argv) {
  const args = {
    baseline: 'http://127.0.0.1:8889',
    candidate: 'http://127.0.0.1:8888',
    outDir: '',
    viewport: '1440x900',
    theme: 'cxd',
    caseId: '',
    limit: 0,
    threshold: 0.1,
    warnRatio: 0.0005,
    failRatio: 0.003,
    timeout: 45000,
    executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'
  };

  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (!arg.startsWith('--')) continue;
    const key = arg.slice(2);
    const next = argv[i + 1];
    if (key === 'baseline') args.baseline = next, i++;
    else if (key === 'candidate') args.candidate = next, i++;
    else if (key === 'out') args.outDir = path.resolve(next), i++;
    else if (key === 'viewport') args.viewport = next, i++;
    else if (key === 'theme') args.theme = next, i++;
    else if (key === 'case') args.caseId = next, i++;
    else if (key === 'limit') args.limit = Number(next), i++;
    else if (key === 'threshold') args.threshold = Number(next), i++;
    else if (key === 'warn-ratio') args.warnRatio = Number(next), i++;
    else if (key === 'fail-ratio') args.failRatio = Number(next), i++;
    else if (key === 'timeout') args.timeout = Number(next), i++;
    else if (key === 'executable-path') args.executablePath = next, i++;
    else if (key === 'help') args.help = true;
    else throw new Error(`Unknown argument: ${arg}`);
  }

  const [width, height] = args.viewport.split('x').map(Number);
  if (!width || !height) throw new Error(`Invalid --viewport ${args.viewport}`);
  args.viewportSize = {width, height};
  if (!args.outDir) {
    const stamp = new Date().toISOString().replace(/[:.]/g, '-');
    args.outDir = path.join(ROOT, '.gstack/visual-regression/interactions', stamp);
  }
  return args;
}

function ensureDir(dir) {
  fs.mkdirSync(dir, {recursive: true});
}

function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function installDeterminism(context, theme, viewMode = 'pc') {
  await context.addInitScript(({theme, viewMode}) => {
    const fixedNow = Date.parse('2026-08-09T00:00:00.000Z');
    const RealDate = Date;
    class FixedDate extends RealDate {
      constructor(...args) {
        super(...(args.length ? args : [fixedNow]));
      }
      static now() {
        return fixedNow;
      }
    }
    FixedDate.UTC = RealDate.UTC;
    FixedDate.parse = RealDate.parse;
    FixedDate.prototype = RealDate.prototype;
    window.Date = FixedDate;
    let randomSeed = 0x2a2a2a2a;
    Math.random = () => {
      randomSeed = (randomSeed * 1664525 + 1013904223) >>> 0;
      return randomSeed / 0x100000000;
    };
    try {
      localStorage.clear();
      localStorage.setItem('amis-theme', theme);
      localStorage.setItem('amis-viewMode', viewMode);
      localStorage.setItem('amis-locale', 'zh-CN');
    } catch (e) {}
  }, {theme, viewMode});
}

function parseViewport(viewport) {
  const [width, height] = viewport.split('x').map(Number);
  if (!width || !height) throw new Error(`Invalid viewport ${viewport}`);
  return {width, height};
}

function viewportForCase(testCase, args) {
  return testCase.viewport ? parseViewport(testCase.viewport) : args.viewportSize;
}

async function preparePage(page) {
  await page.addStyleTag({
    content: `
      *, *::before, *::after {
        transition-duration: 0s !important;
        transition-delay: 0s !important;
        animation-duration: 0s !important;
        animation-delay: 0s !important;
        animation-iteration-count: 1 !important;
        scroll-behavior: auto !important;
        caret-color: transparent !important;
      }
      iframe[src^="http://"], iframe[src^="https://"] { opacity: 0 !important; }
      video { background: #111 !important; }
      .amis-Form--debug, .cxd-Form--debug { display: none !important; }
    `
  }).catch(() => undefined);
}

async function settle(page, extra = 500) {
  await page.waitForLoadState('networkidle', {timeout: 8000}).catch(() => undefined);
  await page.evaluate(() => document.fonts && document.fonts.ready).catch(() => undefined);
  await page.waitForFunction(() => document.readyState === 'complete', {timeout: 10000}).catch(() => undefined);
  await page.waitForFunction(() => {
    const selectors = ['.visibility-sensor > .amis-Spinner', '.visibility-sensor > .cxd-Spinner', '.amis-LazyComponent > .amis-Spinner', '.cxd-LazyComponent > .cxd-Spinner'];
    return selectors.every(selector => Array.from(document.querySelectorAll(selector)).every(node => {
      const style = getComputedStyle(node);
      const rect = node.getBoundingClientRect();
      return rect.bottom < 0 || rect.top > innerHeight || style.display === 'none' || style.visibility === 'hidden' || style.opacity === '0' || rect.width === 0 || rect.height === 0;
    }));
  }, {timeout: 12000}).catch(() => undefined);
  await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)))).catch(() => undefined);
  await delay(extra);
}

function collectConsole(page, bucket, side) {
  page.on('console', msg => {
    if (['error', 'warning'].includes(msg.type())) bucket.push({side, type: msg.type(), text: msg.text()});
  });
  page.on('pageerror', err => bucket.push({side, type: 'pageerror', text: err.message}));
  page.on('requestfailed', request => bucket.push({side, type: 'requestfailed', text: `${request.failure()?.errorText || 'failed'} ${request.url()}`}));
}

async function findLocator(page, selectors) {
  let y = 0;
  for (let scan = 0; scan < 120; scan++) {
    await page.evaluate(nextY => window.scrollTo(0, nextY), y).catch(() => undefined);
    await settle(page, 250);
    for (const selector of selectors || []) {
      const locators = [
        page.locator('.Doc-content').locator(selector),
        page.locator(selector)
      ];

      for (const locator of locators) {
        const visibleLocator = await firstVisibleInViewport(page, locator);
        if (visibleLocator) return {selector, locator: visibleLocator, y};
      }
    }

    const scroll = await page.evaluate(() => {
      const el = document.scrollingElement || document.documentElement;
      const viewport = window.innerHeight || 900;
      return {
        maxScroll: Math.max(0, el.scrollHeight - viewport),
        step: Math.max(1, viewport - 160)
      };
    });
    if (y >= scroll.maxScroll) break;
    y = Math.min(y + scroll.step, scroll.maxScroll);
  }
  return null;
}

async function waitForVisibleSelector(page, selectors, timeout = 5000) {
  const deadline = Date.now() + timeout;
  let lastError = '';
  while (Date.now() < deadline) {
    for (const selector of selectors || []) {
      try {
        const locator = page.locator(selector);
        const visibleLocator = await firstVisibleInViewport(page, locator);
        if (visibleLocator) return {selector, locator: visibleLocator};
      } catch (error) {
        lastError = error && error.message ? error.message : String(error);
      }
    }
    await delay(150);
  }

  throw new Error(
    `Expected visible selector not found: ${(selectors || []).join(', ')}${
      lastError ? ` (${lastError})` : ''
    }`
  );
}

async function firstVisibleInViewport(page, locator) {
  const count = Math.min(await locator.count().catch(() => 0), 80);
  for (let i = 0; i < count; i++) {
    const candidate = locator.nth(i);
    try {
      if (!(await candidate.isVisible({timeout: 300}).catch(() => false))) continue;
      const box = await candidate.boundingBox();
      if (!box || !box.width || !box.height) continue;
      const inViewport = await page.evaluate(
        rect => rect.bottom > 0 && rect.top < window.innerHeight && rect.right > 0 && rect.left < window.innerWidth,
        {
          left: box.x,
          top: box.y,
          right: box.x + box.width,
          bottom: box.y + box.height
        }
      );
      if (inViewport) return candidate;
    } catch (e) {
    }
  }
  return null;
}

async function performStep(page, step) {
  if (step.action === 'screenshot-only') return {action: step.action};
  if (step.action === 'assert-video-interface') return assertVideoInterface(page);
  if (step.action === 'open-context-menu') return openSyntheticContextMenu(page, step);
  if (step.action === 'escape') {
    await page.keyboard.press('Escape');
    await settle(page, 300);
    return {action: step.action};
  }
  if (step.action === 'mouse-away') {
    await page.mouse.move(5, 5);
    await settle(page, 300);
    return {action: step.action};
  }
  if (step.action === 'blur') {
    await page.keyboard.press('Tab').catch(() => undefined);
    await page.evaluate(() => document.activeElement && document.activeElement.blur()).catch(() => undefined);
    await settle(page, 300);
    return {action: step.action};
  }

  const found = await findLocator(page, step.selectors);
  if (!found) {
    const message = `No visible trigger found for ${step.state}`;
    if (step.optional) return {action: step.action, skipped: true, reason: message};
    throw new Error(message);
  }

  await scrollLocatorIntoStableView(page, found.locator);
  if (step.action === 'click') {
    await found.locator.click({timeout: 5000, force: true});
  } else if (step.action === 'hover') {
    await found.locator.hover({timeout: 5000, force: true});
  } else if (step.action === 'focus') {
    await found.locator.focus({timeout: 5000});
  } else if (step.action === 'fill') {
    await found.locator.fill(step.value || '', {timeout: 5000}).catch(async () => {
      await found.locator.click({timeout: 5000, force: true});
      await page.keyboard.press(process.platform === 'darwin' ? 'Meta+A' : 'Control+A');
      await page.keyboard.type(step.value || '');
    });
  } else if (step.action === 'drag') {
    const box = await found.locator.boundingBox();
    if (box) {
      await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
      await page.mouse.down();
      await page.mouse.move(box.x + box.width / 2 + 80, box.y + box.height / 2 + 30, {steps: 5});
      await page.mouse.up();
    }
  } else if (step.action === 'hover-center') {
    const box = await found.locator.boundingBox();
    if (!box) throw new Error(`No bounding box for ${found.selector}`);
    await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
  } else {
    throw new Error(`Unknown action ${step.action}`);
  }

  await settle(page, 700);
  let expected;
  if (step.expectSelectors?.length) {
    expected = await waitForVisibleSelector(page, step.expectSelectors);
  }
  if (step.quietMouse) {
    const size = page.viewportSize() || {width: 1440, height: 900};
    await page.mouse.move(Math.max(1, size.width - 8), Math.max(1, size.height - 8));
    await settle(page, 250);
  }
  return {
    action: step.action,
    selector: found.selector,
    expectedSelector: expected?.selector,
    y: found.y
  };
}

async function assertVideoInterface(page) {
  const result = await page.evaluate(async () => {
    const video = document.querySelector('.amis-Video video,.cxd-Video video,video');
    if (!video) return {exists: false};

    const src = video.currentSrc || video.getAttribute('src') || '';
    const poster = video.getAttribute('poster') || '';
    const hasControls = Boolean(
      video.controls ||
        document.querySelector('.video-react-control-bar,.video-react-big-play-button')
    );

    let playError = '';
    try {
      await video.play();
    } catch (error) {
      playError = error && error.message ? error.message : String(error);
    }
    await new Promise(resolve => setTimeout(resolve, 500));
    const afterPlay = {
      paused: video.paused,
      currentTime: video.currentTime,
      readyState: video.readyState
    };

    video.pause();
    await new Promise(resolve => setTimeout(resolve, 100));
    const afterPause = {
      paused: video.paused,
      currentTime: video.currentTime,
      readyState: video.readyState
    };

    return {exists: true, src, poster, hasControls, playError, afterPlay, afterPause};
  });

  if (!result.exists) throw new Error('Video element was not rendered.');
  if (!result.src) throw new Error('Video src is empty.');
  if (!result.poster) throw new Error('Video poster is empty.');
  if (!result.hasControls) throw new Error('Video controls are not available.');
  if (result.playError) throw new Error(`Video play failed: ${result.playError}`);
  if (result.afterPlay.paused) throw new Error('Video did not enter playing state.');
  if (!result.afterPause.paused) throw new Error('Video did not enter paused state.');

  return {
    action: 'assert-video-interface',
    video: {
      hasControls: result.hasControls,
      readyState: result.afterPlay.readyState,
      currentTime: Number(result.afterPause.currentTime.toFixed(3))
    }
  };
}

async function openSyntheticContextMenu(page, step) {
  await page.evaluate(async () => {
    const mod = await import('/packages/amis-ui/src/components/ContextMenu.tsx');
    await mod.ContextMenu.getInstance();
    await new Promise(resolve => setTimeout(resolve, 250));
    await mod.openContextMenus({x: 420, y: 260}, [
      {label: 'QA Context Item', icon: 'fa fa-copy'},
      {
        label: 'Nested Actions',
        children: [
          {label: 'Child A'},
          {label: 'Child B', selected: true}
        ]
      },
      '|',
      {label: 'Disabled Item', disabled: true}
    ]);
  });
  await settle(page, 700);
  let expected;
  if (step.expectSelectors?.length) {
    expected = await waitForVisibleSelector(page, step.expectSelectors);
  }
  return {action: step.action, expectedSelector: expected?.selector};
}

async function scrollLocatorIntoStableView(page, locator) {
  await locator.evaluate(element => {
    element.scrollIntoView({block: 'center', inline: 'nearest'});
  }).catch(async () => {
    await locator.scrollIntoViewIfNeeded().catch(() => undefined);
  });
  await settle(page, 250);
}

async function screenshot(page, outPath) {
  await page.screenshot({path: outPath, animations: 'disabled'});
}

async function openCasePage(browser, baseUrl, testCase, side, args, consoleEvents) {
  const context = await browser.newContext({
    viewport: viewportForCase(testCase, args),
    deviceScaleFactor: 1,
    colorScheme: 'light',
    reducedMotion: 'reduce',
    locale: 'zh-CN'
  });
  await installDeterminism(context, args.theme, testCase.viewMode || 'pc');
  const page = await context.newPage();
  collectConsole(page, consoleEvents, side);
  const response = await page.goto(`${baseUrl}${testCase.route}`, {waitUntil: 'domcontentloaded', timeout: args.timeout});
  await preparePage(page);
  await settle(page, 1000);
  if (testCase.syntheticSetup) {
    await setupSyntheticHarness(page, testCase.syntheticSetup);
    await settle(page, 1000);
  }
  return {context, page, status: response ? response.status() : null};
}

async function setupSyntheticHarness(page, kind) {
  if (kind === 'context-menu') {
    await page.evaluate(() => {
      document.body.innerHTML = `
        <main id="qa-context-menu-harness" style="box-sizing:border-box;width:100vw;height:100vh;padding:96px;background:#f7f8fa;font-family:Arial,sans-serif;">
          <section style="width:720px;margin:0 auto;padding:32px;border:1px solid #d8dde8;background:white;border-radius:4px;">
            <h1 style="margin:0 0 16px;font-size:20px;">ContextMenu QA Harness</h1>
            <p style="margin:0;color:#5c6573;">Synthetic trigger keeps baseline and candidate on the same stable DOM.</p>
          </section>
        </main>`;
    });
    return;
  }

  if (kind === 'froala') {
    await page.evaluate(async () => {
      const ReactMod = await import('/node_modules/.vite/deps/react.js');
      const React = ReactMod.default || ReactMod;
      const ClientMod = await import('/node_modules/.vite/deps/react-dom_client.js');
      const createRoot = ClientMod.createRoot || ClientMod.default?.createRoot;
      const RichText = await import('/packages/amis-ui/src/components/RichText.tsx');

      document.body.innerHTML = `
        <main style="box-sizing:border-box;width:100vw;min-height:100vh;padding:72px;background:#f7f8fa;font-family:Arial,sans-serif;">
          <section id="qa-froala-harness" style="position:relative;margin:0 auto;width:960px;min-height:420px;background:white;padding:24px;border:1px solid #d8dde8;border-radius:4px;z-index:1;"></section>
        </main>`;

      const host = document.getElementById('qa-froala-harness');
      const root = createRoot(host);
      root.render(
        React.createElement(RichText.default, {
          model: '<p>Froala QA</p>',
          onModelChange: value => {
            window.__amisFroalaValue = value;
          },
          config: {
            key: 'qa-token',
            attribution: false,
            language: 'zh_cn',
            heightMin: 240,
            height: 260,
            toolbarButtons: [
              'bold',
              'italic',
              'insertLink',
              'insertImage',
              'insertTable',
              'html'
            ],
            events: {
              initialized() {
                window.__amisFroalaReady = true;
              }
            }
          }
        })
      );

      const start = Date.now();
      while (!window.__amisFroalaReady && Date.now() - start < 12000) {
        await new Promise(resolve => setTimeout(resolve, 250));
      }
      if (!window.__amisFroalaReady) {
        throw new Error('Froala synthetic harness did not initialize.');
      }
    });
    return;
  }

  throw new Error(`Unknown synthetic setup ${kind}`);
}

async function captureSide(browser, baseUrl, testCase, side, args, rootDir, consoleEvents) {
  const dir = path.join(rootDir, side);
  ensureDir(dir);
  const captures = [];
  const actions = [];
  const opened = await openCasePage(browser, baseUrl, testCase, side, args, consoleEvents);
  try {
    const beforePath = path.join(dir, 'before.png');
    if (testCase.beforeSelectors?.length) {
      await findLocator(opened.page, testCase.beforeSelectors);
    }
    await screenshot(opened.page, beforePath);
    captures.push({state: 'before', path: beforePath});
    for (const step of testCase.steps) {
      const action = await performStep(opened.page, step);
      actions.push({state: step.state, ...action});
      if (action.skipped) continue;
      const shotPath = path.join(dir, `${step.state}.png`);
      await screenshot(opened.page, shotPath);
      captures.push({state: step.state, path: shotPath});
    }
    return {status: opened.status, captures, actions};
  } finally {
    await opened.page.close().catch(() => undefined);
    await opened.context.close().catch(() => undefined);
  }
}

async function comparePng(pixelmatch, PNG, baselinePath, candidatePath, diffPath, threshold) {
  const imgA = PNG.sync.read(fs.readFileSync(baselinePath));
  const imgB = PNG.sync.read(fs.readFileSync(candidatePath));
  if (imgA.width !== imgB.width || imgA.height !== imgB.height) {
    return {width: Math.max(imgA.width, imgB.width), height: Math.max(imgA.height, imgB.height), diffPixels: Math.max(imgA.width * imgA.height, imgB.width * imgB.height), diffRatio: 1, dimensionMismatch: true};
  }
  const diff = new PNG({width: imgA.width, height: imgA.height});
  const diffPixels = pixelmatch(imgA.data, imgB.data, diff.data, imgA.width, imgA.height, {threshold, includeAA: false});
  fs.writeFileSync(diffPath, PNG.sync.write(diff));
  return {width: imgA.width, height: imgA.height, diffPixels, diffRatio: diffPixels / (imgA.width * imgA.height), dimensionMismatch: false};
}

function statusForRatio(ratio, warnRatio, failRatio) {
  if (ratio > failRatio) return 'fail';
  if (ratio > warnRatio) return 'warn';
  return 'pass';
}

async function runCase(deps, browser, args, testCase) {
  const caseDir = path.join(args.outDir, 'interactions', testCase.id);
  const diffDir = path.join(caseDir, 'diff');
  ensureDir(diffDir);
  const consoleEvents = [];
  try {
    const baseline = await captureSide(browser, args.baseline, testCase, 'baseline', args, caseDir, consoleEvents);
    const candidate = await captureSide(browser, args.candidate, testCase, 'candidate', args, caseDir, consoleEvents);
    const diffs = [];
    const baselineByState = new Map(baseline.captures.map(item => [item.state, item.path]));
    if (testCase.compareScreenshots !== false) {
      for (const item of candidate.captures) {
        const baselinePath = baselineByState.get(item.state);
        if (!baselinePath) continue;
        const diffPath = path.join(diffDir, `${item.state}.png`);
        const diff = await comparePng(deps.pixelmatch, deps.PNG, baselinePath, item.path, diffPath, args.threshold);
        diffs.push({state: item.state, baselinePath: path.relative(args.outDir, baselinePath), candidatePath: path.relative(args.outDir, item.path), diffPath: path.relative(args.outDir, diffPath), ...diff, status: statusForRatio(diff.diffRatio, testCase.warnRatio ?? args.warnRatio, testCase.failRatio ?? args.failRatio)});
      }
    }
    const status = diffs.some(item => item.status === 'fail') ? 'fail' : diffs.some(item => item.status === 'warn') ? 'warn' : 'pass';
    return {id: testCase.id, title: testCase.title, route: testCase.route, status, baselineStatus: baseline.status, candidateStatus: candidate.status, baselineActions: baseline.actions, candidateActions: candidate.actions, diffs, consoleEvents};
  } catch (error) {
    return {id: testCase.id, title: testCase.title, route: testCase.route, status: 'error', error: error && error.stack ? error.stack : String(error), consoleEvents};
  }
}

function writeReport(args, results) {
  const counts = results.reduce((acc, item) => {
    acc[item.status] = (acc[item.status] || 0) + 1;
    return acc;
  }, {pass: 0, warn: 0, fail: 0, error: 0});
  const summary = {generatedAt: new Date().toISOString(), baseline: args.baseline, candidate: args.candidate, viewport: args.viewport, theme: args.theme, casesRun: results.length, counts};
  fs.writeFileSync(path.join(args.outDir, 'interaction-summary.json'), JSON.stringify(summary, null, 2) + '\n');
  fs.writeFileSync(path.join(args.outDir, 'interaction-results.json'), JSON.stringify(results, null, 2) + '\n');

  const lines = [
    '# amis interaction visual regression report',
    '',
    `Generated: ${summary.generatedAt}`,
    `Baseline: ${args.baseline}`,
    `Candidate: ${args.candidate}`,
    `Viewport: ${args.viewport}`,
    `Theme: ${args.theme}`,
    '',
    '## Summary',
    '',
    `- Cases: ${results.length}`,
    `- Pass: ${counts.pass || 0}`,
    `- Warn: ${counts.warn || 0}`,
    `- Fail: ${counts.fail || 0}`,
    `- Error: ${counts.error || 0}`,
    '',
    '## Case Results',
    '',
    '| Status | Case | Route | Max Diff | Trigger Notes | Error |',
    '|---|---|---|---:|---|---|'
  ];
  for (const result of results) {
    const maxDiff = Math.max(0, ...(result.diffs || []).map(item => item.diffRatio || 0));
    const notes = [
      ...(result.baselineActions || []).map(item => `b:${item.state}:${item.selector || item.skipped || item.action}${item.expectedSelector ? `=>${item.expectedSelector}` : ''}`),
      ...(result.candidateActions || []).map(item => `c:${item.state}:${item.selector || item.skipped || item.action}${item.expectedSelector ? `=>${item.expectedSelector}` : ''}`)
    ].join('<br>');
    const error = result.error ? String(result.error).split('\n')[0].replace(/\|/g, '\\|') : '';
    lines.push(`| ${result.status} | ${result.id} ${result.title.replace(/\|/g, '\\|')} | \`${result.route}\` | ${(maxDiff * 100).toFixed(4)}% | ${notes.replace(/\|/g, '\\|')} | ${error} |`);
  }
  fs.writeFileSync(path.join(args.outDir, 'interaction-report.md'), lines.join('\n') + '\n');
  return summary;
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  if (args.help) {
    console.log('Usage: node run-interaction-regression.cjs --baseline http://127.0.0.1:8889 --candidate http://127.0.0.1:8888 --out DIR');
    return;
  }
  let cases = CASES;
  if (args.caseId) cases = cases.filter(item => item.id === args.caseId);
  if (args.limit) cases = cases.slice(0, args.limit);
  if (!cases.length) throw new Error('No interaction cases matched filters.');

  ensureDir(args.outDir);
  fs.writeFileSync(path.join(args.outDir, 'interaction-run-config.json'), JSON.stringify(args, null, 2) + '\n');
  fs.writeFileSync(path.join(args.outDir, 'interaction-cases.json'), JSON.stringify(cases, null, 2) + '\n');

  const [{chromium}, {PNG}, pixelmatchModule] = await Promise.all([
    Promise.resolve(requireFromDeps('playwright')),
    Promise.resolve(requireFromDeps('pngjs')),
    import(pathToFileURL(requireFromDeps.resolve('pixelmatch')).href)
  ]);
  const deps = {PNG, pixelmatch: pixelmatchModule.default || pixelmatchModule};
  const launchOptions = {headless: true, args: ['--disable-gpu', '--font-render-hinting=none', '--autoplay-policy=no-user-gesture-required']};
  if (args.executablePath && fs.existsSync(args.executablePath)) launchOptions.executablePath = args.executablePath;
  const browser = await chromium.launch(launchOptions);
  const results = [];
  try {
    for (let i = 0; i < cases.length; i++) {
      const result = await runCase(deps, browser, args, cases[i]);
      results.push(result);
      console.log(`[${i + 1}/${cases.length}] ${result.status.toUpperCase()} ${result.id} ${cases[i].route}`);
      writeReport(args, results);
    }
  } finally {
    await browser.close().catch(() => undefined);
  }
  const summary = writeReport(args, results);
  console.log(JSON.stringify({outDir: args.outDir, counts: summary.counts}, null, 2));
}

main().catch(error => {
  console.error(error && error.stack ? error.stack : error);
  process.exit(1);
});
