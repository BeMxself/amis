#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const {JSDOM} = require('jsdom');
const {version} = require('../../packages/amis/package.json');
const {
  getExpectedChunkFiles,
  getExpectedSdkFiles,
  parseResourceMap,
  sdkCssFiles,
  sdkStaticFiles
} = require('./sdk-contract');
const {sdkRuntimeAssets} = require('./sdk-runtime-assets');

const repoRoot = path.resolve(__dirname, '../..');
const args = process.argv.slice(2);
const sdkDir = path.resolve(
  repoRoot,
  readOption('--sdk-dir') || 'packages/amis/sdk'
);
const baselineSdkDir = path.join(repoRoot, 'packages/amis/sdk');

const errors = [];
const warnings = [];

const expectedChunkFiles = getExpectedChunkFiles(sdkDir);
const expectedFiles = getExpectedSdkFiles(sdkDir);
const sdkScopedCssFiles = ['sdk.css', 'ang.css', 'dark.css', 'antd.css'];
const rollupEntryExactBaselineFiles = [
  'iconfont.css',
  'iconfont.eot',
  'iconfont.svg',
  'iconfont.ttf',
  'iconfont.woff',
  'locale/de-DE.js',
  'thirds/moment-timezone/data/packed/latest.json',
  'thirds/pdfjs-dist/build/pdf.worker.min.mjs'
];

if (!fs.existsSync(sdkDir)) {
  fail(
    `SDK directory does not exist: ${sdkDir}. Run \`npm run build --workspace amis\` first.`
  );
  reportAndExit();
}

for (const file of expectedFiles) {
  assertNonEmptyFile(file);
}

const sdkJs = readSdkText('sdk.js');
if (sdkJs) {
  assertContains(sdkJs, 'amis.require.resourceMap(', 'sdk.js resource map');
  assertContains(sdkJs, "sdk@", 'sdk.js versioned base path marker');
  assertResourceMap(sdkJs);
}

assertRollupEntryStaticAssets();

for (const cssFile of ['sdk.css', 'ang.css', 'dark.css', 'antd.css']) {
  const css = readSdkText(cssFile);
  if (css) {
    assertContains(css, '.amis-scope', `${cssFile} scoped selector prefix`);
  }
}

reportAndExit();

function readOption(name) {
  const index = args.indexOf(name);
  if (index === -1) {
    return undefined;
  }

  return args[index + 1];
}

function sdkPath(file) {
  return path.join(sdkDir, file);
}

function assertNonEmptyFile(file) {
  const fullPath = sdkPath(file);
  if (!fs.existsSync(fullPath)) {
    fail(`Missing SDK artifact: ${file}`);
    return;
  }

  const stat = fs.statSync(fullPath);
  if (!stat.isFile()) {
    fail(`SDK artifact is not a file: ${file}`);
  } else if (stat.size === 0) {
    fail(`SDK artifact is empty: ${file}`);
  }
}

function readSdkText(file) {
  const fullPath = sdkPath(file);
  if (!fs.existsSync(fullPath)) {
    return '';
  }

  return fs.readFileSync(fullPath, 'utf8');
}

function assertContains(contents, needle, label) {
  if (!contents.includes(needle)) {
    fail(`Missing ${label}: ${needle}`);
  }
}

function assertNoPreprocessorExpressions(contents, label) {
  if (/(?:\$[a-z0-9_-]+|px2rem\()/i.test(contents)) {
    fail(`${label} contains unresolved Sass expression.`);
  }
}

function assertSameTextFile(left, right) {
  const leftText = readSdkText(left);
  const rightText = readSdkText(right);

  if (leftText && rightText && leftText !== rightText) {
    fail(`${right} does not match ${left}.`);
  }
}

function assertResourceMap(sdkJs) {
  let resourceMap;

  try {
    resourceMap = parseResourceMap(sdkJs);
  } catch (error) {
    fail(error.message);
    return;
  }

  const res = resourceMap.res || {};
  const pkg = resourceMap.pkg || {};
  const packageUrls = Object.values(pkg).map(item => item && item.url);
  const resourceUrls = Object.values(res).map(item => item && item.url);

  if (!Object.keys(res).length) {
    fail('SDK resource map has no res entries.');
  }

  if (!Object.keys(pkg).length) {
    fail('SDK resource map has no pkg entries.');
  }

  for (const file of expectedChunkFiles) {
    if (!packageUrls.some(url => typeof url === 'string' && url.endsWith('/' + file))) {
      fail(`SDK resource map does not reference chunk package: ${file}`);
    }
  }

  for (const file of ['thirds/hls.js/hls.js', 'thirds/mpegts.js/mpegts.js']) {
    if (!resourceUrls.some(url => typeof url === 'string' && url.endsWith('/' + file))) {
      fail(`SDK resource map does not reference external runtime file: ${file}`);
    }
  }

  const nonJsPackages = Object.entries(pkg).filter(
    ([, item]) => !item || item.type !== 'js'
  );
  if (nonJsPackages.length) {
    fail(`SDK resource map has non-js package entries: ${nonJsPackages.length}`);
  }

  console.log(
    `SDK resource map: ${Object.keys(res).length} resources, ${Object.keys(pkg).length} packages.`
  );
}

function assertRollupEntryStaticAssets() {
  const manifestFile = sdkPath('sdk-next-manifest.json');

  if (!fs.existsSync(manifestFile)) {
    return;
  }

  const manifest = JSON.parse(fs.readFileSync(manifestFile, 'utf8'));

  if (!manifest.rollupEntry) {
    return;
  }

  if (!Array.isArray(manifest.rollupEntry.emptyAssetImports)) {
    fail('Rollup entry manifest does not list empty asset imports.');
  } else if (manifest.rollupEntry.emptyAssetImports.length) {
    fail(
      `Rollup entry has stubbed asset imports: ${manifest.rollupEntry.emptyAssetImports.join(
        ', '
      )}`
    );
  }

  const staticFiles = new Set(manifest.rollupEntry.staticFiles || []);
  const cssFiles = new Set(manifest.rollupEntry.cssFiles || []);

  sdkCssFiles.forEach(file => {
    if (!cssFiles.has(file)) {
      fail(`Rollup entry manifest does not list CSS asset: ${file}`);
    }

    assertNonEmptyFile(`rollup-entry/${file}`);
    assertNoPreprocessorExpressions(
      readSdkText(`rollup-entry/${file}`),
      `rollup-entry/${file}`
    );
  });

  sdkScopedCssFiles.forEach(file => {
    const css = readSdkText(`rollup-entry/${file}`);

    if (css) {
      assertContains(
        css,
        '.amis-scope',
        `rollup-entry/${file} scoped selector prefix`
      );
      assertNoPreprocessorExpressions(css, `rollup-entry/${file}`);
    }
  });

  assertSameTextFile('rollup-entry/sdk.css', 'rollup-entry/cxd.css');
  assertSameTextFile('rollup-entry/sdk-ie11.css', 'rollup-entry/cxd-ie11.css');

  sdkStaticFiles.forEach(file => {
    if (!staticFiles.has(file)) {
      fail(`Rollup entry manifest does not list static asset: ${file}`);
    }

    assertNonEmptyFile(`rollup-entry/${file}`);
  });

  staticFiles.forEach(file => {
    assertNonEmptyFile(`rollup-entry/${file}`);
  });

  assertSameDirectoryFileList(
    path.join(baselineSdkDir, 'thirds'),
    sdkPath('rollup-entry/thirds'),
    'rollup-entry/thirds'
  );

  rollupEntryExactBaselineFiles.forEach(assertSameRollupEntryBaselineFile);
  assertRollupEntryRuntimeAssets();
  assertRollupEntryRuntimeSmoke();
  assertRollupEntryLazyRuntimeImports();
}

function assertRollupEntryRuntimeAssets() {
  let resourceMap;

  try {
    resourceMap = parseResourceMap(readSdkText('rollup-entry/sdk.js'));
  } catch (error) {
    fail(`Cannot parse rollup-entry/sdk.js resource map: ${error.message}`);
    return;
  }

  sdkRuntimeAssets.forEach(asset => {
    const resource = (resourceMap.res || {})[asset.moduleId];

    if (!resource || resource.type !== 'js') {
      fail(`Rollup entry resource map does not list runtime asset: ${asset.moduleId}`);
      return;
    }

    if (typeof resource.url !== 'string' || !resource.url.endsWith('/' + asset.file)) {
      fail(`Rollup entry runtime asset has unexpected URL: ${asset.moduleId}`);
    }

    assertRollupEntryRuntimeModule(asset);
  });
}

function assertRollupEntryRuntimeModule(asset) {
  const file = `rollup-entry/${asset.file}`;
  const contents = readSdkText(file);

  assertContains(
    contents,
    `amis.define(${JSON.stringify(asset.moduleId)}`,
    `${file} module id`
  );

  if (asset.moduleId === 'hls.js') {
    assertContains(contents, 'isSupported', `${file} HLS API marker`);
  } else if (asset.moduleId === 'mpegts.js') {
    assertContains(contents, 'createPlayer', `${file} mpegts API marker`);
  } else if (asset.moduleId === 'node_modules/pdfjs-dist/build/pdf.mjs') {
    assertContains(contents, 'exports.getDocument', `${file} pdfjs API marker`);
  }
}

function assertRollupEntryRuntimeSmoke() {
  const dom = new JSDOM(
    '<!doctype html><html><head></head><body></body></html>',
    {
      url: 'https://example.test/page.html',
      runScripts: 'outside-only'
    }
  );
  const {window} = dom;

  Object.defineProperty(window.document, 'currentScript', {
    configurable: true,
    value: {src: 'https://cdn.example.test/sdk/sdk.js'}
  });

  try {
    window.eval(createSdkLoaderSource());
    sdkRuntimeAssets.forEach(asset => {
      window.eval(readSdkText(`rollup-entry/${asset.file}`));
    });

    const hls = window.amis.require('hls.js');
    const mpegts = window.amis.require('mpegts.js');
    const pdfjs = window.amis.require('node_modules/pdfjs-dist/build/pdf.mjs');

    if (typeof hls !== 'function' || typeof hls.isSupported !== 'function') {
      fail('rollup-entry hls.js runtime API is not loadable.');
    }

    if (!mpegts || typeof mpegts.createPlayer !== 'function') {
      fail('rollup-entry mpegts.js runtime API is not loadable.');
    }

    if (!pdfjs || typeof pdfjs.getDocument !== 'function' || !pdfjs.version) {
      fail('rollup-entry pdfjs runtime API is not loadable.');
    }
  } catch (error) {
    fail(`Rollup entry runtime smoke failed: ${error.message}`);
  }
}

function assertRollupEntryLazyRuntimeImports() {
  const danglingFiles = listFiles(sdkPath('rollup-entry'))
    .filter(file => file.endsWith('.js') && !file.startsWith('thirds/'))
    .filter(file =>
      /new Promise\(function\(fullfill\)\s*\{\s*[\w$]+\.commonjsRequire\(\[/m.test(
        readSdkText(`rollup-entry/${file}`)
      )
    );

  if (danglingFiles.length) {
    fail(
      `Rollup entry has hanging FIS async require wrappers: ${formatFileList(
        danglingFiles
      )}`
    );
  }

  if (fs.existsSync(sdkPath('rollup-entry/hls.js'))) {
    fail('Rollup entry should not bundle hls.js; use thirds/hls.js/hls.js.');
  }

  if (fs.existsSync(sdkPath('rollup-entry/mpegts.js'))) {
    fail(
      'Rollup entry should not bundle mpegts.js; use thirds/mpegts.js/mpegts.js.'
    );
  }

  assertContains(
    readSdkText(
      findRollupEntryFileContaining(
        "require(['mpegts.js']",
        'mpegts runtime import'
      )
    ),
    "require(['mpegts.js']",
    'Rollup entry mpegts runtime import'
  );
  assertContains(
    readSdkText(
      findRollupEntryFileContaining("require(['hls.js']", 'hls runtime import')
    ),
    "require(['hls.js']",
    'Rollup entry hls runtime import'
  );
  assertContains(
    readSdkText(
      findRollupEntryFileContaining(
        "require(['./loadMonacoEditor']",
        'Monaco SDK loader import'
      )
    ),
    "require(['./loadMonacoEditor']",
    'Rollup entry Monaco SDK loader import'
  );
  assertRollupEntryResourcePackage(
    'loadMonacoEditor',
    'rest.js',
    'Monaco SDK loader chunk'
  );
}

function findRollupEntryFileContaining(needle, label) {
  const file = listFiles(sdkPath('rollup-entry'))
    .filter(item => item.endsWith('.js') && !item.startsWith('thirds/'))
    .find(item => readSdkText(`rollup-entry/${item}`).includes(needle));

  if (!file) {
    fail(`Missing Rollup entry ${label}: ${needle}`);
    return 'rollup-entry/sdk.js';
  }

  return `rollup-entry/${file}`;
}

function assertRollupEntryResourcePackage(moduleId, fileName, label) {
  let resourceMap;

  try {
    resourceMap = parseResourceMap(readSdkText('rollup-entry/sdk.js'));
  } catch (error) {
    fail(`Cannot parse rollup-entry/sdk.js resource map: ${error.message}`);
    return;
  }

  const resource = (resourceMap.res || {})[moduleId];
  const pkg = resource && resource.pkg && (resourceMap.pkg || {})[resource.pkg];

  if (!pkg || typeof pkg.url !== 'string' || !pkg.url.endsWith('/' + fileName)) {
    fail(`${label} should be packaged in ${fileName}.`);
  }
}

function createSdkLoaderSource() {
  return fs
    .readFileSync(path.join(repoRoot, 'examples/mod.js'), 'utf8')
    .replace(/@@version/g, `@${version}`)
    .replace(/@version/g, version);
}

function assertSameDirectoryFileList(leftDir, rightDir, label) {
  if (!fs.existsSync(leftDir)) {
    fail(`Missing SDK baseline directory for ${label}: ${leftDir}`);
    return;
  }

  if (!fs.existsSync(rightDir)) {
    fail(`Missing SDK artifact directory: ${label}`);
    return;
  }

  const leftFiles = listFiles(leftDir).sort();
  const rightFiles = listFiles(rightDir).sort();
  const missing = leftFiles.filter(file => !rightFiles.includes(file));
  const extra = rightFiles.filter(file => !leftFiles.includes(file));

  if (missing.length) {
    fail(`${label} is missing baseline files: ${formatFileList(missing)}`);
  }

  if (extra.length) {
    fail(`${label} has extra files: ${formatFileList(extra)}`);
  }
}

function assertSameRollupEntryBaselineFile(file) {
  const baselineFile = path.join(baselineSdkDir, file);
  const rollupEntryFile = sdkPath(`rollup-entry/${file}`);

  if (!fs.existsSync(baselineFile) || !fs.existsSync(rollupEntryFile)) {
    return;
  }

  if (!fs.readFileSync(baselineFile).equals(fs.readFileSync(rollupEntryFile))) {
    fail(`rollup-entry/${file} does not match SDK baseline.`);
  }
}

function listFiles(dir, prefix = '') {
  return fs.readdirSync(path.join(dir, prefix), {withFileTypes: true}).flatMap(
    entry => {
      const file = path.join(prefix, entry.name);

      if (entry.isDirectory()) {
        return listFiles(dir, file);
      }

      if (entry.isFile()) {
        return file.split(path.sep).join('/');
      }

      return [];
    }
  );
}

function formatFileList(files) {
  return files.slice(0, 10).join(', ') + (files.length > 10 ? ', ...' : '');
}

function fail(message) {
  errors.push(message);
}

function reportAndExit() {
  for (const warning of warnings) {
    console.warn(`warning: ${warning}`);
  }

  if (errors.length) {
    console.error('SDK contract check failed:');
    for (const error of errors) {
      console.error(`- ${error}`);
    }
    process.exit(1);
  }

  console.log(`SDK contract OK: ${expectedFiles.length} expected files checked.`);
}
