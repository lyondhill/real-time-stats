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
      var dstat,
        _this = this;
      dstat = spawn('dstat', ['-cmsl']);
      dstat.stdout.on('data', function(data) {
        var line, result;
        line = data.to_string();
        console.log(line);
        if (result = line.match(/\d+\s+\d+\s+(\d+)\s+\d+\s+\d+\s+\d+\|\s+(\d+)[MKG]\s+(\d+)[MKG]\s+(\d+)[MKG]\s+(\d+)[MKG]\|\s+(\d+)[MKG]\s+(\d+)[MKG]\|\s+(\d+)\s+\d+\s+\d+/)) {
          return console.log(result);
        }
      });
      return dstat.stderr.on('data', function(data) {
        return console.log(data.toString());
      });
    };

    return Gatherer;

  })();

}).call(this);
