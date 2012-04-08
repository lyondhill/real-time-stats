# redis = require('redis').createClient(6379, '10.60.38.98')
# # redis = require('redis').createClient(6379, '127.0.0.1')

# module.exports = class Server

#   constructor: (@host, @port) ->
#     @to_log = false
#     @app = require('express').createServer();
#     @io = require("socket.io").listen(@app)

#     @app.configure ->
#       @app.set "views", __dirname + "/views"
#       @app.set "view engine", "jade"
#       @app.use express.bodyParser()
#       @app.use express.methodOverride()
#       @app.use require("stylus").middleware(src: __dirname + "/public")
#       @app.use app.router
#       @app.use express.static(__dirname + "/public")

#     @app.configure "development", ->
#       @app.use express.errorHandler(
#         dumpExceptions: true
#         showStack: true
#       )

#     @app.configure "production", ->
#       @app.use express.errorHandler()

#     @set_routes()

#     @app.listen(@port, @host)

#   set_routes: () ->
#     @app.get "/", @hello_world

#   handle_error: (err, res) =>
#     console.log("ERROR: #{err}")
#     res.send(err, 500);
#     throw new Exception("ERROR: #{err}")

#   log: (data) =>
#     if @to_log
#       console.log "#{Date().toString()}: #{data}"

#   hello_world: (req, res) =>
#     console.log "hay"
#     res.render('index', { title: 'Express' })




express = require("express")
routes = require("../routes")
app = module.exports = express.createServer()
app.configure ->
  app.set "views", __dirname + "../views"
  app.set "view engine", "jade"
  app.use express.bodyParser()
  app.use express.methodOverride()
  app.use require("stylus").middleware(src: __dirname + "../public")
  app.use app.router
  app.use express.static(__dirname + "../public")

app.configure "development", ->
  app.use express.errorHandler(
    dumpExceptions: true
    showStack: true
  )

app.configure "production", ->
  app.use express.errorHandler()

app.get "/", routes.index
app.listen 3000, ->
  console.log "Express server listening on port %d in %s mode", app.address().port, app.settings.env