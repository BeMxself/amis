const sdkRuntimeAssets = [
  {
    moduleId: 'hls.js',
    file: 'thirds/hls.js/hls.js',
    sourceFile: 'node_modules/hls.js/dist/hls.min.js',
    format: 'commonjs-umd'
  },
  {
    moduleId: 'mpegts.js',
    file: 'thirds/mpegts.js/mpegts.js',
    sourceFile: 'node_modules/mpegts.js/dist/mpegts.js',
    format: 'commonjs-umd'
  },
  {
    moduleId: 'node_modules/pdfjs-dist/build/pdf.mjs',
    file: 'thirds/pdfjs-dist/build/pdf.js',
    sourceFile: 'node_modules/pdfjs-dist/build/pdf.mjs',
    format: 'pdfjs-esm',
    includeAsDependency: true
  }
];

function getSdkRuntimeResourceEntries(basePathExpression) {
  return sdkRuntimeAssets.map(asset => ({
    moduleId: asset.moduleId,
    url: `${basePathExpression} + ${JSON.stringify('/' + asset.file)}`,
    type: 'js',
    includeAsDependency: asset.includeAsDependency
  }));
}

module.exports = {
  getSdkRuntimeResourceEntries,
  sdkRuntimeAssets
};
