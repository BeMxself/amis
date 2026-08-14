#!/usr/bin/env node

const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const {
  getExpectedSdkFiles,
  parseResourceMap,
  sdkChunkPlan,
  sdkCssFiles
} = require('./sdk-contract');
const {
  buildSdkHelperCssFromSource,
  buildSdkIe11Css,
  sdkIe11PatchCss
} = require('./build-sdk-support-css-source');
const {copySdkStaticAssetsFromSource} = require('./build-sdk-static-assets-source');
const {buildSdkThemeCssFromSource} = require('./build-sdk-theme-css-source');
const {
  createSdkEntryWithEmbeddedResourceMap,
  defaultEntry,
  generateRollupSdkEntryOutput,
  sdkEntryAliases
} = require('./rollup-sdk-entry-build');

const repoRoot = path.resolve(__dirname, '../..');
const args = process.argv.slice(2);
const mode = readOption('--mode') || 'contract-mirror';
const sourceSdkDir = path.resolve(
  repoRoot,
  readOption('--source-sdk-dir') || 'packages/amis/sdk'
);
const outDir = path.resolve(
  repoRoot,
  readOption('--out-dir') || 'packages/amis/sdk-next'
);
const manifestFile = path.join(outDir, 'sdk-next-manifest.json');
const rollupEntryOutDir = path.join(outDir, 'rollup-entry');
const sourceGeneratedCssFiles = new Set([
  'sdk.css',
  'cxd.css',
  'ang.css',
  'dark.css',
  'antd.css',
  'sdk-ie11.css',
  'cxd-ie11.css',
  'ang-ie11.css',
  'dark-ie11.css',
  'antd-ie11.css',
  'helper.css',
  'ie11-patch.css'
]);

main().catch(error => {
  console.error(error);
  process.exitCode = 1;
});

async function main() {
  assertDirectory(sourceSdkDir, 'source SDK directory');
  assertExpectedArtifacts(sourceSdkDir);
  assertSupportedMode(mode);

  fs.rmSync(outDir, {recursive: true, force: true});
  fs.mkdirSync(path.dirname(outDir), {recursive: true});
  fs.cpSync(sourceSdkDir, outDir, {recursive: true});

  const rollupEntry =
    mode === 'rollup-entry' ? await writeRollupEntryOutput() : undefined;
  const manifest = createSdkNextManifest(outDir, sourceSdkDir, {
    mode,
    rollupEntry
  });
  fs.writeFileSync(manifestFile, JSON.stringify(manifest, null, 2) + '\n');

  console.log(
    `SDK next written: ${relative(outDir)} (${manifest.files.length} files).`
  );
  console.log(`SDK next manifest: ${relative(manifestFile)}.`);
}

function assertSupportedMode(value) {
  if (value !== 'contract-mirror' && value !== 'rollup-entry') {
    throw new Error(
      `Unsupported SDK next mode: ${value}. Use contract-mirror or rollup-entry.`
    );
  }
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

async function writeRollupEntryOutput() {
  const {output} = await generateRollupSdkEntryOutput();
  const embeddedSdkJs = createSdkEntryWithEmbeddedResourceMap(output);

  fs.mkdirSync(rollupEntryOutDir, {recursive: true});
  output.forEach(item => writeRollupOutputItem(rollupEntryOutDir, item));
  fs.writeFileSync(path.join(rollupEntryOutDir, 'sdk.js'), embeddedSdkJs);
  const cssFiles = await writeRollupEntryCssAssets();
  const staticFiles = copyRollupEntryStaticAssets();

  const resourceMap = parseResourceMap(embeddedSdkJs);
  const chunkManifest = JSON.parse(
    fs.readFileSync(
      path.join(rollupEntryOutDir, 'sdk-chunk-manifest.json'),
      'utf8'
    )
  );
  const emptyAssetManifest = JSON.parse(
    fs.readFileSync(path.join(rollupEntryOutDir, 'sdk-empty-assets.json'), 'utf8')
  );

  return {
    outDir: relative(rollupEntryOutDir),
    entry: relative(defaultEntry),
    embeddedResourceMap: true,
    entryAliases: sdkEntryAliases,
    loaderBridge: true,
    resourceCount: Object.keys(resourceMap.res || {}).length,
    packageCount: Object.keys(resourceMap.pkg || {}).length,
    chunks: chunkManifest.chunks.map(chunk => chunk.fileName).sort(),
    cssFiles,
    emptyAssetImports: emptyAssetManifest.imports || [],
    staticFiles,
    files: listFiles(rollupEntryOutDir).map(file => `rollup-entry/${file}`)
  };
}

function copyRollupEntryCssAssets() {
  return copyRollupEntryFiles(
    sdkCssFiles.filter(file => !sourceGeneratedCssFiles.has(file))
  );
}

async function writeRollupEntryCssAssets() {
  const cssFiles = new Set(copyRollupEntryCssAssets());
  const themeCssItems = buildSdkThemeCssFromSource({repoRoot});

  for (const themeCss of themeCssItems) {
    writeRollupEntryTextFile(themeCss.filename, themeCss.content);
    cssFiles.add(themeCss.filename);
    await writeRollupEntryIe11Css(themeCss.filename, themeCss.content, cssFiles);

    if (themeCss.filename === 'sdk.css') {
      writeRollupEntryTextFile('cxd.css', themeCss.content);
      cssFiles.add('cxd.css');
      await writeRollupEntryIe11Css('cxd.css', themeCss.content, cssFiles);
    }
  }

  writeRollupEntryTextFile(
    'helper.css',
    await buildSdkHelperCssFromSource({repoRoot})
  );
  cssFiles.add('helper.css');
  writeRollupEntryTextFile('ie11-patch.css', sdkIe11PatchCss);
  cssFiles.add('ie11-patch.css');

  return [...cssFiles].sort();
}

async function writeRollupEntryIe11Css(file, css, cssFiles) {
  const ie11File = file.replace(/\.css$/, '-ie11.css');

  writeRollupEntryTextFile(ie11File, await buildSdkIe11Css(css));
  cssFiles.add(ie11File);
}

function copyRollupEntryStaticAssets() {
  return copySdkStaticAssetsFromSource({
    repoRoot,
    outDir: rollupEntryOutDir,
    sourceSdkDir
  });
}

function copyRollupEntryFiles(files) {
  return files.filter(file => {
    const sourceFile = path.join(sourceSdkDir, file);
    const targetFile = path.join(rollupEntryOutDir, file);

    if (!fs.existsSync(sourceFile)) {
      return false;
    }

    fs.mkdirSync(path.dirname(targetFile), {recursive: true});
    fs.copyFileSync(sourceFile, targetFile);
    return true;
  }).sort();
}

function writeRollupOutputItem(dir, item) {
  const fileName = item.fileName;
  const outputFile = path.join(dir, fileName);
  const contents = item.type === 'chunk' ? item.code : item.source;

  fs.mkdirSync(path.dirname(outputFile), {recursive: true});
  fs.writeFileSync(outputFile, contents);
}

function writeRollupEntryTextFile(file, contents) {
  const outputFile = path.join(rollupEntryOutDir, file);

  fs.mkdirSync(path.dirname(outputFile), {recursive: true});
  fs.writeFileSync(outputFile, contents);
}

function createSdkNextManifest(sdkDir, sourceDir, options) {
  options = options || {};
  const files = listFiles(sdkDir)
    .filter(file => file !== path.basename(manifestFile))
    .map(file => describeFile(sdkDir, file));

  return {
    generatedAt: new Date().toISOString(),
    mode: options.mode || 'contract-mirror',
    sourceSdkDir: relative(sourceDir),
    outDir: relative(sdkDir),
    entry: sdkChunkPlan.entry,
    chunks: Object.keys(sdkChunkPlan.chunks),
    expectedFiles: getExpectedSdkFiles(sourceDir),
    ...(options.rollupEntry ? {rollupEntry: options.rollupEntry} : {}),
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
