'use strict'

const path = require('path')
const fs = require('fs-extra')
const preview = require('cli-source-preview')
const replaceAsync = require('./replace')
const co = require('co')
const sass = require('node-sass')
const Cache = require('./cache')
const utils = require('./utils')
const loaderUtils = require('loader-utils')

const BOM_HEADER = '\uFEFF'
const EXT_PRECEDENCE = ['.scss', '.sass', '.css']
const MATCH_URL_ALL = /url\(\s*(['"]?)([^ '"()]+)(\1)\s*\)/g
const MATCH_IMPORTS = /@import\s+(['"])([^,;'"]+)(\1)(\s*,\s*(['"])([^,;'"]+)(\1))*\s*;/g
const MATCH_FILES = /(['"])([^,;'"]+)(\1)/g

function getImportsToResolve (original, includePaths, transformers) {
  let extname = path.extname(original)
  let basename = path.basename(original, extname)
  let dirname = path.dirname(original)

  let imports = []
  let names = [basename]
  let exts = [extname]
  let extensionPrecedence = [].concat(EXT_PRECEDENCE, Object.keys(transformers))

  if (!extname) {
    exts = extensionPrecedence
  }
  if (extname && extensionPrecedence.indexOf(extname) === -1) {
    basename = path.basename(original)
    names = [basename]
    exts = extensionPrecedence
  }
  if (basename[0] !== '_') {
    names.push('_' + basename)
  }

  for (let i = 0; i < names.length; i++) {
    for (let j = 0; j < exts.length; j++) {
      // search relative to original file
      imports.push(path.join(dirname, names[i] + exts[j]))

      // search in includePaths
      for (let includePath of includePaths) {
        imports.push(path.join(includePath, dirname, names[i] + exts[j]))
      }
    }
  }

  return imports
}

function createTransformersMap (transformers) {
  if (!transformers) {
    return {}
  }

  // return map of extension strings to transformer functions
  return transformers.reduce((extensionMap, transformer) => {
    transformer.extensions.forEach((ext) => {
      extensionMap[ext] = transformer.transform
    })
    return extensionMap
  }, {})
}

function getLoaderConfig (ctx) {
  const options = loaderUtils.getOptions(ctx) || {}
  const includePaths = options.includePaths || []
  const basedir = ctx.rootContext || options.context || ctx.options.context || process.cwd()
  const transformers = createTransformersMap(options.transformers)

  // convert relative to absolute
  for (let i = 0; i < includePaths.length; i++) {
    if (!path.isAbsolute(includePaths[i])) {
      includePaths[i] = path.join(basedir, includePaths[i])
    }
  }

  return {
    basedir,
    includePaths,
    transformers,
    baseEntryDir: path.dirname(ctx.resourcePath),
    root: options.root,
    data: options.data
  }
}

function * mergeSources (opts, entry, resolve, dependencies, level) {
  level = level || 0
  dependencies = dependencies || []

  let includePaths = opts.includePaths
  let transformers = opts.transformers
  let content = false

  if (typeof entry === 'object') {
    content = entry.content
    entry = entry.file
  } else {
    content = yield fs.readFile(entry, 'utf8')

    // fix BOM issue (only on windows)
    if (content.startsWith(BOM_HEADER)) {
      content = content.substring(BOM_HEADER.length)
    }
  }

  let ext = path.extname(entry)

  if (transformers[ext]) {
    content = transformers[ext](content)
  }

  if (opts.data) {
    content = opts.data + '\n' + content
  }

  let entryDir = path.dirname(entry)

  // replace url(...)
  content = content.replace(MATCH_URL_ALL, (total, left, file, right) => {
    if (loaderUtils.isUrlRequest(file)) {
      // handle url(<loader>!<file>)
      let pos = file.lastIndexOf('!')
      if (pos >= 0) {
        left += file.substring(0, pos + 1)
        file = file.substring(pos + 1)
      }

      // test again
      if (loaderUtils.isUrlRequest(file)) {
        let absoluteFile = path.normalize(path.resolve(entryDir, file))
        let relativeFile = path.relative(opts.baseEntryDir, absoluteFile).replace(/\\/g, '/') // fix for windows path

        if (relativeFile[0] !== '.') {
          relativeFile = './' + relativeFile
        }

        return `url(${left}${relativeFile}${right})`
      } else {
        return total
      }
    } else {
      return total
    }
  })

  // find comments should after content.replace(...), otherwise the comments offset will be incorrect
  let commentRanges = utils.findComments(content)

  // replace @import "..."
  function * importReplacer (total) {
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

    while (matched = MATCH_FILES.exec(total)) { // eslint-disable-line
      let originalImport = matched[2].trim()
      if (!originalImport) {
        let err = new Error(`import file cannot be empty: "${total}" @${entry}`)

        err.file = entry

        throw err
      }

      let imports = getImportsToResolve(originalImport, includePaths, transformers)
      let resolvedImport

      for (let i = 0; i < imports.length; i++) {
        // if imports[i] is absolute path, then use it directly
        if (path.isAbsolute(imports[i]) && fs.existsSync(imports[i])) {
          resolvedImport = imports[i]
        } else {
          try {
            let reqFile = loaderUtils.urlToRequest(imports[i], opts.root)

            resolvedImport = yield resolve(entryDir, reqFile)
            break
          } catch (err) {
            // skip
          }
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

module.exports = function (content) {
  let entry = this.resourcePath
  let callback = this.async()
  let cache = new Cache(entry)
  let options = getLoaderConfig(this)
  let ctx = this

  // for webpack 1
  if (this.cacheable) {
    this.cacheable()
  }

  function resolver (ctx) {
    return function (dir, importFile) {
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

  return co(function * () {
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
            indentedSyntax: entry.endsWith('.sass'),
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
