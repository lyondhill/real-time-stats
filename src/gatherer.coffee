spawn = require('child_process').spawn

module.exports = class Gatherer

  constructor: (@host, @port) ->
    @redis = require('redis').createClient(@port, @host)
    run_stats()

  run_stats: () ->
    dstat = spawn 'dstat', ['-cmsl']
    dstat.stdout
    ps.stdout.on 'data', (data) =>
      console.log data
