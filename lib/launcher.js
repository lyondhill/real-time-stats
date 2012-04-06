(function() {
  var Server, children, cluster, deathSigs, i, murderedChildren, numCPUs, sig, spawn;

  Server = require('./server');

  cluster = require("cluster");

  numCPUs = require("os").cpus().length;

  children = [];

  murderedChildren = [];

  if (cluster.isMaster) {
    console.log("Master: " + process.pid);
    i = 0;
    while (i < numCPUs) {
      spawn = cluster.fork();
      children.push(spawn);
      spawn.on("message", function(msg) {
        return console.log(msg);
      });
      i++;
    }
    cluster.on("death", function(worker) {
      var child, wasMurdered;
      wasMurdered = false;
      for (child in murderedChildren) {
        if (children[child].pid === worker.pid) {
          wasMurdered = true;
          murderedChildren.splice(child, 1);
        }
      }
      if (!wasMurdered) {
        console.log("restarting worker");
        spawn = cluster.fork();
        children.push(spawn);
        worker.on("message", function(msg) {
          return console.log(msg);
        });
      }
      for (child in children) {
        if (children[child].pid === worker.pid) children.splice(child, 1);
      }
      if (children.length === 0) return process.exit();
    });
    deathSigs = ["SIGINT", "SIGTERM", "SIGQUIT"];
    for (sig in deathSigs) {
      process.on(deathSigs[sig], function() {
        var child, _results;
        _results = [];
        for (child in children) {
          murderedChildren.push(children[child]);
          _results.push(children[child].kill(deathSigs[sig]));
        }
        return _results;
      });
    }
    process.on("SIGUSR2", function() {
      var child, deathRow, _results;
      deathRow = children.slice();
      i = 0;
      while (i < numCPUs) {
        spawn = cluster.fork();
        children.push(spawn);
        spawn.on("message", function(msg) {
          return console.log(msg);
        });
        i++;
      }
      _results = [];
      for (child in deathRow) {
        murderedChildren.push(deathRow[child]);
        _results.push(deathRow[child].kill("SIGQUIT"));
      }
      return _results;
    });
  } else {
    new Server('0.0.0.0', 8080);
  }

}).call(this);
