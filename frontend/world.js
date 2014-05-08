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
 * Creates a world object containing a 2d map, 2d streetmap and a 3d globe
 */
var world = new function() {

	var currentView;

	var timeout = 500;						// timeout interval
	var timer = null;						// timeout id
	var key = 0;							// current key for delayed database request
	var dataset = null;						// database data
	var requestPaused = ".";				// text to show in speed information if loading is currently paused
	var attackNumberHash = {};				// hashmap containing the number of attacks per Lat/Lng position
	var controller = new Controller();

	var views = {};

	/**
	 * Toggle whether the key control is enabled or not
	 */
	this.enableController = controller.enable;
	this.disableController = controller.disable;

	function addControllerHints(container, callbacks) {
		if (callbacks.toggle != undefined) {
			container.append($('<div class="legend-toggle" rel="tooltip" title="Toggle heatmap (keyboard control)">t</div>').tooltip());
		}

		if (callbacks.zoom != undefined) {
			container.append($('<div class="legend-up icon-arrow-up" rel="tooltip" title="Zoom in (keyboard control)"></div>').tooltip());
			container.append($('<div class="legend-down icon-arrow-down" rel="tooltip" title="Zoom out (keyboard control)"></div>').tooltip());
		}

		if (callbacks.move != undefined) {
			container.append($('<div class="legend-wasd" rel="tooltip" title="Move (keyboard controls)">w/a/s/d</div>').tooltip());
		}
	}

	/**
	 * Leave maps
	 */
	function deactivateView() {
		currentView = null;
		controller.unregisterCallbacks();
	}
	this.deactivateView = deactivateView;


	this.registerView = function(name, v) {
		// check if view is already registered
		if (views[name] != undefined)
			return false;

		views[name] = v;
		return true;
	}

	this.initializeView = function(v) {
		if (views[v].initialized)
			return;

		var container = createContainer(v);

		addControllerHints(container, views[v].controllerCallbacks);

		views[v].initialize(container);
	}

	function createContainer(v) {
		var c = $('<div id="' + v + '" class="center world-view" LeftWinRemove="center"></div>');
		$('#mainContent').append(c);
		c.show();
		return c;
	}

	this.activateView = function(v) {
		this.initializeView(v);
		currentView = v;
		controller.registerCallbacks(views[v].controllerCallbacks);

		views[v].resize();
	}

	/**
	 * Delay database markings
	 */
	this.delayedMarking = function delayedMarking(data, live) {
		// save data for restarting the timer
		dataset = data;
		
		//restart the timer to update a potentially changed timeout
		//clearTimeout(timer);
		
		// update progress bar
		var percent = 0;
		if (key > 0)
			percent = ((key)/data.length) * 100;
		$('.bar').css('width', function(){return (percent +'%')});
		
		$('#requestInfo').text('Current loading state: ' + key + '/' + data.length + ' attacks.');
		$('#requestSpeedInfo').text('Current speed: ' + Math.round(100*(1000/timeout))/100 + ' attacks/second' + requestPaused);
		
		// timeout recursion
		if (key < data.length && timeout != 0) {
			//console.log(timeout);
			timer = setTimeout(
				function() {
					world.markIncidents([data[key]], live);
					key++;
					delayedMarking(data, live);
				},
				timeout
			);
		} else {
			// mark all incidents at once if timeout interval is 0
			if (timeout == 0) {
				world.markIncidents(data.slice(key), live, true);
			}
			
			if (data.length > 0) {
				world.finishLoading(true);
			} else {
				world.finishLoading(false);
			}
			
			// show number of attacks loaded
			if (data.length > 0) {
				$('#requestInfo').text('Successfully loaded ' + data.length + ' attacks.');
			}
		}
	}
	
	/**
	 * Stop the timeout of the database delay timer, reset all values, the progress bar and "Get Incidents" Button
	 */
	this.finishLoading = function finishLoading(showState) {
		// stop the timer
		clearTimeout(timer);
		// reset timer
		timer = null;
		dataset = null;
		key = 0;
		timeout = 500;
		if (showState) {
			// update progress bar
			$('.bar').css('width', '100%');
		} else {
			// reset progress bar
			$('.bar').css('width', 0);
		}
		// reset play button to pause if necessary
		if ($('#playButton i').hasClass('icon-play')) {
			$('#playButton i').addClass('icon-pause');
			$('#playButton i').removeClass('icon-play');
		}
		// reset "Get Incidents" button (stop showing "Loading..."), disable control buttons
		$('#getIncidents').text('Get Incidents');
		$('#getIncidents').removeClass("disabled");
		disableRequestControl();
		// reset info on loading progress and speed
		$('#requestInfo').text('');
		$('#requestSpeedInfo').text('');
	}
	
	/*
	 * Change the timeout intervals of the database delay timer
	 */
	this.changeTimer = function(value) {
		// do not speed up too fast
		if (timeout + value <= 0)
			value = -100;
		// and slow down in the same interval as the speedup
		if (timeout - value < 0)
			value = 100;
		// do not speed up to "no time"
		if (timeout + value <= 0)
			value = 0;
		// increase or decrease the timeout interval depending on the given value
		timeout += value;
		// do not speed up "in negative time"
		if (timeout < 0)
			timeout = 0;
		$('#requestSpeedInfo').text('Current speed: ' + Math.round(100*(1000/timeout))/100 + ' attacks/second' + requestPaused);
	}
	
	/**
	 * Reset the timeout of the database delay timer to 0
	 */
	this.resetTimer = function() {
		timeout = 0;
		$('#requestSpeedInfo').text('');
	}
	
	/**
	 * Stop the timeout of the database delay timer
	 */
	this.stopTimer = function() {
		clearTimeout(timer);
		requestPaused = " (currently paused).";
		$('#requestSpeedInfo').text('Current speed: ' + Math.round(100*(1000/timeout))/100 + ' attacks/second' + requestPaused);
	}
	
	/**
	 * Restart the timeout of the database delay timer
	 */
	this.restartTimer = function() {
		this.delayedMarking(dataset, live);
		requestPaused = ".";
		$('#requestSpeedInfo').text('Current speed: ' + Math.round(100*(1000/timeout))/100 + ' attacks/second' + requestPaused);
	}
	
	/**
	 * Mark incidents on all loaded views
	 */
	this.markIncidents = function(data, live, noAnimation) {
		// remove alert saying "Waiting for attacks..."
		$("#tableWaitingAlert").remove();

		// update hashmap for displaying number of attacks per LatLng
		attackNumberHashAdd(data);
	
		// define source color and label
		var sourceColor = "red";
		for (var i in data)
			data[i].src.label = getLabel(data[i], live);
		
		// each view has it own marker key
		var keys = [];

		// add marker to all views ..
		for (var i in views) {
			if (views[i].initialized)
				keys[i] = views[i].addIncidents(data, sourceColor);
		}

		// .. and try to animate it
		if (!noAnimation && views[currentView] && views[currentView].viewOptions.hasMarker && !views[currentView].viewOptions.animatesMarker) {
			var j = 0;
			for (var i in data) {
				var pos = views[currentView].getPosition(data[i].src.ll[0], data[i].src.ll[1]);
				if (pos != undefined)
					animateMarker(pos.x, pos.y, sourceColor, views[currentView].container, keys[currentView][j]);
				j++;
			}
		}
		
		// set timeout to remove marker if in live view
		if (live) {
			var expireTime = 300000;
			setTimeout(
				function() {
					// update hashmap for displaying number of attacks per LatLng
					attackNumberHashRemove(data);

					// remove marker on views
					for (var i in keys) {
						if (keys[i] != undefined)
							views[i].removeMarkers(keys[i]);
					}
				},
				expireTime
			);
		}
	}

	function attackNumberHashAdd(arr) {
		for (var i in arr) {
			var llHash = new String(arr[i].src.ll[0]) + "_" + new String(arr[i].src.ll[1]);
			if (attackNumberHash[llHash] != undefined) {
				attackNumberHash[llHash]++;
			} else {
				attackNumberHash[llHash] = 1;
			}
		}
	}

	function attackNumberHashRemove(arr) {
		for (var i in arr) {
			var llHash = new String(arr[i].src.ll[0]) + "_" + new String(arr[i].src.ll[1]);
			if (attackNumberHash[llHash] > 0) {
				attackNumberHash[llHash]--;
			} else {
				attackNumberHash[llHash] = undefined;
			}
		}
	}

	function attackNumberHashGet(data) {
		var llHash = new String(data.src.ll[0]) + "_" + new String(data.src.ll[1]);
		return attackNumberHash[llHash];
	}

	/**
	 * State whether the current view has at least one incident
	 */
	this.hasCurrentlyIncidents = function() {
		if (views[currentView] != undefined) {
			return views[currentView].hasIncidents();
		}
		return false;
	}

	/**
	 * State whether the current view want to enable advMarkerInfo button
	 */
	this.showAdvMarkerInfo = function() {
		if (views[currentView] != undefined) {
			return views[currentView].viewOptions.showAdvMarkerInfo;
		}
		return false;
	}
	
	/**
	 * Reset every incident
	 */
	this.reset = function() {
		// reset views
		for (var key in views) {
			if (views[key].initialized)
				views[key].reset();
		}

		attackNumberHash = {};

		// reset progress bar
		$('.bar').css('width', 0);
		// reset progress information
		$('#requestInfo').text('');
		//TODO also influence x/y entries loaded and successfully loaded y items?
	}
	
	/**
	 * Determine label shown on both the 2d map and the 3d globe.
	 */
	function getLabel(data, live) {
		var label = "";
		// standard information label
		if (live)
			label += "Live data";
		else
			label += "Database data";
		var num = attackNumberHashGet(data);
		if (num != null) {
			if (num == 1)
				label += ": " + num + " attack";
			else
				label += ": " + num + " attacks";
		}
		label += "<br />Attack source (marked here): ";
		if (data.src.city != "" && data.src.city != undefined)
			label += data.src.city + ", ";
		label += data.src.country;
		
		// advanced information
		label += ";<br />Destination: ";
		if (data.dst.city != "" && data.dst.city != undefined)
			label += data.dst.city + ", ";
		if (data.dst.country != "" && data.dst.country != undefined)
			label += data.dst.country;
		else
			label += "Unknown";
		label += ";<br />Date: " + formatDate(data);
		
		var type = typeid2str(data.type)
		if (type != "" && type != undefined);
			label += ";<br />Type: " + type;
		
		if (data.authorized)
			label += ";<br />Authorized Sensor";
		else
			label += ";<br />Unauthorized Sensor";
		
		return label;
	}
	
	/**
	 * Format the date to a more readable representation
	 */
	function formatDate(incident) {
		var date = incident.date && new Date(incident.date) || new Date();
		var day = date.getDate();
		if (date.getDate() < 10)
			day = "0" + date.getDate();
		var month = (date.getMonth() + 1);
		if ((date.getMonth() + 1) < 10)
			month = "0" + (date.getMonth() + 1);
		var hour = date.getHours();
		if (date.getHours() < 10)
			hour = "0" + date.getHours();
		var minute = date.getMinutes();
		if (date.getMinutes() < 10)
			minute = "0" + date.getMinutes();
		var dateFormat = day + "." + month + "." + date.getFullYear() + " " + hour + ":" + minute;
		
		return dateFormat;
	}
	this.formatDate = formatDate;

	/**
	 * Make popovers in the table
	 */
	function makePopovers() {
		console.log("makePopovers");
		$('a[rel=popover]').popover({});
	}
	this.makePopovers = makePopovers;
	
	/**
	 * animate new marker using jquery animate()
	 */
	function animateMarker(x, y, color, container, key) {
		// define style of the animation div
		var style = {
			'background-color': color,
			'position': 'absolute',
			'border-radius': '100px',
			'height': '40px',
			'width': '40px',
			'margin-top': '-20px',
			'margin-left': '-20px',
			'left': x + 'px',
			'top': y + 'px',
		};
		// create a marker animation
		$(container).append('<div class="markerAnimation" id=' + key + '></div>');
		// add the css style to the marker animation
		$("#" + key + ".markerAnimation").css(style);
		// animate the marker and delete it afterwards
		$("#" + key + ".markerAnimation").fadeOut(
			1000,
			$("#" + key + ".markerAnimation").remove
		);
	}
	


	/**
	 * resize current view
	 */
	function resizeView() {
		if (views[currentView] && views[currentView].initialized) views[currentView].resize();
	}
	this.resizeView = resizeView;
}

function showLog(id){
	console.log("showLog " + id);
	socket.emit("getLog", id, function(content){
		console.log("showLog content: " + content);
		$('#showLogLabel').text("Log for id " + id);
		$('#showLogBody').html(content);
		$('#showLog').modal();
	});
}

// TODO: may use a config file to specify which views should be used
$(function(){
	world.registerView('map', new MapView('world_mill_en', 'navy'));
	world.registerView('streetmap', new StreetmapView());
	world.registerView('globe', new GlobeView());
	world.registerView('table', new TableView());
	world.initializeView('table');

	setTimeout(function() {
		world.resizeView();
	}, 10);

	//world.registerView('sample', new SampleView($('#table')));
});

$(window).resize($.throttle(250,function() {
	world.resizeView();
}));
