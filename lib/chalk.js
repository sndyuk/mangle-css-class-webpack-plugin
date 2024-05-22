let chalk;
try {
  chalk = require('chalk');
} catch (_) {
  chalk = {
    green: (str) => str,
    yellow: (str) => str,
    red: (str) => str,
  }
}

module.exports = chalk;
