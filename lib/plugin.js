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
      // setup hooks for webpack >= 4
      compiler.hooks.compilation.tap('MangleCssClassPluginHooks', compilation => {
        compilation.hooks.optimizeChunkAssets.tapAsync('MangleCssClassPluginOptimizeChunkAssetsHooks', runner(compiler, compilation, this.opts));
      });
    } else {
      // setup hooks for webpack <= 3
      compiler.plugin('compilation', (compilation) => {
        compilation.plugin('optimize-chunk-assets', runner(compiler, compilation, this.opts));
      });
    }
  }
}

module.exports = Plugin;
