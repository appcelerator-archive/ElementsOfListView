var elements = {
	defaults:{"melting_point":"unknown","boiling_point":"unknown","stability":"stable","wikilink":"http://en.m.wikipedia.org/wiki/{name}"},
	files:["elements0.json","elements1.json","elements2.json","elements3.json","elements4.json","elements5.json"],
	table:[],
	
	/**
	 *	Adds more elements to the elementsList if possible
	 */
 	addData : function() {
		if(elements.files.length > 0) {
			var newElements = JSON.parse(loadFile(elements.files.shift())).table;
			// fill in unknown values
			for(var i = 0; i < newElements.length; i++) {
				for(var j in elements.defaults) {
					if(undefined === newElements[i][j]) {
						// check if the default value has a substitution
						var p = /\{[^\}]*\}/;
						var defaultVal = elements.defaults[j];
						var fillVal = p.exec(defaultVal);
						if(undefined !== fillVal && null != fillVal) {
							var replacement = newElements[i][fillVal[0].substr(1,fillVal[0].length-2)];
							defaultVal = defaultVal.replace(p, replacement);
						}
						newElements[i][j] = defaultVal;
					}
				}
				newElements[i].melting_point = decodeScientificNotation(newElements[i].melting_point);
				newElements[i].boiling_point = decodeScientificNotation(newElements[i].boiling_point);
			}
			elements.table = elements.table.concat(newElements);
			return newElements;
		} else {
			return null;
		}
	}
};

function decodeScientificNotation(numberAsString) {
	if(_.contains(["n/a", "unknown", "sublimes"], numberAsString)) {
		return {text:numberAsString};
	} else if(-1 != numberAsString.indexOf('E')) {
		
		Ti.API.debug("elements::decodeScientificNotation - numberAsString = \"" + numberAsString + "\"");
		
		// assumes exponent part is between 0 and 5 inclusive.
		var exp = ['\u2070','\u00b9','\u00b2','\u00b3','\u2074','\u2075'][numberAsString.slice(-1)];
		var newNumberAsString = numberAsString.replace(/E[0-9]$/, "\u00d710"+exp);

		Ti.API.debug("elements::decodeScientificNotation - decoded number = \"" + newNumberAsString + "\"");

		return {text: newNumberAsString, val: Number(numberAsString)};
	} else {
		return {text: numberAsString, val: Number(numberAsString)};
	}
}
	
	
/**
 * 	Loads the contents of an element file and returns it.
 */
function loadFile(filename) {
	var elementsFile = Ti.Filesystem.getFile(Ti.Filesystem.resourcesDirectory + filename); 
	var result = elementsFile.read().text;
	return result;
};

module.exports = elements;
