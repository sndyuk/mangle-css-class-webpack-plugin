var path = require('path');
var fs = require('fs');
var webpack = require('webpack');
var rimraf = require('rimraf');
var webpackMajorVersion = Number(require('webpack/package.json').version.split('.')[0]);
if (webpackMajorVersion < 4) {
  var CommonsChunkPlugin = require('webpack/lib/optimize/CommonsChunkPlugin');
}
const MangleCssClassPlugin = require('../index.js');
const ClassGenerator = require('../lib/classGenerator');

const OUTPUT_DIR = path.join(__dirname, '../dist');

const testPlugin = (webpackConfig, expectedResults, done, expectErrors, expectWarnings) => {
  if (webpackMajorVersion >= 4) {
    webpackConfig.mode = 'development';
    if (webpackConfig.module && webpackConfig.module.loaders) {
      webpackConfig.module.rules = webpackConfig.module.loaders;
      delete webpackConfig.module.loaders;
    }
  }
  if (webpackConfig.__commonsChunk) {
    if (webpackMajorVersion < 4) {
      webpackConfig.plugins = webpackConfig.plugins || [];
      webpackConfig.plugins.unshift(new CommonsChunkPlugin(webpackConfig.__commonsChunk));
    } else {
      webpackConfig.optimization = transformCommonChunkConfigToOptimization(webpackConfig.__commonsChunk);
    }
    delete webpackConfig.__commonsChunk;
  }
  webpack(webpackConfig, (err, stats) => {
    expect(err).toBeFalsy();
    var compilationErrors = (stats.compilation.errors || []).join('\n');
    if (expectErrors) {
      expect(compilationErrors).not.toBe('');
    } else {
      expect(compilationErrors).toBe('');
    }
    var compilationWarnings = (stats.compilation.warnings || []).join('\n');
    if (expectWarnings) {
      expect(compilationWarnings).not.toBe('');
    } else {
      expect(compilationWarnings).toBe('');
    }
    var outputFileExists = fs.existsSync(path.join(OUTPUT_DIR, webpackConfig.output.filename));
    expect(outputFileExists).toBe(true);
    if (!outputFileExists) {
      return done();
    }
    var content = fs.readFileSync(path.join(OUTPUT_DIR, webpackConfig.output.filename)).toString();
    for (var i = 0; i < expectedResults.length; i++) {
      var expectedResult = expectedResults[i];
      if (expectedResult instanceof RegExp) {
        expect(content).toMatch(expectedResult);
      } else {
        expect(content).toContain(expectedResult);
      }
    }
    done();
  });
}

const defaultCssClassRegExp = '[cl]-[a-z][a-zA-Z0-9_]*';

describe('MangleCssClassPlugin', () => {
  beforeEach((done) => {
    rimraf(OUTPUT_DIR, done);
  });

  it('replace a css class', (done) => {
    testPlugin({
      entry: [path.join(__dirname, 'fixtures/case1.js')],
      output: {
        path: OUTPUT_DIR,
        filename: 'case1.js',
      },
      plugins: [new MangleCssClassPlugin({
        classNameRegExp: defaultCssClassRegExp,
        log: true,
      })]
    }, ["<p class=\\\"a\\\">l-a</p>"], done);
  });

  it('replace multiple css classes with css and html', (done) => {
    testPlugin({
      entry: path.join(__dirname, 'fixtures/case2.js'),
      output: {
        path: OUTPUT_DIR,
        filename: 'case2.js'
      },
      module: {
        rules: [
          {
            test: /\.css$/,
            use: ['style-loader', 'css-loader']
          },
          {
            test: /\.html$/,
            use: {
              loader: 'html-loader',
            }
          },
        ]
      },
      plugins: [new MangleCssClassPlugin({
        classNameRegExp: defaultCssClassRegExp,
        log: true,
      })]
    }, [".a {\\\\n  width: '100%';\\\\n}", "<div class=\\\\\\\"a\\\\\\\">", "<p class=\\\"a b a\\\"><div /><a class=\\\"b\\\">l-a</p>"], done);
  });

  it('ensure ignore custom classname prefixes', (done) => {
    testPlugin({
      entry: path.join(__dirname, 'fixtures/case3.js'),
      output: {
        path: OUTPUT_DIR,
        filename: 'case3.js'
      },
      module: {
        rules: [
          {
            test: /\.css$/,
            use: ['style-loader', 'css-loader']
          },
          {
            test: /\.html$/,
            use: {
              loader: 'html-loader',
            }
          },
        ]
      },
      plugins: [new MangleCssClassPlugin({
        classNameRegExp: '(xs:|md:)?[cl]-[a-z][a-zA-Z0-9_]*',
        ignorePrefix: ['xs:', 'md:'],
        log: true,
      })]
    }, ["<div class=\\\\\\\"a xs:a md:b\\\\\\\">\\\\n      <p>l-a</p>\\\\n      <p>md:l-b</p>\\\\n    </div>"], done);
  });

  it('do not have dupplicate class name', (done) => {
    const classes = new Set()
    const classGenerator = new ClassGenerator()
    const n = 40
    for (let i = 0; i < n; i++) {
      for (let j = 0; j < n; j++) {
        for (let k = 0; k < n; k++) {
          const className = classGenerator.generateClassName(`l-${i}-${j}-${k}`, { log: false })
          classes.add(className.name)
        }
      }
    }
    console.log('Generated class size:', classes.size)
    expect(classes.size).toBe(Math.pow(n, 3));
    expect(classes).toContain('a');
    expect(classes).toContain('_');
    expect(classes).toContain('a9');
    expect(classes).toContain('aaa');
    expect(classes).toContain('_99');
    done();
  });

  it('do not use reserved class names', (done) => {
    const reservedClassNames = ['b', 'd']
    const classes = new Set()
    const classGenerator = new ClassGenerator()
    const n = 3
    for (let i = 0; i < n; i++) {
      for (let j = 0; j < n; j++) {
        for (let k = 0; k < n; k++) {
          const className = classGenerator.generateClassName(`l-${i}-${j}-${k}`, {
            reserveClassName: reservedClassNames,
            log: true
          })
          classes.add(className.name)
        }
      }
    }
    console.log('Generated class size:', classes.size)
    expect(classes.size).toBe(Math.pow(n, 3));
    expect(classes).toContain('a');
    expect(classes).not.toContain('b');
    expect(classes).toContain('c');
    expect(classes).not.toContain('d');
    expect(classes).toContain('e');
    done();
  });

  it('ignore escape char in class name', (done) => {
    const classGenerator = new ClassGenerator()
    const classNameWithEscape = classGenerator.generateClassName(`l-\\/a\\/b`, {
      log: true
    })
    const classNameWithoutEscape = classGenerator.generateClassName(`l-/a/b`, {
      log: true
    })
    expect(classNameWithEscape.name).toBe(classNameWithoutEscape.name);
    done();
  });
});
