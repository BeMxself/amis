#!/usr/bin/env node

const path = require('path');
const {rollup} = require('rollup');
const commonjs = require('@rollup/plugin-commonjs');
const json = require('@rollup/plugin-json');
const resolve = require('@rollup/plugin-node-resolve').default;
const swc = require('@swc/core');
const {parseResourceMap} = require('./sdk-contract');
const {createSdkManualChunks} = require('./rollup-sdk-manual-chunks');
const {sdkChunkManifestPlugin} = require('./rollup-sdk-chunk-manifest');
const {sdkResourceMapPlugin} = require('./rollup-sdk-resource-map-plugin');

const repoRoot = path.resolve(__dirname, '../..');
const entry = path.join(repoRoot, 'examples/embed.tsx');
const expectedUnresolvedImports = new Set([
  'rc-resize-observer',
  'tinymce/plugins/template'
]);

main().catch(error => {
  console.error(error);
  process.exitCode = 1;
});

async function main() {
  const bundle = await rollup({
    input: entry,
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
      sdkResourceMapPlugin({fileName: 'resource-map.js'})
    ],
    onwarn(warning, warn) {
      if (isExpectedSdkEntryWarning(warning)) {
        return;
      }

      warn(warning);
    }
  });

  const {output} = await generateBundle(bundle);

  const resourceMap = parseResourceMap(findAsset(output, 'resource-map.js').source);
  const manifest = JSON.parse(findAsset(output, 'sdk-chunk-manifest.json').source);
  const entryChunk = findChunk(output, 'sdk.js');

  assert(entryChunk.isEntry, 'sdk.js should be the Rollup entry chunk');
  assert(
    Object.keys(resourceMap.res).some(moduleId => moduleId === 'examples/embed.tsx'),
    'resource map should include examples/embed.tsx'
  );
  assert(
    manifest.chunks.some(chunk => chunk.fileName === 'sdk.js'),
    'chunk manifest should include sdk.js'
  );

  console.log(
    `Rollup SDK entry OK: ${countChunks(output)} chunks, ${Object.keys(resourceMap.res).length} resources.`
  );
}

async function generateBundle(bundle) {
  try {
    return await bundle.generate({
      format: 'amd',
      entryFileNames: 'sdk.js',
      chunkFileNames: '[name].js',
      manualChunks: createSdkManualChunks()
    });
  } finally {
    await bundle.close();
  }
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
