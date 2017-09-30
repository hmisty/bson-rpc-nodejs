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

var util = require('util');
var bson = require('bson');
var net = require('net');

var common = require('./common');

var Proxy = function(host, port){
	this.host = host;
	this.port = port;
	this.connection = new net.Socket();
	this.callbacks = {}; //callback func, _id: function
};

Proxy.prototype.idgen = 1; //for _id gen

Proxy.prototype.reconnect_try = 0; //#tries to re-connect
Proxy.prototype.MAX_RECONNECT_TRY = 0; // 0 means try forever

Proxy.prototype.connect = function(on_connected_callback) {

	//var callbacks = this.callbacks;
	var data_handler = common.create_data_handler((doc) => {
		if (typeof(this.callbacks[doc._id]) == 'function') {
			var callback = this.callbacks[doc._id];

			if (doc.error_code == 0) {
				callback(null, doc.result);
			} else {
				var err = JSON.stringify(doc);
				callback(err);
			}

			delete this.callbacks[doc._id];
			
			if (this.callbacks.length == 0) {
				this.idgen = 0; //start over
			}

		} else {
			//throw away the doc
			console.log('no callback for ' + doc._id + '. throw it away.');
		}
	});

	this.connection.on('data', data_handler);

	this.connection.on('error', () => {
		//notify all obj consumers
		for (var _id in this.callbacks) {
			if (typeof(this.callbacks[_id]) == 'function') {
				this.callbacks[_id](common.status.connection_error);
			}
			delete this.callbacks[_id];
		}

		if (this.reconnect_try < this.MAX_RECONNECT_TRY ||
				this.MAX_RECONNECT_TRY == 0) {
			var ntry = this.reconnect_try++;
			setTimeout(() => {
				console.log('try to re-connect:', ntry);
				/* When trying to reconnect, don't pass in a callback.
				 * You will have duplicated callbacks to call.
				 * When connected, all connect callbacks will be also called.
				 */
				this.connection.connect(this.port, this.host); 
			}, ntry * 1000); //wait longer for more tries
		}
	});

	this.connection.connect(this.port, this.host, () => {
		console.log('connected');
		this.reconnect_try = 0; //reset it when successfully connect
		on_connected_callback();
	});
};

Proxy.prototype.use_service = function(names) {

	var callbacks = this.callbacks;
	var gen_function = function(conn, fn) {
		return function() {
			var args = Array.prototype.splice.call(arguments, 0, arguments.length);
			var doc = {
				_id: this.idgen++,
				fn: fn,
				args: args,
			};
			var obj = new bson();
			var rpc_data = obj.serialize(doc);
			conn.write(rpc_data); //FIXME if conn is not connected

			return {
				then: function(callback) {
					callbacks[doc._id] = callback;
				}
			};
		}
	};

	var conn = this.connection;
	names.push('__stats__');
	names.forEach(function(name) {
		Proxy.prototype[name] = gen_function(conn, name);
	});
};

Proxy.prototype.disconnect = function() {
	this.connection.end();
};


module.exports = Proxy;
