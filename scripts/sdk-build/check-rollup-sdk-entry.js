#!/usr/bin/env node

const {parseResourceMap} = require('./sdk-contract');
const {
  countChunks,
  findAsset,
  findChunk,
  generateRollupSdkEntryOutput
} = require('./rollup-sdk-entry-build');

main().catch(error => {
  console.error(error);
  process.exitCode = 1;
});

async function main() {
  const {output} = await generateRollupSdkEntryOutput();

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

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}
