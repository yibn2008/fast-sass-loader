'use strict'

const path = require('path')
const fs = require('fs-promise')
const co = require('co')
const resolve = require('resolve')

const loader = require('..')

function mockWebpackResolve(dir, file, callback) {
  let resolved

  if (file[0] === '~') {
    resolved = resolve.sync(file.substring(1), {
      basedir: dir
    })
  } else {
    resolved = path.join(dir, file)
  }

  fs.statSync(resolved)

  callback(null, resolved)
}


function mockContext (callback) {
  let ctx = {}

  ctx.async = function () {
    return function (err, css) {
      if (err) {
        console.log('ERR: ', err.stack || err)
      } else {
        console.log('CSS: ', css)
      }

      if (callback) {
        callback(err, css)
      }
    }
  }

  ctx.resourcePath = path.join(__dirname, 'fixtures/actual/index.scss')
  ctx.cacheable = function () {}
  ctx.resolve = mockWebpackResolve
  ctx.dependency = function (file) {
    //
  }

  return ctx
}

let ctx = mockContext()

loader.call(ctx, fs.readFileSync(ctx.resourcePath, 'utf8'))
