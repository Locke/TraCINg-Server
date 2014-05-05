/**
 * TraCINg-Server - Gathering and visualizing cyber incidents on the world
 *
 * Copyright 2014 Matthias Gazzari, Annemarie Mattmann, André Wolski
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

var TableView = function(controller, container) {
	console.log("tableview", arguments);

	var self = this;

	this.viewOptions = {
		hasMarker: false,	// the view does not display any markers..
		animatesMarker: false,	// .. and therefore does not animate them
	};
	this.container = container;

	this.controllerCallbacks = {
		/*
		zoom: function(dir) {
			console.log("tableview.controllerCallbacks.zoom", arguments);
		},
		move: function(dir) {
			console.log("tableview.controllerCallbacks.move", arguments);
		},
		toggle: function() {
			console.log("tableview.controllerCallbacks.toggle", arguments);
		},
		*/
	};

	this.initialized = false;
	this.initialize = function() {
		console.log("tableview.initialize", arguments);
		this.initialized = true;
	}

	/**
	 * Reset the table removing every incident
	 */
	this.reset = function() {
		console.log("tableview.reset", arguments);
	}
	
	/**
	 * add incidents to the table
	 * 
	 * return undefined to indicate that the incidents should stay in live view
	 */
	this.addIncidents = function(arr, color) {
		console.log("tableview.addIncidents", arguments);
		return undefined;
	}
	
	/**
	 * State whether the view has incidents
	 */
	this.hasIncidents = function() {
		console.log("tableview.hasIncidents", arguments);
		return false;
	}

	this.resize = function() {
		console.log("tableview.resize", arguments);
	}
}
