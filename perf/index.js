'use strict'

const cp = require('child_process')
const path = require('path')
const chalk = require('chalk')

console.log('************** RUN WITH FAST SASS LOADER **************')
let label = chalk.green('[total] fast-sass-loader')
console.time(label)
cp.spawnSync(process.execPath, ['../node_modules/.bin/webpack', '--progress'], {
  stdio: 'inherit',
  cwd: __dirname,
  env: Object.assign({
    SASS_LOADER: 'fast-sass-loader'
  }, process.env)
})
console.log()
console.timeEnd(label)
console.log()
console.log()

console.log('************** RUN WITH SASS LOADER **************')
label = chalk.yellow('[total] sass-loader')
console.time(label)
cp.spawnSync(process.execPath, ['../node_modules/.bin/webpack', '--progress'], {
  stdio: 'inherit',
  cwd: __dirname,
  env: Object.assign({
    SASS_LOADER: 'sass-loader'
  }, process.env)
})
console.log()
console.timeEnd(label)
console.log()
