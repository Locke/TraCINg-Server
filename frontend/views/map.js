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

/**
 * Creates a 2d map based on jvectormaps
 * @param map				the name of the jvectormap map
 * @param backgroundColor	the background color of the map
 */
var MapView = function(options) {
	var self = this;

	this.options = {
		localMap: false,
		view: {
			hasMarker: true,		// the view does display markers
			animatesMarker: false,		// map does not animate them -> world should do it
			showAdvMarkerInfo: true,	// enable advMarkerInfo button
			navbar: {
				title: "Country View",
				description: "Click here for a 2D view of the attacks. This map shows the sources of attacks detected by our sensors. For more detailed information, hover over countries and markers. A countries color represents the number of attacks originating from there; the darker the red, the more attacks originate from this country. You can also zoom in and out using the mouse wheel and move around the map by moving the mouse while holding down the left mouse button (if zoomed in). Keyboard controls are described in the bottom left corner.",
			},
		},
		jvmOptions: {},
	};

	$.extend(true, this.options, options);

	var mapObject;
	var uniqueKey = 0;						// unique key for marker id
	var maxKey = 500;						// maximum amount of markers
	var incidentsPerRegion = {};			// incidents per region. In case of a country map like the default 'world_mill_en' region means country
	var incidents = 0;						// total sum of incidents
	var regionCode = Array(maxKey);				// region code of every marker

	this.controllerCallbacks = {
		zoom: function(dir) {
			if (dir == Controller.args.IN)
				self.zoom(1.6);
			if (dir == Controller.args.OUT)
				self.zoom(1/1.6);
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

		var jvmOptions = {
			container: container,
			map: "world_mill_en",
			backgroundColor: "navy",
			markers: [],
			series: {
				regions: [{
					attribute: "fill",
					min: -1,
					max: -2,
					scale: ['#FFFFFF', '#FF0000'],
					normalizeFunction: function(value) {
						// if min value
						if (value == -1)
							return 0;
						// if max value
						if (value == -2)
							return 1;
						// if there are no incidents return 0
						if (incidents == 0)
							return 0;
						// otherwise return (value/incidents)^(1/3)
						return Math.pow(value/incidents, 1/3);
					},
				}],
			},
			// show region label function
			onRegionLabelShow: function(e, el, code) {
				var attacks = incidentsPerRegion[code] || 0;
				if (attacks == 1)
					el.html(el.html() + " (" + attacks + " attack of " + incidents + " total)");
				else
					el.html(el.html() + " (" + attacks + " attacks of " + incidents + " total)");
			},
			onMarkerLabelShow: function(e, label, code) {
				// show only standard label information if advanced information is not requested (default is advanced)
				if (!advInfo) {
					var splittedName = label.text().split(";");
					label.html(splittedName[0]);
				} else {
					label.html(label.text());
				}
			}
		};

		$.extend(true, jvmOptions, this.options.jvmOptions);

		mapObject = new jvm.WorldMap(jvmOptions);

		// zoom tooltips for jVectorMap
		$("div.jvectormap-zoomin").each(function() {
			$(this).attr("title", "Zoom in").tooltip();
		});

		$("div.jvectormap-zoomout").each(function() {
			$(this).attr("title", "Zoom out").tooltip();
		});

		this.initialized = true;
	}
	
	/**
	 * Reset the map removing every point
	 */
	this.reset = function() {
		mapObject.removeAllMarkers();
		mapObject.series.regions[0].clear();
		uniqueKey = 0;
		incidents = 0;
		incidentsPerRegion = {};
	}
	
	/**
	 * Zoom
	 */
	this.zoom = function(value) {
		mapObject.setScale(mapObject.scale * value, mapObject.width / 2, mapObject.height / 2);
	}
	
	/**
	 * Move the map
	 */
	this.move = function(x, y) {
		var damp = mapObject.scale;
		mapObject.transX += x / damp;
		mapObject.transY += y / damp;
		mapObject.applyTransform();
	}
	
	/**
	 * Mark incidents on the map and update incidentsPerRegion
	 */
	this.addIncidents = function(arr, color) {
		var keys = [];
		var markers = {};

		incidents += arr.length;

		for (var i in arr) {
			var data = arr[i];

			/*
			allow either incidents without a location and localMap, or incidents with a location and not localMap

			localMap	hasLocation	allowed
			0		0		0
			0		1		1
			1		0		1
			1		1		0
			=> XOR
			*/
			var hasLocation = !(!data.src || !data.src.ll || (!data.src.ll[0] && !data.src.ll[1]));
			var allowed = this.options.localMap ^ hasLocation;
			if (!allowed) {
				incidents--;
				continue;
			}

			var key = uniqueKey;
			keys.push(key);

			// increment key
			uniqueKey = (uniqueKey + 1) % maxKey;

			var region;
			if (this.options.localMap) {
				var s = data.src.network.split('/');
				region = s[s.length-1];
			}
			else {
				region = data.src.cc;
			}

			incidentsPerRegion[region] = (incidentsPerRegion[region] | 0) + 1;
			regionCode[key] = region;

			if (!this.options.localMap) {
				var ll = data.src.ll;
				var label = data.src.label;
				markers[key] = {latLng: ll, style: {r: 5, fill: color}, name: label};
			}
		}

		if (!this.options.localMap)
			mapObject.addMarkers(markers, []);

		// redraw the region coloring
		redrawIncidentsPerRegion();

		return keys;
	}
	
	/**
	 * Remove markers
	 */
	function removeMarkers(keys) {
		incidents -= keys.length;

		var remove = [];

		for (var i in keys) {
			var key = keys[i];

			if (mapObject.markers[key] != undefined)
				remove.push(key);

			var region = regionCode[key];
			if (incidentsPerRegion[region] > 0) {
				incidentsPerRegion[region] = incidentsPerRegion[region] - 1;
			}
		}

		if (!this.options.localMap)
			mapObject.removeMarkers(remove);

		redrawIncidentsPerRegion();
	}
	this.removeMarkers = removeMarkers;
	
	/**
	 * Get the pixel position of a geographic point
	 */
	this.getPosition = function(latitude, longitude) {
		if (!latitude && !longitude || this.options.localMap)
			return undefined;
		else
			return mapObject.latLngToPoint(latitude, longitude);
	}
	
	/**
	 * Redraw incidents per region
	 */
	function redrawIncidentsPerRegion() {
		mapObject.series.regions[0].setValues(incidentsPerRegion);
	};
	
	/**
	 * State whether the view has incidents
	 */
	this.hasIncidents = function() {
		if (incidents > 0)
			return true;
		return false;
	}

	this.resize = function() {
		// prevent having lots of blue space above and below the map if the window is narrow
		// $("#map").width()/2+50: /2 because the map is 2:1 format, +50 because the zoom buttons shall not overlap the map
		self.container.css("height", function() {return Math.min(self.container.width()/2+50, $(window).height()*0.8);});

		self.container.resize();
	}

	this.showHelpPopovers = function(){
		// nothing to do
	}
};
