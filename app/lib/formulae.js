exports.temperatureFromScale = function(x) {
	
	var result = 0;

	// this forumula gives the slider extra room to move between -50 and 550 degrees
	if(x < 0.2) {
		result = 4425*x*x + 230*x - 273;
	} else if(x > 0.5) {
		result = 9800*x*x - 7800*x + 2000;
	} else {
		result = 2000*x - 450;
	}
	
	return result;
};

/**
 * The derivative of temperatureFromScale.
 */
var dt = function(x) {
	var result = 0;

	// this forumula gives the slider extra room to move between -50 and 550 degrees
	if(x < 2) {
		result = 2*4425*x + 230;
	} else if(x > 5) {
		result = 2*9800*x - 7800;
	} else {
		result = 2000;
	}
	
	return result;
};

exports.temperatureToScale = function(temperature) {
	
	var result;

	if("n/a" == temperature || temperature < -273) {
		result = 0;
	} else if(temperature > 4000) {
		result = 1;
	} else {
		result = 0.49;
		// apply newton's method over 10 iterations.
		for(var i = 0; i < 10; i++) {
			result = result - (exports.temperatureFromScale(result)-temperature)/dt(result);
		}
	}

	return result;
};

/**
 * Calculate the colour of the symbol.
 */
exports.temperatureColor = function(element, temperature) {

	// unstable are always coloured red
	if("unstable" === element.stability) {
		return "#900"; // unstable

	// sublimes, can only be solid or gas
	} else if("sublimes" === element.boiling_point.text) {
		if(temperature > element.melting_point.val) {
			return "#090"; // gas
		} else {
			return "#000"; // solid
		}

	// does not freeze, can only be liquid or gas
	} else if("n/a" === element.melting_point.text) {
		if(temperature > element.boiling_point.val) {
			return "#090"; // gas
		} else {
			return "#009"; // liquid
		}

	// unknown state
	} else if(undefined === element.boiling_point.val && 
			(undefined === element.melting_point.val || temperature > element.melting_point.val)) {
		return "#999"; // unknown
	} else if(undefined === element.melting_point.val && 
			(undefined === element.boiling_point.val || temperature < element.boiling_point.val)) {
		return "#999"; // unknown
	
	// most elements
	} else if(temperature > element.boiling_point.val) {
		return "#090"; // gas
	} else if(temperature > element.melting_point.val) {
		return "#009"; // liquid
	} else {
		return "black"; // solid
	}
};

/**
 * Calculates the position of the element on the periodic table. The table is wide-form, ie the Lanthanides and Actinides are placed inline
 * with the other elements.  Hydrogen is {row:1,col:1}, Helium is {row:1,col:36}
 * @param {Number} number
 */
exports.position = function(number) {
	var nobleGasses = [2,10,18,36,54,86,118,150]; // the 150 is purely a guess for future-proofing purposes, nothing over 
												  // 118 has been discovered.
	var gaps = [2,5,13,21,39]; // there are no known gaps after 39, a couple dozen other elements would have to be discovered
							   // to merit adding a gap before the lanthanides and actinides.
	var totalColumns = 32;

	var result = {};

	// hardcoded hydrogen to make math for other elements easier
	if(number == 1) {
		return {row: 0, column: 1};
	}

	for(var row = 0; row < nobleGasses.length; row++) {
		if(number < nobleGasses[row]) {
			result.row = row;
			break;
		}
		if(number == nobleGasses[row]) {
			// noble gas, handle like this to make math easier for other elements
			return {row: row, column: totalColumns};
		}
	}
	if(row >= gaps.length || number < gaps[row]) {
		result.column = number - nobleGasses[row-1];
	} else {
		result.column = totalColumns - (nobleGasses[row]-number);
	}
	return result;
};
