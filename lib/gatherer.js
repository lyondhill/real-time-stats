(function() {
  var Gatherer, spawn;

  spawn = require('child_process').spawn;

  module.exports = Gatherer = (function() {

    function Gatherer(host, port) {
      var exec,
        _this = this;
      this.host = host;
      this.port = port;
      this.redis = require('redis').createClient(this.port, this.host);
      exec = require('child_process').exec;
      exec("hostname", function(error, stdout, stderr) {
        return _this.hostname = stdout.toString().replace(/\n/, "");
      });
      this.run_stats();
      this.current = {};
    }

    Gatherer.prototype.run_stats = function() {
      var dstat,
        _this = this;
      dstat = spawn('dstat', ['-cmsl']);
      dstat.stdout.on('data', function(data) {
        var cpu, line, load, mem, mem_total, result, swap;
        line = data.toString();
        if (result = line.match(/\d+\s+\d+\s+(\d+)\s+\d+\s+\d+\s+\d+\|\s*(\d+)K{0,1}M{0,1}G{0,1}\s+(\d+)K{0,1}M{0,1}G{0,1}\s+(\d+)K{0,1}M{0,1}G{0,1}\s+(\d+)K{0,1}M{0,1}G{0,1}\|\s*(\d+)K{0,1}M{0,1}G{0,1}\s+(\d+)K{0,1}M{0,1}G{0,1}\|\s*(\d+\.?\d*)\s+(\d+\.?\d*)\s+(\d+\.?\d*)/)) {
          cpu = 100 - parseInt(result[1]);
          mem_total = parseInt(result[2]) + parseInt(result[3]) + parseInt(result[4]) + parseInt(result[5]);
          mem = (mem_total - parseInt(result[5])) / mem_total * 100;
          swap = parseInt(result[6]) / (parseInt(result[6]) + parseInt(result[7])) * 100;
          load = parseInt(result[8]);
          _this.current[_this.hostname] = [cpu, mem, swap, load];
          console.log(JSON.stringify(_this.current));
          return _this.redis.publish('update', JSON.stringify(_this.current));
        } else {
          return console.log("no match for :" + line);
        }
      });
      return dstat.stderr.on('data', function(data) {
        return console.log(data.toString());
      });
    };

    return Gatherer;

  })();

}).call(this);
