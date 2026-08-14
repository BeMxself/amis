const fs = require('fs');
const path = require('path');
const sass = require('sass');
const {buildSdkThemeCss} = require('./build-sdk-theme-css');
const {collectSdkPlaceholderAssets} = require('./collect-sdk-placeholder-assets');
const {reduceSdkCssCalc} = require('./reduce-sdk-css-calc');
const {rewriteSdkCssUrls} = require('./rewrite-sdk-css-urls');

const repoRoot = path.resolve(__dirname, '../..');

function buildSdkThemeCssFromSource(options) {
  options = options || {};

  const root = options.repoRoot || repoRoot;
  const placeholderFile =
    options.placeholderFile || path.join(root, 'examples/sdk-placeholder.html');
  const version =
    options.version || require('../../packages/amis/package.json').version;
  const placeholderHtml = fs.readFileSync(placeholderFile, 'utf8');
  const sdkAssets = collectSdkPlaceholderAssets(placeholderHtml, {
    version,
    resolveFile: url => resolveSdkPlaceholderFile(root, placeholderFile, url),
    markFileSkipped: () => {}
  });

  return buildSdkThemeCss(sdkAssets.cssContents, options.themeOptions).map(
    item => ({
      ...item,
      content: reduceSdkCssCalc(item.content)
    })
  );
}

function resolveSdkPlaceholderFile(root, placeholderFile, url) {
  const fullPath = resolveSdkPlaceholderPath(root, placeholderFile, url);

  if (!fullPath || !fs.existsSync(fullPath)) {
    return undefined;
  }

  return {
    basename: path.basename(url),
    subpath: '/' + url,
    getContent: () => readSdkPlaceholderFile(url, fullPath)
  };
}

function resolveSdkPlaceholderPath(root, placeholderFile, url) {
  if (url.startsWith('@fortawesome/')) {
    return require.resolve(url);
  }

  if (url.startsWith('amis-ui/')) {
    return path.join(root, 'packages', url);
  }

  if (url.startsWith('./') || url.startsWith('../')) {
    return path.resolve(path.dirname(placeholderFile), url);
  }

  return undefined;
}

function readSdkPlaceholderFile(url, file) {
  if (/\.scss$/.test(url)) {
    return compileSass(file);
  }

  const content = fs.readFileSync(file, 'utf8');

  return url.startsWith('@fortawesome/')
    ? rewriteSdkCssUrls(content, {from: url})
    : content;
}

function compileSass(file) {
  return sass.compile(file, {
    style: 'expanded',
    logger: {
      warn: () => {},
      debug: () => {}
    }
  }).css;
}

module.exports = {
  buildSdkThemeCssFromSource
};
