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

var GlobeView = function(controller, container) {
	console.log("globeview", arguments);
	var self = this;
	var container = container;

	this.viewOptions = {
		animatesMarker: true, // globe animates them -> world shouldn't do it
	};
	this.container = container;

	// create globeObject
	var globe;

	// set modifyMarkerLabel function for globe
	var modifyMarkerLabel = function(label) {
		if (!advInfo) {
			var splittedLabel = label.split(";");
			label = splittedLabel[0];
		}
		return label;
	};
	// set setCountryLabel function for globe
	var setCountryLabel = function(cc, markers, allMarkers) {
		var country = countryName[cc];
		return country + " (" + markers + " attacks of " + allMarkers + " total)";
	};

	this.initialized = false;
	this.initialize = function() {
		globe = new GLOBE.main(container[0], "extern/globe/images/", {
			'modifyMarkerLabel': modifyMarkerLabel,
			'setCountryLabel': setCountryLabel
		});

		this.initialized = true;
	}


	this.controllerCallbacks = {
		zoom: function(dir) {
			if (dir == controller.args.IN)
				self.zoom(100);
			if (dir == controller.args.OUT)
				self.zoom(-100);
		},
		move: function(dir) {
			if (dir == controller.args.LEFT)
				self.rotate(-0.000001, 0);
			if (dir == controller.args.RIGHT)
				self.rotate(0.000001, 0);
			if (dir == controller.args.UP)
				self.rotate(0, 0.0000005);
			if (dir == controller.args.DOWN)
				self.rotate(0, -0.0000005);
		},
		toggle: function() {
			self.toggleView();
		},
	};


	/**
	 * Reset the map removing every point
	 */
	this.reset = function() {
		console.log("globeview.reset", arguments);
		globe.reset();
	}
	
	/**
	 * Zoom
	 */
	this.zoom = function(value) {
		console.log("globeview.zoom", arguments);
		globe.zoom(value);
	}
	
	/**
	 * Move the map
	 */
	this.move = function(x, y) {
		console.log("globeview.move", arguments);
		globe.move(x, y);
	}
	
	/**
	 * Mark incident on the map
	 */
	this.addMarker = function(cc, ll, color, label) {
		console.log("globeview.addMarker", arguments);
		if (globe.addMarker == undefined) return;
		return globe.addMarker(cc, ll[0], ll[1], label);
	}
	
	/**
	 * Remove marker
	 */
	this.removeMarker = function(key) {
		console.log("globeview.removeMarker", arguments);
		globe.removeMarker(key);
	}
	
	/**
	 * Get the pixel position of a geographic point
	 */
	this.getPosition = function(latitude, longitude) {
		console.log("globeview.getPosition", arguments);
		return globe.getPosition(latitute, longitude);
	}
	
	
	/**
	 * State whether any country has at least one marker
	 */
	this.hasMarker = function() {
		console.log("globeview.hasMarker", arguments);
		if (globe.hasMarker == undefined) return false;
		return globe.hasMarker();
	}

	this.resize = function() {
		console.log("globeview.resize", arguments);
		if (globe.resize == undefined) return;
		globe.resize();
	}

	this.toggleView = function() {
		console.log("globeview.toggleView", arguments);
		globe.toggleView();
	}

	this.rotate = function(horizAngle, vertAngle) {
		console.log("globeview.rotate", arguments);
		globe.rotate(horizAngle, vertAngle);
	}
}
