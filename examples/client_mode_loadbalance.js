var util = require('util');
var bson_rpc = require('..');

// load-balance mode
var proxy4 = new bson_rpc.client(['10.0.0.1', '10.0.0.3', '10.0.0.5', '127.0.0.1', '10.0.0.2', '10.0.0.4'], 8181);
console.log('conn mode: ' + proxy4.connection_mode);
proxy4.use_service(['add']);

proxy4.connect(() => {
	proxy4.add(1, 2).then(function (err, doc) {
		console.log('conn mode ' + proxy4.connection_mode +
			' returns ' + doc);
	});

	proxy4.add(3, 4).then(function (err, doc) {
		console.log('conn mode ' + proxy4.connection_mode +
			' returns ' + doc);
		proxy4.disconnect();
	});
});

