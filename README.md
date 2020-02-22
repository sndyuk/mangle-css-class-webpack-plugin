[![Build Status](https://travis-ci.org/sndyuk/mangle-css-class-webpack-plugin.svg?branch=master)](https://travis-ci.org/sndyuk/mangle-css-class-webpack-plugin)

<div align="center">
  <a href="https://github.com/webpack/webpack">
    <img width="100" height="100"
      src="https://raw.githubusercontent.com/webpack/media/master/logo/icon-square-big.png">
  </a>
  <h1>mangle-css-class-webpack-plugin</h1>
  <p>Minifies and obfuscates the class names in JavaScript, CSS, and HTML</p>
</div>

<h2 align="center">Install</h2>

```bash
  npm i --save-dev mangle-css-class-webpack-plugin
```

```bash
  yarn add --dev mangle-css-class-webpack-plugin
```

<h2 align="center">Usage</h2>

The plugin will generate optimized class name in HTML, JavaScript, and CSS files.
configure as follows:

**webpack.config.js**
```js
const MangleCssClassPlugin = require('mangle-css-class-webpack-plugin');

module.exports = {
  ...
  plugins: [
    new MangleCssClassPlugin({
      classNameRegExp: '[cl]-[a-z][a-zA-Z0-9_]*',
      log: true,
    }),
  ],
};
```

This will replace class name matched regex in HTML, JavaScript, CSS files. Identify the class names not to match unexpected words since it replaces all words that are matched with the `classNameRegExp`.
I suggest that your class names have specific prefix or suffix that identified as a class name.

### Options
#### classNameRegExp
e.g. `'(abc-|efg-)?[cl]-[a-z][a-zA-Z0-9_]*'`  
the sample regexp maches `l-main`, `c-textbox`, `l-main__header`, `abc-textbox__input`, and so on...  

If you want to use the back slash `\` on the regexp, use `\\\\\\\\\\\\\\\\` and `\\\\` to match class names contained both JS and CSS.

#### ignorePrefix
The prefix will be ignored from mangling.  
e.g.
```js
classNameRegExp: '(abc-|efg-)?[cl]-[a-z][a-zA-Z0-9_]*',
ignorePrefixRegExp: ['abc-', 'efg-'],
```
In this case, `abc-c-textbox__input` becomes `abc-a`.

#### ignorePrefixRegExp
Same behavior as ignorePrefix.  
e.g.
```js
classNameRegExp: '((hover|focus|xs|md|sm|lg|xl)(\\\\\\\\\\\\\\\\|\\\\)?:)*tw-[a-z_-][a-zA-Z0-9_-]*',
ignorePrefixRegExp: '((hover|focus|xs|md|sm|lg|xl)(\\\\\\\\\\\\\\\\|\\\\)?:)*',
```
In this case, `hover\:xs\:c-textbox__input` becomes `hover\:xs\:a`.

### Example
#### Source code
```html
<!-- html -->
<main class='l-abc'>
  <div class='l-efg' />
</main>
```

```js
// js
document.querySelector('l-efg');
```

```css
// css
.l-abc {
}
.l-abc .l-efg {
}
```

#### Output code

```html
<!-- html -->
<main class='a'>
  <div class='b' />
</main>
```

```js
// js
document.querySelector('b');
```

```css
// css
.a {
}
.a .b {
}
```
