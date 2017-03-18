'use strict'

const assert = require('assert')
const fs = require('fs')
const path = require('path')
const webpack = require('webpack')
const utils = require('../lib/utils')
const config = require('./fixtures/webpack.config.js')
const compiler = webpack(config)

describe('test sass-loader', function () {
  it('should load normal sass file', function (done) {
    this.timeout(10000)

    let runtimeDir = path.join(__dirname, 'runtime')
    if (!utils.fstat(runtimeDir)) {
      fs.mkdirSync(runtimeDir)
    }

    compiler.run((err, stats) => {
      if (err) {
        console.log(err)
      }

      assert.equal(stats.errors, undefined)

      let css = fs.readFileSync(path.join(__dirname, 'runtime/index.css'), 'utf8')
      let expect = fs.readFileSync(path.join(__dirname, 'fixtures/expect.css'), 'utf8')

      assert.equal(css, expect)

      done()
    })
  })
})
