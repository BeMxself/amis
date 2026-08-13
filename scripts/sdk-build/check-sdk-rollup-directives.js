#!/usr/bin/env node

const {
  rewriteSdkFilterUrl,
  rewriteSdkUriDirectives,
  toSdkAssetUrl
} = require('./rollup-fis-directives');

const basePathExpression = "amis['sdk@6.13.0BasePath']";
const source = [
  "const pdfWorker = __uri('pdfjs-dist/build/pdf.worker.min.mjs');",
  "const monacoLoader = helper.__uri(\"monaco-editor/min/vs/loader.js\");",
  "const localImage = __uri('../static/photo.png');",
  'function filterUrl(url: string) {',
  '  return url;',
  '}'
].join('\n');
const transformed = rewriteSdkFilterUrl(
  rewriteSdkUriDirectives(source),
  basePathExpression
);
const transformedJsFilterUrl = rewriteSdkFilterUrl(
  'function filterUrl(url) { return url; }',
  basePathExpression
);

assertEqual(
  toSdkAssetUrl('pdfjs-dist/build/pdf.worker.min.mjs'),
  '/thirds/pdfjs-dist/build/pdf.worker.min.mjs',
  'pdf worker should map to SDK thirds'
);
assertEqual(
  toSdkAssetUrl('monaco-editor/min/vs/loader.js'),
  '/thirds/monaco-editor/min/vs/loader.js',
  'Monaco loader should map to SDK thirds'
);
assertEqual(
  toSdkAssetUrl('../static/photo.png'),
  '../static/photo.png',
  'non-SDK assets should keep their original URL'
);

assertContains(
  transformed,
  '"/thirds/pdfjs-dist/build/pdf.worker.min.mjs"',
  'pdf __uri() call should become a SDK thirds URL literal'
);
assertContains(
  transformed,
  '"/thirds/monaco-editor/min/vs/loader.js"',
  'Monaco __uri() call should become a SDK thirds URL literal'
);
assertContains(
  transformed,
  '"../static/photo.png"',
  'non-SDK __uri() call should remain a local URL literal'
);
assertContains(
  transformed,
  "return amis['sdk@6.13.0BasePath'] + url.substring(1);",
  'filterUrl should prefix SDK-relative URLs with the SDK base path'
);
assertContains(
  transformedJsFilterUrl,
  "return amis['sdk@6.13.0BasePath'] + url.substring(1);",
  'compiled JS filterUrl should also be rewritten'
);
assertNotContains(transformed, '__uri(', '__uri calls should be eliminated');

console.log('Rollup SDK FIS directives OK.');

function assertEqual(actual, expected, message) {
  if (actual !== expected) {
    throw new Error(`${message}: expected ${expected}, got ${actual}`);
  }
}

function assertContains(contents, expected, message) {
  if (!contents.includes(expected)) {
    throw new Error(`${message}: missing ${expected}`);
  }
}

function assertNotContains(contents, expected, message) {
  if (contents.includes(expected)) {
    throw new Error(`${message}: unexpected ${expected}`);
  }
}
