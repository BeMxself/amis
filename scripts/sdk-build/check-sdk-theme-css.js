#!/usr/bin/env node

const {buildSdkThemeCss} = require('./build-sdk-theme-css');

const themeCss = buildSdkThemeCss([
  {name: 'ang.scss', content: '.AngOnly { color: red; }'},
  {name: 'cxd.scss', content: '.CxdOnly { color: blue; }'},
  {name: 'dark.scss', content: '.DarkOnly { color: black; }'},
  {name: 'antd.scss', content: '.AntdOnly { color: green; }'},
  {
    name: 'shared.scss',
    content: [
      'body { margin: 0; }',
      'html.app { height: 100%; }',
      ':root { --sdk-color: red; }',
      '@keyframes fade { from { opacity: 0; } to { opacity: 1; } }',
      '.fr-box { color: black; }',
      '.tox-menu { color: black; }',
      '.monaco-editor { color: black; }',
      '.Button, .Alert:hover { color: red; }'
    ].join('\n')
  }
]);

const byTheme = Object.fromEntries(themeCss.map(item => [item.theme, item]));

assertEqual(themeCss.length, 4, 'should emit one CSS file per SDK theme');
assertEqual(byTheme.ang.filename, 'ang.css', 'ang theme filename');
assertEqual(byTheme.cxd.filename, 'sdk.css', 'cxd theme filename');
assertEqual(byTheme.dark.filename, 'dark.css', 'dark theme filename');
assertEqual(byTheme.antd.filename, 'antd.css', 'antd theme filename');

assertContains(byTheme.cxd.content, '.amis-scope .CxdOnly', 'cxd theme CSS');
assertNotContains(byTheme.cxd.content, 'AngOnly', 'cxd should exclude ang CSS');
assertNotContains(byTheme.cxd.content, 'DarkOnly', 'cxd should exclude dark CSS');
assertNotContains(byTheme.cxd.content, 'AntdOnly', 'cxd should exclude antd CSS');

assertContains(byTheme.ang.content, '.amis-scope .AngOnly', 'ang theme CSS');
assertNotContains(byTheme.ang.content, 'CxdOnly', 'ang should exclude cxd CSS');

assertContains(
  byTheme.cxd.content,
  '.amis-scope .Button, .amis-scope .Alert:hover',
  'regular selectors should receive SDK scope'
);
assertContains(
  byTheme.cxd.content,
  '.amis-scope { margin: 0; }',
  'body selectors should be rewritten to the SDK scope root'
);
assertContains(
  byTheme.cxd.content,
  '.amis-scope.app { height: 100%; }',
  'html selectors should preserve suffixes on the SDK scope root'
);
assertContains(
  byTheme.cxd.content,
  ':root { --sdk-color: red; }',
  ':root should stay global'
);
assertContains(
  byTheme.cxd.content,
  '@keyframes fade { from { opacity: 0; } to { opacity: 1; } }',
  'keyframe steps should not be scoped'
);
assertContains(
  byTheme.cxd.content,
  '.fr-box { color: black; }',
  'Froala selectors should not be scoped'
);
assertContains(
  byTheme.cxd.content,
  '.tox-menu { color: black; }',
  'TinyMCE selectors should not be scoped'
);
assertContains(
  byTheme.cxd.content,
  '.monaco-editor { color: black; }',
  'Monaco selectors should not be scoped'
);

console.log(`SDK theme CSS OK: ${themeCss.length} themes checked.`);

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
