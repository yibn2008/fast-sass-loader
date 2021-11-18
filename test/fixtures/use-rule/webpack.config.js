'use strict'

const path = require('path')
const ExtractTextPlugin = require('extract-text-webpack-plugin')
const loader = require.resolve('../../..')
const cssLoader = require.resolve('css-loader')

module.exports = {
  context: path.join(__dirname),
  entry: {
    index: './index.scss'
  },
  output: {
    path: path.join(__dirname, '../../runtime/use-rule'),
    filename: '[name].js'
  },
  module: {
    rules: [
      {
        test: /\.(scss|sass)$/,
        use: ExtractTextPlugin.extract({
          use: [
            cssLoader,
            loader
          ]
        })
      },
      {
        test: /\.png$/,
        loader: 'file-loader?name=[path][name].[ext]'
      }
    ]
  },
  plugins: [
    new ExtractTextPlugin('[name].css')
  ]
}
