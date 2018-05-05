# fast-sass-loader

[![Build Status](https://travis-ci.org/yibn2008/fast-sass-loader.svg?branch=master)](https://travis-ci.org/yibn2008/fast-sass-loader)
[![Coverage Status](https://coveralls.io/repos/github/yibn2008/fast-sass-loader/badge.svg)](https://coveralls.io/github/yibn2008/fast-sass-loader)

Blazingly fast sass loader for webpack.

*Tips: using with [fast-css-loader](https://github.com/yibn2008/fast-css-loader) you will get more than 10 times css build performance*

Features:

- 5~10 times faster than `sass-loader` in large sass project
- support sass file dedupe, never worry about `@import` same file in different place
- support url resolve, never worry about the problem with `url(...)` (see https://github.com/webpack-contrib/sass-loader#problems-with-url)

fast sass loader for webpack. 5~10 times faster than **sass-loader**, and support url resolve.

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

performance benchmark (run `npm run perf`):

![image](https://user-images.githubusercontent.com/4136679/39662788-e99dfa2c-5099-11e8-8e95-d09b68df437c.png)

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

### webpack 2, 3 and 4:

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
            options: {
              includePaths: [ ... ]
            }
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

## Options

### includePaths:

An array of paths that [node-sass](https://github.com/sass/node-sass) can look in to attempt to resolve your @import declarations. When using data, it is recommended that you use this.

### data:
If you want to prepend Sass code before the actual entry file, you can set the data option. In this case, the loader will not override the data option but just append the entry's content. This is especially useful when some of your Sass variables depend on the environment:

```javascript
{
    loader: "fast-sass-loader",
    options: {
        data: "$env: " + process.env.NODE_ENV + ";"
    }
}
```

Please note: Since you're injecting code, this will break the source mappings in your entry file. Often there's a simpler solution than this.

### transformers:
If you want to import files that aren't basic Sass or css files, you can use the transformers option. This option takes an array of transformer entries, each with a list of file extensions and a tranform function. If an imported file's extension matches one of the transformers' extensions, the file contents will be passed to the corresponding transform function. Your transform function should return a sass string that will be directly written into your compiled Sass file. This is especially useful if you use .json files to share your basic styles across platforms and you'd like to import your .json files directly into your Sass.
```javascript
{
    loader: "fast-sass-loader",
    options: {
        transformers: [
            {
                extensions: [".json"],
                transform: function(rawFile) {
                    return jsonToSass(rawFile);
                }
            }
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

h2 { color: $foobar; }

// will output:
// h1 { color: #AAA; }
// h2 { color: #AAA; }
```

You can use variable prefix to bypass.

### Avoid nested @import in sass rules

fast-sass-loader doesn't support `@import` statement in sass rules, for example:

```sass
.a {
  @import 'group'
}

.b {
  @import 'group'
}
```

you should wrap the rules that you want to import with mixin, then include them in your `.a { ... }` or `.b { ... }`

## License

MIT
