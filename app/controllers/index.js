
var elements = require('elements');
var f = require('formulae');
var temperature = 25;

var getElementBySymbol = function(symbol) {
	Ti.API.log("index::elementClick called, symbol = " + symbol);
	if("clickToSearch" === symbol) {
		return null; // this is not an element
	}
	for(var i = 0; i < elements.table.length; i++) {
		var elem = elements.table[i];
		if(elem.symbol == symbol) {
			// found the item
			return elem;
		}
	}
	// If we get here, no element is found. Should never happen.
	Ti.API.error("index::getElementBySymbol internal error");
	return null; 
};

var quickView = function(elem) {
	Ti.API.debug("index::quickView called");
	var quickView = Alloy.createController("quickView", {
		element: elem,
		temperature: temperature
	});
	$.index.add(quickView.getView());
	
	quickView.getView().addEventListener('click', function() {
		$.index.remove(quickView.getView());
	});
};

/**
 *	an element was clicked on, we know what it is. Now open it in a web view
 */
var viewElement = function(elem) {
	if(OS_IOS) {
		var wikiwindow = Alloy.createController("iPhone/wikiviewer", {
			name: elem.name, 
			symbol: elem.symbol,
			symbolcolor: f.temperatureColor(elem, temperature),
			wikilink: elem.wikilink
		});
		wikiwindow.getView().open();
	}
	if(OS_ANDROID) {
		Titanium.Platform.openURL(elem.wikilink);
	}
};

var symbolClicked = false;
function symbolClick(e) {
	Ti.API.debug("index::symbolClick - started, e.source == " + e.source);
	var elem = getElementBySymbol(e.itemId);
	Ti.API.debug("index::symbolClick - elem = " + JSON.stringify(elem));
	if(elem) {
		quickView(elem);
	}
	symbolClicked = true;
};

/**
 *	Click into a web view that contains the wiki page for the element
 */
var elementClick = function(e) {
	if(symbolClicked) {
		symbolClicked = false;
		return;
	}
	Ti.API.debug("index::elementClick - source.id = " + e.source.id);
	var elem = getElementBySymbol(e.itemId);
	if(elem) {
		viewElement(elem);		
	}
};
$.elementsList.addEventListener('itemclick', elementClick);


/**
 *	Because search can only search for things that are already in the ListView, let's load the rest of the content here.
 */
var searchFocus = function(e) {
	Ti.API.debug("index::searchFocus called");
	while(elements.files.length > 0) {
		Ti.API.debug("index::searchFocus adding data");
		addData();
	}
};


/*
 * 	This is the search bar on Android. It's not visible until the user clicks into it, and when the user deletes all
 * 	the text inside, it disappears.
 */
if(OS_ANDROID) {

	var clickToSearch = {
		// this 'template' property allows this list item to use a different template from the others.
		template: Titanium.UI.LIST_ITEM_TEMPLATE_DEFAULT,
		properties: {
			height: 50,	// fixes the height of the listItem. I want it to be the same height as the Search bar so it
						// the list doesn't appear to shift when this item is removed.
			title: "Click to search",
			color: "#009",
			itemId: "clickToSearch"
		}
	};
	
	var searchAction = function(e) {
		$.elementsList.searchText = e.value;
	};
	
	var cancelSearchAction = function(e) {
		if('' === $.searchBar.value) {
			// end search
			$.searchBar.blur();
			$.elementsList.top = 0;
			$.elementsList.sections[0].insertItemsAt(0, [clickToSearch]);
			$.searchBar.visible = false;
		}
	};

	$.elementsList.addEventListener('itemclick', function(e) {
		//
		//	Ensure this handler is only acting on clickToSearch items.
		//
		if(!$.searchBar.visible && "clickToSearch" == e.itemId) {
			// start search
			setTimeout(searchFocus, 10); // make sure all the data is loaded or the search won't find stuff.
										 // the data doesn't really need to exist until the user actually starts
										 // typing, so we can defer this action until the UI changes are made.
			$.searchBar.visible = true;
			$.elementsList.sections[0].deleteItemsAt(0,1); // remove the list item that says 'clickToSearch'
			$.elementsList.top = 50;	// make room for the 
			$.searchBar.focus();
		}
	});

	var sec = $.elementsList.sections[0];
	if(0 == sec.items.length) {
		sec.setItems([clickToSearch]);
	} else {
		sec.insertItemsAt(0, [clickToSearch]);
	}
}


/**
 *	Convert a list of elements from a JSON file into a format that can be added to the ListView
 * 	@param {Object} rawElements the elements from the JSON file.
 */
var preprocessForListView = function(rawElements) {
	return _.map(rawElements, function(element) {
		return {
			properties: {
				searchableText: element.name + ' ' + element.symbol + ' ' + element.number.toString(),
				itemId: element.symbol
			},
			symbol: {text: element.symbol, color: f.temperatureColor(element, temperature), onClick: elementClick},
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
	var newElements = elements.addData();
	if(newElements) {
		var dataToAdd = preprocessForListView(newElements);
		
		Ti.API.debug(JSON.stringify(dataToAdd));
		
		
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
 *	Load or reload the content in the list.
 */
var setItems = function() {	
	var items = preprocessForListView(elements.table);
	if(OS_ANDROID && !$.searchBar.visible) {
		items.unshift(clickToSearch);
	}
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
	
	temperature = f.temperatureFromScale(e.value);

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
	var sliderValueAtSTP = 0.2375;
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
