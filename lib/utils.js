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
    let ranges = []
    let ruleMap = {
      '//': '\n',
      '/*': '*/'
    }
    let startRule = /\/\/|\/\*/g
    let matches

    while (matches = startRule.exec(text)) {  // eslint-disable-line
      let endChars = ruleMap[matches[0]]
      let start = startRule.lastIndex - matches[0].length
      let end = text.indexOf(endChars, startRule.lastIndex)

      if (end < 0) {
        end = Infinity
      }

      ranges.push([ start, end ])

      startRule.lastIndex = end
    }

    return ranges
  }
}

module.exports = utils
