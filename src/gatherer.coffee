spawn = require('child_process').spawn

module.exports = class Gatherer

  constructor: (@host, @port) ->
    # @redis = require('redis').createClient(@port, @host)
    @run_stats()

  run_stats: () ->
    dstat = spawn 'dstat', ['-cmsl']
    dstat.stdout.on 'data', (data) =>
      line = data.toString()
      # console.log line
      if result = line.match /\d+\s+\d+\s+(\d+)\s+\d+\s+\d+\s+\d+\|\s+(\d+)[MKG]\s+(\d+)[MKG]\s+(\d+)[MKG]\s+(\d+)[MKG]\|\s+(\d+)[MKG]\s+(\d+)[MKG]\|\s+(\d+)\s+\d+\s+\d+/
        # console.log result
        cpu = 100 - parseInt(result[1])
        mem_total = parseInt(result[2]) + parseInt(result[3]) + parseInt(result[4]) + parseInt(result[5])
        mem = ((mem_total - parseInt(result[5])) / mem_total * 100)
        swap = parseInt(result[6]) / (parseInt(result[6]) + parseInt(result[7])) *  100
        load = parseInt(result[8])
        console.log "cpu: #{cpu}, mem: #{mem}, swap: #{swap}, load: #{load}"

    dstat.stderr.on 'data', (data) =>
      console.log data.toString()
