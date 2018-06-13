const optimizer = require('./optimizer');

const runner = (compiler, compilation) => {
  const optimize = optimizer(compiler, compilation);
  return (chunks, callback) => {
    optimize(chunks);
    callback();
  };
}

class Plugin {
  apply(compiler) {
    if (compiler.hooks) {
      // setup hooks for webpack >= 4
      compiler.hooks.compilation.tap('MangleCssClassPluginHooks', compilation => {
        compilation.hooks.optimizeChunkAssets.tapAsync('MangleCssClassPluginOptimizeChunkAssetsHooks', runner(compiler, compilation));
      });
    } else {
      // setup hooks for webpack <= 3
      compiler.plugin('compilation', (compilation) => {
        compilation.hook('optimize-chunk-assets', runner(compiler, compilation));
      });
    }
  }
}

module.exports = Plugin;
