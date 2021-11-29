const optimizer = require('./optimizer');

const runner = (compiler, compilation, opts) => {
  const optimize = optimizer(compiler, compilation, opts);
  return (chunks, callback) => {
    optimize(chunks);
    callback();
  };
}

class Plugin {
  constructor(opts = {}) {
    this.opts = opts;
  }

  apply(compiler) {
    if (compiler.hooks) {
      compiler.hooks.compilation.tap(
        'MangleCssClassPluginHooks',
        (compilation) => {
          if (compilation.hooks.processAssets) {
            // setup hooks for webpack >= 5
            compilation.hooks.processAssets.tapAsync('MangleCssClassPluginOptimizeChunkAssetsHooks', runner(compiler, compilation, this.opts));
          } else {
            // setup hooks for webpack >= 4
            compilation.hooks.optimizeChunkAssets.tapAsync('MangleCssClassPluginOptimizeChunkAssetsHooks', runner(compiler, compilation, this.opts));
          }
        }
      );
    } else {
      // setup hooks for webpack <= 3
      compiler.plugin('compilation', (compilation) => {
        compilation.plugin('optimize-chunk-assets', runner(compiler, compilation, this.opts));
      });
    }
  }
}

module.exports = Plugin;
