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
  const externalModuleIds = new Set(
    (options.externalResources || [])
      .filter(resource => resource.includeAsDependency)
      .map(resource => resource.moduleId)
  );
  const moduleIdByFileName = new Map(
    chunks.map(chunk => [
      chunk.fileName,
      normalizeChunkModuleId(chunk.fileName, moduleIdPrefix)
    ])
  );
  const res = {};

  chunks.forEach(chunk => {
    const pkgId = pkgByFileName.get(chunk.fileName);

    getChunkModuleIds(chunk, moduleIdPrefix)
      .filter(shouldExposeResourceModuleId)
      .forEach(moduleId => {
        res[moduleId] = createResourceEntry(
          chunk,
          pkgId,
          moduleIdByFileName,
          externalModuleIds
        );
      });
  });

  addExternalResources(res, options.externalResources || []);

  return {
    res,
    pkg: Object.fromEntries(pkgEntries)
  };
}

function addExternalResources(res, externalResources) {
  externalResources.forEach(resource => {
    if (!resource.moduleId || res[resource.moduleId]) {
      return;
    }

    res[resource.moduleId] = {
      url: resource.url,
      type: resource.type || 'js'
    };
  });
}

function createResourceMapScript(resourceMap, options) {
  options = options || {};

  const basePathExpression = options.basePathExpression || 'd';
  const serialized = unwrapBasePathExpressions(
    JSON.stringify(resourceMap),
    basePathExpression
  );

  return `amis.require.resourceMap(${serialized});`;
}

function unwrapBasePathExpressions(serialized, basePathExpression) {
  const escapedBasePathExpression = escapeRegExp(basePathExpression);

  return serialized.replace(
    new RegExp(
      `"url"\\s*:\\s*"${escapedBasePathExpression}\\s*\\+\\s*\\\\"([^"\\\\]+)\\\\""`,
      'g'
    ),
    `"url":${basePathExpression}+"$1"`
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
  ids.add(normalizeChunkModuleId(chunk.fileName, prefix));

  getAmdDefineModuleIds(chunk.code || '', prefix).forEach(moduleId =>
    ids.add(moduleId)
  );

  if (!ids.size) {
    ids.add(normalizeModuleId(chunk.name || chunk.fileName, prefix));
  }

  return Array.from(ids).sort();
}

function getAmdDefineModuleIds(code, prefix = '') {
  const ids = new Set();
  const pattern = /amis\.define\(\s*['"]([^'"]+)['"]/g;
  let match;

  while ((match = pattern.exec(code))) {
    ids.add(prefix + match[1]);
  }

  return Array.from(ids).sort();
}

function shouldExposeResourceModuleId(moduleId) {
  return !(
    moduleId === 'commonjsHelpers.js' ||
    moduleId.includes('?commonjs-') ||
    moduleId.endsWith('?commonjs-module')
  );
}

function createResourceEntry(
  chunk,
  pkgId,
  moduleIdByFileName,
  externalModuleIds
) {
  const deps = chunk.imports
    .map(fileName =>
      moduleIdByFileName.get(fileName) ||
      (externalModuleIds.has(fileName) ? fileName : undefined)
    )
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

function normalizeChunkModuleId(fileName, prefix = '') {
  return prefix + fileName.replace(/\.js$/i, '');
}

function createPackageId(index, prefix) {
  return `${prefix}p${index}`;
}

module.exports = {
  createRollupResourceMap,
  createResourceMapScript,
  getAmdDefineModuleIds,
  normalizeChunkModuleId,
  normalizeModuleId,
  shouldExposeResourceModuleId,
  unwrapBasePathExpressions
};
