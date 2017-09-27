var bson_rpc = require('..');

/****** test *******/
var keep_running = true;
var success = 0;
var failure = 0;

var proxy = new bson_rpc.client('127.0.0.1', 8181);
proxy.use_service(['hi', 'echo', 'add']);

on_result_func = (err, result) => {
	if (err) throw err;
	
	if (result == 3) { //1+2=3
		success += 1;
	} else {
		failure += 1;
		console.log('result ' + result + ' is not 3! ');
	}

	if (keep_running) {
		proxy.on_result(proxy.add(1, 2), on_result_func);
	} else {
		proxy.disconnect();
	}

};

proxy.connect();

var time_to_run = 5 * 1000; // 5 seconds
var start = Date.now();
setTimeout(() => {
	keep_running = false;

	var elapsed = Date.now() - start;
	console.log('Time elapsed: ' + elapsed + ' ms');
	console.log('Successful requests: ' + success);
	console.log('Failed requests: ' + failure);
	console.log('Request per second: ' + Math.floor(success / elapsed * 1000));
}, time_to_run); //stop after predefined seconds

var workers = 1; //20;
for (var i = 0; i < workers; i++) {
	proxy.on_result(proxy.add(1, 2), on_result_func);
}

