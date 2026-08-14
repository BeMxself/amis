const path = require('path');

const rCssUrl = /url\((['"]?)(?!data:|https?:|\/\/|#|\/)([^)'"]+)\1\)/gi;

function rewriteSdkCssUrls(code, options) {
  options = options || {};

  if (!options.from) {
    throw new Error('rewriteSdkCssUrls requires an asset path in options.from.');
  }

  const fromDir = path.posix.dirname(options.from);
  const sdkBaseDir = options.sdkBaseDir || './thirds';

  return code.replace(rCssUrl, function (match, quote, url) {
    const sdkUrl = joinSdkUrl(sdkBaseDir, fromDir, url);

    return `url(${quote}${sdkUrl}${quote})`;
  });
}

function joinSdkUrl(baseDir, fromDir, url) {
  const joined = path.posix.join(baseDir, fromDir, url);

  return baseDir.startsWith('./') && !joined.startsWith('./')
    ? './' + joined
    : joined;
}

module.exports = {
  rewriteSdkCssUrls
};
