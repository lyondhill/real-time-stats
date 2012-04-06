(function() {
  var ExpressServ, chain, db, redis,
    __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; };

  db = new require("odbc").Database();

  redis = require('redis').createClient(6379, '10.60.38.98');

  chain = require('chain-gang').create({
    workers: 1
  });

  module.exports = ExpressServ = (function() {

    function ExpressServ(host, port) {
      var _this = this;
      this.host = host;
      this.port = port;
      this.hello_world = __bind(this.hello_world, this);
      this.component_most_viewed = __bind(this.component_most_viewed, this);
      this.component_slowest_response = __bind(this.component_slowest_response, this);
      this.component_response_time = __bind(this.component_response_time, this);
      this.component_web_requests = __bind(this.component_web_requests, this);
      this.component_quick_stats_month = __bind(this.component_quick_stats_month, this);
      this.component_quick_stats_week = __bind(this.component_quick_stats_week, this);
      this.component_quick_stats_day = __bind(this.component_quick_stats_day, this);
      this.make_it_pretty = __bind(this.make_it_pretty, this);
      this.app_bandwidth_month = __bind(this.app_bandwidth_month, this);
      this.app_bandwidth_days = __bind(this.app_bandwidth_days, this);
      this.component_hardware_usage = __bind(this.component_hardware_usage, this);
      this.app_most_viewed = __bind(this.app_most_viewed, this);
      this.app_slowest_response = __bind(this.app_slowest_response, this);
      this.app_response_time = __bind(this.app_response_time, this);
      this.app_web_requests = __bind(this.app_web_requests, this);
      this.app_quick_stats_month = __bind(this.app_quick_stats_month, this);
      this.app_quick_stats_week = __bind(this.app_quick_stats_week, this);
      this.app_quick_stats_day = __bind(this.app_quick_stats_day, this);
      this.apps_top_fifty = __bind(this.apps_top_fifty, this);
      this.log_response = __bind(this.log_response, this);
      this.log_request = __bind(this.log_request, this);
      this.handle_error = __bind(this.handle_error, this);
      this.log = false;
      this.app = require('express').createServer();
      this.set_routes();
      db.open("DSN=MonetDB;UID=pagoda_stats;PWD=9S6HwS05yzfQ;DATABASE=pagoda_stats", function() {
        console.log('db connected');
        return _this.app.listen(_this.port, _this.host);
      });
    }

    ExpressServ.prototype.set_routes = function() {
      this.app.get("/apps/top-50", this.apps_top_fifty);
      this.app.get("/apps/:app/quick-stats-day", this.app_quick_stats_day);
      this.app.get("/apps/:app/quick-stats-week", this.app_quick_stats_week);
      this.app.get("/apps/:app/quick-stats-month", this.app_quick_stats_month);
      this.app.get("/apps/:app/web-requests", this.app_web_requests);
      this.app.get("/apps/:app/response-time", this.app_response_time);
      this.app.get("/apps/:app/slowest-response-time", this.app_slowest_response);
      this.app.get("/apps/:app/most-viewed", this.app_most_viewed);
      this.app.get("/apps/:app/bandwidth-days", this.app_bandwidth_days);
      this.app.get("/apps/:app/bandwidth-month", this.app_bandwidth_month);
      this.app.get("/components/:component/hardware-usage", this.component_hardware_usage);
      this.app.get("/components/:component/quick-stats-day", this.component_quick_stats_day);
      this.app.get("/components/:component/quick-stats-week", this.component_quick_stats_week);
      this.app.get("/components/:component/quick-stats-month", this.component_quick_stats_month);
      this.app.get("/components/:component/web-requests", this.component_web_requests);
      this.app.get("/components/:component/response-time", this.component_response_time);
      this.app.get("/components/:component/slowest-response-time", this.component_slowest_response);
      this.app.get("/components/:component/most-viewed", this.component_most_viewed);
      return this.app.get("/", this.hello_world);
    };

    ExpressServ.prototype.handle_error = function(err, res) {
      console.log("ERROR: " + err);
      res.send(err, 500);
      throw new Exception("ERROR: " + err);
    };

    ExpressServ.prototype.log_request = function(req) {
      if (this.log) {
        console.log("" + (Date().toString()) + " => Incoming Request to " + req.url);
        console.log("" + (Date().toString()) + " => REQUEST PARAMS:");
        console.log("" + (Date().toString()) + " => ----------------------------");
        console.log(req.params);
        return console.log("" + (Date().toString()) + " => ----------------------------");
      }
    };

    ExpressServ.prototype.log_response = function(data) {
      if (this.log) {
        console.log("" + (Date().toString()) + " => Responding to request with:");
        console.log("" + (Date().toString()) + " => ----------------------------");
        console.log(data);
        console.log("" + (Date().toString()) + " => ----------------------------");
        return console.log("" + (Date().toString()) + " => SUCCESS!");
      }
    };

    ExpressServ.prototype.apps_top_fifty = function(req, res) {
      var _this = this;
      this.log_request(req);
      res.header('Connection', 'close');
      return chain.add(function(job) {
        return db.query("SELECT app_id, count(*) as \"total\" FROM pagoda_stats.web_requests WHERE created_at>CURRENT_TIMESTAMP - INTERVAL '" + (req.query.days || 30) + "' DAY GROUP BY app_id ORDER BY count(*) DESC LIMIT 50", function(err, result, moreResultSets) {
          var data;
          job.finish();
          if (err) _this.handle_error(err, res);
          data = {
            data: result,
            description: "top apps for " + (req.query.days || 30) + " days"
          };
          res.send(JSON.stringify(data));
          return _this.log_response(data);
        });
      });
    };

    ExpressServ.prototype.app_quick_stats_day = function(req, res) {
      var _this = this;
      this.log_request(req);
      res.header('Connection', 'close');
      return redis.get("" + req.params.app + "-quick_stats_day", function(err, response) {
        if (err) _this.handle_error(err, res);
        if (response) {
          res.send("quickStats_day(" + response + ")");
          return _this.log_request();
        } else {
          return chain.add(function(job) {
            return db.query("SELECT count(*) as \"total\", avg(duration) as \"response\" FROM web_requests WHERE app_id='" + req.params.app + "' and created_at>CURRENT_TIMESTAMP - INTERVAL '1' DAY", function(err, result, moreResultSets) {
              var data;
              job.finish();
              if (err) _this.handle_error(err, res);
              try {
                result[0]['response'] = "" + ((eval(result[0]['response']) / 1000).toFixed());
              } catch (error) {
                console.log("Parsing ERROR: " + error);
                result = [];
              }
              data = {
                data: result,
                description: "Last 24 Hours"
              };
              res.send("quickStats_day(" + (JSON.stringify(data)) + ")");
              if (result !== []) {
                redis.set("" + req.params.app + "-quick_stats_day", JSON.stringify(data));
              }
              if (result !== []) {
                redis.expire("" + req.params.app + "-quick_stats_day", 1800);
              }
              return _this.log_response(data);
            });
          });
        }
      });
    };

    ExpressServ.prototype.app_quick_stats_week = function(req, res) {
      var _this = this;
      this.log_request(req);
      res.header('Connection', 'close');
      return redis.get("" + req.params.app + "-quick_stats_week", function(err, response) {
        if (err) _this.handle_error(err, res);
        if (response) {
          res.send("quickStats_week(" + response + ")");
          return _this.log_response(response);
        } else {
          return chain.add(function(job) {
            return db.query("SELECT count(*) as \"total\", avg(duration) as \"response\" FROM web_requests WHERE app_id='" + req.params.app + "' and created_at>CURRENT_TIMESTAMP - INTERVAL '7' DAY", function(err, result, moreResultSets) {
              var data;
              job.finish();
              if (err) _this.handle_error(err, res);
              try {
                result[0]['response'] = "" + ((eval(result[0]['response']) / 1000).toFixed());
              } catch (error) {
                console.log("Parsing ERROR: " + error);
                result = [];
              }
              data = {
                data: result,
                description: "Last 7 Days"
              };
              res.send("quickStats_week(" + (JSON.stringify(data)) + ")");
              if (result !== []) {
                redis.set("" + req.params.app + "-quick_stats_week", JSON.stringify(data));
              }
              if (result !== []) {
                redis.expire("" + req.params.app + "-quick_stats_week", 3600);
              }
              return _this.log_response(data);
            });
          });
        }
      });
    };

    ExpressServ.prototype.app_quick_stats_month = function(req, res) {
      var _this = this;
      this.log_request(req);
      res.header('Connection', 'close');
      return redis.get("" + req.params.app + "-quick_stats_month", function(err, response) {
        if (err) _this.handle_error(err, res);
        if (response) {
          res.send("quickStats_month(" + response + ")");
          return _this.log_response(response);
        } else {
          return chain.add(function(job) {
            return db.query("SELECT count(*) as \"total\", avg(duration) as \"response\" FROM web_requests WHERE app_id='" + req.params.app + "' and created_at>CURRENT_TIMESTAMP - INTERVAL '30' DAY", function(err, result, moreResultSets) {
              var data;
              job.finish();
              if (err) _this.handle_error(err, res);
              try {
                result[0]['response'] = "" + ((eval(result[0]['response']) / 1000).toFixed());
              } catch (error) {
                console.log("Parsing ERROR: " + error);
                result = [];
              }
              data = {
                data: result,
                description: "Last 30 Days"
              };
              res.send("quickStats_month(" + (JSON.stringify(data)) + ")");
              if (result !== []) {
                redis.set("" + req.params.app + "-quick_stats_month", JSON.stringify(data));
              }
              if (result !== []) {
                redis.expire("" + req.params.app + "-quick_stats_month", 86400);
              }
              return _this.log_response(data);
            });
          });
        }
      });
    };

    ExpressServ.prototype.app_web_requests = function(req, res) {
      var _this = this;
      this.log_request(req);
      res.header('Connection', 'close');
      return redis.get("" + req.params.app + "-web_requests", function(err, response) {
        if (err) _this.handle_error(err, res);
        if (response) {
          res.send("webRequests(" + response + ")");
          return _this.log_response(response);
        } else {
          return chain.add(function(job) {
            return db.query("(SELECT count(*) as \"total\", cast((avg(web_requests.duration) / 1000) as DECIMAL(18,2)) as \"average\", CAST(MOD(EXTRACT(hour from web_requests.created_at) - EXTRACT(hour from good_date.good_time) + 24, 24) as CHAR(3)) as \"hour\" from web_requests, (select cast(new_time.\"year\" || '-' || new_time.\"month\" || '-' || new_time.\"day\" || ' ' || new_time.\"hour\" || ':00:00.000000' as timestamp) as good_time from (select extract(year from time.time) as \"year\", extract(month from time.time) as \"month\", extract(day from time.time) as \"day\", extract(hour from time.time) as \"hour\" from (select current_timestamp as time) time) new_time) good_date where web_requests.created_at >= good_date.good_time - interval '1' day and web_requests.created_at < good_date.good_time and web_requests.app_id='" + req.params.app + "' GROUP BY \"hour\");", function(err, result, moreResultSets) {
              var array, data, i, max_avg, max_total;
              job.finish();
              if (err) _this.handle_error(err, res);
              array = [];
              try {
                i = 0;
                while (i < 24) {
                  array.push({
                    total: "0",
                    average: 0,
                    hour: i.toString()
                  });
                  i++;
                }
                max_total = 0;
                max_avg = 0;
                i = 0;
                while (i < result.length) {
                  if (Math.round(result[i].average) > max_avg) {
                    max_avg = Math.round(result[i].average);
                  }
                  if (eval(result[i].total) > max_total) {
                    max_total = eval(result[i].total);
                  }
                  result[i].average = Math.round(result[i].average);
                  array[eval(result[i].hour)] = result[i];
                  i++;
                }
                array.push({
                  total: _this.make_it_pretty(max_total),
                  average: _this.make_it_pretty(max_avg),
                  hour: "max"
                });
              } catch (error) {
                console.log("Parsing ERROR: " + error);
                array = [];
              }
              data = {
                data: array,
                description: ""
              };
              res.send("webRequests(" + (JSON.stringify(data)) + ")");
              if (array !== []) {
                redis.set("" + req.params.app + "-web_requests", JSON.stringify(data));
              }
              if (array !== []) {
                redis.expire("" + req.params.app + "-web_requests", 300);
              }
              return _this.log_response(data);
            });
          });
        }
      });
    };

    ExpressServ.prototype.app_response_time = function(req, res) {
      var _this = this;
      this.log_request(req);
      res.header('Connection', 'close');
      return redis.get("" + req.params.app + "-response_time", function(err, response) {
        if (err) _this.handle_error(err, res);
        if (response) {
          res.send("responseTime(" + response + ")");
          return _this.log_response(response);
        } else {
          return chain.add(function(job) {
            return db.query("SELECT cast((quarter.count * 100.0) / (total.count * 1.0) as DECIMAL(18,2)) as quarter, cast((half.count * 100.0) / (total.count * 1.0) as DECIMAL(18,2)) as half, cast((one.count * 100.0) / (total.count * 1.0) as DECIMAL(18,2)) as one, cast(((quarter.count + half.count + one.count) * 100.0) / (total.count * 1.0) as DECIMAL(18,2)) as full_second, cast((two.count * 100.0) / (total.count * 1.0) as DECIMAL(18,2)) as two, cast((three.count * 100.0) / (total.count * 1.0) as DECIMAL(18,2)) as three, cast((four.count * 100.0) / (total.count * 1.0) as DECIMAL(18,2)) as four, cast((more.count * 100.0) / (total.count * 1.0) as DECIMAL(18,2)) as more FROM (SELECT COUNT(*) as count FROM web_requests WHERE app_id='" + req.params.app + "' AND created_at>CURRENT_TIMESTAMP - INTERVAL '1' DAY AND duration <= 250000) quarter, (SELECT COUNT(*) as count FROM web_requests WHERE app_id='" + req.params.app + "' AND created_at>CURRENT_TIMESTAMP - INTERVAL '1' DAY AND duration <= 500000  AND duration > 250000) half, (SELECT COUNT(*) as count FROM web_requests WHERE app_id='" + req.params.app + "' AND created_at>CURRENT_TIMESTAMP - INTERVAL '1' DAY AND duration <= 1000000 AND duration > 500000) one, (SELECT COUNT(*) as count FROM web_requests WHERE app_id='" + req.params.app + "' AND created_at>CURRENT_TIMESTAMP - INTERVAL '1' DAY AND duration <= 2000000 AND duration > 1000000) two, (SELECT COUNT(*) as count FROM web_requests WHERE app_id='" + req.params.app + "' AND created_at>CURRENT_TIMESTAMP - INTERVAL '1' DAY AND duration <= 3000000 AND duration > 2000000) three, (SELECT COUNT(*) as count FROM web_requests WHERE app_id='" + req.params.app + "' AND created_at>CURRENT_TIMESTAMP - INTERVAL '1' DAY AND duration <= 4000000 AND duration > 3000000) four, (SELECT COUNT(*) as count FROM web_requests WHERE app_id='" + req.params.app + "' AND created_at>CURRENT_TIMESTAMP - INTERVAL '1' DAY AND duration >  4000000) more, (SELECT CASE COUNT(*) WHEN 0 THEN 1 ELSE COUNT(*) END as count FROM web_requests WHERE app_id='" + req.params.app + "' AND created_at>CURRENT_TIMESTAMP - INTERVAL '1' DAY) total", function(err, result, moreResultSets) {
              var data;
              job.finish();
              if (err) _this.handle_error(err, res);
              try {
                result[0].quarter = Math.round(eval(result[0].quarter) * 10) / 10;
                result[0].half = Math.round(eval(result[0].half) * 10) / 10;
                result[0].one = Math.round(eval(result[0].one) * 10) / 10;
                result[0].full_second = Math.round(eval(result[0].full_second) * 10) / 10;
                result[0].two = Math.round(eval(result[0].two) * 10) / 10;
                result[0].three = Math.round(eval(result[0].three) * 10) / 10;
                result[0].four = Math.round(eval(result[0].four) * 10) / 10;
                result[0].more = Math.round(eval(result[0].more) * 10) / 10;
              } catch (error) {
                console.log("Parsing ERROR: " + error);
                result = [];
              }
              data = {
                data: result,
                description: ""
              };
              res.send("responseTime(" + (JSON.stringify(data)) + ")");
              if (result !== []) {
                redis.set("" + req.params.app + "-response_time", JSON.stringify(data));
              }
              if (result !== []) {
                redis.expire("" + req.params.app + "-response_time", 3600);
              }
              return _this.log_response(data);
            });
          });
        }
      });
    };

    ExpressServ.prototype.app_slowest_response = function(req, res) {
      var _this = this;
      this.log_request(req);
      res.header('Connection', 'close');
      return redis.get("" + req.params.app + "-slowest_response", function(err, response) {
        if (err) _this.handle_error(err, res);
        if (response) {
          res.send("pageStats_slowestResponseTime(" + response + ")");
          return _this.log_response(response);
        } else {
          return chain.add(function(job) {
            return db.query("SELECT path, avg(duration) as \"metric\" FROM web_requests WHERE app_id='" + req.params.app + "' and created_at>CURRENT_TIMESTAMP - INTERVAL '1' DAY GROUP BY \"path\" ORDER BY \"metric\" DESC LIMIT 20", function(err, result, moreResultSets) {
              var data, i;
              job.finish();
              if (err) _this.handle_error(err, res);
              try {
                i = 0;
                while (i < result.length) {
                  result[i].metric = "" + ((eval(result[i]['metric']) / 1000).toFixed());
                  i++;
                }
              } catch (error) {
                console.log("Parsing ERROR: " + error);
                result = [];
              }
              data = {
                data: result,
                description: "URL's With Slowest Response Time:"
              };
              res.send("pageStats_slowestResponseTime(" + (JSON.stringify(data)) + ")");
              if (result !== []) {
                redis.set("" + req.params.app + "-slowest_response", JSON.stringify(data));
              }
              if (result !== []) {
                redis.expire("" + req.params.app + "-slowest_response", 3600);
              }
              return _this.log_response(data);
            });
          });
        }
      });
    };

    ExpressServ.prototype.app_most_viewed = function(req, res) {
      var _this = this;
      this.log_request(req);
      res.header('Connection', 'close');
      return redis.get("" + req.params.app + "-most_viewed", function(err, response) {
        if (err) _this.handle_error(err, res);
        if (response) {
          res.send("pageStats_mostViewed(" + response + ")");
          return _this.log_response(response);
        } else {
          return chain.add(function(job) {
            return db.query("SELECT pages.path as path, (pages.count * 100.0) / (total.count * 1.0) as \"metric\" FROM (SELECT path, count(*) as \"count\" FROM web_requests WHERE app_id='" + req.params.app + "' and created_at>CURRENT_TIMESTAMP - INTERVAL '1' DAY GROUP BY path) pages, (SELECT CASE COUNT(*) WHEN 0 THEN 1 ELSE COUNT(*) END as count FROM web_requests WHERE app_id='" + req.params.app + "' AND created_at>CURRENT_TIMESTAMP - INTERVAL '1' DAY) total ORDER BY \"metric\" DESC LIMIT 20;", function(err, result, moreResultSets) {
              var data, i;
              job.finish();
              if (err) _this.handle_error(err, res);
              try {
                i = 0;
                while (i < result.length) {
                  result[i].metric = "" + (Math.round(eval(result[i]['metric']))) + "%";
                  i++;
                }
              } catch (error) {
                console.log("Parsing ERROR: " + error);
                result = [];
              }
              data = {
                data: result,
                description: "Most Viewed URLs:"
              };
              res.send("pageStats_mostViewed(" + (JSON.stringify(data)) + ")");
              if (result !== []) {
                redis.set("" + req.params.app + "-most_viewed", JSON.stringify(data));
              }
              if (result !== []) {
                redis.expire("" + req.params.app + "-most_viewed", 3600);
              }
              return _this.log_response(data);
            });
          });
        }
      });
    };

    ExpressServ.prototype.component_hardware_usage = function(req, res) {
      var _this = this;
      this.log_request(req);
      res.header('Connection', 'close');
      return redis.get("" + req.params.component + "-usage_stats_day", function(err, response) {
        if (err) _this.handle_error(err, res);
        if (response) {
          res.send("hardwareUsage(" + response + ")");
          return _this.log_response(response);
        } else {
          return chain.add(function(job) {
            return db.query("SELECT AVG(ram) as  \"ram\", SUM(cpu) / SUM(duration) / 1000 as  \"cpu\",  \"hour\" as  \"hour\" FROM (SELECT AVG(ram) as  \"ram\", MAX(cpu) - MIN(cpu) as  \"cpu\", MAX(created_at) - MIN(created_at) as  \"duration\", process_hour, MAX( \"hour\") as  \"hour\" FROM (SELECT component_stats.ram as  \"ram\", component_stats.cpu as  \"cpu\", component_stats.created_at as  \"created_at\", component_stats.process_id || '_' || extract(hour FROM component_stats.created_at) as  \"process_hour\", MOD(EXTRACT(hour from component_stats.created_at) - EXTRACT(hour from good_date.good_time) + 24, 24) as  \"hour\" FROM component_stats, (SELECT cast(new_time. \"year\" || '-' || new_time. \"month\" || '-' || new_time. \"day\" || ' ' || new_time. \"hour\" || ':00:00.000000' as timestamp) as good_time from (select extract(year from time.time) as  \"year\", extract(month from time.time) as  \"month\", extract(day from time.time) as  \"day\", extract(hour from time.time) as  \"hour\" from (select current_timestamp as time ) time ) new_time ) good_date WHERE component_stats.component_id = '" + req.params.component + "' AND component_stats.created_at >= good_date.good_time - interval '1' day AND component_stats.created_at < good_date.good_time ) processes GROUP BY  \"process_hour\") component GROUP BY  \"hour\";", function(err, result, moreResultSets) {
              var array, data, i;
              job.finish();
              if (err) _this.handle_error(err, res);
              array = [];
              try {
                i = 0;
                while (i < 24) {
                  array.push({
                    cpu: 0,
                    mem: 0,
                    hour: i.toString()
                  });
                  i++;
                }
                i = 0;
                while (i < result.length) {
                  result[i].ram = Math.round(result[i].ram);
                  array[eval(result[i].hour)] = result[i];
                  i++;
                }
              } catch (error) {
                console.log("Parsing ERROR: " + error);
                array = [];
              }
              data = {
                data: array,
                description: ""
              };
              res.send("hardwareUsage(" + (JSON.stringify(data)) + ")");
              if (array !== []) {
                redis.set("" + req.params.component + "-usage_stats_day", JSON.stringify(data));
              }
              if (array !== []) {
                redis.expire("" + req.params.component + "-usage_stats_day", 300);
              }
              return _this.log_response(data);
            });
          });
        }
      });
    };

    ExpressServ.prototype.app_bandwidth_days = function(req, res) {
      var _this = this;
      this.log_request(req);
      res.header('Connection', 'close');
      return redis.get("" + req.params.app + "-bandwidth_days", function(err, response) {
        if (err) _this.handle_error(err, res);
        if (response) {
          res.send("bandwidth_days(" + response + ")");
          return _this.log_request();
        } else {
          return chain.add(function(job) {
            return db.query("SELECT sum(bytes) as \"total\" FROM bandwidth_stats WHERE app_id='" + req.params.app + "' and created_at>CURRENT_TIMESTAMP - INTERVAL '" + (req.query.days || 14) + "' DAY", function(err, result, moreResultSets) {
              var data;
              job.finish();
              if (err) _this.handle_error(err, res);
              data = {
                data: result,
                description: "Bandwidth 2 weeks"
              };
              res.send("bandwidth_days(" + (JSON.stringify(data)) + ")");
              if (result !== []) {
                redis.set("" + req.params.app + "-bandwidth_days", JSON.stringify(data));
              }
              if (result !== []) {
                redis.expire("" + req.params.app + "-bandwidth_days", 1800);
              }
              return _this.log_response(data);
            });
          });
        }
      });
    };

    ExpressServ.prototype.app_bandwidth_month = function(req, res) {
      var _this = this;
      this.log_request(req);
      res.header('Connection', 'close');
      return redis.get("" + req.params.app + "-bandwidth_month", function(err, response) {
        if (err) _this.handle_error(err, res);
        if (response) {
          res.send("bandwidth_month(" + response + ")");
          return _this.log_request();
        } else {
          return chain.add(function(job) {
            return db.query("SELECT sum(bytes) as \"total\" FROM pagoda_stats.bandwidth_stats WHERE app_id='" + req.params.app + "' and created_at between '" + req.query.year + "-" + req.query.month + "-" + req.query.day + "' and '" + (parseInt(req.query.month) === 12 ? parseInt(req.query.year) + 1 : req.query.year) + "-" + ((parseInt(req.query.month) + 1) % 12) + "-" + req.query.day + "'", function(err, result, moreResultSets) {
              var data;
              job.finish();
              if (err) _this.handle_error(err, res);
              data = {
                data: result,
                description: "Bandwidth 1 month"
              };
              res.send("bandwidth_month(" + (JSON.stringify(data)) + ")");
              if (result !== []) {
                redis.set("" + req.params.app + "-bandwidth_month", JSON.stringify(data));
              }
              if (result !== []) {
                redis.expire("" + req.params.app + "-bandwidth_month", 1800);
              }
              return _this.log_response(data);
            });
          });
        }
      });
    };

    ExpressServ.prototype.make_it_pretty = function(number) {
      if (number < 10) {
        return 10;
      } else if (number < 500) {
        return Math.round((number / 10) + 1) * 10;
      } else {
        return Math.round((number / 100) + 1) * 100;
      }
    };

    ExpressServ.prototype.component_quick_stats_day = function(req, res) {
      var _this = this;
      this.log_request(req);
      res.header('Connection', 'close');
      return redis.get("" + req.params.component + "-quick_stats_day", function(err, response) {
        if (err) _this.handle_error(err, res);
        if (response) {
          res.send("quickStats_day(" + response + ")");
          return _this.log_request();
        } else {
          return chain.add(function(job) {
            return db.query("SELECT count(*) as \"total\", avg(duration) as \"response\" FROM web_requests WHERE component_id='" + req.params.component + "' and created_at>CURRENT_TIMESTAMP - INTERVAL '1' DAY", function(err, result, moreResultSets) {
              var data;
              job.finish();
              if (err) _this.handle_error(err, res);
              try {
                result[0]['response'] = "" + ((eval(result[0]['response']) / 1000).toFixed());
              } catch (error) {
                console.log("Parsing ERROR: " + error);
                result = [];
              }
              data = {
                data: result,
                description: "Last 24 Hours"
              };
              res.send("quickStats_day(" + (JSON.stringify(data)) + ")");
              if (result !== []) {
                redis.set("" + req.params.component + "-quick_stats_day", JSON.stringify(data));
              }
              if (result !== []) {
                redis.expire("" + req.params.component + "-quick_stats_day", 1800);
              }
              return _this.log_response(data);
            });
          });
        }
      });
    };

    ExpressServ.prototype.component_quick_stats_week = function(req, res) {
      var _this = this;
      this.log_request(req);
      res.header('Connection', 'close');
      return redis.get("" + req.params.component + "-quick_stats_week", function(err, response) {
        if (err) _this.handle_error(err, res);
        if (response) {
          res.send("quickStats_week(" + response + ")");
          return _this.log_response(response);
        } else {
          return chain.add(function(job) {
            return db.query("SELECT count(*) as \"total\", avg(duration) as \"response\" FROM web_requests WHERE component_id='" + req.params.component + "' and created_at>CURRENT_TIMESTAMP - INTERVAL '7' DAY", function(err, result, moreResultSets) {
              var data;
              job.finish();
              if (err) _this.handle_error(err, res);
              try {
                result[0]['response'] = "" + ((eval(result[0]['response']) / 1000).toFixed());
              } catch (error) {
                console.log("Parsing ERROR: " + error);
                result = [];
              }
              data = {
                data: result,
                description: "Last 7 Days"
              };
              res.send("quickStats_week(" + (JSON.stringify(data)) + ")");
              if (result !== []) {
                redis.set("" + req.params.component + "-quick_stats_week", JSON.stringify(data));
              }
              if (result !== []) {
                redis.expire("" + req.params.component + "-quick_stats_week", 3600);
              }
              return _this.log_response(data);
            });
          });
        }
      });
    };

    ExpressServ.prototype.component_quick_stats_month = function(req, res) {
      var _this = this;
      this.log_request(req);
      res.header('Connection', 'close');
      return redis.get("" + req.params.component + "-quick_stats_month", function(err, response) {
        if (err) _this.handle_error(err, res);
        if (response) {
          res.send("quickStats_month(" + response + ")");
          return _this.log_response(response);
        } else {
          return chain.add(function(job) {
            return db.query("SELECT count(*) as \"total\", avg(duration) as \"response\" FROM web_requests WHERE component_id='" + req.params.component + "' and created_at>CURRENT_TIMESTAMP - INTERVAL '30' DAY", function(err, result, moreResultSets) {
              var data;
              job.finish();
              if (err) _this.handle_error(err, res);
              try {
                result[0]['response'] = "" + ((eval(result[0]['response']) / 1000).toFixed());
              } catch (error) {
                console.log("Parsing ERROR: " + error);
                result = [];
              }
              data = {
                data: result,
                description: "Last 30 Days"
              };
              res.send("quickStats_month(" + (JSON.stringify(data)) + ")");
              if (result !== []) {
                redis.set("" + req.params.component + "-quick_stats_month", JSON.stringify(data));
              }
              if (result !== []) {
                redis.expire("" + req.params.component + "-quick_stats_month", 86400);
              }
              return _this.log_response(data);
            });
          });
        }
      });
    };

    ExpressServ.prototype.component_web_requests = function(req, res) {
      var _this = this;
      this.log_request(req);
      res.header('Connection', 'close');
      return redis.get("" + req.params.component + "-web_requests", function(err, response) {
        if (err) _this.handle_error(err, res);
        if (response) {
          res.send("webRequests(" + response + ")");
          return _this.log_response(response);
        } else {
          return chain.add(function(job) {
            return db.query("(SELECT count(*) as \"total\", cast((avg(web_requests.duration) / 1000) as DECIMAL(18,2)) as \"average\", CAST(MOD(EXTRACT(hour from web_requests.created_at) - EXTRACT(hour from good_date.good_time) + 24, 24) as CHAR(3)) as \"hour\" from web_requests, (select cast(new_time.\"year\" || '-' || new_time.\"month\" || '-' || new_time.\"day\" || ' ' || new_time.\"hour\" || ':00:00.000000' as timestamp) as good_time from (select extract(year from time.time) as \"year\", extract(month from time.time) as \"month\", extract(day from time.time) as \"day\", extract(hour from time.time) as \"hour\" from (select current_timestamp as time) time) new_time) good_date where web_requests.created_at >= good_date.good_time - interval '1' day and web_requests.created_at < good_date.good_time and web_requests.component_id='" + req.params.component + "' GROUP BY \"hour\");", function(err, result, moreResultSets) {
              var array, data, i, max_avg, max_total;
              job.finish();
              if (err) _this.handle_error(err, res);
              array = [];
              try {
                i = 0;
                while (i < 24) {
                  array.push({
                    total: "0",
                    average: 0,
                    hour: i.toString()
                  });
                  i++;
                }
                max_total = 0;
                max_avg = 0;
                i = 0;
                while (i < result.length) {
                  if (Math.round(result[i].average) > max_avg) {
                    max_avg = Math.round(result[i].average);
                  }
                  if (eval(result[i].total) > max_total) {
                    max_total = eval(result[i].total);
                  }
                  result[i].average = Math.round(result[i].average);
                  array[eval(result[i].hour)] = result[i];
                  i++;
                }
                array.push({
                  total: _this.make_it_pretty(max_total),
                  average: _this.make_it_pretty(max_avg),
                  hour: "max"
                });
              } catch (error) {
                console.log("Parsing ERROR: " + error);
                array = [];
              }
              data = {
                data: array,
                description: ""
              };
              res.send("webRequests(" + (JSON.stringify(data)) + ")");
              if (array !== []) {
                redis.set("" + req.params.component + "-web_requests", JSON.stringify(data));
              }
              if (array !== []) {
                redis.expire("" + req.params.component + "-web_requests", 300);
              }
              return _this.log_response(data);
            });
          });
        }
      });
    };

    ExpressServ.prototype.component_response_time = function(req, res) {
      var _this = this;
      this.log_request(req);
      res.header('Connection', 'close');
      return redis.get("" + req.params.component + "-response_time", function(err, response) {
        if (err) _this.handle_error(err, res);
        if (response) {
          res.send("responseTime(" + response + ")");
          return _this.log_response(response);
        } else {
          return chain.add(function(job) {
            return db.query("SELECT cast((quarter.count * 100.0) / (total.count * 1.0) as DECIMAL(18,2)) as quarter, cast((half.count * 100.0) / (total.count * 1.0) as DECIMAL(18,2)) as half, cast((one.count * 100.0) / (total.count * 1.0) as DECIMAL(18,2)) as one, cast(((quarter.count + half.count + one.count) * 100.0) / (total.count * 1.0) as DECIMAL(18,2)) as full_second, cast((two.count * 100.0) / (total.count * 1.0) as DECIMAL(18,2)) as two, cast((three.count * 100.0) / (total.count * 1.0) as DECIMAL(18,2)) as three, cast((four.count * 100.0) / (total.count * 1.0) as DECIMAL(18,2)) as four, cast((more.count * 100.0) / (total.count * 1.0) as DECIMAL(18,2)) as more FROM (SELECT COUNT(*) as count FROM web_requests WHERE component_id='" + req.params.component + "' AND created_at>CURRENT_TIMESTAMP - INTERVAL '1' DAY AND duration <= 250000) quarter, (SELECT COUNT(*) as count FROM web_requests WHERE component_id='" + req.params.component + "' AND created_at>CURRENT_TIMESTAMP - INTERVAL '1' DAY AND duration <= 500000  AND duration > 250000) half, (SELECT COUNT(*) as count FROM web_requests WHERE component_id='" + req.params.component + "' AND created_at>CURRENT_TIMESTAMP - INTERVAL '1' DAY AND duration <= 1000000 AND duration > 500000) one, (SELECT COUNT(*) as count FROM web_requests WHERE component_id='" + req.params.component + "' AND created_at>CURRENT_TIMESTAMP - INTERVAL '1' DAY AND duration <= 2000000 AND duration > 1000000) two, (SELECT COUNT(*) as count FROM web_requests WHERE component_id='" + req.params.component + "' AND created_at>CURRENT_TIMESTAMP - INTERVAL '1' DAY AND duration <= 3000000 AND duration > 2000000) three, (SELECT COUNT(*) as count FROM web_requests WHERE component_id='" + req.params.component + "' AND created_at>CURRENT_TIMESTAMP - INTERVAL '1' DAY AND duration <= 4000000 AND duration > 3000000) four, (SELECT COUNT(*) as count FROM web_requests WHERE component_id='" + req.params.component + "' AND created_at>CURRENT_TIMESTAMP - INTERVAL '1' DAY AND duration >  4000000) more, (SELECT CASE COUNT(*) WHEN 0 THEN 1 ELSE COUNT(*) END as count FROM web_requests WHERE component_id='" + req.params.component + "' AND created_at>CURRENT_TIMESTAMP - INTERVAL '1' DAY) total", function(err, result, moreResultSets) {
              var data;
              job.finish();
              if (err) _this.handle_error(err, res);
              try {
                result[0].quarter = Math.round(eval(result[0].quarter) * 10) / 10;
                result[0].half = Math.round(eval(result[0].half) * 10) / 10;
                result[0].one = Math.round(eval(result[0].one) * 10) / 10;
                result[0].full_second = Math.round(eval(result[0].full_second) * 10) / 10;
                result[0].two = Math.round(eval(result[0].two) * 10) / 10;
                result[0].three = Math.round(eval(result[0].three) * 10) / 10;
                result[0].four = Math.round(eval(result[0].four) * 10) / 10;
                result[0].more = Math.round(eval(result[0].more) * 10) / 10;
              } catch (error) {
                console.log("Parsing ERROR: " + error);
                result = [];
              }
              data = {
                data: result,
                description: ""
              };
              res.send("responseTime(" + (JSON.stringify(data)) + ")");
              if (result !== []) {
                redis.set("" + req.params.component + "-response_time", JSON.stringify(data));
              }
              if (result !== []) {
                redis.expire("" + req.params.component + "-response_time", 3600);
              }
              return _this.log_response(data);
            });
          });
        }
      });
    };

    ExpressServ.prototype.component_slowest_response = function(req, res) {
      var _this = this;
      this.log_request(req);
      res.header('Connection', 'close');
      return redis.get("" + req.params.component + "-slowest_response", function(err, response) {
        if (err) _this.handle_error(err, res);
        if (response) {
          res.send("pageStats_slowestResponseTime(" + response + ")");
          return _this.log_response(response);
        } else {
          return chain.add(function(job) {
            return db.query("SELECT path, avg(duration) as \"metric\" FROM web_requests WHERE component_id='" + req.params.component + "' and created_at>CURRENT_TIMESTAMP - INTERVAL '1' DAY GROUP BY \"path\" ORDER BY \"metric\" DESC LIMIT 20", function(err, result, moreResultSets) {
              var data, i;
              job.finish();
              if (err) _this.handle_error(err, res);
              try {
                i = 0;
                while (i < result.length) {
                  result[i].metric = "" + ((eval(result[i]['metric']) / 1000).toFixed());
                  i++;
                }
              } catch (error) {
                console.log("Parsing ERROR: " + error);
                result = [];
              }
              data = {
                data: result,
                description: "URL's With Slowest Response Time:"
              };
              res.send("pageStats_slowestResponseTime(" + (JSON.stringify(data)) + ")");
              if (result !== []) {
                redis.set("" + req.params.component + "-slowest_response", JSON.stringify(data));
              }
              if (result !== []) {
                redis.expire("" + req.params.component + "-slowest_response", 3600);
              }
              return _this.log_response(data);
            });
          });
        }
      });
    };

    ExpressServ.prototype.component_most_viewed = function(req, res) {
      var _this = this;
      this.log_request(req);
      res.header('Connection', 'close');
      return redis.get("" + req.params.component + "-most_viewed", function(err, response) {
        if (err) _this.handle_error(err, res);
        if (response) {
          res.send("pageStats_mostViewed(" + response + ")");
          return _this.log_response(response);
        } else {
          return chain.add(function(job) {
            return db.query("SELECT pages.path as path, (pages.count * 100.0) / (total.count * 1.0) as \"metric\" FROM (SELECT path, count(*) as \"count\" FROM web_requests WHERE component_id='" + req.params.component + "' and created_at>CURRENT_TIMESTAMP - INTERVAL '1' DAY GROUP BY path) pages, (SELECT CASE COUNT(*) WHEN 0 THEN 1 ELSE COUNT(*) END as count FROM web_requests WHERE component_id='" + req.params.component + "' AND created_at>CURRENT_TIMESTAMP - INTERVAL '1' DAY) total ORDER BY \"metric\" DESC LIMIT 20;", function(err, result, moreResultSets) {
              var data, i;
              job.finish();
              if (err) _this.handle_error(err, res);
              try {
                i = 0;
                while (i < result.length) {
                  result[i].metric = "" + (Math.round(eval(result[i]['metric']))) + "%";
                  i++;
                }
              } catch (error) {
                console.log("Parsing ERROR: " + error);
                result = [];
              }
              data = {
                data: result,
                description: "Most Viewed URLs:"
              };
              res.send("pageStats_mostViewed(" + (JSON.stringify(data)) + ")");
              if (result !== []) {
                redis.set("" + req.params.component + "-most_viewed", JSON.stringify(data));
              }
              if (result !== []) {
                redis.expire("" + req.params.component + "-most_viewed", 3600);
              }
              return _this.log_response(data);
            });
          });
        }
      });
    };

    ExpressServ.prototype.hello_world = function(req, res) {
      res.header('Connection', 'close');
      return res.send("hello BIG world");
    };

    return ExpressServ;

  })();

}).call(this);
