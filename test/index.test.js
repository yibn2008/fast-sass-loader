'use strict'

const assert = require('assert')
const fs = require('fs')
const path = require('path')
const webpack = require('webpack')
const rmdir = require('rimraf')
const utils = require('../lib/utils')

function clearCRLF (raw) {
  return raw.replace(/\r/g, '').trim()
}

function handleError (err, stats, done) {
  if (err) {
    console.error(err.stack || err)
    if (err.details) {
      console.error(err.details)
    }
    done(err)
    return false
  }

  console.log(stats.toString({
    colors: true    // Shows colors in the console
  }))

  const info = stats.toJson()
  if (stats.hasErrors()) {
    done(info.errors)
    return false
  }

  return true
}

function runSimpleTest(done, fixtureName) {
  const config = require('./fixtures/' + fixtureName + '/webpack.config.js')
  const compiler = webpack(config)

  compiler.run((err, stats) => {
    if (!handleError(err, stats, done)) {
      return
    }

    try {
      assert.equal(stats.errors, undefined)

      let css = fs.readFileSync(path.join(__dirname, 'runtime/' + fixtureName + '/index.css'), 'utf8')
      let expect = fs.readFileSync(path.join(__dirname, 'fixtures/' + fixtureName + '/expect.css'), 'utf8')

      assert.equal(clearCRLF(css), clearCRLF(expect))

      done()
    } catch (err) {
      done(err)
    }
  })
}

describe('test sass-loader', function () {
  this.timeout(10000)

  const runtimeDir = path.join(__dirname, 'runtime')

  beforeEach(done => {
    rmdir(runtimeDir, done)
  })

  it('should load normal sass file', function (done) {
    const config = require('./fixtures/normal/webpack.config.js')
    const compiler = webpack(config)

    compiler.run((err, stats) => {
      if (!handleError(err, stats, done)) {
        return
      }

      try {
        assert.equal(stats.errors, undefined)

        let css = fs.readFileSync(path.join(__dirname, 'runtime/normal/index.css'), 'utf8')
        let expect = fs.readFileSync(path.join(__dirname, 'fixtures/normal/expect.css'), 'utf8')

        assert.equal(clearCRLF(css), clearCRLF(expect))

        let css2 = fs.readFileSync(path.join(__dirname, 'runtime/normal/index2.css'), 'utf8')
        let expect2 = fs.readFileSync(path.join(__dirname, 'fixtures/normal/expect2.css'), 'utf8')

        assert.equal(clearCRLF(css2), clearCRLF(expect2))
        done()
      } catch (err) {
        done(err)
      }
    })
  })

  it('should load sass file with data option', function (done) {
    const config = require('./fixtures/withData/webpack.config.js')
    const compiler = webpack(config)

    compiler.run((err, stats) => {
      if (!handleError(err, stats, done)) {
        return
      }

      try {
        assert.equal(stats.errors, undefined)

        let css = fs.readFileSync(path.join(__dirname, 'runtime/withData/index.css'), 'utf8')
        let expect = fs.readFileSync(path.join(__dirname, 'fixtures/withData/expect.css'), 'utf8')

        assert.equal(clearCRLF(css), clearCRLF(expect))

        done()
      } catch (err) {
        done(err)
      }
    })
  })

  it('should compile without options', function (done) {
    runSimpleTest(done, 'simple')
  })

  it.only('should auto remove BOM header', function (done) {
    runSimpleTest(done, 'bom-issue')
  })

  it('should resolve files with double extensions', function (done) {
    runSimpleTest(done, 'double-extensions')
  })

  it('should be able to import non sass files with a passed transformer', function(done) {
    runSimpleTest(done, 'withTransformer')
  })
})
