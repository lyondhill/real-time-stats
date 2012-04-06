spawn = require('child_process').spawn

module.exports = class Gatherer

  constructor: (@host, @port) ->
    # @redis = require('redis').createClient(@port, @host)
    @run_stats()

  run_stats: () ->
    dstat = spawn 'dstat', ['-cmsl']
    dstat.stdout.on 'data', (data) =>
      line = data.toString()
      console.log line
      if result = line.match /\d+\s+\d+\s+(\d+)\s+\d+\s+\d+\s+\d+\|\s+(\d+)[MKG]\s+(\d+)[MKG]\s+(\d+)[MKG]\s+(\d+)[MKG]\|\s+(\d+)[MKG]\s+(\d+)[MKG]\|\s+(\d+)\s+\d+\s+\d+/
        console.log result

    dstat.stderr.on 'data', (data) =>
      console.log data.toString()
