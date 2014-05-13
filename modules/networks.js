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
var data = {};

var paths = {};

function getPath(name) {
	if(!name) return "";
	if(paths[name]) return paths[name];

	var path = getPath(networks[name].parent) + "/" + name;
	paths[name] = path;
	return path
}

function initialize(){
	for (var name in networks) {
		var n = networks[name];
		if (n) {
			var title = n.title;
			var path = getPath(name);
			var netmasks = [];
			if (n.networks) {
				for (var i in n.networks) {
					var range = n.networks[i];
					var block = new Netmask(range);
					netmasks.push(block);
				}
			}
			data[name] = {"netmasks": netmasks, "title": title, "path": path};
		}
	}
}

//exports.initialize = initialize;
initialize();

function search(ip) {
	if (!ip) return null;
	for (var name in data) {
		for (var index in data[name].netmasks) {
			if (data[name].netmasks[index].contains(ip))
				return data[name].path;
		}
	}
	return "";
}

exports.search = search;
