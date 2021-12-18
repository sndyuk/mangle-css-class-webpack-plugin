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
    compiler.hooks.compilation.tap(
      'MangleCssClassPluginHooks',
      (compilation) => {
        compilation.hooks.processAssets.tapAsync('MangleCssClassPluginOptimizeChunkAssetsHooks', runner(compiler, compilation, this.opts));
      }
    );
  }
}

module.exports = Plugin;
