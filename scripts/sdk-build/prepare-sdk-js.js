var rSourceMap =
  /(?:\/\/\#\s*sourceMappingURL[^\r\n\'\"]*|\/\*\#\s*sourceMappingURL[^\r\n\'\"]*\*\/)(?:\r?\n|$)/gi;

function prepareSdkJs(contents) {
  return unicodeJs(stripSourceMapComments(contents));
}

function stripSourceMapComments(contents) {
  return contents.replace(rSourceMap, '');
}

function unicodeJs(contents) {
  return contents.replace(
    /([\u4E00-\u9FA5]|[\uFE30-\uFFA0]|[\u2019])/g,
    function (_, value) {
      return '\\u' + value.charCodeAt(0).toString(16);
    }
  );
}

module.exports = {
  prepareSdkJs,
  stripSourceMapComments,
  unicodeJs
};
