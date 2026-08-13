#!/usr/bin/env node

const {rollup} = require('rollup');
const {parseResourceMap} = require('./sdk-contract');
const {sdkChunkManifestPlugin} = require('./rollup-sdk-chunk-manifest');
const {sdkResourceMapPlugin} = require('./rollup-sdk-resource-map-plugin');

main().catch(error => {
  console.error(error);
  process.exitCode = 1;
});

async function main() {
  const bundle = await rollup({
    input: 'virtual:entry',
    plugins: [
      virtualModules({
        'virtual:entry': `
          import {message} from 'virtual:shared';
          console.log(message);
          import('virtual:lazy').then(mod => console.log(mod.lazy));
        `,
        'virtual:shared': `export const message = 'hello';`,
        'virtual:lazy': `export const lazy = 'later';`
      }),
      sdkChunkManifestPlugin({fileName: 'sdk-chunk-manifest.json'}),
      sdkResourceMapPlugin({fileName: 'resource-map.js'})
    ]
  });

  const {output} = await bundle.generate({
    format: 'amd',
    entryFileNames: 'sdk.js',
    chunkFileNames: '[name].js'
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

  console.log(
    `Rollup SDK plugins OK: ${Object.keys(resourceMap.pkg).length} packages, ${chunkManifest.chunks.length} chunks.`
  );
}

function virtualModules(modules) {
  return {
    name: 'sdk-build-virtual-modules',
    resolveId(id) {
      return Object.prototype.hasOwnProperty.call(modules, id) ? id : null;
    },
    load(id) {
      return modules[id] || null;
    }
  };
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
