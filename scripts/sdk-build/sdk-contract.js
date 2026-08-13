const fs = require('fs');
const path = require('path');
const {
  sdkChunkPlan,
  sdkCssFiles,
  sdkStaticFiles
} = require('./chunk-plan');

function getExpectedChunkFiles(sdkDir) {
  const optionalChunks = new Set(sdkChunkPlan.optionalChunks || []);

  return Object.keys(sdkChunkPlan.chunks).filter(
    file => !optionalChunks.has(file) || fs.existsSync(path.join(sdkDir, file))
  );
}

function getExpectedSdkFiles(sdkDir) {
  return [...getExpectedChunkFiles(sdkDir), ...sdkCssFiles, ...sdkStaticFiles];
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
  getExpectedChunkFiles,
  getExpectedSdkFiles,
  parseResourceMap,
  sdkChunkPlan
};
