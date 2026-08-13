/* eslint-disable */

var path = require('path');
var buildSdkThemeCss = require('./sdk-build/build-sdk-theme-css')
  .buildSdkThemeCss;
var collectSdkPlaceholderAssets = require('./sdk-build/collect-sdk-placeholder-assets')
  .collectSdkPlaceholderAssets;
var prepareSdkJs = require('./sdk-build/prepare-sdk-js').prepareSdkJs;
var caches = {};
var createResource = fis.require('postpackager-loader/lib/resource.js');
const package = require('../packages/amis/package.json');

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

  let jsContents = prepareSdkJs(sdkAssets.jsContents);

  let jsFile = fis.file(root, 'sdk.js');
  jsFile.setContent(jsContents);
  ret.pkg[jsFile.subpath] = jsFile;

  buildSdkThemeCss(sdkAssets.cssContents).forEach(function (themeCss) {
    let cssFile = fis.file(root, themeCss.filename);
    cssFile.setContent(themeCss.content);
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
