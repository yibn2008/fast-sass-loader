'use strict'

const path = require('path')
const ExtractTextPlugin = require('extract-text-webpack-plugin')
const loader = require.resolve('../../..')
const cssLoader = require.resolve('css-loader')

module.exports = {
  context: path.join(__dirname),
  entry: {
    index: './actual/index.scss',
  },
  output: {
    path: path.join(__dirname, '../../runtime/withTransformer'),
    filename: '[name].js'
  },
  module: {
    rules: [
      {
        test: /\.(scss|sass)$/,
        use: ExtractTextPlugin.extract({
          use: [
            cssLoader,
            {
              loader: loader,
              options: {
                transformers: [{
                  extensions: ['.color'],
                  transform: function(rawFile) {
                    return '$' + rawFile + ';'
                  }
                }],
              }
            }
          ]
        })
      }
    ]
  },
  plugins: [
    new ExtractTextPlugin('[name].css')
  ]
}
