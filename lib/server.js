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

var common = require('./common');

var logger = common.logger;
var Status = common.status; 

var Server = function(host, port){
	this.host = host;
	this.port = port;
	this.server = net.createServer((sock) => {
		
		var data_handler = common.create_data_handler((doc) => {
			logger.debug('Request: ' + util.inspect(doc));

			var result;
			if (doc['fn'] != undefined) {
				var func = this[doc['fn']];

				if (doc['args'] != undefined) {
					result = func.apply(null, doc['args']);
				} else {
					result = func();
				}

			} else {
				result = Status.unknown_message;
			}

			var response = Status.ok;
			response.result = result;
			response._id = doc['_id'];
			logger.debug('Response: ' + util.inspect(response));
			var obj = new bson();
			var rpc_data = obj.serialize(response);
			sock.write(rpc_data);
		});

		sock.on('data', data_handler);

	});

};

Server.prototype.start = function() {
	this.server.listen(this.port, this.host);
};

module.exports = Server;
