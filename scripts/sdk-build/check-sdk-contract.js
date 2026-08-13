#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const {
  sdkChunkPlan,
  sdkCssFiles,
  sdkStaticFiles
} = require('./chunk-plan');

const repoRoot = path.resolve(__dirname, '../..');
const args = process.argv.slice(2);
const sdkDir = path.resolve(
  repoRoot,
  readOption('--sdk-dir') || 'packages/amis/sdk'
);

const errors = [];
const warnings = [];

const expectedChunkFiles = Object.keys(sdkChunkPlan.chunks);
const optionalChunkFiles = new Set(sdkChunkPlan.optionalChunks || []);
const expectedFiles = [
  ...expectedChunkFiles.filter(file => !optionalChunkFiles.has(file)),
  ...sdkCssFiles,
  ...sdkStaticFiles
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

function assertResourceMap(sdkJs) {
  const resourceMap = parseResourceMap(sdkJs);
  if (!resourceMap) {
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
    if (optionalChunkFiles.has(file) && !fs.existsSync(sdkPath(file))) {
      continue;
    }

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

function parseResourceMap(sdkJs) {
  const marker = 'amis.require.resourceMap(';
  const markerIndex = sdkJs.indexOf(marker);
  if (markerIndex === -1) {
    fail('Cannot find amis.require.resourceMap(...) in sdk.js.');
    return null;
  }

  const objectStart = sdkJs.indexOf('{', markerIndex + marker.length);
  if (objectStart === -1) {
    fail('Cannot find resource map object literal in sdk.js.');
    return null;
  }

  const objectEnd = findBalancedObjectEnd(sdkJs, objectStart);
  if (objectEnd === -1) {
    fail('Cannot parse resource map object literal in sdk.js.');
    return null;
  }

  const expression = sdkJs.slice(objectStart, objectEnd + 1);
  try {
    const amis = new Proxy(
      {},
      {
        get() {
          return '/__AMIS_SDK_BASE__';
        }
      }
    );

    return new Function('d', 'amis', `return (${expression});`)(
      '/__AMIS_SDK_BASE__',
      amis
    );
  } catch (error) {
    fail(`Cannot evaluate SDK resource map object: ${error.message}`);
    return null;
  }
}

function findBalancedObjectEnd(source, start) {
  let depth = 0;
  let quote = '';
  let escaped = false;

  for (let index = start; index < source.length; index++) {
    const char = source[index];

    if (quote) {
      if (escaped) {
        escaped = false;
      } else if (char === '\\') {
        escaped = true;
      } else if (char === quote) {
        quote = '';
      }
      continue;
    }

    if (char === '"' || char === "'" || char === '`') {
      quote = char;
      continue;
    }

    if (char === '{') {
      depth++;
    } else if (char === '}') {
      depth--;
      if (depth === 0) {
        return index;
      }
    }
  }

  return -1;
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
