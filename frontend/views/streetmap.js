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

var StreetmapView = function() {
	var self = this;

	this.viewOptions = {
		hasMarker: true,		// the view does display markers
		animatesMarker: false,		// map does not animate them -> world should do it
		showAdvMarkerInfo: true,	// enable advMarkerInfo button
	};

	var stmap;
	var maxKey = 500;					// maximum amount of markers
	var markerArray = [maxKey];			// array containing all markers
	var uniqueKey = 0;					// unique key for marker id
	var holdTime = 100;					// time in ms until a label disappears
	var incidents = 0;					// total sum of incidents
	

	this.controllerCallbacks = {
		zoom: function(dir) {
			if (dir == Controller.args.IN)
				self.zoom(1);
			if (dir == Controller.args.OUT)
				self.zoom(-1);
		},
		move: function(dir) {
			var speed = 120;
			if (dir == Controller.args.LEFT)
				self.move(speed,0);
			if (dir == Controller.args.RIGHT)
				self.move(-speed, 0);
			if (dir == Controller.args.UP)
				self.move(0, speed);
			if (dir == Controller.args.DOWN)
				self.move(0, -speed);
		},
		toggle: undefined,
	};

	this.initialized = false;
	this.initialize = function(container) {
		this.container = container;
		stmap = new L.Map(container[0]);	// create a map
		// set standard (start) view (first argument: lat/lng; second argument: zoom (the smaller the farther away))
		stmap.setView([35, 0], 3, {animate: false});
		// deactivate native keybindings
		stmap.keyboard.disable();

		// add layer
		L.tileLayer("http://{s}.tile.osm.org/{z}/{x}/{y}.png", {
			attribution: "&copy; <a href='http://osm.org/copyright'>OpenStreetMap</a> contributors",
			noWrap: true,
			minZoom: 1
		}).addTo(stmap);

		/* set a bounding box for the map which is as large as the world and does not allow movement beyond
		 * (this is sort of buggy and does not work with "setView" when the setView zoom level is the same as
		 * the max zoom through maxBound, thus if this shall be used, set the zoom level to 4 and adjust
		 * lat/lng if desired; enabling this also makes the Layer attribute noWrap less useful)
		 */
		stmap.setMaxBounds(new L.LatLngBounds([-190, -290], [190, 290]));

		this.initialized = true;
	}

	/*
	 * mark incidents on the map
	 */
	this.addIncidents = function(arr, color) {
		var ret = [];

		for (var i in arr) {
			var data = arr[i];
			var cc = data.src.cc;
			var ll = data.src.ll;
			var label = data.src.label;

			incidents++;

			// create a marker (leaflet circle)
			var size = 500; // 500 meter circle
			var latLng = new L.LatLng(ll[0], ll[1]);
			var circle = L.circle(latLng, size, { color: color, fillColor: color, fillOpacity: 0.5 });
			circle.addTo(stmap);

			// create a popup that will not receive focus on creation (i.e. no autoPan)
			var popup = new L.Popup({autoPan: false}).setContent(label);
			circle.bindPopup(popup);

			// show popup on mousehover, hide popup on mouseout
			var stmapHoverTimer;

			circle.on("mouseover", function(e) {
				var marker = this;

				// show standard or advanced label information depending on which is requested
				var splittedLabel = label.split(";");
				if (advInfo)
					marker._popup.setContent(label);
				else
					marker._popup.setContent(splittedLabel[0]);
				marker.openPopup();


				// define mouseleave events
				popup._container.addEventListener("mouseleave", function(e) {stmapHoverTimer = setTimeout(function() {marker.closePopup()}, holdTime)});

				// define mouseenter events
				popup._container.addEventListener("mouseenter", function(e) {clearTimeout(stmapHoverTimer);});
			});

			// remove a previously defined marker with the same key
			removeMarkers([uniqueKey]);

			// add the circle to the marker array to be able to remove it
			markerArray[uniqueKey] = circle;

			var returnMarker = uniqueKey;
			uniqueKey = (uniqueKey + 1) % maxKey;
			ret.push(returnMarker);
		}

		return ret;
	}
	
	/*
	 * remove markers
	 */
	function removeMarkers(keys) {
		for (var i in keys) {
			var key = keys[i];
			if (markerArray[key] != undefined) {
				stmap.removeLayer(markerArray[key]);
				markerArray[key] = undefined;
			}
		}
	}
	this.removeMarkers = removeMarkers;
	
	/*
	 * remove all markers
	 */
	this.reset = function() {
		removeMarkers(markerArray);
		uniqueKey = 0;
		incidents = 0;
	}
	
	/*
	 * get marker position (lat/lng to point) for css animation
	 */
	this.getPosition = function(latitude, longitude) {
		return stmap.latLngToContainerPoint(new L.LatLng(latitude, longitude));
	}
	
	/*
	 * Zoom the streetmap
	 */
	this.zoom = function(value) {
		stmap.zoomIn(value);
	}
	
	/*
	 * Move the streetmap
	 */
	this.move = function(x, y) {
		stmap.panBy([-x, -y]);
	}
	
	/*
	 * State whether the view has incidents
	 */
	this.hasIncidents = function() {
		if (incidents > 0)
			return true;
		return false;
	}

	this.resize = function() {
		stmap.invalidateSize(false);
	}
};
