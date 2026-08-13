const {
  createRollupResourceMap,
  createResourceMapScript
} = require('./rollup-resource-map');

function sdkResourceMapPlugin(options) {
  options = options || {};

  return {
    name: 'sdk-resource-map',
    generateBundle(outputOptions, bundle) {
      const resourceMap = createRollupResourceMap(bundle, options);
      const source = createResourceMapScript(resourceMap, options);

      this.emitFile({
        type: 'asset',
        fileName: options.fileName || 'resource-map.js',
        source
      });
    }
  };
}

module.exports = {
  sdkResourceMapPlugin
};
