const { ReplaceSource } = require('webpack-sources');
const chalk = require('./chalk');
const ClassGenerator = require('./classGenerator');

const classGenerator = new ClassGenerator()

const validate = (opts) => {
  if (opts.log) return;
  for (let className in newClassMap) {
    const c = newClassMap[className];
    if (c.usedBy.length > 1) {
      continue;
    }
    if (c.usedBy[0].match(/.+\.css:*$/)) {
      console.log(`The class name '${chalk.yellow(className)}' is not used: defined at ${chalk.yellow(c.usedBy[0])}.`);
    } else {
      console.log(`The class name '${chalk.yellow(className)}' is not defined: used at ${chalk.yellow(c.usedBy[0])}.`);
    }
  }
};

const optimize = (chunk, compilation, opts) => chunk.files.forEach((file) => {
  let classnameRegex;
  if (file.match(/.+\.css.*$/)) {
    classnameRegex = new RegExp(`\\\.(${opts.classNameRegExp})`, 'g');
  } else if (file.match(/.+\.js.*$/) || file.match(/.+\.html.*$/)) {
    classnameRegex = new RegExp(`["'.\\\s](${opts.classNameRegExp})`, 'g');
  }
  if (!classnameRegex) {
    return;
  }
  const originalSource = compilation.assets[file];
  const rawSource = originalSource.source();
  let source;
  while (match = classnameRegex.exec(rawSource)) {
    const originalName = match[1];
    let targetName = originalName

    let originalPrefix = ''
    if (opts.ignorePrefix) {
      let ignorePrefix = opts.ignorePrefix
      if (typeof ignorePrefix === 'string') {
        ignorePrefix = [ignorePrefix]
      }
      for (let i = 0; i < ignorePrefix.length; i++) {
        if (originalName.startsWith(ignorePrefix[i])) {
          if (opts.log) {
            console.log(`Skip the prefix ${chalk.red(ignorePrefix[i])} of ${chalk.green(originalName)}`);
          }
          targetName = originalName.substr(ignorePrefix[i].length)
          originalPrefix = ignorePrefix[i]
          break
        }
      }
    }

    newClass = classGenerator.generateClassName(targetName, opts);
    if (!source) source = new ReplaceSource(originalSource);
    const startPos = match.index + match[0].indexOf(match[1]);
    newClass.usedBy.push(`${file}:${startPos}`);
    const newClassName = `${originalPrefix}${newClass.name}`
    source.replace(startPos, startPos + originalName.length - 1, newClassName);
  }
  if (!source) {
    return;
  }
  compilation.assets[file] = source;
});

const optimizer = (compiler, compilation, opts) => (chunks) => {
  if (!opts.classNameRegExp) throw new Error("'classNameRegExp' option is required. e.g. '[c]-[a-z][a-zA-Z0-9_]*'");

  chunks.forEach((chunk) => optimize(chunk, compilation, opts));
  validate(opts);
}

module.exports = optimizer;
