var util = require('util');
var bson_rpc = require('..');

// stand-by mode
var proxy3 = new bson_rpc.client('10.0.0.1', '127.0.0.1', 8181);
console.log('conn mode: ' + proxy3.connection_mode);
proxy3.use_service(['add']);

proxy3.connect(() => {
	proxy3.add(1, 2).then(function (err, doc) {
		console.log('conn mode ' + proxy3.connection_mode +
			' returns ' + doc);
	});
	proxy3.add(3, 4).then(function (err, doc) {
		console.log('conn mode ' + proxy3.connection_mode +
			' returns ' + doc);
		proxy3.disconnect();
	});
});

