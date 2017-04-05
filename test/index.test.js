'use strict'

const assert = require('assert')
const fs = require('fs')
const path = require('path')
const webpack = require('webpack')
const utils = require('../lib/utils')

function clearCRLF (raw) {
  return raw.replace(/\r/g, '').trim()
}

describe('test sass-loader', function () {
  this.timeout(10000)

  it('should load normal sass file', function (done) {
    const config = require('./fixtures/normal/webpack.config.js')
    const compiler = webpack(config)

    let runtimeDir = path.join(__dirname, 'runtime')
    if (!utils.fstat(runtimeDir)) {
      fs.mkdirSync(runtimeDir)
    }

    compiler.run((err, stats) => {
      if (err) {
        console.error(err)
      }

      assert.equal(stats.errors, undefined)

      let css = fs.readFileSync(path.join(__dirname, 'runtime/normal/index.css'), 'utf8')
      let expect = fs.readFileSync(path.join(__dirname, 'fixtures/normal/expect.css'), 'utf8')

      assert.equal(clearCRLF(css), clearCRLF(expect))

      let css2 = fs.readFileSync(path.join(__dirname, 'runtime/normal/index2.css'), 'utf8')
      let expect2 = fs.readFileSync(path.join(__dirname, 'fixtures/normal/expect2.css'), 'utf8')

      assert.equal(clearCRLF(css2), clearCRLF(expect2))

      done()
    })
  })

  it('should compile without options', function (done) {
    const config = require('./fixtures/simple/webpack.config.js')
    const compiler = webpack(config)

    let runtimeDir = path.join(__dirname, 'runtime')
    if (!utils.fstat(runtimeDir)) {
      fs.mkdirSync(runtimeDir)
    }

    compiler.run((err, stats) => {
      if (err) {
        console.error(err)
      }

      assert.equal(stats.errors, undefined)

      let css = fs.readFileSync(path.join(__dirname, 'runtime/simple/index.css'), 'utf8')
      let expect = fs.readFileSync(path.join(__dirname, 'fixtures/simple/expect.css'), 'utf8')

      assert.equal(clearCRLF(css), clearCRLF(expect))

      done()
    })
  })
})
