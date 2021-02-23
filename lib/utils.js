const fs = require('fs')

function isObject (item) {
  return item && typeof item === 'object' && !Array.isArray(item)
}
function mergeDeep (target, ...sources) {
  if (!sources.length) return target
  const source = sources.shift()

  if (isObject(target) && isObject(source)) {
    for (const key in source) {
      if (isObject(source[key])) {
        if (!target[key]) Object.assign(target, { [key]: {} })
        mergeDeep(target[key], source[key])
      } else {
        Object.assign(target, { [key]: source[key] })
      }
    }
  }

  return mergeDeep(target, ...sources)
}
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

    while ((matches = startRule.exec(text))) {
      // eslint-disable-line
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
  },
  mergeDeep
}

module.exports = utils
