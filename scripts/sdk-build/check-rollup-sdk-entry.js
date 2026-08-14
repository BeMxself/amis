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
const {sdkRuntimeAssets} = require('./sdk-runtime-assets');

main().catch(error => {
  console.error(error);
  process.exitCode = 1;
});

async function main() {
  const {output} = await generateRollupSdkEntryOutput();

  const embeddedSdkJs = createSdkEntryWithEmbeddedResourceMap(output);
  const resourceMap = parseResourceMap(embeddedSdkJs);
  const emptyAssets = JSON.parse(findAsset(output, 'sdk-empty-assets.json').source);
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
    embeddedSdkJs.includes('/thirds/pdfjs-dist/build/pdf.worker.min.mjs'),
    'embedded sdk.js should rewrite pdf worker __uri() to the SDK thirds path'
  );
  assert(
    embeddedSdkJs.includes("return amis['sdk@") &&
      embeddedSdkJs.includes("BasePath'] + url.substring(1)"),
    'embedded sdk.js should rewrite SDK worker filterUrl() to use base path relative URLs'
  );
  assert(
    Object.keys(resourceMap.res).some(moduleId => moduleId === 'examples/embed.tsx'),
    'resource map should include examples/embed.tsx'
  );
  sdkRuntimeAssets.forEach(asset => {
    const resource = resourceMap.res[asset.moduleId];

    assert(
      resource && resource.type === 'js',
      `resource map should include runtime asset ${asset.moduleId}`
    );
    assert(
      resource.url && resource.url.endsWith('/' + asset.file),
      `resource map should point ${asset.moduleId} to ${asset.file}`
    );
  });
  assert(
    manifest.chunks.some(chunk => chunk.fileName === 'sdk.js'),
    'chunk manifest should include sdk.js'
  );
  assert(
    manifest.chunks.some(chunk => chunk.fileName === 'json-view.js'),
    'chunk manifest should include json-view.js'
  );
  assert(
    Array.isArray(emptyAssets.imports),
    'empty asset manifest should list stubbed asset imports'
  );
  assert(
    emptyAssets.imports.length === 0,
    `Rollup SDK entry should not silently stub asset imports: ${emptyAssets.imports.join(', ')}`
  );
  assertNoDanglingFisAsyncCommonjsRequire(output);
  assertRuntimeImportShape(output);
  await assertRuntimeEntry(embeddedSdkJs, output);

  console.log(
    `Rollup SDK entry OK: ${countChunks(output)} chunks, ${Object.keys(resourceMap.res).length} resources.`
  );
}

function assertNoDanglingFisAsyncCommonjsRequire(output) {
  const danglingChunks = output
    .filter(item => item.type === 'chunk')
    .filter(chunk =>
      /new Promise\(function\(fullfill\)\s*\{\s*[\w$]+\.commonjsRequire\(\[/m.test(
        chunk.code
      )
    )
    .map(chunk => chunk.fileName);

  assert(
    danglingChunks.length === 0,
    `Rollup SDK entry has hanging FIS async require wrappers: ${danglingChunks.join(
      ', '
    )}`
  );
}

function assertRuntimeImportShape(output) {
  const chunkNames = new Set(
    output.filter(item => item.type === 'chunk').map(chunk => chunk.fileName)
  );
  const videoChunk = findChunk(output, 'Video.js');
  const monacoLoaderChunk = output.find(
    item =>
      item.type === 'chunk' &&
      Object.keys(item.modules || {}).some(moduleId =>
        moduleId.endsWith('/examples/loadMonacoEditor.ts')
      )
  );

  ['hls.js', 'mpegts.js'].forEach(moduleId => {
    assert(
      videoChunk.dynamicImports.includes(moduleId),
      `Video.js should lazy-load ${moduleId} through the SDK runtime resource map`
    );
    assert(
      !chunkNames.has(moduleId),
      `Rollup SDK entry should not bundle ${moduleId}; it should use thirds runtime assets`
    );
  });

  assert(
    monacoLoaderChunk,
    'Rollup SDK entry should resolve monaco-editor to examples/loadMonacoEditor.ts'
  );
  assert(
    !hasModule(output, '/node_modules/monaco-editor/'),
    'Rollup SDK entry should not bundle monaco-editor directly'
  );
}

function hasModule(output, needle) {
  return output.some(
    item =>
      item.type === 'chunk' &&
      Object.keys(item.modules || {}).some(moduleId => moduleId.includes(needle))
  );
}

async function assertRuntimeEntry(embeddedSdkJs, output) {
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
  installChunkLoader(window, output);

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

  const entryModule = window.amisRequire(sdkEntryAliases[0]);
  entryModule.embed(
    '#root',
    {type: 'page', title: 'Smoke', body: 'Hello Rollup SDK'},
    {},
    {fetcher: () => Promise.resolve({status: 0, data: {}})}
  );
  await waitFor(
    window,
    () => window.document.querySelector('#root').textContent.includes('Hello Rollup SDK'),
    'embedded sdk.js should render a lazy page renderer at runtime'
  );
}

function installChunkLoader(window, output) {
  const chunksByFileName = new Map(
    output
      .filter(item => item.type === 'chunk')
      .map(chunk => [chunk.fileName, chunk.code])
  );
  const originalAppendChild = window.document.head.appendChild.bind(
    window.document.head
  );

  window.document.head.appendChild = node => {
    if (!node || node.tagName !== 'SCRIPT') {
      return originalAppendChild(node);
    }

    const fileName = new URL(node.src).pathname.split('/').pop();
    const code = chunksByFileName.get(fileName);

    if (!code) {
      window.setTimeout(
        () => node.onerror && node.onerror(new Error(`missing chunk ${fileName}`)),
        0
      );
      return node;
    }

    window.setTimeout(() => {
      try {
        window.eval(code);
        node.onload && node.onload();
      } catch (error) {
        node.onerror && node.onerror(error);
      }
    }, 0);
    return node;
  };
}

async function waitFor(window, predicate, message) {
  const startedAt = Date.now();

  while (Date.now() - startedAt < 1500) {
    if (predicate()) {
      return;
    }
    await new Promise(resolve => window.setTimeout(resolve, 25));
  }

  throw new Error(message);
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
