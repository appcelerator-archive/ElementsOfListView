

var exponentDigits = 
		['\u2070','\u00b9','\u00b2','\u00b3','\u2074',
		 '\u2075','\u2076','\u2077','\u2078','\u2079'];
var exponentNegative = '\u207b';

prettyPrint('0');
prettyPrint('1E2');
prettyPrint('1E-2');
prettyPrint('1E45');
prettyPrint('1E-45');
prettyPrint('001E45');
prettyPrint('001E-45');
prettyPrint('1.10E45');
prettyPrint('1.10E-45');
prettyPrint('11.0E45');
prettyPrint('11.0E-45');
prettyPrint('<11.0E45s');
prettyPrint('<11.0E-45s');



function prettyPrint(numberAsString, force) {

	Ti.API.debug("elements::decodeScientificNotation - numberAsString = \"" + numberAsString + "\"");

	var numberPattern = /([^0-9\-]*)(-?[0-9]*\.?[0-9]*(E-?[0-9]+)?)([^0-9\-]*)/g;
	var numberBreakdown = numberPattern.exec(numberAsString);
	Ti.API.debug("elements::decodeScientificNotation - numberBreakdown = "+JSON.stringify(numberBreakdown));
	if(null != numberBreakdown && numberBreakdown.length >= 3 && "" !== numberBreakdown[2]) {

		var numberPart = numberBreakdown[2];
			
		var Eindex = numberPart.indexOf('E');

		if(-1 == Eindex && !force) {
		
			// the original number was not in scientific notation, we don't need to provide the 
			// new number in scientific notation either
			return {text:numberPart, val: Number(numberPart)};

		} else {
	
			// sign
			var sign = ('-' === numberPart.charAt(0)) ? '-' : ''; 
			
			//Ti.API.debug("elements::decodeScientificNotation - sign = \"" + sign + "\"");
	
			// coefficent
			// must satisfy two requirements: (1) correct number of significant digits, and (2) at least 1 but less than 10
			var Eindex = numberPart.indexOf('E');
			var coefficient = 
					(-1 == Eindex) ? 
							numberPart.substring(('-' == sign) ? 1 : 0) : 
							numberPart.substring(('-' == sign) ? 1 : 0, Eindex);
			// now we have the original number without the sign, lets move the decimal all the way to the right
			var decimalIndex = coefficient.indexOf('.');
			var decimalMoves = 0;
			if(-1 != decimalIndex) {
				// this should be negative.
				decimalMoves = decimalIndex - coefficient.length + 1;
				// and remove the point
				coefficient = coefficient.replace('.','');
			}
			// now if there are any zeros at the front of the coefficient, remove them
			coefficient = coefficient.replace(/^0*/,'');
			// and add the decimal point back in, don't forget to count its moves
			decimalMoves += coefficient.length - 1;
			if(coefficient.length > 1) {
				coefficient = coefficient.charAt(0) + '.' + coefficient.substring(1);
			}
			
			//Ti.API.debug("elements::decodeScientificNotation - coefficient = \"" + coefficient + "\"");
	
			// exponent
			var exponent = decimalMoves;
			if(-1 != Eindex) {
				var exponentStr = numberPart.substring(Eindex+1);
				exponent += Number(exponentStr);
			}
			var exponentText = '';
			if(0 != exponent) {
				var exponentSign = '';
				if(exponent < 0) {
					exponentSign = exponentNegative;
					exponent *= -1;
				}
				while(exponent) {
	
					//Ti.API.debug("elements::decodeScientificNotation - exponent,exponentText = " + exponent + ",\"" + exponentText + "\"");
	
					exponentText = exponentDigits[exponent%10] + exponentText;
					exponent = Math.floor(exponent / 10);	
				}
				exponentText = "\u00d710" + exponentSign + exponentText;
			}
	
			//Ti.API.debug("elements::decodeScientificNotation - exponentText = \"" + exponentText + "\"");
	
			Ti.API.debug("elements::decodeScientificNotation - decoded number = \"" + sign+coefficient+exponentText + "\"");
			
			// now put it all together
			return {text:sign+coefficient+exponentText, val: Number(numberPart)};
		}
		
	} else {
		return {text:numberAsString};
	}
	


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

module.exports = {
	prettyPrint: prettyPrint
};
