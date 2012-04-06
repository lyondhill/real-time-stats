(function() {
  var Gatherer, spawn;

  spawn = require('child_process').spawn;

  module.exports = Gatherer = (function() {

    function Gatherer(host, port) {
      this.host = host;
      this.port = port;
      this.redis = require('redis').createClient(this.port, this.host);
      this.run_stats();
    }

    Gatherer.prototype.run_stats = function() {
      var dstat,
        _this = this;
      dstat = spawn('dstat', ['-cmsl']);
      dstat.stdout;
      return ps.stdout.on('data', function(data) {
        return console.log(data);
      });
    };

    return Gatherer;

  })();

}).call(this);
