var wrapSdkResourceMapWithBasePath = require('./rewrite-sdk-resource-map')
  .wrapSdkResourceMapWithBasePath;

var rLinkScript =
  /(<!(?:--)?\[[\s\S]*?<!\[endif\](?:--)?>|<!--[\s\S]*?(?:-->|$))|(?:(\s*<script([^>]*)>([\s\S]*?)<\/script>)|(?:\s*(<link([^>]*?)(?:\/)?>)|(<style([^>]*)>([\s\S]*?)<\/style>)))(<!--ignore-->)?\n?/gi;
var rScriptType = /type=('|")(.*?)\1/i;
var rSrcHref = /\s*(?:src|href)=('|")(.+?)\1/i;
var rRefStyle = /rel=('|")stylesheet\1/i;

function collectSdkPlaceholderAssets(contents, options) {
  var cssContents = [];
  var jsContents = '';
  var entryJs = '';

  contents.replace(
    rLinkScript,
    function (
      all,
      comment,
      script,
      attrs,
      body,
      link,
      lattrs,
      style,
      sattrs,
      sbody,
      ignored
    ) {
      // 忽略注释。
      if (comment || ignored) {
        return all;
      }

      var externalScript = getExternalScript(attrs, body, script);
      if (externalScript) {
        var jsFile = options.resolveFile(externalScript);

        if (jsFile) {
          options.markFileSkipped(jsFile);
          jsContents += getJsFileContent(jsFile, options.version) + ';\n';
        }

        return '';
      }

      if (isInlineJavaScript(script, attrs)) {
        entryJs += ';' + body;
        return '';
      }

      var stylesheet = getStylesheetHref(link, lattrs);
      if (stylesheet) {
        var cssFile = options.resolveFile(stylesheet);

        if (cssFile) {
          cssContents.push({
            name: cssFile.basename,
            content: cssFile.getContent()
          });
          options.markFileSkipped(cssFile);
        }

        return '';
      }

      if (style && sbody.trim()) {
        cssContents.push({
          name: 'inline',
          content: sbody
        });

        return '';
      }

      return all;
    }
  );

  return {
    cssContents: cssContents,
    jsContents: jsContents,
    entryJs: entryJs
  };
}

function getExternalScript(attrs, body, script) {
  if (!script || body.trim()) {
    return '';
  }

  var src = attrs.match(rSrcHref);
  return src ? src[2] : '';
}

function isInlineJavaScript(script, attrs) {
  if (!script) {
    return false;
  }

  var type = attrs.match(rScriptType);
  return (
    !type ||
    ['text/javascript', 'application/javascript'].indexOf(
      type[2].toLowerCase()
    ) !== -1
  );
}

function getStylesheetHref(link, attrs) {
  if (!link || !rRefStyle.test(attrs)) {
    return '';
  }

  var href = attrs.match(rSrcHref);
  return href ? href[2] : '';
}

function getJsFileContent(file, version) {
  var contents = file.getContent();

  if (/_map\.js$/.test(file.subpath)) {
    return wrapSdkResourceMapWithBasePath(contents, version);
  }

  return contents;
}

module.exports = {
  collectSdkPlaceholderAssets
};
