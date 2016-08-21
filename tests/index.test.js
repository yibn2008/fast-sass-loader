'use strict'

const assert = require('assert')
const webpack = require('webpack')
const config = require('./fixtures/webpack.config.js')
const compiler = webpack(config)

describe('test sass-loader', function () {
  it('should load normal sass file', function (done) {
    compiler.run((err, stats) => {
      if (err) {
        console.log(err)
      } else {
        console.log(stats.toString())
      }

      done()
    })
  })
})
