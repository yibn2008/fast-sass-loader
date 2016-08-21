# fast-sass-loader

fast sass loader for webpack. 5~10 times faster than **sass-loader**, and support url resolve.

## Notice

fast-sass-loader do not support these features:

- **sourceMap**, fast-ass-loader merge sass files by itself, so the source map will be incorrect.
- **resolve-url-loader**, since fast-sass-loader already support url resolve, resolve-url-loader can be removed from you loader list.

