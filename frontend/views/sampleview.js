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

var sampleview = function(controller) {
	console.log("sampleview", arguments);

	var self = this;

	this.viewOptions = {
		animatesMarker: false, // does not animate them -> world should do it
	};
	this.container = undefined;

	this.controllerCallbacks = {
		zoom: function(dir) {
			console.log("sampleview.controllerCallbacks.zoom", arguments);
		},
		move: function(dir) {
			console.log("sampleview.controllerCallbacks.move", arguments);
		},
		toggle: function() {
			console.log("sampleview.controllerCallbacks.toggle", arguments);
		},
	};

	/**
	 * Reset the map removing every point
	 */
	this.reset = function() {
		console.log("sampleview.reset", arguments);
	}
	
	/**
	 * Zoom
	 */
	this.zoom = function(value) {
		console.log("sampleview.zoom", arguments);
	}
	
	/**
	 * Move the map
	 */
	this.move = function(x, y) {
		console.log("sampleview.move", arguments);
	}
	
	/**
	 * Mark incident on the map
	 */
	this.addMarker = function(cc, ll, color, label) {
		console.log("sampleview.addMarker", arguments);
		return 0;
	}
	
	/**
	 * Remove marker
	 */
	this.removeMarker = function(key) {
		console.log("sampleview.removeMarker", arguments);
	}
	
	/**
	 * Get the pixel position of a geographic point
	 */
	this.getPosition = function(latitude, longitude) {
		console.log("sampleview.getPosition", arguments);
		return {x: 0, y: 0};
	}
	
	
	/**
	 * State whether any country has at least one marker
	 */
	this.hasMarker = function() {
		console.log("sampleview.hasMarker", arguments);
		return false;
	}
}
