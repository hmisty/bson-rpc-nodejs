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
	this.obj_received = []; //bson bytes obj received
	this.callbacks = {}; //callback func, _id: function
};

Proxy.prototype.idgen = 1; //for _id gen

Proxy.prototype.connect = function(on_connected_callback) {
	var conn = this.connection;
	var obj_received = this.obj_received;
	var callbacks = this.callbacks;

	conn.connect(this.port, this.host, function() {
		var bytes_recv = new Buffer('');
		var obj_len = 0;

		conn.on('data', function(data) {
			bytes_recv = Buffer.concat([bytes_recv, data]);
			
			var i = 0, j = 0;
			while (j < bytes_recv.length) {
				
				if (obj_len == 0) { // a new obj
					obj_len = bytes_recv.readInt32LE(0, 4); //4 bytes to int
				}

				if (bytes_recv.length >= obj_len) { //enough data for obj
					j = i + obj_len;
					var buf = bytes_recv.slice(i, j);
					obj_received.push(buf);
					i = j;
				} else { //not enough data, must wait for next 'data' event
					j = bytes_recv.length;
				}

			}
			bytes_recv = bytes_recv.slice(i);

			while (obj_received.length > 0) {
				var obj = obj_received.shift();
				var b = new bson();
				var doc = b.deserialize(obj);
				if (typeof(callbacks[doc._id]) == 'function') {
					var callback = callbacks[doc._id];

					if (doc.error_code == 0) {
						callback(null, doc.result);
					} else {
						var err = JSON.stringify(doc);
						callback(err);
					}
					
					delete callbacks[doc._id];

				} else {
					//throw away the doc
					console.log('no callback for ' + doc._id + '. throw it away.');
				}
			}

		});

		if (typeof(on_connected_callback) == 'function')
			on_connected_callback();
	});
};

Proxy.prototype.use_service = function(names) {

	var gen_function = function(conn, fn) {
		return function() {
			var args = Array.prototype.splice.call(arguments, 0, arguments.length);
			var doc = {
				_id: Proxy.prototype.idgen++,
				fn: fn,
				args: args,
			};
			var obj = new bson();
			var rpc_data = obj.serialize(doc);
			conn.write(rpc_data); //FIXME if conn is not connected

			console.log('sent msg _id: ' + doc._id);
			return doc._id;
		}
	};

	var conn = this.connection;
	names.forEach(function(name) {
		Proxy.prototype[name] = gen_function(conn, name);
	});
};

Proxy.prototype.on_result = function(_id, callback) {
	this.callbacks[_id] = callback;
};

Proxy.prototype.disconnect = function() {
	this.connection.destroy();
};


module.exports = Proxy;
