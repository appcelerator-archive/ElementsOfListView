
var elements = require('elements');
var temperature = 25;

/**
 * Calculate the colour of the symbol in the list.
 */
var temperatureColor = function(element, temperature) {
	if("unstable" === element.stability) {
		return "#900"; // unstable
	} else if(temperature+273 > element.boiling_point) {
		return "#090"; // gas
	} else if("n/a" === element.melting_point || temperature+273 > element.melting_point) {
		return "#009"; // liquid
	} else {
		return "black"; // solid
	}
};

/**
 * 	Not used any more.
 *	
 * 	Updates an element's symbol color according to the current temperature. This method gets an item from the ListView, 
 *  changes its symbol color, then sends the update back into the list.
 *	
 * 	Updating 118 items this way was unacceptably slow, 10-15 seconds on my fastest Android device.
 */
var changeColor = function(itemIndex, color) {
	var listSection = $.elementsList.sections[0];
	var listItem = listSection.getItemAt(itemIndex);
	listItem.symbol.color = color;
	listSection.updateItemAt(itemIndex, listItem);
};

/**
 * 	Not used any more.
 *	
 * 	This is an update on the method above. It only updates a ListItem if the color changes. Getting the item from the
 * 	listView is not a particularly expensive operation, when no colours are actually changed it usually took about 35ms
 *	to get iterate through all 118 elements this way. However if a lot of elements changed it's still unacceptably slow.
 *	
 * 	Updating 118 items this way was unacceptably slow, 10-15 seconds on my fastest Android device.
 */
var changeColor = function(itemIndex, color) {
	var listSection = $.elementsList.sections[0];
	var listItem = listSection.getItemAt(itemIndex);
	if(listItem.symbol.color != color) {
		listItem.symbol.color = color;
		listSection.updateItemAt(itemIndex, listItem);
		return true; // this just means the item is actually updated. The calling function uses this to measure the 
					 // performance of the element changes.
	}
	return false; // means the item was not updated.
};

/**
 *	This is the initial load of the content in the list.
 * 
 * 	After trying the piecemeal updates of the list in the two methods above, I tried just rebuilding the dataset and 
 *  updating it to the list. This is the fastest method by far, and the lag time is just as small no matter how many
 *	colours change.
 */
var setItems = function() {	
	var items = _.map(elements.table, function(element) {
			return {
				symbol: {text: element.symbol, color: temperatureColor(element, temperature)},
				name: {text: element.name},
				number: {text: element.number.toString()},
				mass: {text: element.mass.toString()}
			};
		});
	// note that setItems will clear the list before passing in the item array.
	$.elementsList.sections[0].setItems(items);
};
// the initial data load
setItems();

var changeTemperatureAction = function() {

	// start time and end time for logging purposes only
	var startTime = new Date();

	changeTemperatureTimer = null;

	var numChanges = 118; // for measuring performance only purposes only.

	if(false) {
		// first method, updating all items in the list
		_.map(elements.table, function(element) {
			changeColor(element.number-1, temperatureColor(element, temperature));
		});
	}	

	if(false) {
		// the second method, updating only the items that 
		numChanges = 0;
		_.map(elements.table, function(element) {
			if(changeColor(element.number-1, temperatureColor(element, temperature))) {
				numChanges++;
			}
		});
	}

	// the third method, just replace all the items in the list.	
	setItems();

	// logging only
	var endTime = new Date();
	Ti.API.info("index::changeTemperatureAction complete, changed "+numChanges+" element states in " + 
			(endTime.valueOf() - startTime.valueOf()) + "ms.");
};

/**
 *	This timer is used to throttle events. When moving the slider the value can change very quickly, I only want to
 *	reload the list once per 100ms.
 */
var changeTemperatureTimer = null;

/**
 *	Called when the slider is moved. Adjusts the temperature and, if none exists already, sets a delay timer so that
 * 	in 100ms the list will update.
 * 	@param {Object} e the slider's change event.
 */
var changeTemperature = function(e) {
	
	// this forumula gives the slider extra room to move between -50 and 550 degrees
	var x = e.value;
	if(x < 2) {
		temperature = 44.25*x*x + 23*x - 273;
	} else if(x > 5) {
		temperature = 98*x*x - 780*x + 2000;
	} else {
		temperature = 200*x - 450;
	}
	
	updateHud();
	if(!changeTemperatureTimer) {
		changeTemperatureTimer = setTimeout(changeTemperatureAction, 100);
	}
	displayHud(e);
};

/*
 * 
 * 	below this line are items that support a heads-up-display that was added to give some context into what the
 * 	slider is doing. This is not pertinant to the ListView tutorial
 * 
 */

/**
 * 	The slider's touchend event handler. If there is a delay timer outstanding, it clears it and updates the ListView
 * 	immediately.
 *	@param {Object} e unused
 */
var sliderTouchend = function(e) {
	if(changeTemperatureTimer) {
		clearTimeout(changeTemperatureTimer);
		changeTemperatureAction();
	}
	removeHud(e);
};


var sliderTouchstart = function(e) {
	displayHud(e);
};

// android trips a few change events on startup, which causes the hub to appear. Let's prevent that.
var hudActive = false;
var activateHud = function() {
	$.index.removeEventListener("postlayout", activateHud);
	setTimeout(function(){hudActive = true;}, 250);
	setTimeout(resetTemperature,100);
};
$.index.addEventListener("postlayout", activateHud);

/**
 * 	True when the HUD is visible
 */
var hudOnDisplay = false;

/**
 * 	The delay timer for hiding the HUD, when such a timer exists.
 */
var hideHudDelay = null;

/**
 * 	Update the text in the HUD
 */
var updateHud = function(e) {
	$.temperature.text = Math.round(temperature) + "ºC";
};

/**
 *	Show the HUD
 */
var displayHud = function(e) {
	if(!hudActive) {
		return;
	}
	if (!hudOnDisplay) {
		hudOnDisplay = true;
		updateHud();
		$.hud.visible = true;
		$.hud.animate({opacity: 0.9, duration: 100});
	}
	removeHud();
};

/**
 * 	Hide the HUD
 */
var removeHud = function(e) {
	if(!hudOnDisplay) {
		return;
	}
	if(hideHudDelay) {
		// reset the hud timeout, if one exists aready
		clearTimeout(hideHudDelay);
	}
	hideHudDelay = setTimeout(function() {
		hudOnDisplay = false;
		hideHudDelay = null;
		$.hud.animate({
					opacity:0,
					duration: 250
				}, function() {
					$.hud.visible = false;
					hudOnDisplay = false; // just to make sure it wasn't set during the animation
				});
	}, 750);
};

/**
 * Reset the temperature to the default of 25ºC
 * @param {Object} e ignored
 */
var resetTemperature = function(e) {
	var sliderValueAtSTP = 2.375;
	$.slider.value = sliderValueAtSTP;
	setTimeout(function() {
		changeTemperature({value:sliderValueAtSTP});
		changeTemperatureAction();
	}, 10);
	if(changeTemperatureTimer) {
		clearTimeout(changeTemperatureTimer);
	}
	removeHud();
};

$.index.open();
