const fs = require('fs');
const path = require('path');
const {generateSdkLocale} = require('../generate-sdk-locale');

const repoRoot = path.resolve(__dirname, '../..');
const monacoBasicLanguages = [
  'apex',
  'azcli',
  'bat',
  'clojure',
  'coffee',
  'cpp',
  'csharp',
  'css',
  'dockerfile',
  'fsharp',
  'go',
  'handlebars',
  'html',
  'ini',
  'java',
  'javascript',
  'less',
  'lua',
  'markdown',
  'msdax',
  'objective-c',
  'php',
  'postiats',
  'powershell',
  'pug',
  'python',
  'r',
  'razor',
  'redis',
  'redshift',
  'ruby',
  'rust',
  'sb',
  'scheme',
  'scss',
  'shell',
  'solidity',
  'sql',
  'st',
  'swift',
  'typescript',
  'vb',
  'xml',
  'yaml'
];

const baselinePackagedRuntimeFiles = [
  'thirds/hls.js/hls.js',
  'thirds/mpegts.js/mpegts.js',
  'thirds/pdfjs-dist/build/pdf.js'
];

function copySdkStaticAssetsFromSource(options) {
  options = options || {};

  const root = options.repoRoot || repoRoot;
  const outDir = options.outDir;
  const sourceSdkDir = options.sourceSdkDir;

  if (!outDir) {
    throw new Error('Missing SDK static asset output directory.');
  }

  if (!sourceSdkDir) {
    throw new Error('Missing SDK baseline directory for packaged runtime assets.');
  }

  writeIconfontAssets(root, outDir);
  writeLocaleAssets(root, outDir);
  copyFontAwesomeAssets(root, outDir);
  copyMomentTimezoneAssets(root, outDir);
  copyMonacoAssets(root, outDir);
  copyPdfWorkerAsset(root, outDir);
  copyBaselinePackagedRuntimeAssets(sourceSdkDir, outDir);

  return listFiles(outDir).sort();
}

function writeIconfontAssets(root, outDir) {
  ['css', 'eot', 'svg', 'ttf', 'woff'].forEach(ext => {
    copyFile(
      path.join(root, 'examples/static', `iconfont.${ext}`),
      path.join(outDir, `iconfont.${ext}`)
    );
  });
}

function writeLocaleAssets(root, outDir) {
  const localeFile = path.join(root, 'packages/amis-ui/src/locale/de-DE.ts');
  writeFile(
    path.join(outDir, 'locale/de-DE.js'),
    generateSdkLocale(fs.readFileSync(localeFile, 'utf8')) + '\n'
  );
}

function copyFontAwesomeAssets(root, outDir) {
  copyDirectory(
    path.join(root, 'node_modules/@fortawesome/fontawesome-free/webfonts'),
    path.join(outDir, 'thirds/@fortawesome/fontawesome-free/webfonts')
  );
}

function copyMomentTimezoneAssets(root, outDir) {
  copyFile(
    path.join(root, 'node_modules/moment-timezone/data/packed/latest.json'),
    path.join(outDir, 'thirds/moment-timezone/data/packed/latest.json')
  );
}

function copyMonacoAssets(root, outDir) {
  const monacoRoot = path.join(root, 'node_modules/monaco-editor/min/vs');
  const monacoOut = path.join(outDir, 'thirds/monaco-editor/min/vs');

  [
    'base/browser',
    'base/worker',
    'language/css',
    'language/html',
    'language/json',
    'language/typescript'
  ].forEach(dir => {
    copyDirectory(path.join(monacoRoot, dir), path.join(monacoOut, dir));
  });

  monacoBasicLanguages.forEach(language => {
    copyFile(
      path.join(monacoRoot, 'basic-languages', language, `${language}.js`),
      path.join(monacoOut, 'basic-languages', language, `${language}.js`)
    );
  });

  [
    'editor/editor.main.css',
    'editor/editor.main.js',
    'editor/editor.main.nls.js',
    'editor/editor.main.nls.zh-cn.js',
    'loader.js'
  ].forEach(file => {
    copyFile(path.join(monacoRoot, file), path.join(monacoOut, file));
  });
}

function copyPdfWorkerAsset(root, outDir) {
  copyFile(
    path.join(root, 'node_modules/pdfjs-dist/build/pdf.worker.min.mjs'),
    path.join(outDir, 'thirds/pdfjs-dist/build/pdf.worker.min.mjs')
  );
}

function copyBaselinePackagedRuntimeAssets(sourceSdkDir, outDir) {
  baselinePackagedRuntimeFiles.forEach(file => {
    copyFile(path.join(sourceSdkDir, file), path.join(outDir, file));
  });
}

function copyDirectory(source, target) {
  fs.mkdirSync(path.dirname(target), {recursive: true});
  fs.cpSync(source, target, {recursive: true});
}

function copyFile(source, target) {
  fs.mkdirSync(path.dirname(target), {recursive: true});
  fs.copyFileSync(source, target);
}

function writeFile(file, contents) {
  fs.mkdirSync(path.dirname(file), {recursive: true});
  fs.writeFileSync(file, contents);
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

module.exports = {
  copySdkStaticAssetsFromSource
};
