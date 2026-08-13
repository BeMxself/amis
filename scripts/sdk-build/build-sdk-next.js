#!/usr/bin/env node

const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const {
  getExpectedSdkFiles,
  sdkChunkPlan
} = require('./sdk-contract');

const repoRoot = path.resolve(__dirname, '../..');
const args = process.argv.slice(2);
const sourceSdkDir = path.resolve(
  repoRoot,
  readOption('--source-sdk-dir') || 'packages/amis/sdk'
);
const outDir = path.resolve(
  repoRoot,
  readOption('--out-dir') || 'packages/amis/sdk-next'
);
const manifestFile = path.join(outDir, 'sdk-next-manifest.json');

main();

function main() {
  assertDirectory(sourceSdkDir, 'source SDK directory');
  assertExpectedArtifacts(sourceSdkDir);

  fs.rmSync(outDir, {recursive: true, force: true});
  fs.mkdirSync(path.dirname(outDir), {recursive: true});
  fs.cpSync(sourceSdkDir, outDir, {recursive: true});

  const manifest = createSdkNextManifest(outDir, sourceSdkDir);
  fs.writeFileSync(manifestFile, JSON.stringify(manifest, null, 2) + '\n');

  console.log(
    `SDK next written: ${relative(outDir)} (${manifest.files.length} files).`
  );
  console.log(`SDK next manifest: ${relative(manifestFile)}.`);
}

function readOption(name) {
  const index = args.indexOf(name);
  if (index === -1) {
    return undefined;
  }

  return args[index + 1];
}

function assertDirectory(dir, label) {
  if (!fs.existsSync(dir) || !fs.statSync(dir).isDirectory()) {
    throw new Error(
      `Missing ${label}: ${relative(dir)}. Run \`npm run build --workspace amis\` first.`
    );
  }
}

function assertExpectedArtifacts(sdkDir) {
  const missing = getExpectedSdkFiles(sdkDir)
    .filter(file => !fs.existsSync(path.join(sdkDir, file)));

  if (missing.length) {
    throw new Error(
      `Source SDK is missing expected artifacts:\n${missing
        .map(file => `- ${file}`)
        .join('\n')}`
    );
  }
}

function createSdkNextManifest(sdkDir, sourceDir) {
  const files = listFiles(sdkDir)
    .filter(file => file !== path.basename(manifestFile))
    .map(file => describeFile(sdkDir, file));

  return {
    generatedAt: new Date().toISOString(),
    mode: 'contract-mirror',
    sourceSdkDir: relative(sourceDir),
    outDir: relative(sdkDir),
    entry: sdkChunkPlan.entry,
    chunks: Object.keys(sdkChunkPlan.chunks),
    expectedFiles: getExpectedSdkFiles(sourceDir),
    files
  };
}

function listFiles(dir, prefix = '') {
  return fs.readdirSync(path.join(dir, prefix), {withFileTypes: true}).flatMap(
    entry => {
      const file = path.join(prefix, entry.name);

      if (entry.isDirectory()) {
        return listFiles(dir, file);
      }

      if (entry.isFile()) {
        return file.split(path.sep).join('/');
      }

      return [];
    }
  );
}

function describeFile(dir, file) {
  const fullPath = path.join(dir, file);
  const buffer = fs.readFileSync(fullPath);

  return {
    path: file,
    size: buffer.length,
    sha256: crypto.createHash('sha256').update(buffer).digest('hex')
  };
}

function relative(file) {
  return path.relative(repoRoot, file).split(path.sep).join('/');
}
