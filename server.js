
var express = require('express')
  // , routes = require('./routes');

var app = module.exports = express.createServer();
io = require('socket.io').listen(app);

// Configuration

app.configure(function(){
  app.set('views', __dirname + '/views');
  app.set('view engine', 'jade');
  app.use(express.bodyParser());
  app.use(express.methodOverride());
  app.use(require('stylus').middleware({ src: __dirname + '/public' }));
  app.use(app.router);
  app.use(express.static(__dirname + '/public'));
});

app.configure('development', function(){
  app.use(express.errorHandler({ dumpExceptions: true, showStack: true }));
});

app.configure('production', function(){
  app.use(express.errorHandler());
});

// Routes
// App stuff
app.get('/', function(req, res) {
  res.render('index', { title: 'Express' })
});

app.listen(3000, function(){
  console.log("Express server listening on port %d in %s mode", app.address().port, app.settings.env);
});



// Socket.io stuff
io.sockets.on('connection', function (socket) {
  // socket.emit("update", { oven1: [80,60,38,1.0] })
  // socket.emit("update", { oven2: [60,80,33,0.32] })
  setInterval(function() {
    socket.emit("update", { oven1: [80,60,38,1.0] })
  }, 2000)
  setTimeout(function() {
    setInterval(function() {
      socket.emit("update", { oven1: [60,80,33,0.32] })
    }, 2000)
  }, 1000);
  setInterval(function() {
    socket.emit("update", { oven2: [19,14,33,2.0] })
  }, 2000)
  setTimeout(function() {
    setInterval(function() {
      socket.emit("update", { oven2: [68,45,23,50] })
    }, 2000)
  }, 1000);

});
