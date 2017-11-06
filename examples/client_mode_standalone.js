var util = require('util');
var bson_rpc = require('..');

// stand-alone mode
var proxy2 = new bson_rpc.client('127.0.0.1', 8181);
//var proxy2 = new bson_rpc.client('10.0.0.1', 8181); //FIXME takes a long time to get Error ETIMEDOUT
//var proxy2 = new bson_rpc.client('a.b.c.d', 8181);
console.log('conn mode: ' + proxy2.connection_mode);
proxy2.use_service(['add']);

proxy2.connect(() => {
	proxy2.add(1, 2).then(function (err, doc) {
		console.log('conn mode ' + proxy2.connection_mode +
			' returns ' + doc);
	});
	proxy2.add(3, 4).then(function (err, doc) {
		console.log('conn mode ' + proxy2.connection_mode +
			' returns ' + doc);
		proxy2.disconnect();
	});
});

