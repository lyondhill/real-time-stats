db = new require("odbc").Database();
redis = require('redis').createClient(6379, '10.60.38.98')
chain = require('chain-gang').create({workers: 1})
# redis = require('redis').createClient(6379, '127.0.0.1')

##################################################
#  app = require("express").createServer()
#  io = require("socket.io").listen(app)
#  app.listen 80
#  app.get "/", (req, res) ->
#    res.sendfile __dirname + "/index.html"
#  
#  io.sockets.on "connection", (socket) ->
#    socket.emit "news",
#      hello: "world"
#  
#    socket.on "my other event", (data) ->
#      console.log data
# ################################################

module.exports = class Server

  constructor: (@host, @port) ->
    @log = false
    @app = require('express').createServer();
    @io = require("socket.io").listen(@app)
    @set_routes()
    @app.listen(@port, @host)

    # process.on "uncaughtException", (exception) ->
    #   console.error "uncaught exception: #{exception}!"
    #   setTimeout (->
    #     redis = require('redis').createClient(6379, '10.60.38.98')
    #     console.log JSON.stringify(redis)
    #     db.open "DSN=MonetDB;UID=pagoda_stats;PWD=9S6HwS05yzfQ;DATABASE=pagoda_stats", () ->
    #       console.log 'monet reconnected'
    #     ), 5000

  set_routes: () ->
    @app.get "/apps/top-50", @apps_top_fifty
    @app.get "/apps/:app/quick-stats-day", @app_quick_stats_day
    @app.get "/apps/:app/quick-stats-week", @app_quick_stats_week
    @app.get "/apps/:app/quick-stats-month", @app_quick_stats_month
    @app.get "/apps/:app/web-requests", @app_web_requests
    @app.get "/apps/:app/response-time", @app_response_time
    @app.get "/apps/:app/slowest-response-time", @app_slowest_response
    @app.get "/apps/:app/most-viewed", @app_most_viewed
    @app.get "/apps/:app/bandwidth-days", @app_bandwidth_days
    @app.get "/apps/:app/bandwidth-month", @app_bandwidth_month
    @app.get "/components/:component/hardware-usage", @component_hardware_usage
    @app.get "/components/:component/quick-stats-day", @component_quick_stats_day
    @app.get "/components/:component/quick-stats-week", @component_quick_stats_week
    @app.get "/components/:component/quick-stats-month", @component_quick_stats_month
    @app.get "/components/:component/web-requests", @component_web_requests
    @app.get "/components/:component/response-time", @component_response_time
    @app.get "/components/:component/slowest-response-time", @component_slowest_response
    @app.get "/components/:component/most-viewed", @component_most_viewed
    @app.get "/", @hello_world

  handle_error: (err, res) =>
    console.log("ERROR: #{err}")
    res.send(err, 500);
    throw new Exception("ERROR: #{err}")

  log_request: (req) =>
    if @log
      console.log "#{Date().toString()} => Incoming Request to #{req.url}"
      console.log "#{Date().toString()} => REQUEST PARAMS:"
      console.log "#{Date().toString()} => ----------------------------"
      console.log req.params
      console.log "#{Date().toString()} => ----------------------------"

  log_response: (data) =>
    if @log
      console.log "#{Date().toString()} => Responding to request with:"
      console.log "#{Date().toString()} => ----------------------------"
      console.log data
      console.log "#{Date().toString()} => ----------------------------"
      console.log "#{Date().toString()} => SUCCESS!"


  apps_top_fifty: (req, res) =>
    @log_request(req)
    res.header('Connection','close')
    chain.add (job) =>
      db.query "SELECT app_id, count(*) as \"total\" FROM pagoda_stats.web_requests WHERE created_at>CURRENT_TIMESTAMP - INTERVAL '#{req.query.days || 30}' DAY GROUP BY app_id ORDER BY count(*) DESC LIMIT 50", (err, result, moreResultSets) =>
        job.finish()
        @handle_error(err, res) if err
        data = data: result, description: "top apps for #{req.query.days || 30} days"
        res.send JSON.stringify(data)
        @log_response(data)

  app_quick_stats_day: (req, res) =>
    @log_request(req)
    res.header('Connection','close')
    redis.get "#{req.params.app}-quick_stats_day", (err, response) =>
      @handle_error(err, res) if err
      if response
        res.send "quickStats_day(#{response})"
        @log_request()
      else
        chain.add (job) =>
          db.query "SELECT count(*) as \"total\", avg(duration) as \"response\" FROM web_requests WHERE app_id='#{req.params.app}' and created_at>CURRENT_TIMESTAMP - INTERVAL '1' DAY", (err, result, moreResultSets) =>
            job.finish()
            @handle_error(err, res) if err
            try
              result[0]['response'] = "#{(eval(result[0]['response'])/1000).toFixed()}"
            catch error
              console.log "Parsing ERROR: #{error}"
              result = []
            data = data: result, description: "Last 24 Hours"
            res.send "quickStats_day(#{JSON.stringify(data)})"
            redis.set("#{req.params.app}-quick_stats_day", JSON.stringify(data)) unless result == []
            redis.expire("#{req.params.app}-quick_stats_day", 1800) unless result == []
            @log_response(data)

  app_quick_stats_week: (req, res) =>
    @log_request(req)
    res.header('Connection','close')
    redis.get "#{req.params.app}-quick_stats_week", (err, response) =>
      @handle_error(err, res) if err
      if response
        res.send "quickStats_week(#{response})"
        @log_response(response)
      else
        chain.add (job) =>
          db.query "SELECT count(*) as \"total\", avg(duration) as \"response\" FROM web_requests WHERE app_id='#{req.params.app}' and created_at>CURRENT_TIMESTAMP - INTERVAL '7' DAY", (err, result, moreResultSets) =>
            job.finish()
            @handle_error(err, res) if err
            try
              result[0]['response'] = "#{(eval(result[0]['response'])/1000).toFixed()}"
            catch error
              console.log "Parsing ERROR: #{error}"
              result = []
            data = data: result, description: "Last 7 Days"
            res.send "quickStats_week(#{JSON.stringify(data)})"
            redis.set("#{req.params.app}-quick_stats_week", JSON.stringify(data)) unless result == []
            redis.expire("#{req.params.app}-quick_stats_week", 3600) unless result == []
            @log_response(data)

  app_quick_stats_month: (req, res) =>
    @log_request(req)
    res.header('Connection','close')
    redis.get "#{req.params.app}-quick_stats_month", (err, response) =>
      @handle_error(err, res) if err
      if response
        res.send "quickStats_month(#{response})"
        @log_response(response)
      else
        chain.add (job) =>
          db.query "SELECT count(*) as \"total\", avg(duration) as \"response\" FROM web_requests WHERE app_id='#{req.params.app}' and created_at>CURRENT_TIMESTAMP - INTERVAL '30' DAY", (err, result, moreResultSets) =>
            job.finish()
            @handle_error(err, res) if err
            try
              result[0]['response'] = "#{(eval(result[0]['response'])/1000).toFixed()}"
            catch error
              console.log "Parsing ERROR: #{error}"
              result = []
            data = data: result, description: "Last 30 Days"
            res.send "quickStats_month(#{JSON.stringify(data)})"
            redis.set("#{req.params.app}-quick_stats_month", JSON.stringify(data)) unless result == []
            redis.expire("#{req.params.app}-quick_stats_month", 86400) unless result == []
            @log_response(data)

  app_web_requests: (req, res) =>
    @log_request(req)
    res.header('Connection','close')
    redis.get "#{req.params.app}-web_requests", (err, response) =>
      @handle_error(err, res) if err
      if response
        res.send "webRequests(#{response})"
        @log_response(response)
      else
        chain.add (job) =>
          db.query "(SELECT count(*) as \"total\", cast((avg(web_requests.duration) / 1000) as DECIMAL(18,2)) as \"average\", CAST(MOD(EXTRACT(hour from web_requests.created_at) - EXTRACT(hour from good_date.good_time) + 24, 24) as CHAR(3)) as \"hour\" from web_requests, (select cast(new_time.\"year\" || '-' || new_time.\"month\" || '-' || new_time.\"day\" || ' ' || new_time.\"hour\" || ':00:00.000000' as timestamp) as good_time from (select extract(year from time.time) as \"year\", extract(month from time.time) as \"month\", extract(day from time.time) as \"day\", extract(hour from time.time) as \"hour\" from (select current_timestamp as time) time) new_time) good_date where web_requests.created_at >= good_date.good_time - interval '1' day and web_requests.created_at < good_date.good_time and web_requests.app_id='#{req.params.app}' GROUP BY \"hour\");", (err, result, moreResultSets) =>
            job.finish()
            @handle_error(err, res) if err
            array = []
            try
              i = 0
              while i < 24
                array.push total: "0", average: 0, hour: i.toString()
                i++
              max_total = 0
              max_avg = 0
              i = 0
              while i < result.length
                max_avg = Math.round(result[i].average) if Math.round(result[i].average) > max_avg
                max_total = eval(result[i].total) if eval(result[i].total) > max_total
                result[i].average = Math.round(result[i].average)
                array[eval(result[i].hour)] = result[i]
                i++
              array.push total: @make_it_pretty(max_total), average: @make_it_pretty(max_avg), hour: "max"
            catch error
              console.log "Parsing ERROR: #{error}"
              array = []

            data = data: array, description: ""
            res.send "webRequests(#{JSON.stringify(data)})"
            redis.set("#{req.params.app}-web_requests", JSON.stringify(data)) unless array == []
            redis.expire("#{req.params.app}-web_requests", 300) unless array == []
            @log_response(data)

  app_response_time: (req, res) =>
    @log_request(req)
    res.header('Connection','close')
    redis.get "#{req.params.app}-response_time", (err, response) =>
      @handle_error(err, res) if err
      if response
        res.send "responseTime(#{response})"
        @log_response(response)
      else
        chain.add (job) =>
          db.query "SELECT cast((quarter.count * 100.0) / (total.count * 1.0) as DECIMAL(18,2)) as quarter, cast((half.count * 100.0) / (total.count * 1.0) as DECIMAL(18,2)) as half, cast((one.count * 100.0) / (total.count * 1.0) as DECIMAL(18,2)) as one, cast(((quarter.count + half.count + one.count) * 100.0) / (total.count * 1.0) as DECIMAL(18,2)) as full_second, cast((two.count * 100.0) / (total.count * 1.0) as DECIMAL(18,2)) as two, cast((three.count * 100.0) / (total.count * 1.0) as DECIMAL(18,2)) as three, cast((four.count * 100.0) / (total.count * 1.0) as DECIMAL(18,2)) as four, cast((more.count * 100.0) / (total.count * 1.0) as DECIMAL(18,2)) as more FROM (SELECT COUNT(*) as count FROM web_requests WHERE app_id='#{req.params.app}' AND created_at>CURRENT_TIMESTAMP - INTERVAL '1' DAY AND duration <= 250000) quarter, (SELECT COUNT(*) as count FROM web_requests WHERE app_id='#{req.params.app}' AND created_at>CURRENT_TIMESTAMP - INTERVAL '1' DAY AND duration <= 500000  AND duration > 250000) half, (SELECT COUNT(*) as count FROM web_requests WHERE app_id='#{req.params.app}' AND created_at>CURRENT_TIMESTAMP - INTERVAL '1' DAY AND duration <= 1000000 AND duration > 500000) one, (SELECT COUNT(*) as count FROM web_requests WHERE app_id='#{req.params.app}' AND created_at>CURRENT_TIMESTAMP - INTERVAL '1' DAY AND duration <= 2000000 AND duration > 1000000) two, (SELECT COUNT(*) as count FROM web_requests WHERE app_id='#{req.params.app}' AND created_at>CURRENT_TIMESTAMP - INTERVAL '1' DAY AND duration <= 3000000 AND duration > 2000000) three, (SELECT COUNT(*) as count FROM web_requests WHERE app_id='#{req.params.app}' AND created_at>CURRENT_TIMESTAMP - INTERVAL '1' DAY AND duration <= 4000000 AND duration > 3000000) four, (SELECT COUNT(*) as count FROM web_requests WHERE app_id='#{req.params.app}' AND created_at>CURRENT_TIMESTAMP - INTERVAL '1' DAY AND duration >  4000000) more, (SELECT CASE COUNT(*) WHEN 0 THEN 1 ELSE COUNT(*) END as count FROM web_requests WHERE app_id='#{req.params.app}' AND created_at>CURRENT_TIMESTAMP - INTERVAL '1' DAY) total", (err, result, moreResultSets) =>
            job.finish()
            @handle_error(err, res) if err
            try
              result[0].quarter = Math.round((eval(result[0].quarter) * 10))/10
              result[0].half = Math.round((eval(result[0].half) * 10))/10
              result[0].one = Math.round((eval(result[0].one) * 10))/10
              result[0].full_second = Math.round((eval(result[0].full_second) * 10))/10
              result[0].two = Math.round((eval(result[0].two) * 10))/10
              result[0].three = Math.round((eval(result[0].three) * 10))/10
              result[0].four = Math.round((eval(result[0].four) * 10))/10
              result[0].more = Math.round((eval(result[0].more) * 10))/10
            catch error
              console.log "Parsing ERROR: #{error}"
              result = []
            data = data: result, description: ""
            res.send "responseTime(#{JSON.stringify(data)})"
            redis.set("#{req.params.app}-response_time", JSON.stringify(data)) unless result == []
            redis.expire("#{req.params.app}-response_time", 3600) unless result == []
            @log_response(data)

  app_slowest_response: (req, res) =>
    @log_request(req)
    res.header('Connection','close')
    redis.get "#{req.params.app}-slowest_response", (err, response) =>
      @handle_error(err, res) if err
      if response
        res.send "pageStats_slowestResponseTime(#{response})"
        @log_response(response)
      else
        chain.add (job) =>
          db.query "SELECT path, avg(duration) as \"metric\" FROM web_requests WHERE app_id='#{req.params.app}' and created_at>CURRENT_TIMESTAMP - INTERVAL '1' DAY GROUP BY \"path\" ORDER BY \"metric\" DESC LIMIT 20", (err, result, moreResultSets) =>
            job.finish()
            @handle_error(err, res) if err
            try
              i = 0
              while i < result.length
                result[i].metric = "#{(eval(result[i]['metric'])/1000).toFixed()}"
                i++
            catch error
              console.log "Parsing ERROR: #{error}"
              result = []
            data = data: result, description: "URL's With Slowest Response Time:"
            res.send "pageStats_slowestResponseTime(#{JSON.stringify(data)})"
            redis.set("#{req.params.app}-slowest_response", JSON.stringify(data)) unless result == []
            redis.expire("#{req.params.app}-slowest_response", 3600) unless result == []
            @log_response(data)

  app_most_viewed: (req, res) =>
    @log_request(req)
    res.header('Connection','close')
    redis.get "#{req.params.app}-most_viewed", (err, response) =>
      @handle_error(err, res) if err
      if response
        res.send "pageStats_mostViewed(#{response})"
        @log_response(response)
      else
        chain.add (job) =>
          db.query "SELECT pages.path as path, (pages.count * 100.0) / (total.count * 1.0) as \"metric\" FROM (SELECT path, count(*) as \"count\" FROM web_requests WHERE app_id='#{req.params.app}' and created_at>CURRENT_TIMESTAMP - INTERVAL '1' DAY GROUP BY path) pages, (SELECT CASE COUNT(*) WHEN 0 THEN 1 ELSE COUNT(*) END as count FROM web_requests WHERE app_id='#{req.params.app}' AND created_at>CURRENT_TIMESTAMP - INTERVAL '1' DAY) total ORDER BY \"metric\" DESC LIMIT 20;", (err, result, moreResultSets) =>
            job.finish()
            @handle_error(err, res) if err
            try
              i = 0
              while i < result.length
                result[i].metric = "#{(Math.round(eval(result[i]['metric'])))}%"
                i++
            catch error
              console.log "Parsing ERROR: #{error}"
              result = []
            data = data: result, description: "Most Viewed URLs:"
            res.send "pageStats_mostViewed(#{JSON.stringify(data)})"
            redis.set("#{req.params.app}-most_viewed", JSON.stringify(data)) unless result == []
            redis.expire("#{req.params.app}-most_viewed", 3600) unless result == []
            @log_response(data)

# Needs more things. 
  component_hardware_usage: (req, res) =>
    @log_request(req)
    res.header('Connection','close')
    redis.get "#{req.params.component}-usage_stats_day", (err, response) =>
      @handle_error(err, res) if err
      if response
        res.send "hardwareUsage(#{response})"
        @log_response(response)
      else
        chain.add (job) =>
          db.query "SELECT AVG(ram) as  \"ram\", SUM(cpu) / SUM(duration) / 1000 as  \"cpu\",  \"hour\" as  \"hour\" FROM (SELECT AVG(ram) as  \"ram\", MAX(cpu) - MIN(cpu) as  \"cpu\", MAX(created_at) - MIN(created_at) as  \"duration\", process_hour, MAX( \"hour\") as  \"hour\" FROM (SELECT component_stats.ram as  \"ram\", component_stats.cpu as  \"cpu\", component_stats.created_at as  \"created_at\", component_stats.process_id || '_' || extract(hour FROM component_stats.created_at) as  \"process_hour\", MOD(EXTRACT(hour from component_stats.created_at) - EXTRACT(hour from good_date.good_time) + 24, 24) as  \"hour\" FROM component_stats, (SELECT cast(new_time. \"year\" || '-' || new_time. \"month\" || '-' || new_time. \"day\" || ' ' || new_time. \"hour\" || ':00:00.000000' as timestamp) as good_time from (select extract(year from time.time) as  \"year\", extract(month from time.time) as  \"month\", extract(day from time.time) as  \"day\", extract(hour from time.time) as  \"hour\" from (select current_timestamp as time ) time ) new_time ) good_date WHERE component_stats.component_id = '#{req.params.component}' AND component_stats.created_at >= good_date.good_time - interval '1' day AND component_stats.created_at < good_date.good_time ) processes GROUP BY  \"process_hour\") component GROUP BY  \"hour\";", (err, result, moreResultSets) =>
            job.finish()
            @handle_error(err, res) if err
            array = []
            try
              i = 0
              while i < 24
                array.push cpu: 0, mem: 0, hour: i.toString()
                i++
              i = 0
              while i < result.length
                result[i].ram = Math.round(result[i].ram)
                array[eval(result[i].hour)] = result[i]
                i++
            catch error
              console.log "Parsing ERROR: #{error}"
              array = []

            data = data: array, description: ""
            res.send "hardwareUsage(#{JSON.stringify(data)})"
            redis.set("#{req.params.component}-usage_stats_day", JSON.stringify(data)) unless array == []
            redis.expire("#{req.params.component}-usage_stats_day", 300) unless array == []
            @log_response(data)

  app_bandwidth_days: (req, res) =>
    @log_request(req)
    res.header('Connection','close')
    redis.get "#{req.params.app}-bandwidth_days", (err, response) =>
      @handle_error(err, res) if err
      if response
        res.send "bandwidth_days(#{response})"
        @log_request()
      else
        chain.add (job) =>
          db.query "SELECT sum(bytes) as \"total\" FROM bandwidth_stats WHERE app_id='#{req.params.app}' and created_at>CURRENT_TIMESTAMP - INTERVAL '#{req.query.days || 14}' DAY", (err, result, moreResultSets) =>
            job.finish()
            @handle_error(err, res) if err
            data = data: result, description: "Bandwidth 2 weeks"
            res.send "bandwidth_days(#{JSON.stringify(data)})"
            redis.set("#{req.params.app}-bandwidth_days", JSON.stringify(data)) unless result == []
            redis.expire("#{req.params.app}-bandwidth_days", 1800) unless result == []
            @log_response(data)

  app_bandwidth_month: (req, res) =>
    @log_request(req)
    res.header('Connection','close')
    redis.get "#{req.params.app}-bandwidth_month", (err, response) =>
      @handle_error(err, res) if err
      if response
        res.send "bandwidth_month(#{response})"
        @log_request()
      else
        chain.add (job) =>
          db.query "SELECT sum(bytes) as \"total\" FROM pagoda_stats.bandwidth_stats WHERE app_id='#{req.params.app}' and created_at between '#{req.query.year}-#{req.query.month}-#{req.query.day}' and '#{ if parseInt(req.query.month) == 12 then parseInt(req.query.year) + 1 else req.query.year}-#{(parseInt(req.query.month) + 1) % 12}-#{req.query.day}'", (err, result, moreResultSets) =>
            job.finish()
            @handle_error(err, res) if err
            data = data: result, description: "Bandwidth 1 month"
            res.send "bandwidth_month(#{JSON.stringify(data)})"
            redis.set("#{req.params.app}-bandwidth_month", JSON.stringify(data)) unless result == []
            redis.expire("#{req.params.app}-bandwidth_month", 1800) unless result == []
            @log_response(data)


  make_it_pretty: (number) =>
    if number < 10
      10
    else if number < 500
      Math.round((number/10)+1)*10
    else
      Math.round((number/100)+1)*100

  component_quick_stats_day: (req, res) =>
    @log_request(req)
    res.header('Connection','close')
    redis.get "#{req.params.component}-quick_stats_day", (err, response) =>
      @handle_error(err, res) if err
      if response
        res.send "quickStats_day(#{response})"
        @log_request()
      else
        chain.add (job) =>
          db.query "SELECT count(*) as \"total\", avg(duration) as \"response\" FROM web_requests WHERE component_id='#{req.params.component}' and created_at>CURRENT_TIMESTAMP - INTERVAL '1' DAY", (err, result, moreResultSets) =>
            job.finish()
            @handle_error(err, res) if err
            try
              result[0]['response'] = "#{(eval(result[0]['response'])/1000).toFixed()}"
            catch error
              console.log "Parsing ERROR: #{error}"
              result = []
            data = data: result, description: "Last 24 Hours"
            res.send "quickStats_day(#{JSON.stringify(data)})"
            redis.set("#{req.params.component}-quick_stats_day", JSON.stringify(data)) unless result == []
            redis.expire("#{req.params.component}-quick_stats_day", 1800) unless result == []
            @log_response(data)

  component_quick_stats_week: (req, res) =>
    @log_request(req)
    res.header('Connection','close')
    redis.get "#{req.params.component}-quick_stats_week", (err, response) =>
      @handle_error(err, res) if err
      if response
        res.send "quickStats_week(#{response})"
        @log_response(response)
      else
        chain.add (job) =>
          db.query "SELECT count(*) as \"total\", avg(duration) as \"response\" FROM web_requests WHERE component_id='#{req.params.component}' and created_at>CURRENT_TIMESTAMP - INTERVAL '7' DAY", (err, result, moreResultSets) =>
            job.finish()
            @handle_error(err, res) if err
            try
              result[0]['response'] = "#{(eval(result[0]['response'])/1000).toFixed()}"
            catch error
              console.log "Parsing ERROR: #{error}"
              result = []
            data = data: result, description: "Last 7 Days"
            res.send "quickStats_week(#{JSON.stringify(data)})"
            redis.set("#{req.params.component}-quick_stats_week", JSON.stringify(data)) unless result == []
            redis.expire("#{req.params.component}-quick_stats_week", 3600) unless result == []
            @log_response(data)

  component_quick_stats_month: (req, res) =>
    @log_request(req)
    res.header('Connection','close')
    redis.get "#{req.params.component}-quick_stats_month", (err, response) =>
      @handle_error(err, res) if err
      if response
        res.send "quickStats_month(#{response})"
        @log_response(response)
      else
        chain.add (job) =>
          db.query "SELECT count(*) as \"total\", avg(duration) as \"response\" FROM web_requests WHERE component_id='#{req.params.component}' and created_at>CURRENT_TIMESTAMP - INTERVAL '30' DAY", (err, result, moreResultSets) =>
            job.finish()
            @handle_error(err, res) if err
            try
              result[0]['response'] = "#{(eval(result[0]['response'])/1000).toFixed()}"
            catch error
              console.log "Parsing ERROR: #{error}"
              result = []
            data = data: result, description: "Last 30 Days"
            res.send "quickStats_month(#{JSON.stringify(data)})"
            redis.set("#{req.params.component}-quick_stats_month", JSON.stringify(data)) unless result == []
            redis.expire("#{req.params.component}-quick_stats_month", 86400) unless result == []
            @log_response(data)

  component_web_requests: (req, res) =>
    @log_request(req)
    res.header('Connection','close')
    redis.get "#{req.params.component}-web_requests", (err, response) =>
      @handle_error(err, res) if err
      if response
        res.send "webRequests(#{response})"
        @log_response(response)
      else
        chain.add (job) =>
          db.query "(SELECT count(*) as \"total\", cast((avg(web_requests.duration) / 1000) as DECIMAL(18,2)) as \"average\", CAST(MOD(EXTRACT(hour from web_requests.created_at) - EXTRACT(hour from good_date.good_time) + 24, 24) as CHAR(3)) as \"hour\" from web_requests, (select cast(new_time.\"year\" || '-' || new_time.\"month\" || '-' || new_time.\"day\" || ' ' || new_time.\"hour\" || ':00:00.000000' as timestamp) as good_time from (select extract(year from time.time) as \"year\", extract(month from time.time) as \"month\", extract(day from time.time) as \"day\", extract(hour from time.time) as \"hour\" from (select current_timestamp as time) time) new_time) good_date where web_requests.created_at >= good_date.good_time - interval '1' day and web_requests.created_at < good_date.good_time and web_requests.component_id='#{req.params.component}' GROUP BY \"hour\");", (err, result, moreResultSets) =>
            job.finish()
            @handle_error(err, res) if err
            array = []
            try
              i = 0
              while i < 24
                array.push total: "0", average: 0, hour: i.toString()
                i++
              max_total = 0
              max_avg = 0
              i = 0
              while i < result.length
                max_avg = Math.round(result[i].average) if Math.round(result[i].average) > max_avg
                max_total = eval(result[i].total) if eval(result[i].total) > max_total
                result[i].average = Math.round(result[i].average)
                array[eval(result[i].hour)] = result[i]
                i++
              array.push total: @make_it_pretty(max_total), average: @make_it_pretty(max_avg), hour: "max"
            catch error
              console.log "Parsing ERROR: #{error}"
              array = []

            data = data: array, description: ""
            res.send "webRequests(#{JSON.stringify(data)})"
            redis.set("#{req.params.component}-web_requests", JSON.stringify(data)) unless array == []
            redis.expire("#{req.params.component}-web_requests", 300) unless array == []
            @log_response(data)

  component_response_time: (req, res) =>
    @log_request(req)
    res.header('Connection','close')
    redis.get "#{req.params.component}-response_time", (err, response) =>
      @handle_error(err, res) if err
      if response
        res.send "responseTime(#{response})"
        @log_response(response)
      else
        chain.add (job) =>
          db.query "SELECT cast((quarter.count * 100.0) / (total.count * 1.0) as DECIMAL(18,2)) as quarter, cast((half.count * 100.0) / (total.count * 1.0) as DECIMAL(18,2)) as half, cast((one.count * 100.0) / (total.count * 1.0) as DECIMAL(18,2)) as one, cast(((quarter.count + half.count + one.count) * 100.0) / (total.count * 1.0) as DECIMAL(18,2)) as full_second, cast((two.count * 100.0) / (total.count * 1.0) as DECIMAL(18,2)) as two, cast((three.count * 100.0) / (total.count * 1.0) as DECIMAL(18,2)) as three, cast((four.count * 100.0) / (total.count * 1.0) as DECIMAL(18,2)) as four, cast((more.count * 100.0) / (total.count * 1.0) as DECIMAL(18,2)) as more FROM (SELECT COUNT(*) as count FROM web_requests WHERE component_id='#{req.params.component}' AND created_at>CURRENT_TIMESTAMP - INTERVAL '1' DAY AND duration <= 250000) quarter, (SELECT COUNT(*) as count FROM web_requests WHERE component_id='#{req.params.component}' AND created_at>CURRENT_TIMESTAMP - INTERVAL '1' DAY AND duration <= 500000  AND duration > 250000) half, (SELECT COUNT(*) as count FROM web_requests WHERE component_id='#{req.params.component}' AND created_at>CURRENT_TIMESTAMP - INTERVAL '1' DAY AND duration <= 1000000 AND duration > 500000) one, (SELECT COUNT(*) as count FROM web_requests WHERE component_id='#{req.params.component}' AND created_at>CURRENT_TIMESTAMP - INTERVAL '1' DAY AND duration <= 2000000 AND duration > 1000000) two, (SELECT COUNT(*) as count FROM web_requests WHERE component_id='#{req.params.component}' AND created_at>CURRENT_TIMESTAMP - INTERVAL '1' DAY AND duration <= 3000000 AND duration > 2000000) three, (SELECT COUNT(*) as count FROM web_requests WHERE component_id='#{req.params.component}' AND created_at>CURRENT_TIMESTAMP - INTERVAL '1' DAY AND duration <= 4000000 AND duration > 3000000) four, (SELECT COUNT(*) as count FROM web_requests WHERE component_id='#{req.params.component}' AND created_at>CURRENT_TIMESTAMP - INTERVAL '1' DAY AND duration >  4000000) more, (SELECT CASE COUNT(*) WHEN 0 THEN 1 ELSE COUNT(*) END as count FROM web_requests WHERE component_id='#{req.params.component}' AND created_at>CURRENT_TIMESTAMP - INTERVAL '1' DAY) total", (err, result, moreResultSets) =>
            job.finish()
            @handle_error(err, res) if err
            try
              result[0].quarter = Math.round((eval(result[0].quarter) * 10))/10
              result[0].half = Math.round((eval(result[0].half) * 10))/10
              result[0].one = Math.round((eval(result[0].one) * 10))/10
              result[0].full_second = Math.round((eval(result[0].full_second) * 10))/10
              result[0].two = Math.round((eval(result[0].two) * 10))/10
              result[0].three = Math.round((eval(result[0].three) * 10))/10
              result[0].four = Math.round((eval(result[0].four) * 10))/10
              result[0].more = Math.round((eval(result[0].more) * 10))/10
            catch error
              console.log "Parsing ERROR: #{error}"
              result = []
            data = data: result, description: ""
            res.send "responseTime(#{JSON.stringify(data)})"
            redis.set("#{req.params.component}-response_time", JSON.stringify(data)) unless result == []
            redis.expire("#{req.params.component}-response_time", 3600) unless result == []
            @log_response(data)

  component_slowest_response: (req, res) =>
    @log_request(req)
    res.header('Connection','close')
    redis.get "#{req.params.component}-slowest_response", (err, response) =>
      @handle_error(err, res) if err
      if response
        res.send "pageStats_slowestResponseTime(#{response})"
        @log_response(response)
      else
        chain.add (job) =>
          db.query "SELECT path, avg(duration) as \"metric\" FROM web_requests WHERE component_id='#{req.params.component}' and created_at>CURRENT_TIMESTAMP - INTERVAL '1' DAY GROUP BY \"path\" ORDER BY \"metric\" DESC LIMIT 20", (err, result, moreResultSets) =>
            job.finish()
            @handle_error(err, res) if err
            try
              i = 0
              while i < result.length
                result[i].metric = "#{(eval(result[i]['metric'])/1000).toFixed()}"
                i++
            catch error
              console.log "Parsing ERROR: #{error}"
              result = []
            data = data: result, description: "URL's With Slowest Response Time:"
            res.send "pageStats_slowestResponseTime(#{JSON.stringify(data)})"
            redis.set("#{req.params.component}-slowest_response", JSON.stringify(data)) unless result == []
            redis.expire("#{req.params.component}-slowest_response", 3600) unless result == []
            @log_response(data)

  component_most_viewed: (req, res) =>
    @log_request(req)
    res.header('Connection','close')
    redis.get "#{req.params.component}-most_viewed", (err, response) =>
      @handle_error(err, res) if err
      if response
        res.send "pageStats_mostViewed(#{response})"
        @log_response(response)
      else
        chain.add (job) =>
          db.query "SELECT pages.path as path, (pages.count * 100.0) / (total.count * 1.0) as \"metric\" FROM (SELECT path, count(*) as \"count\" FROM web_requests WHERE component_id='#{req.params.component}' and created_at>CURRENT_TIMESTAMP - INTERVAL '1' DAY GROUP BY path) pages, (SELECT CASE COUNT(*) WHEN 0 THEN 1 ELSE COUNT(*) END as count FROM web_requests WHERE component_id='#{req.params.component}' AND created_at>CURRENT_TIMESTAMP - INTERVAL '1' DAY) total ORDER BY \"metric\" DESC LIMIT 20;", (err, result, moreResultSets) =>
            job.finish()
            @handle_error(err, res) if err
            try
              i = 0
              while i < result.length
                result[i].metric = "#{(Math.round(eval(result[i]['metric'])))}%"
                i++
            catch error
              console.log "Parsing ERROR: #{error}"
              result = []
            data = data: result, description: "Most Viewed URLs:"
            res.send "pageStats_mostViewed(#{JSON.stringify(data)})"
            redis.set("#{req.params.component}-most_viewed", JSON.stringify(data)) unless result == []
            redis.expire("#{req.params.component}-most_viewed", 3600) unless result == []
            @log_response(data)


  hello_world: (req, res) =>
    res.header('Connection','close')
    res.send "hello world"
