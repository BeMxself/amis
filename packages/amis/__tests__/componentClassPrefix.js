const prettyFormat = require('pretty-format');

const format = prettyFormat.format || prettyFormat;
const {DOMCollection, DOMElement} = prettyFormat.plugins;

const COMPONENT_CLASS_PREFIX =
  process.env.PRISMUI_TEST_COMPONENT_CLASS_PREFIX || 'prismui-';
const SNAPSHOT_COMPONENT_CLASS_PREFIX = '__PRISMUI_COMPONENT_CLASS_PREFIX__';
const SELECTOR_PREFIXES = Array.from(
  new Set([COMPONENT_CLASS_PREFIX, 'prismui-', 'prismui-'])
);

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

const componentClassPrefixPattern = new RegExp(
  `\\b(?:${SELECTOR_PREFIXES.map(escapeRegExp).join('|')})(?=[A-Z])`,
  'g'
);

const componentSelectorPrefixPattern = new RegExp(
  `\\.(?:${SELECTOR_PREFIXES.map(escapeRegExp).join('|')})(?=[A-Z])`,
  'g'
);

function componentClass(name) {
  return `${COMPONENT_CLASS_PREFIX}${name}`;
}

function componentSelector(selector) {
  return selector.replace(
    componentSelectorPrefixPattern,
    `.${COMPONENT_CLASS_PREFIX}`
  );
}

function normalizeSnapshotClassPrefixes(value) {
  return value
    .replace(componentClassPrefixPattern, SNAPSHOT_COMPONENT_CLASS_PREFIX)
    .replace(/[ \t]+$/gm, '');
}

function isDomElement(value) {
  return value && value.nodeType === 1 && typeof value.cloneNode === 'function';
}

function serializeDomElement(value, config) {
  return normalizeSnapshotClassPrefixes(
    format(value, {
      callToJSON: config.callToJSON,
      compareKeys: config.compareKeys,
      escapeRegex: config.escapeRegex,
      escapeString: config.escapeString,
      highlight: config.highlight,
      indent: 2,
      maxDepth: config.maxDepth,
      min: config.min,
      plugins: [DOMElement, DOMCollection],
      printBasicPrototype: config.printBasicPrototype,
      printFunctionName: config.printFunctionName,
      theme: config.theme
    })
  );
}

function installComponentClassSnapshotSerializer() {
  if (!global.expect || global.__PRISMUI_COMPONENT_CLASS_SNAPSHOT_SERIALIZER__) {
    return;
  }

  global.__PRISMUI_COMPONENT_CLASS_SNAPSHOT_SERIALIZER__ = true;
  expect.addSnapshotSerializer({
    test: isDomElement,
    serialize: serializeDomElement
  });
}

function patchSelectorMethod(prototype, methodName) {
  if (!prototype || prototype[`__amisComponentClass_${methodName}`]) {
    return;
  }

  const original = prototype[methodName];

  if (typeof original !== 'function') {
    return;
  }

  Object.defineProperty(prototype, `__amisComponentClass_${methodName}`, {
    value: original
  });

  Object.defineProperty(prototype, methodName, {
    configurable: true,
    writable: true,
    value: function (selector, ...rest) {
      return original.call(
        this,
        typeof selector === 'string' ? componentSelector(selector) : selector,
        ...rest
      );
    }
  });
}

function installComponentClassSelectorBridge() {
  if (global.__PRISMUI_COMPONENT_CLASS_SELECTOR_BRIDGE__) {
    return;
  }

  global.__PRISMUI_COMPONENT_CLASS_SELECTOR_BRIDGE__ = true;
  [Element.prototype, Document.prototype, DocumentFragment.prototype].forEach(
    prototype => {
      patchSelectorMethod(prototype, 'querySelector');
      patchSelectorMethod(prototype, 'querySelectorAll');
      patchSelectorMethod(prototype, 'matches');
      patchSelectorMethod(prototype, 'closest');
    }
  );
}

module.exports = {
  COMPONENT_CLASS_PREFIX,
  SNAPSHOT_COMPONENT_CLASS_PREFIX,
  componentClass,
  componentSelector,
  installComponentClassSelectorBridge,
  installComponentClassSnapshotSerializer,
  normalizeSnapshotClassPrefixes
};
