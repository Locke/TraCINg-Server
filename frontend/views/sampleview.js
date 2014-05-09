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

var SampleView = function() {
	console.log("sampleview", arguments);

	var self = this;

	this.viewOptions = {
		hasMarker: false,		// the view does not display any markers
		animatesMarker: false,		// does not animate them -> world should do it
		showAdvMarkerInfo: false,	// disable advMarkerInfo button
		navbar: {
			title: "Sample View",
			description: "Click here for the Sample View.",
		}
	};

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

	this.initialized = false;
	this.initialize = function(container) {
		this.container = container;
		console.log("sampleview.initialize", arguments);
		this.initialized = true;
	}

	/**
	 * Reset the map removing every point
	 */
	this.reset = function() {
		console.log("sampleview.reset", arguments);
		this.container.empty();
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
	 * Mark incidents on the map
	 * 
	 * return value is used to call removeMarkers if in live view; do not return anything if you want to store the incident
	 */
	this.addIncidents = function(arr, color) {
		console.log("sampleview.addIncidents", arguments);
		var text = $('<span>added '+arr.length+' incident(s)</span><br/>');
		this.container.append(text);
		//return [1,2,3];
	}
	
	/**
	 * Remove markers
	 */
	this.removeMarkers = function(keys) {
		console.log("sampleview.removeMarkers", arguments);
	}
	
	/**
	 * Get the pixel position of a geographic point
	 */
	this.getPosition = function(latitude, longitude) {
		console.log("sampleview.getPosition", arguments);
		return undefined;
	}
	
	
	/**
	 * State whether the view has incidents
	 */
	this.hasIncidents = function() {
		console.log("sampleview.hasIncidents", arguments);
		return false;
	}

	this.resize = function() {
		console.log("sampleview.resize", arguments);
	}

	this.showHelpPopovers = function() {
		console.log("sampleview.showHelpPopovers", arguments);
	}
};
