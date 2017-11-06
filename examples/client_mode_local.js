var util = require('util');
var bson_rpc = require('..');

// default mode
var proxy = new bson_rpc.client();
console.log('conn mode: ' + proxy.connection_mode);
proxy.use_service(['add']);

proxy.connect(() => {
	proxy.add(1, 2).then(function (err, doc) {
		console.log('conn mode ' + proxy.connection_mode +
			' returns ' + doc);
	});
	proxy.add(3, 4).then(function (err, doc) {
		console.log('conn mode ' + proxy.connection_mode +
			' returns ' + doc);
		proxy.disconnect();
	});
});

