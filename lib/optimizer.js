const { ReplaceSource } = require('webpack-sources');
const chalk = require('./chalk');

const newClassMap = {};
let newClassSize = 0;

const reservedPrefixMap = {}
const acceptChars = 'abcdefghijklmnopqrstuvwxyz'.split('');
const acceptSuffixes = 'abcdefghijklmnopqrstuvwxyz0123456789'.split('');
const maximumClassNames = acceptChars.length * acceptSuffixes.length;

const generateClassName = (original, opts) => {
  const cn = newClassMap[original];
  if (cn) return cn;

  const acceptCharsIndex = newClassSize % acceptChars.length;
  const prefix = acceptChars[acceptCharsIndex];
  const reservedPrefixCount = reservedPrefixMap[acceptCharsIndex] || 0;
  let newClassName;
  if (reservedPrefixCount === 0) {
    newClassName = prefix;
    reservedPrefixMap[acceptCharsIndex] = 1;
  } else {
    newClassName = prefix + acceptSuffixes[reservedPrefixCount - 1];
    reservedPrefixMap[acceptCharsIndex]++;
  }
  newClassSize++;
  if (newClassSize > maximumClassNames) {
    throw Error('Maximum class names generated. Change the generator.');
  }
  if (opts.log) {
    console.log(`Minify class name from ${chalk.green(original)} to ${chalk.green(newClassName)}`);
  }
  const newClass = {
    name: newClassName,
    usedBy: [],
  };
  newClassMap[original] = newClass;
  return newClass;
};

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
    newClass = generateClassName(originalName, opts);
    if (!source) source = new ReplaceSource(originalSource);
    const startPos = match.index + match[0].indexOf(match[1]);
    newClass.usedBy.push(`${file}:${startPos}`);
    source.replace(startPos, startPos + originalName.length - 1, newClass.name);
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
