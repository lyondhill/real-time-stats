(function() {
  var Gatherer, spawn;

  spawn = require('child_process').spawn;

  module.exports = Gatherer = (function() {

    function Gatherer(host, port) {
      this.host = host;
      this.port = port;
      this.run_stats();
    }

    Gatherer.prototype.run_stats = function() {
      var dstat, server,
        _this = this;
      server = net.createServer(function(conn) {
        return conn.on("data", function(data) {
          return console.log(data.toString());
        });
      });
      server.listen("/tmp/gath.sock");
      return dstat = spawn('dstat', ['-cmsl', '--output', '/tmp/gath.sock']);
    };

    return Gatherer;

  })();

}).call(this);
