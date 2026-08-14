#!/usr/bin/env node

const {buildSdkThemeCss} = require('./build-sdk-theme-css');
const {reduceSdkCssCalc} = require('./reduce-sdk-css-calc');
const {rewriteSdkCssUrls} = require('./rewrite-sdk-css-urls');

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

const rewrittenUrls = rewriteSdkCssUrls(
  [
    '@font-face {',
    '  src: url("../webfonts/fa-solid-900.woff2") format("woff2"),',
    '    url(../webfonts/fa-solid-900.ttf) format("truetype"),',
    '    url(data:font/woff2;base64,abc) format("woff2"),',
    '    url("https://example.com/font.woff2") format("woff2");',
    '}'
  ].join('\n'),
  {from: '@fortawesome/fontawesome-free/css/all.css'}
);

assertContains(
  rewrittenUrls,
  'url("./thirds/@fortawesome/fontawesome-free/webfonts/fa-solid-900.woff2")',
  'relative package CSS URLs should be rewritten into SDK thirds'
);
assertContains(
  rewrittenUrls,
  'url(./thirds/@fortawesome/fontawesome-free/webfonts/fa-solid-900.ttf)',
  'unquoted relative package CSS URLs should preserve quote style'
);
assertContains(
  rewrittenUrls,
  'url(data:font/woff2;base64,abc)',
  'data URLs should stay inline'
);
assertContains(
  rewrittenUrls,
  'url("https://example.com/font.woff2")',
  'absolute URLs should stay absolute'
);

[
  ['calc(10px)', '10px'],
  ['calc(-1px)', '-1px'],
  ['calc(4px - 1px)', '3px'],
  ['calc(100% - (2 * 5px))', 'calc(100% - 10px)'],
  ['calc(50% - (40px / 2))', 'calc(50% - 20px)'],
  [
    'pop calc(0.55s + 0.20s * (4)) linear infinite',
    'pop 1.35s linear infinite'
  ],
  ['calc(100% / 3)', '33.3333333333%'],
  ['calc(100% - px2rem(20px))', 'calc(100% - px2rem(20px))'],
  [
    '.x{content:"calc(10px)";width:calc(4px - 1px);/* calc(1px) */}',
    '.x{content:"calc(10px)";width:3px;/* calc(1px) */}'
  ]
].forEach(([source, expected]) => {
  assertEqual(reduceSdkCssCalc(source), expected, 'calc arithmetic reduction');
});

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
