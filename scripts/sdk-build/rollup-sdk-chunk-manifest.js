const {sdkChunkPlan} = require('./sdk-contract');

function createSdkChunkManifest(bundle, options) {
  options = options || {};

  const expectedChunks = Object.keys(sdkChunkPlan.chunks).sort();
  const optionalChunks = new Set(sdkChunkPlan.optionalChunks || []);
  const chunks = getRollupChunks(bundle).map(chunk => ({
    fileName: chunk.fileName,
    name: chunk.name,
    isEntry: Boolean(chunk.isEntry),
    facadeModuleId: chunk.facadeModuleId || '',
    imports: [...(chunk.imports || [])].sort(),
    dynamicImports: [...(chunk.dynamicImports || [])].sort(),
    modules: Object.keys(chunk.modules || {}).sort(),
    expected: expectedChunks.includes(chunk.fileName)
  }));
  const emittedChunkNames = new Set(chunks.map(chunk => chunk.fileName));

  return {
    entry: sdkChunkPlan.entry,
    expectedChunks,
    optionalChunks: Array.from(optionalChunks).sort(),
    missingRequiredChunks: expectedChunks.filter(
      file => !optionalChunks.has(file) && !emittedChunkNames.has(file)
    ),
    missingOptionalChunks: expectedChunks.filter(
      file => optionalChunks.has(file) && !emittedChunkNames.has(file)
    ),
    unexpectedChunks: chunks
      .filter(chunk => !chunk.expected)
      .map(chunk => chunk.fileName)
      .sort(),
    chunks
  };
}

function sdkChunkManifestPlugin(options) {
  options = options || {};

  return {
    name: 'sdk-chunk-manifest',
    generateBundle(outputOptions, bundle) {
      const manifest = createSdkChunkManifest(bundle, options);

      if (options.strict && manifest.missingRequiredChunks.length) {
        throw new Error(
          `SDK Rollup output is missing required chunks:\n${manifest.missingRequiredChunks
            .map(file => `- ${file}`)
            .join('\n')}`
        );
      }

      this.emitFile({
        type: 'asset',
        fileName: options.fileName || 'sdk-chunk-manifest.json',
        source: JSON.stringify(manifest, null, 2) + '\n'
      });
    }
  };
}

function getRollupChunks(bundle) {
  return Object.values(bundle)
    .filter(item => item && item.type === 'chunk')
    .sort((left, right) => left.fileName.localeCompare(right.fileName));
}

module.exports = {
  createSdkChunkManifest,
  sdkChunkManifestPlugin
};
