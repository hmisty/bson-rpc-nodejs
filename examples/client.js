var bson_rpc = require('../bson_rpc');

var proxy = new bson_rpc.client('127.0.0.1', 8181);
proxy.use_service(['add']);

proxy.on_result((err, result) => {
	if (err) throw err;
	console.log('result is ' + result);
	proxy.disconnect();
});
	
proxy.connect(() => {
	console.log('connected');
	proxy.add(1, 2);
});
