# fast-sass-loader

fast sass loader for webpack. 5~10 times faster than **sass-loader**, and support url resolve.

## vs sass-loader

| Features      | fast-sass-loader | sass-loader                             |
|---------------|------------------|-----------------------------------------|
| Performance   | Fast (5~10 times)| Slow                                    |
| Sass Dedupe   | ✓                | ×                                       |
| Url Resolve   | ✓                | × (need resolve-url-loader, it's buggy) |
| Loader Config | ×                | ✓                                       |
| Source Map    | ×                | ✓                                       |
| Internal Cache| ✓                | ×                                       |


## install

install by npm:

```javascript
npm install fast-sass-loader --save-dev
```

and you need install **node-sass** and **webpack** as peer dependencies.

## configration

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

## License

MIT
