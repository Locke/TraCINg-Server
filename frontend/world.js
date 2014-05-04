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

	// constants
	var view = {
		MAP: 0,
		STREETMAP: 1,
		GLOBE: 2,
		NULL: 3,
	};
	this.view = view;					// export possible views
	var currentView;

	var timeout = 500;						// timeout interval
	var timer = null;						// timeout id
	var key = 0;							// current key for delayed database request
	var dataset = null;						// database data
	var requestPaused = ".";				// text to show in speed information if loading is currently paused
	var attackNumberHash = {};				// hashmap containing the number of attacks per Lat/Lng position
	var controller = new Controller();

	var views = [];

	/**
	 * Toggle whether the key control is enabled or not
	 */
	this.toggleEnabled = controller.toggleEnabled;

	/**
	 * Leave maps
	 */
	function leaveMap() {
		currentView = view.NULL;
		controller.unregisterCallbacks();
	}


	this.loadView = function(v) {
		// check if view is already loaded
		if (views[v] != undefined)
			return;

		if (v == view.MAP)
			views[v] = new map(controller, $('#map'), 'world_mill_en', 'navy');
		else if (v == view.STREETMAP)
			views[v] = new streetmap(controller, $('#streetmap'));
		else if (v == view.GLOBE)
			views[v] = new GlobeView(controller, $('#globe'));
		else
			console.err("Unknown view: " + v);
	}

	this.initializeView = function(v) {
		// check if view is already initialized
		if (views[v] == undefined)
			this.loadView(v);

		if (!views[v].initialized)
			views[v].initialize();
	}

	this.activateView = function(v) {
		if (v == view.NULL) {
			leaveMap();
			return;
		}

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
					world.markIncident(data[key], live);
					makeTableEntry(generateTableEntry(data[key]));
					key++;
					delayedMarking(data, live);
				},
				timeout
			);
		} else {
			// mark all incidents at once if timeout interval is 0
			if (timeout == 0) {
				var tableEntries = [];
				for (var i = key; i < data.length; i++) {
					world.markIncident(data[i], live, true);
					tableEntries.push(generateTableEntry(data[i]));
				}
				makeTableEntry(tableEntries);
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
	 * Mark an incident on the 2d map, the street map and the 3d globe
	 */
	this.markIncident = function(data, live, noAnimation) {
		// remove alert saying "Waiting for attacks..."
		$("#tableWaitingAlert").remove();

		// update hashmap for displaying number of attacks per LatLng
		llHash = new String(data.src.ll[0]) + "_" + new String(data.src.ll[1]);
		if (attackNumberHash[llHash] != undefined) {
			attackNumberHash[llHash]++;
		} else {
			attackNumberHash[llHash] = 1;
		}
	
		// define source color and label
		var sourceColor = "red";
		var sourceLabel = getLabel(data, live);
		
		// each view has it own marker key
		var keys = [];

		// add marker to views and try to animate it
		for (var i in views) {
			keys[i] = views[i].addMarker(data.src.cc, data.src.ll, sourceColor, sourceLabel);
			if (currentView == i && !noAnimation && !views[i].viewOptions.animatesMarker) {
				var pos = views[i].getPosition(data.src.ll[0], data.src.ll[1]);
				animateMarker(pos.x, pos.y, sourceColor, views[i].container, keys[i]);
			}
		}
		
		// set timeout to remove marker if in live view
		if (live) {
			var expireTime = 300000;
			setTimeout(
				function() {
					// update hashmap for displaying number of attacks per LatLng
					llHash = new String(data.src.ll[0]) + "_" + new String(data.src.ll[1]);
					if (attackNumberHash[llHash] > 0) {
						attackNumberHash[llHash]--;
					} else {
						attackNumberHash[llHash] = undefined;
					}

					// remove marker on views
					for (var i in keys) {
						if (keys[i] != undefined)
							views[i].removeMarker(keys[i]);
					}
				},
				expireTime
			);
		}
	}

	/**
	 * State whether the current view has at least one marker
	 */
	this.hasCurrentlyMarker = function() {
		if (views[currentView] != undefined) {
			return views[currentView].hasMarker();
		}
		return false;
	}
	
	/**
	 * Reset every incident
	 */
	this.reset = function() {
		// reset views
		for (var key in views) {
			views[key].reset();
		}

		// reset table
		$("#attackTable").dataTable().fnClearTable();

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
		var llKey = new String(data.src.ll[0]) + "_" + new String(data.src.ll[1]);
		var num = attackNumberHash[llKey];
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
	
	/**
	 * Generate one table entry and return it as a string to be inserted
	 */
	function generateTableEntry(incident) {
		// set city and country names
		if (incident.src.city == undefined)
			incident.src.city = "";
		if (incident.dst.country == undefined)
			incident.dst.country = "";
		if (incident.dst.city == undefined)
			incident.dst.city = "";
		if (incident.src.port == 0)
			incident.src.port = "";
		if (incident.dst.port == 0)
			incident.dst.port = "";
		
		//format date
		dateFormat = formatDate(incident);

		var log = '';
		if (incident.hasLog){
			log = "<a href='#showLog' data-toggle='modal' onclick='javascript:showLog(" + incident.id + ");'>show log</a>";
		}
		
		var type = typeid2str(incident.type);
		var typeDescr = typeid2descr(incident.type);
		
		// popup for md5sum so it does not take so much space in the table
		var md5 = "";
		if (incident.md5sum && incident.md5sum != '') {
			var virustotalLink = "https://www.virustotal.com/en/search/?query=" + incident.md5sum;
			var popoverContent = "Md5sum of malware hash: " + incident.md5sum + "<br \\> Get more information about this malware from virustotal: <a href=\'" + virustotalLink + "\' target='_blank'>Click here</a> (by doing so you will open a different website)!";
			var url = "\"./extern/bootstrap/images/glyphicons-halflings.png\"";
			md5 = "<a class='btn' rel='popover' data-html='true' data-content=\"" + popoverContent + "\" data-animation='false' data-placement='left'><i class='icon-info-sign' style='background-image: url("+ url +");'></i></a>";
		}
		
		var authorized = "";
		if (incident.authorized) {
			authorized = "<p class='text-success'>Yes</p>";
		} else {
			authorized = "<p class='text-error'>No</p>";
		}

		//make entry
		var attackTableEntry = [incident.sensortype, incident.sensorname, '<span title="' + typeDescr + '">' + type + '</span>', dateFormat, incident.src.country, incident.src.city, incident.src.port, incident.dst.country, incident.dst.city, incident.dst.port, authorized, md5, log];
		return attackTableEntry;
	}
	this.generateTableEntry = generateTableEntry;
	
	/**
	 * Make table entries (includes time formatting)
	 */
	function makeTableEntry(attackTableEntries) {
		$("#attackTable").dataTable().fnAddData(attackTableEntries);
		makePopovers();
	}
	this.makeTableEntry = makeTableEntry;
	
	
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
	

	function updateAttackTableHeight() {
		var attackTable = $("#attackTable").dataTable();
	
		var height = $(window).height();
	
		height -= $("#table .dataTables_scrollBody").offset().top;
		height -= $("#table .dataTables_scroll + div").height();
	
		console.log("attackTableHeight: " + height);
	
		$("#table .dataTables_scrollBody").css({"max-height": height});
	}

	/**
	 * resize table
	 */
	function resizeTable() {
		updateAttackTableHeight();
		$("#attackTable").dataTable().fnDraw();
	}
	this.resizeTable = resizeTable;
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

$(function(){
	$("#attackTable").dataTable({
		"aaSorting": [[ 3, "desc" ]], // order by date, new items first
		"sScrollY": "100%",
		"fnDrawCallback": function() {
			world.makePopovers();
		}
	});

	setTimeout(function() {
		world.resizeTable();
	}, 10);
});

$(window).resize($.throttle(250,function() {
	world.resizeTable();
}));
