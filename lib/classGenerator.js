const chalk = require('./chalk');

const newClassMap = {};
let newClassSize = 0;

const acceptPrefix = 'abcdefghijklmnopqrstuvwxyz_'.split('');
const acceptChars = 'abcdefghijklmnopqrstuvwxyz_-0123456789'.split('');

const generateClassName = (original, opts) => {
  const cn = newClassMap[original];
  if (cn) return cn;

  const chars = []
  let rest = (newClassSize - (newClassSize % acceptPrefix.length)) / acceptPrefix.length
  if (rest > 0) {
    while (true) {
      rest -= 1
      const m = rest % acceptChars.length
      const c = acceptChars[m]
      chars.push(c)
      rest -= m 
      if (rest === 0) {
        break
      }
      rest /= acceptChars.length
    }
  }
  let prefixIndex = newClassSize % acceptPrefix.length

  const newClassName = `${acceptPrefix[prefixIndex]}${chars.join('')}`
  if (opts.log) {
    console.log(`Minify class name from ${chalk.green(original)} to ${chalk.green(newClassName)}`);
  }
  const newClass = {
    name: newClassName,
    usedBy: [],
  };
  newClassMap[original] = newClass;
  newClassSize++;
  return newClass;
};

module.exports = {
  generateClassName: generateClassName
}
