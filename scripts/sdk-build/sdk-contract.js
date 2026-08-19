const fs = require('fs');
const path = require('path');
const {
  sdkChunkPlan,
  sdkCssFiles,
  sdkIe11CssFiles,
  sdkStaticFiles
} = require('./chunk-plan');
const {
  getSdkRuntimeResourceEntries,
  sdkRuntimeAssets
} = require('./sdk-runtime-assets');

const sdkScopedCssFiles = [
  'sdk.css',
  'cxd.css',
  'prismui.css',
  'ang.css',
  'dark.css',
  'antd.css'
];
const sdkResourceMapRuntimeFiles = [
  'thirds/hls.js/hls.js',
  'thirds/mpegts.js/mpegts.js'
];
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

function createSdkArtifactContract(sdkDir) {
  const chunkFiles = getExpectedChunkFiles(sdkDir);

  return {
    entry: sdkChunkPlan.entry,
    allChunkFiles: Object.keys(sdkChunkPlan.chunks),
    chunkFiles,
    cssFiles: [...sdkCssFiles],
    ie11CssFiles: [...sdkIe11CssFiles],
    scopedCssFiles: [...sdkScopedCssFiles],
    staticFiles: [...sdkStaticFiles],
    resourceMapRuntimeFiles: [...sdkResourceMapRuntimeFiles],
    runtimeAssets: getSdkRuntimeAssets(),
    rollupEntryExactBaselineFiles: [...rollupEntryExactBaselineFiles],
    expectedFiles: [
      ...chunkFiles,
      ...sdkCssFiles,
      ...sdkIe11CssFiles,
      ...sdkStaticFiles
    ]
  };
}

function getSdkRuntimeAssets() {
  return sdkRuntimeAssets.map(asset => ({...asset}));
}

function getExpectedChunkFiles(sdkDir) {
  const optionalChunks = new Set(sdkChunkPlan.optionalChunks || []);

  return Object.keys(sdkChunkPlan.chunks).filter(
    file => !optionalChunks.has(file) || fs.existsSync(path.join(sdkDir, file))
  );
}

function getExpectedSdkFiles(sdkDir) {
  return createSdkArtifactContract(sdkDir).expectedFiles;
}

function parseResourceMap(sdkJs) {
  const marker = 'amis.require.resourceMap(';
  const markerIndex = sdkJs.indexOf(marker);
  if (markerIndex === -1) {
    throw new Error('Cannot find amis.require.resourceMap(...) in sdk.js.');
  }

  const objectStart = sdkJs.indexOf('{', markerIndex + marker.length);
  if (objectStart === -1) {
    throw new Error('Cannot find resource map object literal in sdk.js.');
  }

  const objectEnd = findBalancedObjectEnd(sdkJs, objectStart);
  if (objectEnd === -1) {
    throw new Error('Cannot parse resource map object literal in sdk.js.');
  }

  const expression = sdkJs.slice(objectStart, objectEnd + 1);
  const amis = new Proxy(
    {},
    {
      get() {
        return '/__AMIS_SDK_BASE__';
      }
    }
  );

  try {
    return new Function('d', 'amis', `return (${expression});`)(
      '/__AMIS_SDK_BASE__',
      amis
    );
  } catch (error) {
    throw new Error(`Cannot evaluate SDK resource map object: ${error.message}`);
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

module.exports = {
  createSdkArtifactContract,
  getExpectedChunkFiles,
  getExpectedSdkFiles,
  getSdkRuntimeAssets,
  getSdkRuntimeResourceEntries,
  parseResourceMap,
  sdkChunkPlan,
  sdkCssFiles,
  sdkIe11CssFiles,
  sdkStaticFiles
};
