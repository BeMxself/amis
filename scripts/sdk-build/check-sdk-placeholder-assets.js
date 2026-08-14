#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const {collectSdkPlaceholderAssets} = require('./collect-sdk-placeholder-assets');

const repoRoot = path.resolve(__dirname, '../..');
const placeholderFile = path.join(repoRoot, 'examples/sdk-placeholder.html');
const placeholderHtml = fs.readFileSync(placeholderFile, 'utf8');

const expectedCssAssets = [
  '@fortawesome/fontawesome-free/css/all.css',
  '@fortawesome/fontawesome-free/css/v4-shims.css',
  'amis-ui/scss/themes/ang.scss',
  'amis-ui/scss/themes/cxd.scss',
  'amis-ui/scss/themes/dark.scss',
  'amis-ui/scss/themes/antd.scss',
  'amis-ui/scss/helper.scss'
];
const expectedExternalScripts = ['./mod.js'];
const knownAssets = new Set(expectedCssAssets.concat(expectedExternalScripts));
const requestedAssets = [];
const skippedAssets = [];
const unresolvedAssets = [];

const sdkAssets = collectSdkPlaceholderAssets(placeholderHtml, {
  version: require('../../packages/amis/package.json').version,
  resolveFile: url => {
    requestedAssets.push(url);

    if (!knownAssets.has(url)) {
      unresolvedAssets.push(url);
      return undefined;
    }

    return createPlaceholderFile(url);
  },
  markFileSkipped: file => {
    skippedAssets.push(file.subpath);
  }
});

assertArrayEqual(
  requestedAssets,
  expectedCssAssets.concat(expectedExternalScripts),
  'placeholder external asset order'
);
assertArrayEqual(
  sdkAssets.cssContents.map(item => item.name),
  expectedCssAssets.map(file => path.basename(file)),
  'placeholder stylesheet asset order'
);
assertArrayEqual(
  skippedAssets,
  expectedCssAssets.concat(expectedExternalScripts).map(file => '/' + file),
  'placeholder skipped assets'
);
assertArrayEqual(unresolvedAssets, [], 'placeholder unresolved assets');

assertContains(
  sdkAssets.jsContents,
  'window.__sdkPlaceholderExternalScript = true;',
  'placeholder external script bundle'
);
assertContains(sdkAssets.entryJs, "__moduleId('./embed.tsx')", 'SDK entry module id');
assertContains(sdkAssets.entryJs, 'amis.resource', 'SDK resource bootstrap');
assertContains(sdkAssets.entryJs, '/* @require "./embed.tsx" */', 'SDK entry require');

console.log(
  `SDK placeholder assets OK: ${sdkAssets.cssContents.length} CSS assets, ${expectedExternalScripts.length} external script checked.`
);

function createPlaceholderFile(url) {
  return {
    basename: path.basename(url),
    subpath: '/' + url,
    getContent: () =>
      url === './mod.js'
        ? 'window.__sdkPlaceholderExternalScript = true;'
        : `/* ${url} */`
  };
}

function assertArrayEqual(actual, expected, message) {
  assertEqual(
    JSON.stringify(actual),
    JSON.stringify(expected),
    `${message}: expected ${JSON.stringify(expected)}, got ${JSON.stringify(
      actual
    )}`
  );
}

function assertContains(contents, expected, message) {
  if (!contents.includes(expected)) {
    throw new Error(`${message}: missing ${expected}`);
  }
}

function assertEqual(actual, expected, message) {
  if (actual !== expected) {
    throw new Error(message);
  }
}
