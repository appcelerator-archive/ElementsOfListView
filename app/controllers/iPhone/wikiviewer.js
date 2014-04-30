var args = arguments[0] || {};

// expects args: name, symbol, symbolcolor, wikilink

var getWiki = function(url) {
	$.wikiview.url = url;
};

$.win.title = args.name;
var doneButton = Ti.UI.createButton({systemButton:Ti.UI.iPhone.SystemButton.DONE});
doneButton.addEventListener('click', function() {
	$.navWin.close();
});
$.win.rightNavButton = doneButton;

getWiki(args.wikilink);

