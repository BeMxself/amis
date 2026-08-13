#!/usr/bin/env node

const path = require('path');
const {rollup} = require('rollup');
const {parseResourceMap} = require('./sdk-contract');
const {createSdkManualChunks} = require('./rollup-sdk-manual-chunks');
const {sdkChunkManifestPlugin} = require('./rollup-sdk-chunk-manifest');
const {sdkResourceMapPlugin} = require('./rollup-sdk-resource-map-plugin');

const repoRoot = path.resolve(__dirname, '../..');

main().catch(error => {
  console.error(error);
  process.exitCode = 1;
});

async function main() {
  const manualChunks = createSdkManualChunks();

  assertManualChunk(manualChunks, 'node_modules/echarts/core.js', 'charts');
  assertManualChunk(manualChunks, 'node_modules/zrender/lib/core.js', 'charts');
  assertManualChunk(
    manualChunks,
    'node_modules/froala-editor/js/froala_editor.pkgd.js',
    'rich-text'
  );
  assertManualChunk(manualChunks, 'node_modules/tinymce/tinymce.js', 'tinymce');
  assertManualChunk(
    manualChunks,
    'packages/amis-ui/lib/components/Markdown.js',
    'markdown'
  );
  assertManualChunk(
    manualChunks,
    'packages/amis-ui/src/components/Markdown.tsx',
    'markdown'
  );
  assertManualChunk(
    manualChunks,
    'packages/amis/src/components/BarCode.tsx',
    'barcode'
  );
  assertManualChunk(manualChunks, 'node_modules/react/index.js', undefined);

  const bundle = await rollup({
    input: 'virtual:entry',
    plugins: [
      virtualModules({
        'virtual:entry': `
          import {message} from 'virtual:shared';
          import {chart} from 'echarts/core';
          import {Markdown} from 'amis-ui/lib/components/Markdown.js';
          console.log(message);
          console.log(chart, Markdown);
          import('virtual:lazy').then(mod => console.log(mod.lazy));
        `,
        'virtual:shared': `export const message = 'hello';`,
        'virtual:lazy': `export const lazy = 'later';`,
        'echarts/core': {
          id: path.join(repoRoot, 'node_modules/echarts/core.js'),
          code: `export const chart = 'chart';`
        },
        'amis-ui/lib/components/Markdown.js': {
          id: path.join(
            repoRoot,
            'packages/amis-ui/lib/components/Markdown.js'
          ),
          code: `export const Markdown = 'markdown';`
        }
      }),
      sdkChunkManifestPlugin({fileName: 'sdk-chunk-manifest.json'}),
      sdkResourceMapPlugin({fileName: 'resource-map.js'})
    ]
  });

  const {output} = await bundle.generate({
    format: 'amd',
    entryFileNames: 'sdk.js',
    chunkFileNames: '[name].js',
    manualChunks
  });
  await bundle.close();

  const resourceMapAsset = findAsset(output, 'resource-map.js');
  const chunkManifestAsset = findAsset(output, 'sdk-chunk-manifest.json');
  const resourceMap = parseResourceMap(resourceMapAsset.source);
  const chunkManifest = JSON.parse(chunkManifestAsset.source);

  assert(resourceMap.pkg.p0, 'resource map should include first package');
  assert(
    Object.keys(resourceMap.res).some(moduleId => moduleId.includes('virtual:entry')),
    'resource map should include virtual entry module'
  );
  assert(
    chunkManifest.chunks.some(chunk => chunk.fileName === 'sdk.js'),
    'chunk manifest should include sdk.js'
  );
  assert(
    chunkManifest.chunks.some(chunk => chunk.fileName === 'charts.js'),
    'manualChunks should emit charts.js'
  );
  assert(
    chunkManifest.chunks.some(chunk => chunk.fileName === 'markdown.js'),
    'manualChunks should emit markdown.js'
  );

  console.log(
    `Rollup SDK plugins OK: ${Object.keys(resourceMap.pkg).length} packages, ${chunkManifest.chunks.length} chunks.`
  );
}

function virtualModules(modules) {
  const resolvedByImportId = new Map(
    Object.entries(modules).map(([importId, module]) => [
      importId,
      normalizeVirtualModule(importId, module)
    ])
  );
  const codeByResolvedId = new Map(
    Array.from(resolvedByImportId.values()).map(module => [
      module.id,
      module.code
    ])
  );

  return {
    name: 'sdk-build-virtual-modules',
    resolveId(id) {
      if (resolvedByImportId.has(id)) {
        return resolvedByImportId.get(id).id;
      }

      return codeByResolvedId.has(id) ? id : null;
    },
    load(id) {
      return codeByResolvedId.get(id) || null;
    }
  };
}

function normalizeVirtualModule(importId, module) {
  if (typeof module === 'string') {
    return {
      id: importId,
      code: module
    };
  }

  return module;
}

function assertManualChunk(manualChunks, relativeId, expectedChunk) {
  const actualChunk = manualChunks(path.join(repoRoot, relativeId));

  assert(
    actualChunk === expectedChunk,
    `${relativeId} should map to ${expectedChunk || 'no manual chunk'}, got ${
      actualChunk || 'no manual chunk'
    }`
  );
}

function findAsset(output, fileName) {
  const asset = output.find(
    item => item.type === 'asset' && item.fileName === fileName
  );

  assert(asset, `missing emitted asset: ${fileName}`);
  return asset;
}

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}
