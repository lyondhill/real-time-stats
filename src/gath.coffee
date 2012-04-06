Gatherer = require './gatherer'
{argv} = require 'optimist'
# daemon = require 'daemon'

port = argv.p ? argv.port ? 6379
host = argv.h ? argv.host ? '127.0.0.1'

process.title = 'real-time-gath'

if argv.help
  usage = '''

  Usage: real-time-gath --host [host] --port [port]

  Options:
    -h | --host [optional] * redis connection
    -p | --port [optional] * redis connection

    -d          (daemonize)
    --pid <file>
    --log <file>

  '''
  console.log usage
else
  if argv.d

    logfile = argv.log ? '/dev/null'
    pidfile = argv.pid ? '/var/run/real-time-gath.pid'

    daemon.daemonize logfile, pidfile, (err, pid) ->
      if err
        console.log "Error starting daemon: #{err}"
      else
        console.log "Daemon started successfully with pid: #{pid}"
        new Gatherer(host, port)
  else
    new Gatherer(host, port)
