const path = require('path');
const {sdkChunkPlan} = require('./sdk-contract');

const DEFAULT_SKIPPED_CHUNKS = new Set([sdkChunkPlan.entry, 'rest.js']);

function createSdkManualChunks(options) {
  const rules = getSdkManualChunkRules(options);

  return function manualChunks(id) {
    const candidates = getModuleIdCandidates(id);
    const rule = rules.find(rule => rule.matches(candidates));

    return rule ? rule.chunkName : undefined;
  };
}

function getSdkManualChunkRules(options) {
  options = options || {};
  const skippedChunks = createSkippedChunkSet(options.skippedChunks);

  return Object.entries(sdkChunkPlan.chunks).flatMap(([fileName, patterns]) => {
    if (skippedChunks.has(fileName)) {
      return [];
    }

    return asArray(patterns)
      .filter(isManualChunkPattern)
      .map(pattern => createManualChunkRule(fileName, pattern));
  });
}

function createManualChunkRule(fileName, pattern) {
  return {
    fileName,
    chunkName: getRollupChunkName(fileName),
    pattern,
    matches: createPatternMatcher(pattern)
  };
}

function isManualChunkPattern(pattern) {
  return (
    typeof pattern === 'string' &&
    pattern &&
    !pattern.startsWith('!') &&
    !pattern.includes(':') &&
    pattern !== '*.js'
  );
}

function createPatternMatcher(pattern) {
  if (pattern.endsWith('/**')) {
    const prefix = normalizeChunkPattern(pattern.slice(0, -3));

    return candidates =>
      candidates.some(candidate =>
        candidate === prefix || candidate.startsWith(`${prefix}/`)
      );
  }

  const normalizedPattern = normalizeChunkPattern(pattern);

  return candidates => candidates.some(candidate => candidate === normalizedPattern);
}

function getModuleIdCandidates(id) {
  const normalized = normalizeModulePath(id);
  const candidates = new Set([normalized]);

  addSuffixCandidate(candidates, normalized, '/node_modules/');
  addSuffixCandidate(candidates, normalized, '/packages/amis/');
  addSuffixCandidate(candidates, normalized, '/packages/');
  addExamplesCandidate(candidates, normalized);
  addCompiledPackageCandidates(candidates);

  return Array.from(candidates).filter(Boolean);
}

function addSuffixCandidate(candidates, id, marker) {
  const index = id.lastIndexOf(marker);

  if (index !== -1) {
    candidates.add(id.slice(index + marker.length));
  }
}

function addExamplesCandidate(candidates, id) {
  const marker = '/examples/';
  const index = id.lastIndexOf(marker);

  if (index !== -1) {
    candidates.add(`examples/${id.slice(index + marker.length)}`);
  }
}

function addCompiledPackageCandidates(candidates) {
  Array.from(candidates).forEach(candidate => {
    if (!candidate.includes('/src/')) {
      return;
    }

    candidates.add(
      candidate
        .replace('/src/', '/lib/')
        .replace(/\.(tsx|ts|jsx)$/, '.js')
    );
  });
}

function normalizeChunkPattern(pattern) {
  return normalizeModulePath(pattern).replace(/^\.\//, '');
}

function normalizeModulePath(id) {
  return id
    .split(path.sep)
    .join('/')
    .replace(/\\/g, '/')
    .replace(/^\0+/, '')
    .replace(/^\/+/, '');
}

function getRollupChunkName(fileName) {
  return fileName.replace(/\.js$/, '');
}

function asArray(value) {
  return Array.isArray(value) ? value : [value];
}

function createSkippedChunkSet(skippedChunks) {
  if (!skippedChunks) {
    return DEFAULT_SKIPPED_CHUNKS;
  }

  return skippedChunks instanceof Set ? skippedChunks : new Set(skippedChunks);
}

module.exports = {
  createSdkManualChunks,
  getModuleIdCandidates,
  getRollupChunkName,
  getSdkManualChunkRules
};
