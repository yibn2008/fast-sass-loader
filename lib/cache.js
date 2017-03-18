'use strict'

const utils = require('./utils')

// 编译缓存
// cache = {
//   <entry>: {
//      mtime: <Number>,            // 修改时间
//      writeTimes: <Number>,       // 编译次数
//      readTimes: <Number>,        // 读取次数 (自最后一次编译)
//      lastCompile: <Number>,      // 最后一次编译
//      result: <String>,           // 编译结果
//      dependencies: {             // 依赖文件状态
//          <file>: <Number>,       // 依赖文件以及修改时间
//          ...
//      }
//   },
//   ...
// }
const CACHE_STORE = {}

/**
 * Cache
 *
 * Usage:
 *
 * let cache = new Cache(entry)
 *
 * if (cache.isValid()) {
 *   return cache.read()
 * } else {
 *   // compile sass ....
 *   cache.write(dependencies, result.css.toString())
 * }
 */
class Cache {
  constructor (entry) {
    this.entry = entry
  }

  isValid () {
    if (!(this.entry in CACHE_STORE)) {
      return false
    }

    let cache = CACHE_STORE[this.entry]
    let estat = utils.fstat(this.entry)

    // 文件不存在, 或时间不正确
    if (!estat || estat.mtime.getTime() !== cache.mtime) {
      return false
    }

    for (let depFile in cache.dependencies) {
      if (!cache.dependencies.hasOwnProperty(depFile)) {
        continue
      }

      let mtime = cache.dependencies[depFile]
      let dstat = utils.fstat(depFile)

      if (!dstat || dstat.mtime.getTime() !== mtime) {
        return false
      }
    }

    return true
  }

  read () {
    if (this.entry in CACHE_STORE) {
      let cache = CACHE_STORE[this.entry]
      cache.readTimes++

      return cache.result
    } else {
      return false
    }
  }

  getDependencies () {
    if (this.entry in CACHE_STORE) {
      let cache = CACHE_STORE[this.entry]

      return Object.keys(cache.dependencies)
    } else {
      return []
    }
  }

  markInvalid () {
    delete CACHE_STORE[this.entry]
  }

  write (dependencies, result) {
    let cache = CACHE_STORE[this.entry]

    if (!cache) {
      CACHE_STORE[this.entry] = cache = {
        mtime: 0,
        writeTimes: 0,
        readTimes: 0,
        lastCompile: Date.now(),
        result: null,
        dependencies: {}
      }
    }

    cache.mtime = utils.fstat(this.entry).mtime.getTime()
    cache.writeTimes++
    cache.readTimes = 0
    cache.result = result
    cache.dependencies = {}

    for (let i = 0; i < dependencies.length; i++) {
      let depFile = dependencies[i]
      let dstat = utils.fstat(depFile)

      cache.dependencies[depFile] = dstat ? dstat.mtime.getTime() : 0
    }
  }
}

module.exports = Cache
