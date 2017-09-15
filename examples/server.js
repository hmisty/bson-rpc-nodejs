var bson_rpc = require('..');

var server = new bson_rpc.server('127.0.0.1', 8181);

server['add'] = (a, b) => {
	return a + b;
};

server.start();
