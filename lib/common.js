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
var log4js = require('log4js');

//the logger
var logger = exports.logger = log4js.getLogger('BSON-RPC');
logger.level = 'DEBUG';

// the status definition
exports.status = {
	ok : {'error_code': 0, 'result': ''},
	unknown_message : {'error_code': 401, 'error_msg': 'unknown message'},
	invoke_error : {'error_code': 402, 'error_msg': 'failed to call function'},
	function_not_found : {'error_code': 404, 'error_msg': 'function not found'},
	function_not_callable : {'error_code': 405, 'error_msg': 'function not callable'},

	//network error
	connection_error: {'error_code': 501, 'error_msg': 'connection error'},
};

exports.connection_mode = {
	DEFAULT_HOST: '127.0.0.1',
	DEFAULT_PORT: 8181,

	LOCAL: 0,
	STAND_ALONE: 1,
	STAND_BY: 2,
	LOAD_BALANCE: 3,
};

exports.DIE_ON_FAILURE = true;

/*
   Since 0.15.0 we can apply different connection model.
   Instead of trying to re-connect current socket,
   we simply die and rely on the upper-level supervisor to restart the process
   by calling process.exit(1);
   
   Since 0.16.0 we introduced two different failure model:
   1) process.exit, for supervisor to handle the process exit
   2) throw new Error, for caller to handle the Error thrown

 fail()
 fail(error_msg)
 */
exports.fail = function() {
	var error_msg = 'failed.';
	if (arguments.length > 0) {
		error_msg = arguments[0];
	}

	if (this.DIE_ON_FAILURE) {
		logger.error('Die-On-Failure: ' + error_msg);
		process.exit(1);
	} else {
		throw new Error(error_msg);
	}
};

exports.create_data_handler = function(callback) {
	var obj_received = []; //bson bytes obj received

	var bytes_recv = new Buffer('');
	var obj_len = 0;

	var handler = function(data) {
		bytes_recv = Buffer.concat([bytes_recv, data]);

		var i = 0, j = 0;
		while (j < bytes_recv.length) {

			if (obj_len == 0) { // a new obj
				if (bytes_recv.length - i >= 4) {
					obj_len = bytes_recv.readInt32LE(i, 4); //4 bytes to int
				} else {
					break; //need to receive more data
				}
			}

			if (bytes_recv.length >= i + obj_len) { //enough data for obj
				j = i + obj_len;
				var buf = bytes_recv.slice(i, j);
				obj_received.push(buf);
				i = j;
				obj_len = 0;
			} else { 
				break; //not enough data, must wait for next 'data' event
			}

		}
		bytes_recv = bytes_recv.slice(i);

		while (obj_received.length > 0) {
			var obj = obj_received.shift();
			var b = new bson();
			var doc = b.deserialize(obj);
			callback(doc);
		}

	};
	return handler;
};

// Generate a random number in given range [min, max] in average distribution
exports.random = function(min, max) {
	var ceiling = max - min + 1;
	var rand = Math.random() * ceiling;
	return(min + Math.floor(rand));
};

