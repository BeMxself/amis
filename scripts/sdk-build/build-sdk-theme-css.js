var prefixSdkCss = require('./prefix-sdk-css').prefixSdkCss;

var defaultSdkThemes = ['ang', 'cxd', 'dark', 'antd'];

function buildSdkThemeCss(cssContents, options) {
  options = options || {};

  var themes = options.themes || defaultSdkThemes;
  var prefix = options.prefix || '.prismui-scope';

  return themes.map(function (theme) {
    var excludedThemeFiles = themes
      .filter(function (item) {
        return item !== theme;
      })
      .map(function (item) {
        return item + '.scss';
      });

    var contents = cssContents
      .filter(function (item) {
        return !excludedThemeFiles.includes(item.name);
      })
      .map(function (item) {
        return item.content;
      })
      .join('\n');

    return {
      theme: theme,
      filename: theme === 'cxd' ? 'sdk.css' : theme + '.css',
      content: prefixSdkCss(contents, prefix, theme)
    };
  });
}

module.exports = {
  buildSdkThemeCss,
  defaultSdkThemes
};
