'use strict'

const path = require('path')
const fs = require('fs-promise')
const preview = require('cli-source-preview')
const replaceAsync = require('./replace')
const co = require('co')
const async = require('async')
const sass = require('node-sass')
const Cache = require('./cache')
const loaderUtils = require('loader-utils')

const EXT_PRECEDENCE = ['.scss', '.sass', '.css'];
const MATCH_URL_ALL = /url\(\s*(['"]?)([^ '"\(\)]+)(\1)\s*\)/g;
const MATCH_IMPORTS = /@import\s+(['"])([^,;'"]+)(\1)(\s*,\s*(['"])([^,;'"]+)(\1))*\s*;/g;
const MATCH_FILES = /(['"])([^,;'"]+)(\1)/g;

function findComments (text) {
  let ranges = []
  let index = 0
  let ruleMap = {
    '//': '\n',
    '/*': '*/'
  }
  let startRule = /\/\/|\/\*/g
  let matches

  while (matches = startRule.exec(text)) {
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

function getImportsToResolve(original) {
  let extname = path.extname(original)
  let basename = path.basename(original, extname)
  let dirname = path.dirname(original)

  let imports = []
  let names = [basename]
  let exts = [extname]

  if (!extname) {
    exts = EXT_PRECEDENCE
  }
  if (basename[0] !== '_') {
    names.push('_' + basename)
  }

  for (let i = 0; i < names.length; i++) {
    for (let j = 0; j < exts.length; j++) {
      imports.push(path.join(dirname, names[i] + exts[j]))
    }
  }

  return imports
}

function getLoaderConfig(loaderContext) {
  let query = loaderUtils.parseQuery(loaderContext.query);
  let configKey = query.config || 'sassLoader';
  let config = loaderContext.options[configKey] || {};

  delete query.config;

  return Object.assign({}, config, query);
}

function* mergeSources(opts, entry, resolve, dependencies, level) {
  level = level || 0
  dependencies = dependencies || []

  let content = false

  if (typeof entry === 'object') {
    content = entry.content
    entry = entry.file
  } else {
    content = yield fs.readFile(entry, 'utf8')
  }

  let entryDir = path.dirname(entry)
  let commentRanges = findComments(content)

  // replace url(...)
  content = content.replace(MATCH_URL_ALL, (total, left, file, right) => {
    if (loaderUtils.isUrlRequest(file)) {
      let absoluteFile = path.resolve(entryDir, file)
      let relativeFile = path.relative(opts.baseDir, absoluteFile)

      if (relativeFile[0] !== '.') {
        relativeFile = './' + relativeFile
      }

      return `url(${left}${relativeFile}${right})`
    } else {
      return total
    }
  })

  // replace @import "..."
  function* importReplacer(total) {
    // if current import is in comments, then skip it
    let range = this
    let finded = commentRanges.find(commentRange => {
      if (range.start >= commentRange[0] && range.end <= commentRange[1]) {
        return true
      }
    })

    if (finded) {
      return total
    }

    let contents = []
    let matched

    // must reset lastIndex
    MATCH_FILES.lastIndex = 0

    while (matched = MATCH_FILES.exec(total)) {
      let originalImport = matched[2].trim()
      if (!originalImport) {
        let err = new Error(`import file cannot be empty: "${total}" @${entry}`)

        err.file = entry

        throw err
      }

      let imports = getImportsToResolve(originalImport)
      let resolvedImport

      for (let i = 0; i < imports.length; i++) {
        try {
          let reqFile = loaderUtils.urlToRequest(imports[i], opts.root)

          resolvedImport = yield resolve(entryDir, reqFile)
          break;
        } catch (err) {
          // skip
        }
      }

      if (!resolvedImport) {
        let err = new Error(`import file cannot be resolved: "${total}" @${entry}`)

        err.file = entry

        throw err
      }

      resolvedImport = path.normalize(resolvedImport)

      if (dependencies.indexOf(resolvedImport) < 0) {
        dependencies.push(resolvedImport)

        contents.push(yield mergeSources(opts, resolvedImport, resolve, dependencies, level + 1))
      }
    }

    return contents.join('\n')
  }

  return yield replaceAsync(content, MATCH_IMPORTS, co.wrap(importReplacer))
}

module.exports = function(content) {
  let entry = this.resourcePath
  let callback = this.async()
  let cache = new Cache(entry)
  let options = getLoaderConfig(this)
  let ctx = this

  options.baseDir = path.dirname(entry)

  this.cacheable()

  function resolver(ctx) {
    return function(dir, importFile) {
      return new Promise((resolve, reject) => {
        ctx.resolve(dir, importFile, (err, resolvedFile) => {
          if (err) {
            reject(err)
          } else {
            resolve(resolvedFile)
          }
        })
      })
    }
  }

  return co(function*() {
    let dependencies = []

    if (cache.isValid()) {
      cache.getDependencies().forEach(file => {
        ctx.dependency(file)
      })

      return cache.read()
    } else {
      let merged = yield mergeSources(options, {
        file: entry,
        content: content
      }, resolver(ctx), dependencies)

      dependencies.forEach(file => {
        ctx.dependency(file)
      })

      try {
        let result = yield new Promise((resolve, reject) => {
          sass.render({
            file: entry,
            data: merged
          }, (err, result) => {
            if (err) {
              reject(err)
            } else {
              resolve(result)
            }
          })
        })

        let css = result.css.toString()

        cache.write(dependencies, css)

        return css
      } catch (err) {
        console.log(preview(merged, err, {
          offset: 10
        }))
        console.error(err.stack || err)

        throw err
      }
    }
  }).then(css => {
    callback(null, css)
  }, err => {
    // disabled cache
    cache.markInvalid()

    // add error file as deps, so if file changed next time sass-loader will be noticed
    err.file && ctx.dependency(err.file)

    callback(err)
  })
}
