#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const {
  getExpectedChunkFiles,
  getExpectedSdkFiles,
  parseResourceMap,
  sdkCssFiles,
  sdkStaticFiles
} = require('./sdk-contract');

const repoRoot = path.resolve(__dirname, '../..');
const args = process.argv.slice(2);
const sdkDir = path.resolve(
  repoRoot,
  readOption('--sdk-dir') || 'packages/amis/sdk'
);

const errors = [];
const warnings = [];

const expectedChunkFiles = getExpectedChunkFiles(sdkDir);
const expectedFiles = getExpectedSdkFiles(sdkDir);
const sdkScopedCssFiles = ['sdk.css', 'ang.css', 'dark.css', 'antd.css'];

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
