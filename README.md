# fast-sass-loader

[![Build Status](https://travis-ci.org/yibn2008/fast-sass-loader.svg?branch=master)](https://travis-ci.org/yibn2008/fast-sass-loader)
[![Coverage Status](https://coveralls.io/repos/github/yibn2008/fast-sass-loader/badge.svg)](https://coveralls.io/github/yibn2008/fast-sass-loader)

High performance sass loader for webpack 1/2.

Features:

- 5~10 times faster than `sass-loader` in large sass project
- support sass file dedupe, never worry about `@ import` same file in different place
- support url resolve, never worry about the problem with `url(...)` (see https://github.com/webpack-contrib/sass-loader#problems-with-url)

fast sass loader for webpack. 5~10 times faster than **sass-loader**, and support url resolve.

**Good News: Now `fast-sass-loader` support webpack 2**

## vs `sass-loader`

| Features      | fast-sass-loader | sass-loader                             |
|---------------|------------------|-----------------------------------------|
| Performance   | Fast (5~10 times)| Slow                                    |
| Sass Dedupe   | ✓                | ×                                       |
| Url Resolve   | ✓                | × (need resolve-url-loader, it's buggy) |
| Loader Config | ×                | ✓                                       |
| Source Map    | ×                | ✓                                       |
| Internal Cache| ✓                | ×                                       |

## Performance

You can execute `npm run perf` to see the performance benchmark:

```text
************** RUN WITH FAST SASS LOADER **************
Hash: 37ed419b014ff87f0461
Version: webpack 2.2.1
Time: 7457ms
        Asset     Size  Chunks                    Chunk Names
dist/index.js  2.67 kB       0  [emitted]         index
    index.css   627 kB       0  [emitted]  [big]  index
   [0] ./index.scss 41 bytes {0} [built]
   [1] ../~/.0.23.1@css-loader/lib/css-base.js 1.51 kB [built]
Child extract-text-webpack-plugin:
       [0] ../~/.0.23.1@css-loader/lib/css-base.js 1.51 kB {0} [built]
       [1] ../~/.0.23.1@css-loader!../lib!./index.scss 648 kB {0} [built]

[build] fast-sass-loader: 9348.760ms


************** RUN WITH SASS LOADER **************
Hash: 0b034e431d1a93826d38
Version: webpack 2.2.1
Time: 64124ms
        Asset     Size  Chunks                    Chunk Names
dist/index.js  2.67 kB       0  [emitted]         index
    index.css  6.95 MB       0  [emitted]  [big]  index
   [0] ./index.scss 41 bytes {0} [built]
   [1] ../~/.0.23.1@css-loader/lib/css-base.js 1.51 kB [built]
Child extract-text-webpack-plugin:
       [0] ../~/.0.23.1@css-loader/lib/css-base.js 1.51 kB {0} [built]
       [1] ../~/.0.23.1@css-loader!../~/.6.0.3@sass-loader/lib/loader.js!./index.scss 7.18 MB {0} [built]

[build] sass-loader: 64892.699ms
```

Since the `sass-loader` doesn't dedupe repeated sass files, the result will be very very large (6.95MB!!!), and the total compile time takes 64.9 seconds (nearly 6 times longer than `fast-sass-loader`).

### Why `fast-sass-loader` is faster than `sass-loader` ?

1. Support sass file dedupe, so `node-sass` won't compile same file repeatedly, the performance improvement is s ignificant when your sass files number grows very large.
2. Before node-sass compile, `fast-sass-loader` will merge all sass files into a single file, so node-sass only need to compile one large file, it's faster than `@importer` of [libsass](https://github.com/sass/libsass).
3. The internal cache will store all result for every entry, only compile sass when related file changed.

## Install

install by npm:

```javascript
npm install fast-sass-loader --save-dev
```

and you need install **node-sass** and **webpack** as peer dependencies.

## Configration

### webpack 2:

```
{
  module: {
    rules: [
      {
        test: /\.(scss|sass)$/,
        use: [
          'css-loader',
          {
            loader: 'fast-sass-loader',
            includePaths: [ ... ]
          }
        ]
      },
      // other loaders ...
    ]
  }
}
```

### webpack 1:

```
{
  module: {
    loaders: [
      {
        test: /\.(scss|sass)$/,
        loader: 'css!fast-sass'
      },
      // other loaders ...
    ]
  }
}
```

## Warning

### Mixing import `.scss` and`.sass` file is not allowed

Since `fast-sass-loader` will parse `@import` and merge all files into single sass file, you cannot import `.scss` file from `.sass` (or opposite).

For example:

```scss
// file: entry.scss
@import "path/to/file.sass";  // cannot import `path/to/file.sass` in a `.scss` file

body {
  background: #FFF;
}
```

### Avoid same variable name in different sass files

Since `fast-sass-loader` will dedupe sass file, later imported file will be ignored. Using same variable name in different sass fill would produce unexpected output.

For example (compile `entry.scss` with fast-sass-loader):

```sass
// a.scss
$foobar: #000;
```

```sass
// b.scss
@import "a.scss";
$foobar: #AAA;

h1 { color: $foobar; }
```

```sass
// entry.scss
@import "b.scss";
@import "a.scss"; // this file will be ignore: $foobar === #AAA

// will output:
// h1 { color: #AAA; }
// h2 { color: #AAA; }
h2 { color: $foobar; }
```

You can use variable prefix to bypass.

## License

MIT
