#!/usr/bin/env node

const {parseResourceMap} = require('./sdk-contract');
const {
  countChunks,
  createSdkEntryWithEmbeddedResourceMap,
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

  console.log(
    `Rollup SDK entry OK: ${countChunks(output)} chunks, ${Object.keys(resourceMap.res).length} resources.`
  );
}

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}
