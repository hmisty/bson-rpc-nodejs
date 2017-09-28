var util = require('util');
var bson_rpc = require('..');

var proxy = new bson_rpc.client('127.0.0.1', 8181);
proxy.use_service(['add']);

function start() {
	proxy.add(1, 2).then(function (err, doc) {
		console.log(doc);
	});
	proxy.add(3, 4).then(function (err, doc) {
		console.log(doc);
	});
	proxy.add(5, 6).then(function (err, doc) {
		console.log(doc);
	});
	proxy.add(7, 8).then(function (err, doc) {
		console.log(doc);
		proxy.disconnect();
	});
}

proxy.connect(() => {
	start();
});

//console.log(util.inspect(proxy.obj_received));
//console.log(util.inspect(proxy.callbacks));
