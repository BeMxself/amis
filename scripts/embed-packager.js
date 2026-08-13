/* eslint-disable */

var path = require('path');
var collectSdkPlaceholderAssets = require('./sdk-build/collect-sdk-placeholder-assets')
  .collectSdkPlaceholderAssets;
var prefixSdkCss = require('./sdk-build/prefix-sdk-css').prefixSdkCss;
var rSourceMap =
  /(?:\/\/\#\s*sourceMappingURL[^\r\n\'\"]*|\/\*\#\s*sourceMappingURL[^\r\n\'\"]*\*\/)(?:\r?\n|$)/gi;
var caches = {};
var createResource = fis.require('postpackager-loader/lib/resource.js');
const package = require('../packages/amis/package.json');

function unicodeJs(str) {
  return str.replace(
    /([\u4E00-\u9FA5]|[\uFE30-\uFFA0]|[\u2019])/g,
    function (_, value) {
      return '\\u' + value.charCodeAt(0).toString(16);
    }
  );
}

module.exports = function (ret, pack, settings, opt) {
  var root = fis.project.getProjectPath();

  var tpl = ret.pkg['/examples/sdk-placeholder.html'];
  tpl.skiped = true;

  if (tpl && tpl._fromCache && caches[tpl.id]) {
    tpl.setContent(caches[tpl.id]);
    return;
  } else if (!tpl) {
    return;
  }

  var mapping = {};
  var contents = tpl.getContent();
  var resource = tpl._resource;

  var files = ret.pkg;
  Object.keys(files).forEach(function (subpath) {
    var file = files[subpath];

    mapping[file.getUrl()] = file;
  });

  var sdkAssets = collectSdkPlaceholderAssets(contents, {
    version: package.version,
    resolveFile: function (url) {
      return resolveFile(url, resource, tpl, mapping);
    },
    markFileSkipped: function (file) {
      file.skiped = true;
    }
  });

  let jsContents = sdkAssets.jsContents.replace(rSourceMap, '');
  jsContents = unicodeJs(jsContents);

  let jsFile = fis.file(root, 'sdk.js');
  jsFile.setContent(jsContents);
  ret.pkg[jsFile.subpath] = jsFile;

  // cssContents = prefixSdkCss(cssContents, '.amis-scope');
  // let cssFile = fis.file(root, 'sdk.css');
  // cssFile.setContent(cssContents);
  // ret.pkg[cssFile.subpath] = cssFile;

  const themes = ['ang', 'cxd', 'dark', 'antd'];

  themes.forEach(function (theme) {
    const rest = themes.filter(a => a !== theme).map(item => item + '.scss');
    let contents = sdkAssets.cssContents
      .filter(item => !rest.includes(item.name))
      .map(item => item.content)
      .join('\n');

    contents = prefixSdkCss(contents, '.amis-scope', theme);
    let cssFile = fis.file(root, (theme === 'cxd' ? 'sdk' : theme) + '.css');
    cssFile.setContent(contents);
    ret.pkg[cssFile.subpath] = cssFile;
  });

  // tpl.setContent(contents);
  caches[tpl.id] = contents;
};

function resolveFile(url, resource, tpl, mapping) {
  let file = resource.getFileByUrl(url);

  if (!file) {
    file = resource.getFileByUrl(
      fis.util(path.join(path.dirname(tpl.release), url))
    );
  }

  if (!file) {
    file = mapping[url];
  }

  return file;
}
