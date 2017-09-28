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

			if (bytes_recv.length >= obj_len) { //enough data for obj
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
			//console.log(obj.length, obj.readInt32LE(0,4), obj);
			callback(doc);
		}

	};
	return handler;
};

