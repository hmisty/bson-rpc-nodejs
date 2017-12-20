/* Copyright 2017 Evan Liu (hmisty@gmail.com)
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
var isReachable = require('is-reachable');

var common = require('./common');

// the global logger
var logger = common.logger;

var Proxy = function() {
	this.connection_mode = common.connection_mode.LOCAL;
	this.hosts = [];
	this.port = 0;
	this.idgen = 1; //for _id gen

	var nargs = arguments.length;
	var args = arguments;

	switch (nargs) {
		case 2:
			if (args[0] instanceof Array) {
				// LOAD BALANCE MODE
				// var proxy = new bson_rpc.client(['10.0.0.1', '10.0.0.2', ...], 8181);
				this.connection_mode = common.connection_mode.LOAD_BALANCE;
				this.hosts = args[0];
				this.port = args[1];
			} else {
				// STAND-ALONE MODE (FOR BACKWARD COMPATIBILITY)
				// var proxy = new bson_rpc.client('10.0.0.1', 8181);
				this.connection_mode = common.connection_mode.STAND_ALONE;
				this.hosts.push(args[0]);
				this.port = args[1];
			}
			break;
		case 3:
			// STAND-BY MODE, support only 1 master and 1 slave
			// var proxy = new bson_rpc.client('10.0.0.1', '10.0.0.2', 8181);
			this.connection_mode = common.connection_mode.STAND_BY;
			this.hosts.push(args[0]);
			this.hosts.push(args[1]);
			this.port = args[2];
			break;
		default:
			// var proxy = new bson_rpc.client();
			// then we use 127.0.0.1:8181 by default
			this.connection_mode = common.connection_mode.LOCAL;
			this.hosts.push(common.connection_mode.DEFAULT_HOST);
			this.port = common.connection_mode.DEFAULT_PORT;
			break;
	}

	this.socket = new net.Socket();
	this.callbacks = {}; //callback func, _id: function
};

/* this.die_on_failure(true/false);
 */
Proxy.prototype.die_on_failure = function(dof) {
	common.DIE_ON_FAILURE = dof;
};

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
			logger.warn('no callback for ' + doc._id + '. throw it away.');
		}
	});

	this.socket.on('connect', () => {
		logger.info('connected.');
	});

	this.socket.on('data', data_handler);

	this.socket.on('error', (err) => {
		common.fail('socket error: ' + err);
	});

	// connect the socket according to connection_mode
	switch (this.connection_mode) {

			//local mode
		case common.connection_mode.LOCAL:
			var sock = this.socket;
			var port = this.port;
			var next_host = this.hosts.shift(); // take the first host

			isReachable(next_host + ':' + port).then(reachable => {
				logger.info('trying to connect ' + next_host + ':' + port + ' in LOCAL mode...');
				if (reachable) {
					sock.connect(port, next_host, on_connected_callback);
				} else {
					common.fail(next_host + ':' + port + ' is not reachable.');
				}
			});
			break;

			//stand alone mode
		case common.connection_mode.STAND_ALONE:
			var sock = this.socket;
			var port = this.port;
			var next_host = this.hosts.shift();
			isReachable(next_host + ':' + port).then(reachable => {
				logger.info('trying to connect ' + next_host + ':' + port + ' in STAND_ALONE mode...');
				if (reachable) {
					sock.connect(port, next_host, on_connected_callback);
				} else {
					common.fail(next_host + ':' + port + ' is not reachable.');
				}
			});
			break;

			//stand by mode
		case common.connection_mode.STAND_BY:
			var sock = this.socket;
			var port = this.port;
			var hosts = this.hosts;
			var next_host = hosts.shift();
			isReachable(next_host + ':' + port).then(reachable => {
				logger.info('trying to connect master ' + next_host + ':' + port + ' in STAND_BY mode...');
				if (reachable) {
					sock.connect(port, next_host, on_connected_callback);
				} else {
					logger.warn(next_host + ':' + port + ' is not reachable.');

					next_host = hosts.shift();
					isReachable(next_host + ':' + port).then(reachable => {
						logger.info('trying to connect stand-by ' + next_host + ':' + port + ' ...');
						if (reachable) {
							sock.connect(port, next_host, on_connected_callback);
						} else {
							common.fail(next_host + ':' + port + ' is not reachable.');
						}
					});

				}
			});
			break;

			//load balance mode
		case common.connection_mode.LOAD_BALANCE:
			var sock = this.socket;
			var try_next = function (hosts, port) {
				if (hosts.length > 0) {
					// we have more hosts to try
					var which = common.random(0, hosts.length - 1);
					var next_host = hosts.splice(which, 1)[0]; // take the `which` host
					isReachable(next_host + ':' + port).then(reachable => {
						logger.info('trying to connect ' + next_host + ':' + port + ' in LOAD_BALANCE mode...');
						if (reachable) {
							sock.connect(port, next_host, on_connected_callback);
						} else {
							logger.warn(next_host + ':' + port + ' is not reachable.');
							// try more
							try_next(hosts, port);
						}
					});
				} else {
					// we have no more host to try, so just die
					common.fail('all failed to connect.');
				}
			};

			try_next(this.hosts, this.port);
			break;

		default:
			common.fail('unknown connection mode. exit.');
			break;
	}

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
			conn.write(rpc_data);

			return {
				then: function(callback) {
					callbacks[doc._id] = callback;
				}
			};
		}
	};

	var conn = this.socket;
	names.push('__stats__');
	names.forEach(function(name) {
		Proxy.prototype[name] = gen_function(conn, name);
	});
};

Proxy.prototype.disconnect = function() {
	this.socket.end();
	common.fail('client-side disconnected explicitly');
};

module.exports = Proxy;
