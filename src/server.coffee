redis = require('redis').createClient(6379, '10.60.38.98')
# redis = require('redis').createClient(6379, '127.0.0.1')

module.exports = class Server

  constructor: (@host, @port) ->
    @to_log = false
    @app = require('express').createServer();
    @io = require("socket.io").listen(@app)
    @set_routes()
    @app.listen(@port, @host)

  set_routes: () ->
    @app.get "/", @hello_world

  handle_error: (err, res) =>
    console.log("ERROR: #{err}")
    res.send(err, 500);
    throw new Exception("ERROR: #{err}")

  log: (data) =>
    if @to_log
      console.log "#{Date().toString()}: #{data}"

  hello_world: (req, res) =>
    res.sendfile __dirname + "/index.html"