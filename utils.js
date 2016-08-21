'use strict'

const fs = require('fs')

const utils = {
  fstat(file) {
    try {
      return fs.statSync(file)
    } catch (err) {
      return false
    }
  }
}

module.exports = utils
