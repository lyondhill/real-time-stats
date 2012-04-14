spawn = require('child_process').spawn

module.exports = class Gatherer

  constructor: (@host, @port) ->
    @redis = require('redis').createClient(@port, @host)
    exec = require('child_process').exec
    exec "hostname", (error, stdout, stderr) =>
     @hostname = stdout.toString()
    @run_stats()
    @current = {}

  run_stats: () ->
    dstat = spawn 'dstat', ['-cmsl']
    dstat.stdout.on 'data', (data) =>
      line = data.toString()
      # console.log line
      if result = line.match /\d+\s+\d+\s+(\d+)\s+\d+\s+\d+\s+\d+\|\s*(\d+)K{0,1}M{0,1}G{0,1}\s+(\d+)K{0,1}M{0,1}G{0,1}\s+(\d+)K{0,1}M{0,1}G{0,1}\s+(\d+)K{0,1}M{0,1}G{0,1}\|\s*(\d+)K{0,1}M{0,1}G{0,1}\s+(\d+)K{0,1}M{0,1}G{0,1}\|\s*(\d+\.?\d*)\s+(\d+\.?\d*)\s+(\d+\.?\d*)/
        # console.log result
        cpu = 100 - parseInt(result[1])
        mem_total = parseInt(result[2]) + parseInt(result[3]) + parseInt(result[4]) + parseInt(result[5])
        mem = ((mem_total - parseInt(result[5])) / mem_total * 100)
        swap = parseInt(result[6]) / (parseInt(result[6]) + parseInt(result[7])) *  100
        load = parseInt(result[8])
        # console.log "cpu: #{cpu}, mem: #{mem}, swap: #{swap}, load: #{load}"
        @current[@hostname] = [cpu, mem, swap, load]
        console.log JSON.stringify @current
        @redis.publish 'update', JSON.stringify @current
      else
        console.log "no match for :#{line}"

    dstat.stderr.on 'data', (data) =>
      console.log data.toString()
