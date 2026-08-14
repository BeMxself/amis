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

function packRollupSdkRestChunk(output, options) {
  options = options || {};

  const restFileName = options.restFileName || defaultRestFileName;
  const restCandidates = getRestChunkCandidates(output, restFileName);

  if (!restCandidates.length) {
    return output;
  }

  const packedFileNames = new Set(
    restCandidates.map(chunk => chunk.fileName)
  );
  const restChunk = createRestChunk(restCandidates, packedFileNames, restFileName);
  const packedOutput = output
    .filter(item => !isPackedChunk(item, packedFileNames))
    .map(item => remapPackedChunkImports(item, packedFileNames, restFileName));

  packedOutput.push(restChunk);
  replaceGeneratedAssets(packedOutput, options, packedFileNames, restFileName);

  return packedOutput;
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
    code: chunks.map(chunk => chunk.code.trim()).join('\n;\n') + '\n',
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

  addPackedChunkAliases(resourceMap, packedFileNames, restFileName);

  replaceAsset(
    output,
    resourceMapFileName,
    createResourceMapScript(resourceMap, {
      basePathExpression: options.basePathExpression
    })
  );
  replaceAsset(
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

function replaceAsset(output, fileName, source) {
  const index = output.findIndex(
    item => item.type === 'asset' && item.fileName === fileName
  );

  assert(index !== -1, `missing emitted asset: ${fileName}`);

  output[index] = {
    type: 'asset',
    fileName,
    source
  };
}

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

module.exports = {
  getRestChunkCandidates,
  packRollupSdkRestChunk
};
