const chalk = require('./chalk');

const acceptPrefix = 'abcdefghijklmnopqrstuvwxyz_'.split('');
const acceptChars = 'abcdefghijklmnopqrstuvwxyz_-0123456789'.split('');

function ClassGenerator() {
    this.newClassMap = {};
    this.newClassSize = 0;
}

ClassGenerator.prototype = {
  generateClassName: function(original, opts) {
    const cn = this.newClassMap[original];
    if (cn) return cn;

    const chars = []
    let rest = (this.newClassSize - (this.newClassSize % acceptPrefix.length)) / acceptPrefix.length
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
    let prefixIndex = this.newClassSize % acceptPrefix.length

    const newClassName = `${acceptPrefix[prefixIndex]}${chars.join('')}`
    if (opts.reserveClassName && opts.reserveClassName.includes(newClassName)) {
      if (opts.log) {
        console.log(`The class name has been reserved. ${chalk.green(newClassName)}`);
      }
      this.newClassSize++;
      return this.generateClassName(original, opts)
    }
    if (opts.log) {
      console.log(`Minify class name from ${chalk.green(original)} to ${chalk.green(newClassName)}`);
    }
    const newClass = {
      name: newClassName,
      usedBy: [],
    };
    this.newClassMap[original] = newClass;
    this.newClassSize++;
    return newClass;
  }
}

module.exports = ClassGenerator
