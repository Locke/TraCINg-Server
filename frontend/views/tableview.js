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

var TableView = function() {
	console.log("tableview", arguments);

	var self = this;
	var attackTable;

	this.viewOptions = {
		hasMarker: false,		// the view does not display any markers..
		animatesMarker: false,		// .. and therefore does not animate them
		showAdvMarkerInfo: false,	// disable advMarkerInfo button
		navbar: {
			title: "Table View",
			description: "Click here for a table representation of the attack data received from the sensors. This table always shows exactly the attacks which are currently represented on the maps/globe (no less, no more). This behavior is independent from live or database view. Hover over the entries in \"Attack Types\" to learn more about them.",
		}
	};

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
	this.initialize = function(container) {
		this.container = container;
		console.log("tableview.initialize", arguments);

		var table = genAttackTable();
		this.container.append(table);

		attackTable = table.dataTable({
			"aaSorting": [[ 3, "desc" ]], // order by date, new items first
			"sScrollY": "100%",
			"fnDrawCallback": function() {
				world.makePopovers();
			}
		});

		this.initialized = true;
	}

	function genAttackTable() {
		var table = $('<table class="table table-striped"><thead><tr></tr></thead></table>');
		var tr = $('tr', table);
		var cols = ["Sensor Type", "Sensor Name", "Attack Type", "Date", "Source Network", "Source Country", "Source City", "Source Port", "Destination Network", "Destination Country", "Destination City", "Destination Port", "Authorized Sensor", "md5 Sum", "Log"];
		for (var i in cols) {
			tr.append($('<th>' + cols[i] + '</th>'));
		}

		return table;
	}

	/**
	 * Reset the table removing every incident
	 */
	this.reset = function() {
		console.log("tableview.reset", arguments);

		// reset table
		attackTable.fnClearTable();
	}
	
	/**
	 * add incidents to the table
	 */
	this.addIncidents = function(arr, color) {
		console.log("tableview.addIncidents", arguments);

		var rows = [];
		for (var i in arr) {
			rows.push(generateTableEntry(arr[i]));
		}
		attackTable.fnAddData(rows);

		world.makePopovers();

		return undefined; // undefined to indicate that the incidents should stay in live view
	}
	
	/**
	 * State whether the view has incidents
	 */
	this.hasIncidents = function() {
		console.log("tableview.hasIncidents", arguments);

		return ($(".dataTables_empty", this.container).length == 0);
	}


	function updateAttackTableHeight() {
		var height = $(window).height();

		height -= $(".dataTables_scrollBody", this.container).offset().top;
		height -= $(".dataTables_scroll + div", this.container).height();

		console.log("attackTableHeight: " + height);

		$(".dataTables_scrollBody", this.container).css({"max-height": height});
	}

	this.resize = function() {
		console.log("tableview.resize", arguments);

		updateAttackTableHeight();
		attackTable.fnDraw();
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
		dateFormat = world.formatDate(incident);

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
		var attackTableEntry = [incident.sensortype, incident.sensorname, '<span title="' + typeDescr + '">' + type + '</span>', dateFormat, incident.src.network, incident.src.country, incident.src.city, incident.src.port, incident.dst.network, incident.dst.country, incident.dst.city, incident.dst.port, authorized, md5, log];
		return attackTableEntry;
	}

	this.showHelpPopovers = function() {
		// nothing to do
	}
};
