'use strict'

const assert = require('assert')
const fs = require('fs')
const path = require('path')
const webpack = require('webpack')
const config = require('./fixtures/webpack.config.js')
const compiler = webpack(config)

describe('test sass-loader', function () {
  it('should load normal sass file', function (done) {
    this.timeout(10000)

    compiler.run((err, stats) => {
      if (err) {
        console.log(err)
      }

      let css = fs.readFileSync(path.join(__dirname, 'runtime/index.css'), 'utf8')
      let expect = fs.readFileSync(path.join(__dirname, 'fixtures/expect.css'), 'utf8')

      assert.equal(css, expect)

      done()
    })
  })
})
