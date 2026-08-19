#!/usr/bin/env node

const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const {
  parseResourceMap,
  createSdkArtifactContract
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
  findAsset,
  generateRollupSdkEntryOutput,
  sdkEntryAliases
} = require('./rollup-sdk-entry-build');

const repoRoot = path.resolve(__dirname, '../..');
const args = process.argv.slice(2);
const mode = readOption('--mode') || 'contract-mirror';
const defaultOutDir =
  mode === 'rollup-sdk' ? 'packages/amis/sdk' : 'packages/amis/sdk-next';
const sourceSdkDir = path.resolve(
  repoRoot,
  readOption('--source-sdk-dir') || 'packages/amis/sdk'
);
const outDir = path.resolve(repoRoot, readOption('--out-dir') || defaultOutDir);
const rollupEntryOutDir =
  mode === 'rollup-sdk' ? outDir : path.join(outDir, 'rollup-entry');
const defaultIe11CssOutDir = rollupEntryOutDir;
const ie11CssOutDir = path.resolve(
  repoRoot,
  readOption('--ie11-css-out-dir') || defaultIe11CssOutDir
);
const manifestFile = path.join(outDir, 'sdk-next-manifest.json');
const sourceSdkContract = createSdkArtifactContract(sourceSdkDir);
const sourceGeneratedCssFiles = new Set(sourceSdkContract.cssFiles);

main().catch(error => {
  console.error(error);
  process.exitCode = 1;
});

async function main() {
  assertSupportedMode(mode);

  if (mode === 'rollup-sdk') {
    await writeRollupSdkOutput();
    return;
  }

  assertDirectory(sourceSdkDir, 'source SDK directory');
  assertExpectedArtifacts(sourceSdkDir);

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
  if (
    value !== 'contract-mirror' &&
    value !== 'rollup-entry' &&
    value !== 'rollup-sdk'
  ) {
    throw new Error(
      `Unsupported SDK build mode: ${value}. Use contract-mirror, rollup-entry, or rollup-sdk.`
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
  const missing = createSdkArtifactContract(sdkDir).expectedFiles.filter(
    file => !fs.existsSync(path.join(sdkDir, file))
  );

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
  output
    .filter(shouldWriteRollupOutputItem)
    .forEach(item => writeRollupOutputItem(rollupEntryOutDir, item));
  fs.writeFileSync(path.join(rollupEntryOutDir, 'sdk.js'), embeddedSdkJs);
  const cssFiles = await writeRollupEntryCssAssets();
  const staticFiles = await copyRollupEntryStaticAssets();

  const resourceMap = parseResourceMap(embeddedSdkJs);
  const chunkManifest = JSON.parse(
    findAsset(output, 'sdk-chunk-manifest.json').source
  );
  const emptyAssetManifest = JSON.parse(
    findAsset(output, 'sdk-empty-assets.json').source
  );

  return {
    outDir: relative(rollupEntryOutDir),
    ie11CssOutDir: relative(ie11CssOutDir),
    entry: relative(defaultEntry),
    embeddedResourceMap: true,
    entryAliases: sdkEntryAliases,
    loaderBridge: true,
    resourceCount: Object.keys(resourceMap.res || {}).length,
    packageCount: Object.keys(resourceMap.pkg || {}).length,
    chunks: chunkManifest.chunks.map(chunk => chunk.fileName).sort(),
    cssFiles,
    ie11CssFiles: sourceSdkContract.ie11CssFiles.filter(file =>
      fs.existsSync(path.join(ie11CssOutDir, file))
    ),
    emptyAssetImports: emptyAssetManifest.imports || [],
    staticFiles,
    files: listFiles(rollupEntryOutDir).map(file => `rollup-entry/${file}`)
  };
}

async function writeRollupSdkOutput() {
  fs.rmSync(outDir, {recursive: true, force: true});
  fs.rmSync(ie11CssOutDir, {recursive: true, force: true});
  fs.mkdirSync(outDir, {recursive: true});

  const rollupEntry = await writeRollupEntryOutput();
  const files = listFiles(outDir);

  console.log(
    `SDK Rollup written: ${relative(outDir)} (${files.length} files, ${
      rollupEntry.chunks.length
    } chunks).`
  );
}

function shouldWriteRollupOutputItem(item) {
  return mode !== 'rollup-sdk' || item.type === 'chunk';
}

function copyRollupEntryCssAssets() {
  return copyRollupEntryFiles(
    sourceSdkContract.cssFiles.filter(file => !sourceGeneratedCssFiles.has(file))
  );
}

async function writeRollupEntryCssAssets() {
  const cssFiles = new Set(copyRollupEntryCssAssets());
  const themeCssItems = buildSdkThemeCssFromSource({repoRoot});

  for (const themeCss of themeCssItems) {
    writeRollupEntryTextFile(themeCss.filename, themeCss.content);
    cssFiles.add(themeCss.filename);
    await writeRollupEntryIe11Css(themeCss.filename, themeCss.content);

    if (themeCss.filename === 'sdk.css') {
      writeRollupEntryTextFile('cxd.css', themeCss.content);
      cssFiles.add('cxd.css');
      await writeRollupEntryIe11Css('cxd.css', themeCss.content);
      writeRollupEntryTextFile('prismui.css', themeCss.content);
      cssFiles.add('prismui.css');
      await writeRollupEntryIe11Css('prismui.css', themeCss.content);
    }
  }

  writeRollupEntryTextFile(
    'helper.css',
    await buildSdkHelperCssFromSource({repoRoot})
  );
  cssFiles.add('helper.css');
  writeIe11CssTextFile('ie11-patch.css', sdkIe11PatchCss);

  return [...cssFiles].sort();
}

async function writeRollupEntryIe11Css(file, css) {
  writeIe11CssTextFile(
    file.replace(/\.css$/, '-ie11.css'),
    await buildSdkIe11Css(css)
  );
}

function writeIe11CssTextFile(file, contents) {
  const outputFile = path.join(ie11CssOutDir, file);

  fs.mkdirSync(path.dirname(outputFile), {recursive: true});
  fs.writeFileSync(outputFile, contents);
}

async function copyRollupEntryStaticAssets() {
  return copySdkStaticAssetsFromSource({
    repoRoot,
    outDir: rollupEntryOutDir
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
  const sourceContract = createSdkArtifactContract(sourceDir);
  const files = listFiles(sdkDir)
    .filter(file => file !== path.basename(manifestFile))
    .map(file => describeFile(sdkDir, file));

  return {
    generatedAt: new Date().toISOString(),
    mode: options.mode || 'contract-mirror',
    sourceSdkDir: relative(sourceDir),
    outDir: relative(sdkDir),
    entry: sourceContract.entry,
    chunks: sourceContract.allChunkFiles,
    expectedFiles: sourceContract.expectedFiles,
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
