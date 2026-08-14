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
const {sdkFisDirectivePlugin} = require('./rollup-fis-directives');
const {sdkChunkManifestPlugin} = require('./rollup-sdk-chunk-manifest');
const {sdkResourceMapPlugin} = require('./rollup-sdk-resource-map-plugin');
const {getSdkRuntimeResourceEntries} = require('./sdk-runtime-assets');

const repoRoot = path.resolve(__dirname, '../..');
const defaultEntry = path.join(repoRoot, 'examples/embed.tsx');
const sdkEntryModuleId = 'sdk';
const sdkEntryAliases = ['amis/embed', `amis@${version}/embed`];
const sdkBasePathExpression = `amis['sdk@${version}BasePath']`;
const expectedUnresolvedImports = new Set([
  'rc-resize-observer',
  'tinymce/plugins/template'
]);

async function generateRollupSdkEntryOutput(options) {
  options = options || {};
  assertFreshWorkspaceLibs();

  const bundle = await rollup({
    input: options.entry || defaultEntry,
    plugins: [
      resolveWorkspaceLibImports(),
      emptyAssetImports({fileName: 'sdk-empty-assets.json'}),
      transformSdkEntryTypescript(),
      sdkFisDirectivePlugin({basePathExpression: sdkBasePathExpression}),
      json(),
      resolve({
        browser: true,
        extensions: ['.mjs', '.js', '.jsx', '.json', '.ts', '.tsx']
      }),
      transformFisAsyncCommonjsRequire(),
      commonjs({
        sourceMap: false,
        transformMixedEsModules: true
      }),
      sdkChunkManifestPlugin({fileName: 'sdk-chunk-manifest.json'}),
      sdkResourceMapPlugin({
        basePathExpression: sdkBasePathExpression,
        externalResources: getSdkRuntimeResourceEntries(sdkBasePathExpression),
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
        autoId: true
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
  const embeddedChunks = collectStaticChunkDependencies(output, entryChunk);
  const parts = [
    createSdkLoaderSource(),
    createRollupAmdBridgeSource(),
    createSdkEntryAliasSource(),
    ...embeddedChunks.map(chunk => chunk.code),
    resourceMapAsset.source
  ];

  return prepareSdkJs(parts.join('\n;\n') + '\n');
}

function collectStaticChunkDependencies(output, entryChunk) {
  const chunksByFileName = new Map(
    output
      .filter(item => item.type === 'chunk')
      .map(chunk => [chunk.fileName, chunk])
  );
  const visited = new Set();
  const chunks = [];

  visit(entryChunk.fileName);
  return chunks;

  function visit(fileName) {
    if (visited.has(fileName)) {
      return;
    }
    visited.add(fileName);

    const chunk = chunksByFileName.get(fileName);
    assert(chunk, `missing emitted chunk: ${fileName}`);
    chunk.imports.forEach(visit);
    chunks.push(chunk);
  }
}

function createSdkLoaderSource() {
  const source = fs.readFileSync(path.join(repoRoot, 'examples/mod.js'), 'utf8');

  return source.replace(/@@version/g, `@${version}`).replace(/@version/g, version);
}

function assertFreshWorkspaceLibs() {
  const coreFactory = path.join(repoRoot, 'packages/amis-core/lib/factory.js');
  const uiMenu = path.join(
    repoRoot,
    'packages/amis-ui/lib/components/menu/index.js'
  );

  assert(
    fs.existsSync(coreFactory),
    'Rollup SDK entry requires packages/amis-core/lib. Run `npm run build --workspace packages/amis-core` first.'
  );

  const source = fs.readFileSync(coreFactory, 'utf8');
  assert(
    source.includes('config.getComponent'),
    'Rollup SDK entry requires fresh packages/amis-core/lib with async renderer support. Run `npm run build --workspace packages/amis-core` first.'
  );

  assert(
    fs.existsSync(uiMenu),
    'Rollup SDK entry requires packages/amis-ui/lib. Run `npm run build --workspace packages/amis-ui` first.'
  );

  const uiMenuSource = fs.readFileSync(uiMenu, 'utf8');
  assert(
    uiMenuSource.includes("require('@rc-component/menu')"),
    'Rollup SDK entry requires fresh packages/amis-ui/lib after the @rc-component/menu migration. Run `npm run build --workspace packages/amis-ui` first.'
  );
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
      var scopedRequire = createScopedRequire(id, require);
      var args = deps.map(function (dep) {
        if (dep === 'exports') {
          return exports;
        }

        if (dep === 'module') {
          return module;
        }

        if (dep === 'require') {
          return scopedRequire;
        }

        return scopedRequire(dep);
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

  function createScopedRequire(moduleId, require) {
    function scopedRequire(dep) {
      if (dep && dep.splice) {
        var args = Array.prototype.slice.call(arguments);
        args[0] = dep.map(function (item) {
          return resolveAmdDependency(moduleId, item);
        });
        return require.apply(this, args);
      }

      return require(resolveAmdDependency(moduleId, dep));
    }

    scopedRequire.async = function (names, onload, onerror) {
      if (typeof names === 'string') {
        names = resolveAmdDependency(moduleId, names);
      } else if (names && names.splice) {
        names = names.map(function (item) {
          return resolveAmdDependency(moduleId, item);
        });
      }

      return require.async(names, onload, onerror);
    };
    scopedRequire.ensure = function (names, callback) {
      return scopedRequire.async(names, function () {
        callback && callback.call(this, scopedRequire);
      });
    };

    return scopedRequire;
  }

  function resolveAmdDependency(moduleId, dep) {
    if (typeof dep !== 'string') {
      return dep;
    }

    if (dep.charAt(0) !== '.') {
      return dep;
    }

    var parts = moduleId.split('/');
    parts.pop();
    dep.split('/').forEach(function (part) {
      if (!part || part === '.') {
        return;
      }

      if (part === '..') {
        parts.pop();
      } else {
        parts.push(part);
      }
    });

    return parts.join('/');
  }
})();`;
}

function createSdkEntryAliasSource() {
  const assignments = sdkEntryAliases
    .map(
      alias =>
        `  aliasMapping[${JSON.stringify(alias)}] = ${JSON.stringify(
          sdkEntryModuleId
        )};`
    )
    .join('\n');

  return `
(function () {
  var require = window.amis && window.amis.require;

  if (!require) {
    throw new Error('amis SDK loader is not initialized.');
  }

  var aliasMapping = require.aliasMapping || (require.aliasMapping = {});
  // Rollup currently emits one AMD entry module, so only expose aliases backed by that module.
${assignments}
  window.amisRequire = require;
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

function transformFisAsyncCommonjsRequire() {
  return {
    name: 'sdk-fis-async-commonjs-require',
    load(id) {
      if (!isFisAsyncCommonjsModule(id)) {
        return null;
      }

      return rewriteFisAsyncCommonjsRequire(fs.readFileSync(id, 'utf8'));
    },
    transform(code, id) {
      if (!code.includes('fullfill(tslib.__importStar(mod))')) {
        return null;
      }

      const transformed = rewriteFisAsyncCommonjsRequire(code);

      return transformed === code ? null : {code: transformed, map: null};
    }
  };
}

function isFisAsyncCommonjsModule(id) {
  return id.split(path.sep).join('/').endsWith('/packages/amis/lib/minimal.js');
}

function rewriteFisAsyncCommonjsRequire(code) {
  const asyncRequirePattern = /return Promise\.resolve\(\)\.then\(function\(\) \{return new Promise\(function\(fullfill\) \{require\(\[['"]([^'"]+)['"],\s*['"]tslib['"]\], function\(mod, tslib\) \{fullfill\(tslib\.__importStar\(mod\)\)\}\)\}\)\}\)/g;

  return code.replace(
    asyncRequirePattern,
    (_, moduleId) => `return import(${JSON.stringify(moduleId)})`
  );
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

function emptyAssetImports(options) {
  options = options || {};

  const assetNamespace = '\0sdk-empty-asset:';
  const imports = new Set();

  return {
    name: 'sdk-empty-asset-imports',
    resolveId(id) {
      if (!isAssetImport(id)) {
        return null;
      }

      imports.add(id);
      return assetNamespace + id;
    },
    load(id) {
      return id.startsWith(assetNamespace) ? 'export default "";' : null;
    },
    generateBundle() {
      this.emitFile({
        type: 'asset',
        fileName: options.fileName || 'sdk-empty-assets.json',
        source: JSON.stringify(
          {
            imports: Array.from(imports).sort()
          },
          null,
          2
        )
      });
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
  sdkEntryAliases,
  sdkEntryModuleId
};
