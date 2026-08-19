#!/usr/bin/env node

const {JSDOM} = require('jsdom');
const {getSdkRuntimeAssets, parseResourceMap} = require('./sdk-contract');
const {
  countChunks,
  createSdkEntryWithEmbeddedResourceMap,
  findAsset,
  findChunk,
  generateRollupSdkEntryOutput,
  sdkEntryAliases,
  sdkEntryModuleId
} = require('./rollup-sdk-entry-build');
const sdkRuntimeAssets = getSdkRuntimeAssets();
const pdfjsRuntimeModuleId = 'node_modules/pdfjs-dist/build/pdf.mjs';

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
    embeddedSdkJs.includes(`amis.define('${sdkEntryModuleId}'`) ||
      embeddedSdkJs.includes(`amis.define("${sdkEntryModuleId}"`),
    'embedded sdk.js should register the Rollup entry with amis.define'
  );
  assert(
    embeddedSdkJs.includes('window.amisRequire = require'),
    'embedded sdk.js should expose amisRequire'
  );
  assert(
    !embeddedSdkJs.includes('process.env.NODE_ENV'),
    'embedded sdk.js should inline process.env.NODE_ENV for browsers'
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
    /amis\[["']sdk@[^"']+BasePath["']\]\+\w+\.substring\(1\)/.test(
      embeddedSdkJs
    ),
    'embedded sdk.js should rewrite SDK worker filterUrl() to use base path relative URLs'
  );
  assert(
    Object.keys(resourceMap.res).some(moduleId => moduleId === 'examples/embed.tsx'),
    'resource map should include examples/embed.tsx'
  );
  assertNoCommonjsVirtualResourceIds(resourceMap);
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
  assertResourceMapModuleDependsOn(
    resourceMap,
    'pdf-viewer',
    pdfjsRuntimeModuleId
  );
  assert(
    manifest.chunks.some(chunk => chunk.fileName === 'sdk.js'),
    'chunk manifest should include sdk.js'
  );
  assert(
    manifest.chunks.some(chunk => chunk.fileName === 'json-view.js'),
    'chunk manifest should include json-view.js'
  );
  assert(
    manifest.chunks.some(chunk => chunk.fileName === 'rest.js'),
    'chunk manifest should include rest.js'
  );
  assert(
    manifest.missingRequiredChunks.length === 0,
    `chunk manifest should not miss required chunks: ${manifest.missingRequiredChunks.join(', ')}`
  );
  assert(
    manifest.unexpectedChunks.length === 0,
    `chunk manifest should not leave chunks outside the planned SDK chunks: ${manifest.unexpectedChunks.join(', ')}`
  );
  assert(
    !manifest.chunks.some(chunk => chunk.fileName === 'Alert.js'),
    'dynamic renderer chunks should be packed into rest.js'
  );
  assert(
    /amis\.define\(["']Alert["']/.test(findChunk(output, 'rest.js').code),
    'rest.js should contain packed dynamic renderer AMD definitions'
  );
  assert(
    callsDefineBatchInOrder(findChunk(output, 'rest.js').code),
    'rest.js should register every packed module before waking pending renders'
  );
  assertResourceMapModuleUsesFile(resourceMap, 'Alert', 'rest.js');
  assertResourceMapModuleUsesFile(resourceMap, 'Video', 'rest.js');
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
  const videoChunk = findChunkWithModule(
    output,
    '/packages/amis/lib/renderers/Video.js'
  );
  const pdfViewerChunk = findChunkWithModule(
    output,
    '/packages/amis-ui/lib/components/PdfViewer.js'
  );
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
  assert(
    !hasModule(output, '/node_modules/hls-video-element/'),
    'Rollup SDK entry should use the existing hls.js runtime instead of bundling react-player HLS provider'
  );
  assert(
    pdfViewerChunk.imports.includes('node_modules/pdfjs-dist/build/pdf.mjs'),
    'PdfViewer should load pdfjs-dist through the SDK runtime asset'
  );
  assert(
    !hasModule(output, '/node_modules/pdfjs-dist/'),
    'Rollup SDK pdf-viewer chunk should not bundle pdfjs-dist directly'
  );
  assertChartBundleShape(output);
}

function assertChartBundleShape(output) {
  assert(
    !hasModule(output, '/node_modules/echarts/dist/'),
    'Rollup SDK charts chunk should resolve echarts through the ESM entry instead of bundling echarts/dist'
  );
  assert(
    !hasModule(output, '/node_modules/echarts-wordcloud/dist/echarts-wordcloud'),
    'Rollup SDK charts chunk should use echarts-wordcloud source modules instead of the UMD dist bundle'
  );
  assert(
    hasModule(output, '/node_modules/echarts/index.js'),
    'Rollup SDK charts chunk should include the echarts ESM entry'
  );
  assert(
    hasModule(output, '/node_modules/echarts-wordcloud/src/wordCloud.js'),
    'Rollup SDK charts chunk should include the echarts-wordcloud source entry'
  );
}

function hasModule(output, needle) {
  return output.some(
    item =>
      item.type === 'chunk' &&
      Object.keys(item.modules || {}).some(moduleId => moduleId.includes(needle))
  );
}

function findChunkWithModule(output, needle) {
  const chunk = output.find(
    item =>
      item.type === 'chunk' &&
      Object.keys(item.modules || {}).some(moduleId => moduleId.includes(needle))
  );

  assert(chunk, `Rollup SDK entry should include module ${needle}`);
  return chunk;
}

function assertResourceMapModuleUsesFile(resourceMap, moduleId, fileName) {
  const resource = resourceMap.res[moduleId];

  assert(resource, `resource map should include ${moduleId}`);
  assert(resource.pkg, `resource map entry ${moduleId} should use a package`);

  const pkg = resourceMap.pkg[resource.pkg];

  assert(pkg, `resource map package ${resource.pkg} should exist`);
  assert(
    pkg.url && pkg.url.endsWith('/' + fileName),
    `resource map entry ${moduleId} should point to ${fileName}`
  );
}

function assertResourceMapModuleDependsOn(resourceMap, moduleId, dependencyId) {
  const resource = resourceMap.res[moduleId];

  assert(resource, `resource map should include ${moduleId}`);
  assert(
    Array.isArray(resource.deps) && resource.deps.includes(dependencyId),
    `resource map entry ${moduleId} should depend on ${dependencyId}`
  );
}

function assertNoCommonjsVirtualResourceIds(resourceMap) {
  const virtualIds = Object.keys(resourceMap.res || {}).filter(
    moduleId =>
      moduleId === 'commonjsHelpers.js' || moduleId.includes('?commonjs-')
  );

  assert(
    virtualIds.length === 0,
    `resource map should not expose CommonJS virtual modules: ${virtualIds
      .slice(0, 5)
      .join(', ')}`
  );
}

function callsDefineBatchInOrder(code) {
  const begin = code.indexOf('amis.require.beginDefineBatch()');
  const end = code.indexOf('amis.require.endDefineBatch()');

  return begin !== -1 && end !== -1 && begin < end;
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
  const runtimeErrors = collectRuntimeErrors(window);

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
    {
      type: 'page',
      title: 'Supplier directory',
      body: [
        {
          type: 'form',
          body: [
            {
              type: 'select',
              name: 'status',
              label: 'Supplier status',
              options: ['Active', 'Review']
            }
          ]
        },
        {
          type: 'table',
          source: '${suppliers}',
          columns: [{name: 'company', label: 'Company'}]
        },
        {
          type: 'button',
          label: 'Show toast',
          onEvent: {
            click: {
              actions: [
                {
                  actionType: 'toast',
                  args: {
                    msgType: 'success',
                    msg: 'SDK toast rendered'
                  }
                }
              ]
            }
          }
        },
        {
          type: 'chart',
          height: 240,
          config: {
            animation: false,
            xAxis: {type: 'category', data: ['Q1']},
            yAxis: {type: 'value'},
            series: [{type: 'bar', data: [12]}]
          }
        }
      ]
    },
    {data: {suppliers: [{company: 'Prism Labs'}]}},
    {fetcher: () => Promise.resolve({status: 0, data: {}})}
  );
  try {
    await waitFor(
      window,
      () =>
        window.document
          .querySelector('#root')
          .textContent.includes('Prism Labs'),
        'embedded sdk.js should render nested lazy form and table renderers at runtime'
    );
  } catch (error) {
    throw new Error(
      `${error.message}; runtime errors: ${runtimeErrors
        .map(formatRuntimeError)
        .join(' | ')}; loaded chunks: ${JSON.stringify(
        window.__sdkLoadedChunks || []
      )}; missing chunks: ${JSON.stringify(
        window.__sdkMissingChunks || []
      )}; chunk errors: ${JSON.stringify(
        window.__sdkChunkErrors || []
      )}; root html: ${window.document
        .querySelector('#root')
        .innerHTML.slice(0, 500)}`
    );
  }
  const toastButton = Array.from(window.document.querySelectorAll('button')).find(
    button => button.textContent.includes('Show toast')
  );

  assert(toastButton, 'embedded sdk.js should render a toast action button');
  toastButton.dispatchEvent(
    new window.MouseEvent('click', {bubbles: true, cancelable: true})
  );
  await waitFor(
    window,
    () => window.document.body.textContent.includes('SDK toast rendered'),
    'embedded sdk.js should render toast actions through the SDK ToastComponent'
  );
  try {
    await waitFor(
      window,
      () => {
        const chart = window.document.querySelector('[class*="-Chart-content"]');

        return (
          chart &&
          window.echarts &&
          typeof window.echarts.getInstanceByDom === 'function' &&
          window.echarts.getInstanceByDom(chart)
        );
      },
      'embedded sdk.js should initialize a chart renderer through the charts chunk'
    );
  } catch (error) {
    throw new Error(
      `${error.message}; runtime errors: ${runtimeErrors
        .map(formatRuntimeError)
        .join(' | ')}; chart debug: ${JSON.stringify(
        getChartRuntimeDebug(window)
      )}; root html: ${window.document
        .querySelector('#root')
        .innerHTML.slice(0, 500)}`
    );
  }
  await assertPdfViewerRuntimeChunk(window, runtimeErrors);
}

async function assertPdfViewerRuntimeChunk(window, runtimeErrors) {
  let pdfViewerModule;
  let loadError;

  window.amisRequire.async(
    'pdf-viewer',
    module => {
      pdfViewerModule = module;
    },
    error => {
      loadError = error;
    }
  );
  await waitFor(
    window,
    () => pdfViewerModule || loadError,
    'embedded sdk.js should lazy-load pdf-viewer with the PDF runtime asset'
  );

  if (loadError) {
    throw new Error(
      `pdf-viewer lazy load failed: ${formatRuntimeError(
        loadError
      )}; runtime errors: ${runtimeErrors.map(formatRuntimeError).join(' | ')}`
    );
  }

  assert(
    pdfViewerModule && pdfViewerModule.PdfViewer,
    'pdf-viewer chunk should expose PdfViewer after loading the PDF runtime asset'
  );
  assert(
    (window.__sdkLoadedRuntimeAssets || []).some(item => item.fileName === 'pdf.js'),
    'pdf-viewer lazy load should request thirds/pdfjs-dist/build/pdf.js'
  );
}

function installChunkLoader(window, output) {
  window.__sdkLoadedChunks = [];
  window.__sdkLoadedRuntimeAssets = [];
  window.__sdkMissingChunks = [];
  window.__sdkChunkErrors = [];
  const chunksByFileName = new Map(
    output
      .filter(item => item.type === 'chunk')
      .map(chunk => [chunk.fileName, chunk.code])
  );
  const runtimeAssetsByFileName = new Map([
    ['pdf.js', createPdfJsRuntimeStub()]
  ]);
  const originalAppendChild = window.document.head.appendChild.bind(
    window.document.head
  );

  window.document.head.appendChild = node => {
    if (!node || node.tagName !== 'SCRIPT') {
      return originalAppendChild(node);
    }

    const fileName = new URL(node.src).pathname.split('/').pop();
    const code = chunksByFileName.get(fileName);
    const runtimeCode = runtimeAssetsByFileName.get(fileName);

    if (!code && !runtimeCode) {
      window.__sdkMissingChunks.push({fileName, src: node.src});
      window.setTimeout(
        () => node.onerror && node.onerror(new Error(`missing chunk ${fileName}`)),
        0
      );
      return node;
    }

    window.__sdkLoadedChunks.push({fileName, src: node.src});
    window.setTimeout(() => {
      try {
        if (runtimeCode) {
          window.__sdkLoadedRuntimeAssets.push({fileName, src: node.src});
        }
        window.eval(code || runtimeCode);
        node.onload && node.onload();
        node.readyState = 'complete';
        node.onreadystatechange && node.onreadystatechange.call(node);
      } catch (error) {
        window.__sdkChunkErrors.push({fileName, error: formatRuntimeError(error)});
        node.onerror && node.onerror(error);
      }
    }, 0);
    return node;
  };
}

function createPdfJsRuntimeStub() {
  return `amis.define(${JSON.stringify(
    pdfjsRuntimeModuleId
  )}, function(require, exports, module) {
exports.GlobalWorkerOptions = {};
exports.AnnotationMode = {ENABLE: 1};
exports.PDFDataRangeTransport = function PDFDataRangeTransport() {};
exports.getDocument = function getDocument() {};
exports.version = 'test';
});`;
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

function collectRuntimeErrors(window) {
  const errors = [];

  window.addEventListener('error', event => {
    errors.push(event.error || event.message);
  });
  window.addEventListener('unhandledrejection', event => {
    errors.push(event.reason);
  });

  return errors;
}

function formatRuntimeError(error) {
  if (!error) {
    return 'unknown error';
  }

  return error.stack || error.message || String(error);
}

function getChartRuntimeDebug(window) {
  const chartNodes = Array.from(
    window.document.querySelectorAll('[class*="-Chart"]')
  );

  return {
    chartClasses: chartNodes.map(node => node.className).slice(0, 10),
    hasEcharts: Boolean(window.echarts),
    hasGetInstanceByDom: Boolean(window.echarts?.getInstanceByDom),
    requireCharts: tryRequireModule(window, 'charts'),
    requireBarcode: tryRequireModule(window, 'barcode'),
    loadedChunks: window.__sdkLoadedChunks || [],
    missingChunks: window.__sdkMissingChunks || [],
    chunkErrors: window.__sdkChunkErrors || [],
    scripts: Array.from(window.document.querySelectorAll('script'))
      .map(node => node.src)
      .slice(-10)
  };
}

function tryRequireModule(window, moduleId) {
  try {
    const mod = window.amisRequire && window.amisRequire(moduleId);

    return {
      ok: true,
      keys: mod && typeof mod === 'object' ? Object.keys(mod).slice(0, 20) : []
    };
  } catch (error) {
    return {
      ok: false,
      error: formatRuntimeError(error)
    };
  }
}

function installBrowserTestShims(window) {
  installCanvasTestShim(window);
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
      constructor(callback) {
        this.callback = callback;
      }
      observe(target) {
        this.callback(
          [{isIntersecting: true, intersectionRatio: 1, target}],
          this
        );
      }
      unobserve() {}
      disconnect() {}
    };
  window.requestAnimationFrame =
    window.requestAnimationFrame ||
    (callback => window.setTimeout(callback, 16));
  window.cancelAnimationFrame =
    window.cancelAnimationFrame || (handle => window.clearTimeout(handle));
}

function installCanvasTestShim(window) {
  if (!window.ImageData) {
    window.ImageData = class ImageData {
      constructor(dataOrWidth, width, height) {
        if (typeof dataOrWidth === 'number') {
          this.width = dataOrWidth;
          this.height = width;
          this.data = new Uint8ClampedArray(this.width * this.height * 4);
        } else {
          this.data = dataOrWidth;
          this.width = width;
          this.height = height;
        }
      }
    };
  }

  window.HTMLCanvasElement.prototype.getContext = function getContext(type) {
    if (type !== '2d') {
      return null;
    }

    const canvas = this;
    const gradient = {addColorStop() {}};
    const context = {
      canvas,
      measureText(text) {
        return {width: String(text || '').length * 8};
      },
      createImageData(sourceOrWidth, height) {
        if (typeof sourceOrWidth === 'object') {
          return new window.ImageData(
            sourceOrWidth.width,
            sourceOrWidth.height
          );
        }

        return new window.ImageData(sourceOrWidth || 1, height || 1);
      },
      getImageData(x, y, width, height) {
        return new window.ImageData(width || 1, height || 1);
      },
      putImageData() {},
      createLinearGradient() {
        return gradient;
      },
      createRadialGradient() {
        return gradient;
      },
      createPattern() {
        return null;
      },
      getLineDash() {
        return [];
      },
      setLineDash() {},
      setTransform() {},
      resetTransform() {},
      getTransform() {
        return {a: 1, b: 0, c: 0, d: 1, e: 0, f: 0};
      },
      save() {},
      restore() {},
      scale() {},
      rotate() {},
      translate() {},
      beginPath() {},
      closePath() {},
      moveTo() {},
      lineTo() {},
      bezierCurveTo() {},
      quadraticCurveTo() {},
      arc() {},
      arcTo() {},
      ellipse() {},
      rect() {},
      fill() {},
      stroke() {},
      clip() {},
      clearRect() {},
      fillRect() {},
      strokeRect() {},
      fillText() {},
      strokeText() {},
      drawImage() {},
      isPointInPath() {
        return false;
      },
      isPointInStroke() {
        return false;
      }
    };

    return context;
  };
  window.HTMLCanvasElement.prototype.toDataURL = function toDataURL() {
    return 'data:image/png;base64,';
  };
}

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}
