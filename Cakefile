{print}       = require 'util'
fs      = require 'fs'
{spawn} = require 'child_process'

build = (callback) ->
  options = ['-c', '-o', 'lib', 'src']

  coffee = spawn 'coffee', options
  coffee.stdout.on 'data', (data) -> print data.toString()
  coffee.stderr.on 'data', (data) -> print data.toString()
  coffee.on 'exit', (status) -> callback?() if status is 0

task 'build', 'Compile CoffeeScript source files', ->
  build()

task 'clean', 'Clean previous builds', ->
  fs.readdir "#{__dirname}/lib", (err, files) ->
    for file in files
      fs.unlinkSync "#{__dirname}/lib/#{file}"

task 'test', 'Run the Snorkel test suite', ->
  build ->
    require.paths.unshift __dirname + "/lib"
    {reporters} = require 'nodeunit'
    process.chdir __dirname
    reporters.default.run ['test']