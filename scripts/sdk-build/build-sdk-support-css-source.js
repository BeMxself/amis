const path = require('path');
const sass = require('sass');
const postcss = require('postcss');
const autoprefixer = require('autoprefixer');
const postcssCustomProperties = require('postcss-custom-properties');

const repoRoot = path.resolve(__dirname, '../..');
const sdkIe11PatchCss = ':root { --animation-duration: 0s;}\n';

async function buildSdkHelperCssFromSource(options) {
  options = options || {};

  const root = options.repoRoot || repoRoot;
  const helperFile =
    options.helperFile || path.join(root, 'packages/amis-ui/scss/helper.scss');
  const helperCss = sass.compile(helperFile, {
    style: 'expanded',
    logger: {
      warn: () => {},
      debug: () => {}
    }
  }).css;

  const result = await postcss([autoprefixer()]).process(helperCss, {
    from: helperFile
  });

  return result.css;
}

async function buildSdkIe11Css(css) {
  const result = await postcss([
    postcssCustomProperties({preserve: false})
  ]).process(css + sdkIe11PatchCss, {from: undefined});

  return result.css;
}

module.exports = {
  buildSdkHelperCssFromSource,
  buildSdkIe11Css,
  sdkIe11PatchCss
};
