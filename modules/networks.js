/**
 * TraCINg-Server - Gathering and visualizing cyber incidents on the world
 *
 * Copyright 2013 Matthias Gazzari, Annemarie Mattmann, André Wolski
 * 
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 * 
 *     http://www.apache.org/licenses/LICENSE-2.0
 * 
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */


var Netmask = require('netmask').Netmask

var config = require("../config.json");
var networks = require("../networks.json");
var netmasks = {};

function initialize(){
	for (var name in networks) {
		var n = networks[name];
		if (n) {
			var tmp = [];
			if (n.networks) {
				for (var i in n.networks) {
					var range = n.networks[i];
					var block = new Netmask(range);
					tmp.push(block);
				}
			}
			netmasks[name] = tmp;
		}
	}
}

//exports.initialize = initialize;
initialize();

function search(ip) {
	if (!ip) return null;
	for (var name in netmasks) {
		for (var index in netmasks[name]) {
			if (netmasks[name][index].contains(ip))
				return name;
		}
	}
	return null;
}

exports.search = search;
