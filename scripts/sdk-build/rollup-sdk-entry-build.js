const path = require('path');
const fs = require('fs');
const {rollup} = require('rollup');
const commonjs = require('@rollup/plugin-commonjs');
const json = require('@rollup/plugin-json');
const resolve = require('@rollup/plugin-node-resolve').default;
const swc = require('@swc/core');
const {version} = require('../../packages/amis/package.json');
const {prepareSdkJs} = require('./prepare-sdk-js');
const {createSdkManualChunks} = require('./rollup-sdk-manual-chunks');
const {sdkChunkManifestPlugin} = require('./rollup-sdk-chunk-manifest');
const {sdkResourceMapPlugin} = require('./rollup-sdk-resource-map-plugin');

const repoRoot = path.resolve(__dirname, '../..');
const defaultEntry = path.join(repoRoot, 'examples/embed.tsx');
const sdkEntryModuleId = 'examples/embed.tsx';
const sdkBasePathExpression = `amis['sdk@${version}BasePath']`;
const expectedUnresolvedImports = new Set([
  'rc-resize-observer',
  'tinymce/plugins/template'
]);

async function generateRollupSdkEntryOutput(options) {
  options = options || {};

  const bundle = await rollup({
    input: options.entry || defaultEntry,
    plugins: [
      resolveWorkspaceLibImports(),
      emptyAssetImports(),
      transformSdkEntryTypescript(),
      json(),
      resolve({
        browser: true,
        extensions: ['.mjs', '.js', '.jsx', '.json', '.ts', '.tsx']
      }),
      commonjs({
        sourceMap: false,
        transformMixedEsModules: true
      }),
      sdkChunkManifestPlugin({fileName: 'sdk-chunk-manifest.json'}),
      sdkResourceMapPlugin({
        basePathExpression: sdkBasePathExpression,
        fileName: 'resource-map.js'
      })
    ],
    onwarn(warning, warn) {
      if (isExpectedSdkEntryWarning(warning)) {
        return;
      }

      warn(warning);
    }
  });

  try {
    return await bundle.generate({
      format: 'amd',
      entryFileNames: 'sdk.js',
      chunkFileNames: '[name].js',
      amd: {
        define: 'amis.define',
        id: sdkEntryModuleId
      },
      manualChunks: createSdkManualChunks()
    });
  } finally {
    await bundle.close();
  }
}

function createSdkEntryWithEmbeddedResourceMap(output) {
  const entryChunk = findChunk(output, 'sdk.js');
  const resourceMapAsset = findAsset(output, 'resource-map.js');
  const parts = [
    createSdkLoaderSource(),
    createRollupAmdBridgeSource(),
    entryChunk.code,
    resourceMapAsset.source
  ];

  return prepareSdkJs(parts.join('\n;\n') + '\n');
}

function createSdkLoaderSource() {
  const source = fs.readFileSync(path.join(repoRoot, 'examples/mod.js'), 'utf8');

  return source.replace(/@@version/g, `@${version}`).replace(/@version/g, version);
}

function createRollupAmdBridgeSource() {
  return `
(function () {
  var amis = window.amis;
  var originalDefine = amis && amis.define;

  if (!amis || !amis.require || !originalDefine) {
    throw new Error('amis SDK loader is not initialized.');
  }

  amis.define = function (id, deps, factory) {
    if (typeof id !== 'string' || !Array.isArray(deps)) {
      return originalDefine.apply(this, arguments);
    }

    return originalDefine(id, function (require, exports, module) {
      var args = deps.map(function (dep) {
        if (dep === 'exports') {
          return exports;
        }

        if (dep === 'module') {
          return module;
        }

        if (dep === 'require') {
          return require;
        }

        return require(dep);
      });
      var result = typeof factory === 'function'
        ? factory.apply(window, args)
        : factory;

      if (result !== undefined) {
        module.exports = result;
      }

      return module.exports;
    });
  };
})();`;
}

function transformSdkEntryTypescript() {
  return {
    name: 'sdk-entry-typescript',
    transform(code, id) {
      if (!/\.[cm]?[jt]sx?$/.test(id) || id.includes('/node_modules/')) {
        return null;
      }

      const isTypeScript = /\.[cm]?tsx?$/.test(id);
      const result = swc.transformSync(code, {
        filename: id,
        sourceMaps: false,
        jsc: {
          parser: {
            syntax: isTypeScript ? 'typescript' : 'ecmascript',
            tsx: id.endsWith('.tsx'),
            jsx: id.endsWith('.jsx'),
            dynamicImport: true
          },
          target: 'es2018',
          transform: {
            react: {
              runtime: 'classic'
            }
          }
        },
        module: {
          type: 'es6'
        }
      });

      return {
        code: result.code,
        map: null
      };
    }
  };
}

function resolveWorkspaceLibImports() {
  const packages = new Map([
    ['amis', 'packages/amis/lib'],
    ['amis-core', 'packages/amis-core/lib'],
    ['amis-formula', 'packages/amis-formula/lib'],
    ['amis-ui', 'packages/amis-ui/lib'],
    ['office-viewer', 'packages/office-viewer/lib']
  ]);

  return {
    name: 'sdk-workspace-lib-imports',
    resolveId(id) {
      for (const [packageName, libDir] of packages) {
        const resolved = resolveWorkspaceLibImport(id, packageName, libDir);

        if (resolved) {
          return resolved;
        }
      }

      return null;
    }
  };
}

function resolveWorkspaceLibImport(id, packageName, libDir) {
  if (id === packageName) {
    return path.join(repoRoot, libDir, 'index.js');
  }

  const libPrefix = `${packageName}/lib/`;
  if (!id.startsWith(libPrefix)) {
    return null;
  }

  const relativePath = id.slice(libPrefix.length);
  const file = path.join(repoRoot, libDir, relativePath);

  return path.extname(file) ? file : `${file}.js`;
}

function emptyAssetImports() {
  const assetNamespace = '\0sdk-empty-asset:';

  return {
    name: 'sdk-empty-asset-imports',
    resolveId(id) {
      return isAssetImport(id) ? assetNamespace + id : null;
    },
    load(id) {
      return id.startsWith(assetNamespace) ? 'export default "";' : null;
    }
  };
}

function isAssetImport(id) {
  return /\.(css|less|scss|sass|svg|png|jpe?g|gif|webp|woff2?|ttf|eot)$/i.test(
    id.split('?')[0]
  );
}

function isExpectedSdkEntryWarning(warning) {
  if (warning.code === 'UNRESOLVED_IMPORT') {
    return expectedUnresolvedImports.has(warning.source);
  }

  return [
    'CIRCULAR_DEPENDENCY',
    'EVAL',
    'MODULE_LEVEL_DIRECTIVE',
    'THIS_IS_UNDEFINED'
  ].includes(warning.code);
}

function findAsset(output, fileName) {
  const asset = output.find(
    item => item.type === 'asset' && item.fileName === fileName
  );

  assert(asset, `missing emitted asset: ${fileName}`);
  return asset;
}

function findChunk(output, fileName) {
  const chunk = output.find(
    item => item.type === 'chunk' && item.fileName === fileName
  );

  assert(chunk, `missing emitted chunk: ${fileName}`);
  return chunk;
}

function countChunks(output) {
  return output.filter(item => item.type === 'chunk').length;
}

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

module.exports = {
  countChunks,
  createSdkEntryWithEmbeddedResourceMap,
  defaultEntry,
  findAsset,
  findChunk,
  generateRollupSdkEntryOutput,
  sdkEntryModuleId
};
