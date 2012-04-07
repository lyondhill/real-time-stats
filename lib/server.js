(function() {
  var Server, redis,
    __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; };

  redis = require('redis').createClient(6379, '10.60.38.98');

  module.exports = Server = (function() {

    function Server(host, port) {
      this.host = host;
      this.port = port;
      this.hello_world = __bind(this.hello_world, this);
      this.log = __bind(this.log, this);
      this.handle_error = __bind(this.handle_error, this);
      this.to_log = false;
      this.app = require('express').createServer();
      this.io = require("socket.io").listen(this.app);
      this.set_routes();
      this.app.listen(this.port, this.host);
    }

    Server.prototype.set_routes = function() {
      return this.app.get("/", this.hello_world);
    };

    Server.prototype.handle_error = function(err, res) {
      console.log("ERROR: " + err);
      res.send(err, 500);
      throw new Exception("ERROR: " + err);
    };

    Server.prototype.log = function(data) {
      if (this.to_log) return console.log("" + (Date().toString()) + ": " + data);
    };

    Server.prototype.hello_world = function(req, res) {
      return res.sendfile(__dirname + "/index.html");
    };

    return Server;

  })();

}).call(this);
