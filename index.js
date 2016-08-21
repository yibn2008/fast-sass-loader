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
const BAD_URL_FILE = /(^#)|(^(\w+:)?\/\/)|(^data:)/

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

  // replace url(...)
  content = content.replace(MATCH_URL_ALL, (total, left, file, right) => {
    if (!file.match(BAD_URL_FILE)) {
      let absoluteFile = path.resolve(entryDir, file)
      let relativeFile = path.relative(opts.baseDir, absoluteFile)

      return `url(${relativeFile})`
    } else {
      return total
    }
  })

  // replace @import "..."
  function* importReplacer(total) {
    let contents = []
    let matched

    // must reset lastIndex
    MATCH_FILES.lastIndex = 0

    while (matched = MATCH_FILES.exec(total)) {
      let originalImport = matched[2].trim()
      if (!originalImport) {
        throw new Error(`import file cannot be empty: "${total}" @${entry}`)
      }

      let imports = getImportsToResolve(originalImport)
      let resolvedImport

      // console.log('resolve ->', imports)

      for (let i = 0; i < imports.length; i++) {
        try {
          let reqFile = loaderUtils.urlToRequest(imports[i], opts.root)
          resolvedImport = yield resolve(entryDir, reqFile)
          break;
        } catch (err) {
          // console.log('resolve err: ', err.message)
          // skip
        }
      }

      if (!resolvedImport) {
        throw new Error(`import file cannot be resolved: "${total}" @${entry}`)
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
      return cache.read()
    } else {
      console.time('merge')
      let merged = yield mergeSources(options, {
        file: entry,
        content: content
      }, resolver(ctx), dependencies)

      console.timeEnd('merge')

      try {
        console.time('compile')

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

        dependencies.forEach(file => {
          ctx.dependency(file)
        })

        let css = result.css.toString()

        cache.write(dependencies, css)

        console.timeEnd('compile')

        return css
      } catch (err) {
        console.log(preview(merged, err, {
          offset: 10
        }))
        console.error(err.stack || err)

        err.file && ctx.dependency(err.file)
        throw err
      }
    }
  }).then(css => {
    callback(null, css)
  }, err => {
    callback(err)
  })
}
