Server = require './server'
cluster = require("cluster")
numCPUs = require("os").cpus().length
children = []
murderedChildren = []
if cluster.isMaster
  console.log "Master: " + process.pid
  i = 0

  while i < numCPUs
    spawn = cluster.fork()
    children.push spawn
    spawn.on "message", (msg) ->
      console.log msg
    i++
  cluster.on "death", (worker) ->
    wasMurdered = false
    for child of murderedChildren
      if children[child].pid is worker.pid
        wasMurdered = true
        murderedChildren.splice child, 1
    unless wasMurdered
      console.log "restarting worker"
      spawn = cluster.fork()
      children.push spawn
      worker.on "message", (msg) ->
        console.log msg
    for child of children
      children.splice child, 1  if children[child].pid is worker.pid
    process.exit()  if children.length is 0

  deathSigs = [ "SIGINT", "SIGTERM", "SIGQUIT" ]
  for sig of deathSigs
    process.on deathSigs[sig], ->
      for child of children
        murderedChildren.push children[child]
        children[child].kill deathSigs[sig]
  process.on "SIGUSR2", ->
    deathRow = children.slice()
    i = 0

    while i < numCPUs
      spawn = cluster.fork()
      children.push spawn
      spawn.on "message", (msg) ->
        console.log msg
      i++
    for child of deathRow
      murderedChildren.push deathRow[child]
      deathRow[child].kill "SIGQUIT"
else
  new Server('0.0.0.0', 8080)