'use strict'

const fs = require('fs')

const utils = {
  fstat (file) {
    try {
      return fs.statSync(file)
    } catch (err) {
      return false
    }
  },
  findComments (text) {
    const ranges = []
    const ruleMap = {
      '//': '\n',
      '/*': '*/'
    }
    const startRule = /\/\/|\/\*/g
    let matches

    while (matches = startRule.exec(text)) {  // eslint-disable-line
      const endChars = ruleMap[matches[0]]
      const start = startRule.lastIndex - matches[0].length
      let end = text.indexOf(endChars, startRule.lastIndex)

      if (end < 0) {
        end = Infinity
      }

      ranges.push([start, end])

      startRule.lastIndex = end
    }

    return ranges
  }
}

module.exports = utils
