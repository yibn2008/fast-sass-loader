'use strict'

const path = require('path')
const ExtractTextPlugin = require('extract-text-webpack-plugin')
const loader = require.resolve('../..')
const cssLoader = require.resolve('css-loader')

module.exports = {
  entry: {
    index: './actual/index.scss'
  },
  output: {
    path: path.join(__dirname, '../runtime'),
    filename: '[name].js'
  },
  module: {
    loaders: [
      {
        test: /\.scss$/,
        loader: ExtractTextPlugin.extract([cssLoader, loader])
      }
    ]
  },
  plugins: [
    new ExtractTextPlugin('[name].css')
  ]
}
