
var elements = require('elements');
var temperature = 25;

/**
 * 	Loads the contents of an element file and returns it.
 */
var loadFile = function(filename) {
	var elementsFile = Ti.Filesystem.getFile(Ti.Filesystem.resourcesDirectory + filename); 
	var result = elementsFile.read().text;
	return result;
};

/**
 *	Convert a list of elements from a JSON file into a format that can be added to the ListView
 * 	@param {Object} rawElements the elements from the JSON file.
 */
var preprocessForListView = function(rawElements) {
	return _.map(rawElements, function(element) {
			return {
				symbol: {text: element.symbol, color: temperatureColor(element, temperature)},
				name: {text: element.name},
				number: {text: element.number.toString()},
				mass: {text: element.mass.toString()}
			};
	});	
};

/**
 *	Adds more elements to the elementsList if possible
 */
var addData = function() {
	if(elements.files.length > 0) {
		var newElements = JSON.parse(loadFile(elements.files.shift())).table;
		elements.table = elements.table.concat(newElements);
		var dataToAdd = preprocessForListView(newElements);
		
		// Disable animation when adding to iPhone if on the first screen, so it doesn't have the appearance of loading
		// Android doesn't animate appends
		var animationStyle = OS_IOS ? (elements.table.length < 25 ? Ti.UI.iPhone.RowAnimationStyle.NONE : null) : null;
		$.elementsList.sections[0].appendItems(dataToAdd, animationStyle);
	}
};
// let the class start before adding items.
setTimeout(function() {
	// the initial data load
	addData();
	$.elementsList.setMarker({sectionIndex:0,itemIndex:15});
},0);

var markerReached = function() {
	addData();
	$.elementsList.setMarker({
		sectionIndex:0,
		itemIndex: ($.elementsList.sections[0].items.length - 10)
	});
};


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
 *	Load or reload the content in the list.
 */
var setItems = function() {	
	var items = preprocessForListView(elements.table);
	// note that setItems will clear the list before passing in the item array.
	$.elementsList.sections[0].setItems(items);
};

var changeTemperatureAction = function() {

	changeTemperatureTimer = null;
	setItems();

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
