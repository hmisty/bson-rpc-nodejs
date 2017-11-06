var util = require('util');
var bson_rpc = require('..');

/*
// default mode
var proxy = new bson_rpc.client();
console.log('conn mode: ' + proxy.connection_mode);
proxy.use_service(['add']);

proxy.connect(() => {
	proxy.add(1, 2).then(function (err, doc) {
		console.log('conn mode ' + proxy.connection_mode +
			' returns ' + doc);
		proxy.disconnect();
	});
});
*/


// stand-alone mode
var proxy2 = new bson_rpc.client('127.0.0.1', 8181);
console.log('conn mode: ' + proxy2.connection_mode);
proxy2.use_service(['add']);

proxy2.connect(() => {
	proxy2.add(1, 2).then(function (err, doc) {
		console.log('conn mode ' + proxy2.connection_mode +
			' returns ' + doc);
		proxy2.disconnect();
	});
});

/*
// stand-by mode
var proxy3 = new bson_rpc.client('10.0.0.1', '127.0.0.1', 8181);
console.log('conn mode: ' + proxy3.connection_mode);
proxy3.use_service(['add']);

proxy3.connect(() => {
	proxy3.add(1, 2).then(function (err, doc) {
		console.log('conn mode ' + proxy3.connection_mode +
			' returns ' + doc);
	});
});

// load-balance mode
var proxy4 = new bson_rpc.client(['10.0.0.1', '127.0.0.1', '10.0.0.2'], 8181);
console.log('conn mode: ' + proxy4.connection_mode);
proxy4.use_service(['add']);

proxy4.connect(() => {
	proxy4.add(1, 2).then(function (err, doc) {
		console.log('conn mode ' + proxy4.connection_mode +
			' returns ' + doc);
	});
});

*/
