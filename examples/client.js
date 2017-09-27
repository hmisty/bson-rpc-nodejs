var util = require('util');
var bson_rpc = require('..');

var proxy = new bson_rpc.client('127.0.0.1', 8181);
proxy.use_service(['add']);

proxy.connect();

proxy.on_result(proxy.add(1, 2), function (err, doc) {
	console.log(doc);
});
proxy.on_result(proxy.add(3, 4), function (err, doc) {
	console.log(doc);
});
proxy.on_result(proxy.add(5, 6), function (err, doc) {
	console.log(doc);
});
proxy.on_result(proxy.add(7, 8), function (err, doc) {
	console.log(doc);
	proxy.disconnect();
});

//console.log(util.inspect(proxy.obj_received));
//console.log(util.inspect(proxy.callbacks));
