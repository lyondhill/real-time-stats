var redis = require("redis"),
    client = redis.createClient();

client.on("error", function (err) {
    console.log("error event - " + client.host + ":" + client.port + " - " + err);
});

client.set("average", "3")

client.get("average", function (err, res) {
    console.log(res)
})

client.quit(function (err, res) {
    console.log("Exiting from quit command.");
});