const {
  createRollupResourceMap,
  createResourceMapScript,
  normalizeChunkModuleId
} = require('./rollup-resource-map');
const {createSdkChunkManifest} = require('./rollup-sdk-chunk-manifest');
const {sdkChunkPlan} = require('./sdk-contract');

const defaultRestFileName = 'rest.js';
const defaultResourceMapFileName = 'resource-map.js';
const defaultChunkManifestFileName = 'sdk-chunk-manifest.json';

function finalizeRollupSdkOutput(output, options) {
  options = options || {};

  const restFileName = options.restFileName || defaultRestFileName;
  const restCandidates = getRestChunkCandidates(output, restFileName);
  const packedFileNames = new Set(
    restCandidates.map(chunk => chunk.fileName)
  );
  let packedOutput = output;

  if (restCandidates.length) {
    const restChunk = createRestChunk(
      restCandidates,
      packedFileNames,
      restFileName
    );

    packedOutput = output
      .filter(item => !isPackedChunk(item, packedFileNames))
      .map(item => remapPackedChunkImports(item, packedFileNames, restFileName));

    packedOutput.push(restChunk);
  }

  packedOutput = packEmbeddedEntryChunks(packedOutput);
  replaceGeneratedAssets(packedOutput, options, packedFileNames, restFileName);

  return packedOutput;
}

const packRollupSdkRestChunk = finalizeRollupSdkOutput;

function packEmbeddedEntryChunks(output) {
  const expectedChunks = new Set(Object.keys(sdkChunkPlan.chunks));
  const staticEntryChunks = getStaticEntryChunks(output);
  const embeddedFileNames = new Set(
    Array.from(staticEntryChunks).filter(
      fileName => fileName !== sdkChunkPlan.entry && !expectedChunks.has(fileName)
    )
  );

  if (!embeddedFileNames.size) {
    return output;
  }

  const chunksByFileName = new Map(
    output
      .filter(item => item.type === 'chunk')
      .map(chunk => [chunk.fileName, chunk])
  );
  const embeddedChunks = Array.from(embeddedFileNames).map(fileName => {
    const chunk = chunksByFileName.get(fileName);

    assert(chunk, `missing embedded entry chunk: ${fileName}`);
    return chunk;
  });

  return output
    .filter(item => !isPackedChunk(item, embeddedFileNames))
    .map(item =>
      item.type === 'chunk' && item.fileName === sdkChunkPlan.entry
        ? createEntryChunkWithEmbeddedChunks(item, embeddedChunks, embeddedFileNames)
        : remapPackedChunkImports(item, embeddedFileNames, sdkChunkPlan.entry)
    );
}

function createEntryChunkWithEmbeddedChunks(
  entryChunk,
  embeddedChunks,
  embeddedFileNames
) {
  const imports = new Set(entryChunk.imports || []);
  const dynamicImports = new Set(entryChunk.dynamicImports || []);

  embeddedFileNames.forEach(fileName => imports.delete(fileName));
  embeddedChunks.forEach(chunk => {
    (chunk.imports || []).forEach(fileName => {
      if (!embeddedFileNames.has(fileName)) {
        imports.add(fileName);
      }
    });
    (chunk.dynamicImports || []).forEach(fileName =>
      !embeddedFileNames.has(fileName) && dynamicImports.add(fileName)
    );
  });

  return {
    ...entryChunk,
    imports: Array.from(imports).sort(),
    dynamicImports: Array.from(dynamicImports).sort(),
    modules: Object.assign(
      {},
      ...embeddedChunks.map(chunk => chunk.modules || {}),
      entryChunk.modules || {}
    ),
    code:
      embeddedChunks.map(chunk => chunk.code.trim()).join('\n;\n') +
      '\n;\n' +
      entryChunk.code
  };
}

function getRestChunkCandidates(output, restFileName) {
  const expectedChunks = new Set(Object.keys(sdkChunkPlan.chunks));
  const staticEntryChunks = getStaticEntryChunks(output);

  return output.filter(
    item =>
      item.type === 'chunk' &&
      item.fileName !== restFileName &&
      !expectedChunks.has(item.fileName) &&
      !staticEntryChunks.has(item.fileName)
  );
}

function getStaticEntryChunks(output) {
  const chunksByFileName = new Map(
    output
      .filter(item => item.type === 'chunk')
      .map(chunk => [chunk.fileName, chunk])
  );
  const visited = new Set();

  visit(sdkChunkPlan.entry);
  return visited;

  function visit(fileName) {
    if (visited.has(fileName)) {
      return;
    }

    const chunk = chunksByFileName.get(fileName);

    if (!chunk) {
      return;
    }

    visited.add(fileName);
    (chunk.imports || []).forEach(visit);
  }
}

function createRestChunk(chunks, packedFileNames, restFileName) {
  const code = chunks.map(chunk => chunk.code.trim()).join('\n;\n');

  return {
    type: 'chunk',
    fileName: restFileName,
    name: restFileName.replace(/\.js$/, ''),
    isEntry: false,
    isDynamicEntry: true,
    facadeModuleId: '',
    imports: getPackedImports(chunks, packedFileNames, 'imports'),
    dynamicImports: getPackedImports(chunks, packedFileNames, 'dynamicImports'),
    modules: Object.assign({}, ...chunks.map(chunk => chunk.modules || {})),
    code: [
      'amis.require.beginDefineBatch();',
      'try {',
      code,
      '} finally {',
      '  amis.require.endDefineBatch();',
      '}',
      ''
    ].join('\n'),
    map: null
  };
}

function getPackedImports(chunks, packedFileNames, field) {
  const imports = new Set();

  chunks.forEach(chunk => {
    (chunk[field] || []).forEach(fileName => {
      if (!packedFileNames.has(fileName)) {
        imports.add(fileName);
      }
    });
  });

  return Array.from(imports).sort();
}

function isPackedChunk(item, packedFileNames) {
  return item.type === 'chunk' && packedFileNames.has(item.fileName);
}

function remapPackedChunkImports(item, packedFileNames, restFileName) {
  if (item.type !== 'chunk') {
    return item;
  }

  return {
    ...item,
    imports: remapFileNames(item.imports || [], packedFileNames, restFileName),
    dynamicImports: remapFileNames(
      item.dynamicImports || [],
      packedFileNames,
      restFileName
    )
  };
}

function remapFileNames(fileNames, packedFileNames, restFileName) {
  const remapped = fileNames.map(fileName =>
    packedFileNames.has(fileName) ? restFileName : fileName
  );

  return Array.from(new Set(remapped)).sort();
}

function replaceGeneratedAssets(output, options, packedFileNames, restFileName) {
  const resourceMapFileName =
    options.resourceMapFileName || defaultResourceMapFileName;
  const chunkManifestFileName =
    options.chunkManifestFileName || defaultChunkManifestFileName;
  const bundle = outputToBundle(output);
  const resourceMap = createRollupResourceMap(bundle, {
    basePathExpression: options.basePathExpression,
    externalResources: options.externalResources
  });
  const chunkManifest = createSdkChunkManifest(bundle);

  if (packedFileNames.size) {
    addPackedChunkAliases(resourceMap, packedFileNames, restFileName);
  }

  upsertAsset(
    output,
    resourceMapFileName,
    createResourceMapScript(resourceMap, {
      basePathExpression: options.basePathExpression
    })
  );
  upsertAsset(
    output,
    chunkManifestFileName,
    JSON.stringify(chunkManifest, null, 2) + '\n'
  );
}

function addPackedChunkAliases(resourceMap, packedFileNames, restFileName) {
  const restModuleId = normalizeChunkModuleId(restFileName);
  const restResource = resourceMap.res[restModuleId];

  assert(restResource, `resource map should include packed chunk ${restModuleId}`);

  packedFileNames.forEach(fileName => {
    resourceMap.res[normalizeChunkModuleId(fileName)] = {...restResource};
  });
}

function outputToBundle(output) {
  return Object.fromEntries(output.map(item => [item.fileName, item]));
}

function upsertAsset(output, fileName, source) {
  const index = output.findIndex(
    item => item.type === 'asset' && item.fileName === fileName
  );
  const asset = {
    type: 'asset',
    fileName,
    source
  };

  if (index === -1) {
    output.push(asset);
  } else {
    output[index] = asset;
  }
}

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

module.exports = {
  finalizeRollupSdkOutput,
  getRestChunkCandidates,
  packRollupSdkRestChunk
};
