/* Copyright 2017 Evan Liu (hmisty)
 * 
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 * 
 * 		http://www.apache.org/licenses/LICENSE-2.0
 * 
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
'use strict';

var bson = require('bson');
var net = require('net');

var Proxy = function(host, port){
	this.host = host;
	this.port = port;
	this.connection = new net.Socket();
};

Proxy.prototype.connect = function(callback) {
	this.connection.connect(this.port, this.host, callback);
};

Proxy.prototype.use_service = function(names) {

	var gen_function = function(conn, fn) {
		return function() {
			var args = Array.prototype.splice.call(arguments, 0, arguments.length);
			var doc = {
				fn: fn,
				args: args,
			};
			var obj = new bson();
			var rpc_data = obj.serialize(doc);
			conn.write(rpc_data); //FIXME if conn is not connected
		}
	};

	var conn = this.connection;
	for (var i in names) {
		var name = names[i];
		Proxy.prototype[name] = gen_function(conn, name);
	}
};

Proxy.prototype.on_result = function(callback) {
	var conn = this.connection;
	conn.on('data', (data) => {
		var obj = new bson();
		var doc = obj.deserialize(data);
		if (doc.error_code == 0) {
			callback(null, doc.result);
		} else {
			var err = JSON.stringify(doc);
			callback(err);
		}
	});
};

Proxy.prototype.disconnect = function() {
	this.connection.destroy();
};


module.exports = Proxy;
