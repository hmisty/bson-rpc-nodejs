# bson-rpc-nodejs
nodejs version of bson-rpc

see github: https://github.com/hmisty/bson-rpc-nodejs

## Install

	npm install bson-rpc --save

## Examples

client.js

```javascript
var bson_rpc = require('bson-rpc');

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
```

server.js

```javascript
var bson_rpc = require('bson-rpc');

var server = new bson_rpc.server('127.0.0.1', 8181);

server['add'] = (a, b) => {
	return a + b;
};

server.start();
```

## Other Languages

the python version is here: https://github.com/hmisty/bson-rpc

## Author and Contributors

Author: Evan Liu (hmisty).

## License
Copyright (c) 2017 Evan Liu (hmisty). Apache-2.0 License.
