const fs = require('fs');
const path = require('path');

function sdkFisDirectivePlugin(options) {
  options = options || {};

  const basePathExpression = options.basePathExpression || 'amis.sdkBasePath';

  return {
    name: 'sdk-fis-directives',
    transform(code, id) {
      let transformed = code;
      const normalizedId = normalizePath(id);

      if (isSdkUriModule(normalizedId)) {
        transformed = rewriteSdkUriDirectives(transformed);
      }

      if (transformed.includes('__inline(')) {
        transformed = rewriteSdkInlineDirectives(transformed, id);
      }

      if (isSdkFilterUrlModule(normalizedId)) {
        transformed = rewriteSdkFilterUrl(transformed, basePathExpression);
      }

      return transformed === code ? null : {code: transformed, map: null};
    }
  };
}

function rewriteSdkUriDirectives(code) {
  return code.replace(
    /\b(?:[A-Za-z_$][\w$]*\.)?__uri\s*\(\s*(['"])([^'"]+)\1\s*\)/g,
    (_, quote, value) => JSON.stringify(toSdkAssetUrl(value))
  );
}

function rewriteSdkFilterUrl(code, basePathExpression) {
  return code.replace(
    /function\s+filterUrl\s*\(\s*url(?:\s*:\s*string)?\s*\)\s*\{\s*return\s+url\s*;\s*\}/g,
    `function filterUrl(url) {\n  return ${basePathExpression} + url.substring(1);\n}`
  );
}

function rewriteSdkInlineDirectives(code, importer) {
  return code.replace(
    /\b(?:[A-Za-z_$][\w$]*\.)?__inline\s*\(\s*(['"])([^'"]+)\1\s*\)/g,
    (_, quote, value) => readInlineJson(value, importer)
  );
}

function readInlineJson(value, importer) {
  if (path.extname(value) !== '.json') {
    throw new Error(`Unsupported SDK __inline asset: ${value}`);
  }

  const file = path.resolve(path.dirname(importer), value);
  const contents = fs.readFileSync(file, 'utf8');

  return JSON.stringify(JSON.parse(contents));
}

function toSdkAssetUrl(value) {
  if (value.startsWith('/')) {
    return value;
  }

  if (isSdkThirdAsset(value)) {
    return `/thirds/${value}`;
  }

  return value;
}

function isSdkThirdAsset(value) {
  return /^(?:monaco-editor|pdfjs-dist|hls\.js|mpegts\.js)\//.test(value);
}

function isSdkUriModule(id) {
  return (
    id.endsWith('/examples/loadMonacoEditor.ts') ||
    id.endsWith('/examples/loadPdfjsWorker.ts')
  );
}

function isSdkFilterUrlModule(id) {
  return (
    isSdkUriModule(id) ||
    id.endsWith('/packages/amis-ui/lib/components/Editor.js') ||
    id.endsWith('/packages/amis-ui/src/components/Editor.tsx')
  );
}

function normalizePath(value) {
  return value.split('\\').join('/');
}

module.exports = {
  rewriteSdkFilterUrl,
  rewriteSdkInlineDirectives,
  rewriteSdkUriDirectives,
  sdkFisDirectivePlugin,
  toSdkAssetUrl
};
