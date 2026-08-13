function wrapSdkResourceMapWithBasePath(contents, version) {
  return `(function() {
    ${rewriteSdkResourceMapUrls(contents, version)}
        })()`;
}

function rewriteSdkResourceMapUrls(contents, version) {
  return contents.replace(/"url"\s*\:\s*('|")(.\/.*?)\1/g, function (
    _,
    quote,
    value
  ) {
    return `"url": amis['sdk@${version}BasePath'] + ${quote}${value.substring(
      1
    )}${quote}`;
  });
}

module.exports = {
  rewriteSdkResourceMapUrls,
  wrapSdkResourceMapWithBasePath
};
