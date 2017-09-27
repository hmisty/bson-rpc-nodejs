var bson_rpc = require('..');

var proxy = new bson_rpc.client('127.0.0.1', 8181);
proxy.use_service(['add']);

var count = 0;
proxy.on_result((err, result) => {
	if (err) throw err;
	console.log('result is ' + result);
	count++;
});
	
proxy.connect(() => {
	console.log('connected');
	proxy.add(1, 2);
	proxy.add(1, 2);
	proxy.add(1, 2);
	proxy.add(1, 2);
});

function loop() {
	if (count >= 4) {
		proxy.disconnect();
	} else {
		setTimeout(loop, 100);
	}
};

loop();
//proxy.disconnect();
