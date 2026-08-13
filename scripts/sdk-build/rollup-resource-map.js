function createRollupResourceMap(bundle, options) {
  options = options || {};

  const basePathExpression = options.basePathExpression || 'd';
  const moduleIdPrefix = options.moduleIdPrefix || '';
  const packageIdPrefix = options.packageIdPrefix || '';
  const chunks = getRollupChunks(bundle);
  const pkgEntries = chunks.map((chunk, index) => [
    createPackageId(index, packageIdPrefix),
    {
      url: `${basePathExpression} + ${JSON.stringify('/' + chunk.fileName)}`,
      type: 'js'
    }
  ]);
  const pkgByFileName = new Map(
    pkgEntries.map(([pkgId, pkg], index) => [chunks[index].fileName, pkgId])
  );
  const res = {};

  chunks.forEach(chunk => {
    const pkgId = pkgByFileName.get(chunk.fileName);

    getChunkModuleIds(chunk, moduleIdPrefix).forEach(moduleId => {
      res[moduleId] = createResourceEntry(chunk, pkgId, pkgByFileName);
    });
  });

  return {
    res,
    pkg: Object.fromEntries(pkgEntries)
  };
}

function createResourceMapScript(resourceMap, options) {
  options = options || {};

  const basePathExpression = options.basePathExpression || 'd';
  const serialized = unwrapBasePathExpressions(
    JSON.stringify(resourceMap, null, 2),
    basePathExpression
  );

  return `amis.require.resourceMap(${serialized});`;
}

function unwrapBasePathExpressions(serialized, basePathExpression) {
  const escapedBasePathExpression = escapeRegExp(basePathExpression);

  return serialized.replace(
    new RegExp(
      `"url": "${escapedBasePathExpression} \\+ \\\\"([^"\\\\]+)\\\\""`,
      'g'
    ),
    `"url": ${basePathExpression} + "$1"`
  );
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function getRollupChunks(bundle) {
  return Object.values(bundle)
    .filter(item => item && item.type === 'chunk')
    .sort((left, right) => left.fileName.localeCompare(right.fileName));
}

function getChunkModuleIds(chunk, prefix) {
  const ids = new Set();

  if (chunk.facadeModuleId) {
    ids.add(normalizeModuleId(chunk.facadeModuleId, prefix));
  }

  Object.keys(chunk.modules || {}).forEach(moduleId => {
    ids.add(normalizeModuleId(moduleId, prefix));
  });

  if (!ids.size) {
    ids.add(normalizeModuleId(chunk.name || chunk.fileName, prefix));
  }

  return Array.from(ids).sort();
}

function createResourceEntry(chunk, pkgId, pkgByFileName) {
  const deps = chunk.imports
    .map(fileName => pkgByFileName.get(fileName))
    .filter(Boolean)
    .sort();
  const entry = {
    type: 'js',
    pkg: pkgId
  };

  if (deps.length) {
    entry.deps = deps;
  }

  return entry;
}

function normalizeModuleId(moduleId, prefix = '') {
  const normalized = moduleId
    .replace(/\\/g, '/')
    .replace(/^\0+/, '')
    .replace(/^.*\/node_modules\//, '')
    .replace(/^.*\/packages\//, '')
    .replace(/^.*\/examples\//, 'examples/');

  return prefix + normalized;
}

function createPackageId(index, prefix) {
  return `${prefix}p${index}`;
}

module.exports = {
  createRollupResourceMap,
  createResourceMapScript,
  normalizeModuleId,
  unwrapBasePathExpressions
};
