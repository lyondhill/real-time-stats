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
      dstat.stdout.on('data', function(data) {
        var cpu, line, load, mem, mem_total, result, swap;
        line = data.toString();
        if (result = line.match(/\d+\s+\d+\s+(\d+)\s+\d+\s+\d+\s+\d+\|\s+(\d+)K{0,1}M{0,1}G{0,1}\s+(\d+)K{0,1}M{0,1}G{0,1}\s+(\d+)K{0,1}M{0,1}G{0,1}\s+(\d+)K{0,1}M{0,1}G{0,1}\|\s+(\d+)K{0,1}M{0,1}G{0,1}\s+(\d+)K{0,1}M{0,1}G{0,1}\|\s+(\d+\.?\d*)\s+(\d+\.?\d*)\s+(\d+\.?\d*)/)) {
          cpu = 100 - parseInt(result[1]);
          mem_total = parseInt(result[2]) + parseInt(result[3]) + parseInt(result[4]) + parseInt(result[5]);
          mem = (mem_total - parseInt(result[5])) / mem_total * 100;
          swap = parseInt(result[6]) / (parseInt(result[6]) + parseInt(result[7])) * 100;
          load = parseInt(result[8]);
          console.log("cpu: " + cpu + ", mem: " + mem + ", swap: " + swap + ", load: " + load);
          return _this.redis.publish('local', JSON.stringify({
            cpu: cpu,
            mem: mem,
            swap: swap,
            load: load
          }));
        }
      });
      return dstat.stderr.on('data', function(data) {
        return console.log(data.toString());
      });
    };

    return Gatherer;

  })();

}).call(this);
