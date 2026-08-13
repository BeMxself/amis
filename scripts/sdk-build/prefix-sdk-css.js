var postcss = require('postcss');

function prefixSdkCss(code, prefix, label) {
  var cssAst;

  try {
    cssAst = postcss.parse(code, {from: label || undefined});
  } catch (error) {
    error.message = formatCssParseError(error, code, label);
    throw error;
  }

  cssAst.walkRules(function (rule) {
    if (isInKeyframes(rule)) {
      return;
    }

    rule.selectors = rule.selectors.map(function (selector) {
      return prefixSelector(selector, prefix);
    });
  });

  return cssAst.toString();
}

function formatCssParseError(error, code, label) {
  return (
    'Failed to prefix SDK CSS' +
    (label ? ' for ' + label : '') +
    ': ' +
    error.message +
    getErrorExcerpt(error, code)
  );
}

function getErrorExcerpt(error, code) {
  if (!error.line) {
    return '';
  }

  var lines = code.split(/\r?\n/);
  var start = Math.max(0, error.line - 4);
  var end = Math.min(lines.length, error.line + 3);
  var excerpt = lines
    .slice(start, end)
    .map(function (line, index) {
      return start + index + 1 + ': ' + line;
    })
    .join('\n');

  return excerpt ? '\n' + excerpt : '';
}

function prefixSelector(selector, prefix) {
  if (selector.match(/^@/)) return selector;
  if (selector.match(/^:root/)) return selector;

  var bodyOrHtml = selector.match(/(^| )(body|html)($|\W.*)/i);
  if (bodyOrHtml) return bodyOrHtml[1] + prefix + bodyOrHtml[3];

  if (selector.match(/^\.is\-modalOpened/)) {
    return selector.replace(
      /^\.is\-modalOpened\s/,
      '.is-modalOpened ' + prefix + ' '
    );
  }

  if (
    selector.match(
      /^(?:\.fr-|\.fa|\.tox|\.AMISDebug|\.monaco-|\.vs-dark|\.hc-black|\.vs\b|\.cursor-|::|\.context-view|\.menubar|\.fullscreen|\.colorpicker-)/
    )
  ) {
    return selector;
  }

  return prefix + ' ' + selector;
}

function isInKeyframes(rule) {
  var parent = rule.parent;

  while (parent) {
    if (parent.type === 'atrule' && /keyframes$/i.test(parent.name)) {
      return true;
    }

    parent = parent.parent;
  }

  return false;
}

module.exports = {
  prefixSdkCss
};
