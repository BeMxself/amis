#!/usr/bin/env node

const {JSDOM} = require('jsdom');
const {parseResourceMap} = require('./sdk-contract');
const {
  countChunks,
  createSdkEntryWithEmbeddedResourceMap,
  findAsset,
  findChunk,
  generateRollupSdkEntryOutput,
  sdkEntryAliases,
  sdkEntryModuleId
} = require('./rollup-sdk-entry-build');

main().catch(error => {
  console.error(error);
  process.exitCode = 1;
});

async function main() {
  const {output} = await generateRollupSdkEntryOutput();

  const embeddedSdkJs = createSdkEntryWithEmbeddedResourceMap(output);
  const resourceMap = parseResourceMap(embeddedSdkJs);
  const manifest = JSON.parse(findAsset(output, 'sdk-chunk-manifest.json').source);
  const entryChunk = findChunk(output, 'sdk.js');

  assert(entryChunk.isEntry, 'sdk.js should be the Rollup entry chunk');
  assert(
    embeddedSdkJs.includes('amis.require.resourceMap('),
    'embedded sdk.js should include resource map'
  );
  assert(
    embeddedSdkJs.includes('amis.require = require'),
    'embedded sdk.js should include amis loader'
  );
  assert(
    embeddedSdkJs.includes('var originalDefine = amis && amis.define'),
    'embedded sdk.js should include Rollup AMD bridge'
  );
  assert(
    embeddedSdkJs.includes(`amis.define('${sdkEntryModuleId}'`),
    'embedded sdk.js should register the Rollup entry with amis.define'
  );
  assert(
    embeddedSdkJs.includes('window.amisRequire = require'),
    'embedded sdk.js should expose amisRequire'
  );
  sdkEntryAliases.forEach(alias => {
    assert(
      embeddedSdkJs.includes(
        `aliasMapping[${JSON.stringify(alias)}] = ${JSON.stringify(
          sdkEntryModuleId
        )}`
      ),
      `embedded sdk.js should alias ${alias} to the Rollup entry`
    );
  });
  assert(
    embeddedSdkJs.includes("amis['sdk@"),
    'embedded sdk.js should include SDK base path expression'
  );
  assert(
    Object.keys(resourceMap.res).some(moduleId => moduleId === 'examples/embed.tsx'),
    'resource map should include examples/embed.tsx'
  );
  assert(
    manifest.chunks.some(chunk => chunk.fileName === 'sdk.js'),
    'chunk manifest should include sdk.js'
  );
  assertRuntimeEntry(embeddedSdkJs);

  console.log(
    `Rollup SDK entry OK: ${countChunks(output)} chunks, ${Object.keys(resourceMap.res).length} resources.`
  );
}

function assertRuntimeEntry(embeddedSdkJs) {
  const dom = new JSDOM(
    '<!doctype html><html><head></head><body><div id="root"></div></body></html>',
    {
      url: 'https://example.test/page.html',
      runScripts: 'outside-only',
      pretendToBeVisual: true
    }
  );
  const {window} = dom;

  Object.defineProperty(window.document, 'currentScript', {
    configurable: true,
    value: {src: 'https://cdn.example.test/sdk/sdk.js'}
  });
  installBrowserTestShims(window);

  window.eval(embeddedSdkJs);

  assert(
    typeof window.amisRequire === 'function',
    'embedded sdk.js should initialize window.amisRequire at runtime'
  );
  sdkEntryAliases.forEach(alias => {
    const entryModule = window.amisRequire(alias);

    assert(
      entryModule && typeof entryModule.embed === 'function',
      `amisRequire(${JSON.stringify(alias)}) should expose embed()`
    );
  });
}

function installBrowserTestShims(window) {
  window.process = window.process || {env: {NODE_ENV: 'test'}};
  window.matchMedia =
    window.matchMedia ||
    function () {
      return {
        matches: false,
        addListener() {},
        removeListener() {},
        addEventListener() {},
        removeEventListener() {},
        dispatchEvent() {
          return false;
        }
      };
    };
  window.ResizeObserver =
    window.ResizeObserver ||
    class {
      observe() {}
      unobserve() {}
      disconnect() {}
    };
  window.IntersectionObserver =
    window.IntersectionObserver ||
    class {
      observe() {}
      unobserve() {}
      disconnect() {}
    };
  window.requestAnimationFrame =
    window.requestAnimationFrame ||
    (callback => window.setTimeout(callback, 16));
  window.cancelAnimationFrame =
    window.cancelAnimationFrame || (handle => window.clearTimeout(handle));
}

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}
