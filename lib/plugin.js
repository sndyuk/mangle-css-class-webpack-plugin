const optimizer = require('./optimizer');
let HtmlWebpackPlugin = null;
try {
  HtmlWebpackPlugin = require('html-webpack-plugin');
} catch {
  // ignore
}

const runner = (opts) => {
  const optimize = optimizer(opts);
  return (compiler, compilation, chunks, callback) => {
    optimize(compiler, compilation, chunks);
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
        if (!this.fn) {
          this.fn = runner(this.opts);
        }
        if (HtmlWebpackPlugin) {
          HtmlWebpackPlugin.getHooks(compilation).afterEmit.tapAsync(
            'MangleCssClassPluginOptimizeChunkAssetsHooks',
            (data, callback) => {
              this.fn(compiler, compilation, { [data.outputName]: compilation.assets[data.outputName] }, callback);
            },
          );
        }
        compilation.hooks.processAssets.tapAsync('MangleCssClassPluginOptimizeChunkAssetsHooks', (chunks, callback) => this.fn(compiler, compilation, chunks, callback));
      }
    );
  }
}

module.exports = Plugin;
