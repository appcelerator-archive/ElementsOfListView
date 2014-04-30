var args = arguments[0] || {};
var f = require('formulae');

// expected args: element, temperature

$.symbol.applyProperties({
	text: args.element.symbol,
	color: f.temperatureColor(args.element, args.temperature)});
$.number.text = args.element.number;
$.massDataLabel.applyProperties({
	text: args.element.mass.toString(),
	width: Ti.UI.SIZE });
$.radiusDataLabel.text = args.element.radius;
$.meltingDataLabel.text = args.element.melting_point.text+" ºC";
$.boilingDataLabel.text = args.element.boiling_point.text+" ºC";
$.name.text = args.element.name;



/**
 * 	This is a calculator to build the temperature scale for solid/liquid/gas at STP
 */  
var elementPostLayout = function() {
	
	Ti.API.debug("Ti.Platform.displayCaps.density == " + Ti.Platform.displayCaps.density);
	
	var ldf = OS_IOS?(Ti.Platform.displayCaps.density=="high"?2:1):Ti.Platform.displayCaps.logicalDensityFactor;

	Ti.API.debug("ldf == " + ldf);

	var scaleWidth = $.temperatureScaleMarkers.rect.width*ldf;

	var mp = args.element.melting_point.val;
	var bp = Math.min(args.element.boiling_point.val, 4000);

	var melt = null, boil = null;
	var scalePx = function(value) {return Math.round(value).toString()+"px";};

	// set the boiling and melting points
	if("n/a" == args.element.melting_point.text) {
		$.solidBar.visible = false;
		$.meltMarker.visible = false;
	} else if("unknown" == args.element.melting_point.text) {
		$.solidBar.visible = false;
		$.meltMarker.visible = false;
		$.liquidBar.visible = false;
	} else {
		melt = f.temperatureToScale(mp);
		Ti.API.log("melt == " + melt);
		$.meltMarker.left = scalePx(melt*scaleWidth);
		$.solidBar.right = scalePx($.temperatureScaleMarkers.rect.width*ldf - (melt*scaleWidth+1));
	}

	if("sublimes" == args.element.boiling_point.text) {
		$.solidBar.right = 0;
		$.meltingLegendLabel.text = "Sublimation:";
		melt = f.temperatureToScale(mp);
		Ti.API.log("melt == " + melt);
		$.meltMarker.left = scalePx(melt*scaleWidth);
		$.boilMarker.visible = false;
		$.gasBar.left = scalePx(melt*scaleWidth);
	} else if("unknown" == args.element.boiling_point.text) {
		$.gasBar.visible = false;
		$.liquidBar.visible = false;
		$.boilMarker.visible = false;
	} else if(bp > 4000) {
		$.gasBar.visible = false;
		$.boilMarker.visible = false;
		boil = scaleWidth;
	} else {
		boil = f.temperatureToScale(bp);
		Ti.API.log("boil == " + boil);
		$.gasBar.left = scalePx(boil*scaleWidth);
		$.boilMarker.left = scalePx(boil*scaleWidth);
	}
	
	var applyProperties = function(state, props) {
		for(var i in props) {
			$[state+i].applyProperties(props[i]);
		}
	};
	
	var leftTwoline = function(marker, state) {
		Ti.API.debug("leftTwoline("+marker+", \""+state+"\")");
		applyProperties(state, {
			LabelContainer	: { layout: 'composite', left: 0, height: 30 },
			MarkerLine 		: { left: 0 },
			Box				: { left: scalePx(marker*scaleWidth), height: 30 },
			LegendLabel		: { left: 5, right: 0, bottom: 15 },
			DataLabel		: { width: Ti.UI.SIZE, 
								left: -(OS_IOS?5:$[state+'LegendLabel'].rect.width), 
								bottom: 0 }
		});
	};
	
	var rightTwoline = function(marker, state) {
		Ti.API.debug("rightTwoline("+marker+", \""+state+"\")");

		applyProperties(state, {
			LabelContainer	: { layout:"composite", right: 0, height: 30 },
			Box				: { width: scalePx(marker*scaleWidth), height: 30,
								right : scalePx($.temperatureScaleMarkers.rect.width*ldf - marker*scaleWidth - 1) },
			MarkerLine		: {	right: 0 },
			LegendLabel		: { left: 0, right : 4, height: 15, width: Ti.UI.FILL, textAlign: Ti.UI.TEXT_ALIGNMENT_RIGHT },
			DataLabel		: { left: 0, right : 4, width: Ti.UI.FILL, bottom: 0, textAlign: Ti.UI.TEXT_ALIGNMENT_RIGHT }
		});
		

/*
		applyProperties(state, {
			MarkerLine		: {	right: 0 },
			LabelContainer	: { layout:"composite", right: 5},
			DataLabel		: { left: 100, bottom: 0, right: 0,
								textAlign: Ti.UI.TEXT_ALIGNMENT_RIGHT },
			LegendLabel		: { width: $[state+'LabelContainer'].rect.width-5,
								right: -(OS_IOS?0:$[state+'DataLabel'].rect.width),
								bottom: 15, textAlign: Ti.UI.TEXT_ALIGNMENT_RIGHT },
			Box				: { right: scalePx($.temperatureScaleMarkers.rect.width*ldf - marker*scaleWidth - 1) }
		});
		applyProperties(state, {
			DataLabel		: { left: 0, right: 0 }
		});
 */
	};
	
	var leftOneline = function(marker, state) {
		Ti.API.debug("leftOneline("+marker+", \""+state+"\")");
		var bottom = (state=="boiling")?15:0;
		applyProperties(state, {
			MarkerLine		: { left: 0, bottom: bottom },
			LabelContainer	: { layout: "composite", bottom: bottom, left: 5, width: Ti.UI.SIZE, height: Ti.UI.SIZE },
			LegendLabel		: { left: 0 },
			DataLabel		: { left: 5+(OS_IOS?$[state+'LegendLabel'].rect.width:0), width: Ti.UI.SIZE },
			Box				: { left: scalePx(marker*scaleWidth) }
		});
	};
	
	var rightOneline = function(marker, state) {
		Ti.API.debug("rightOneline("+marker+", \""+state+"\")");
		var bottom = (state=="melting")?15:0;
		applyProperties(state, {
			MarkerLine		: { right: 0, bottom: bottom },
			LabelContainer	: { layout: "composite", bottom: bottom, right: 5, width: Ti.UI.SIZE, height: Ti.UI.SIZE },
			DataLabel		: { right: 0, width: Ti.UI.SIZE },
			LegendLabel		: { right: 5+(OS_IOS?$[state+'DataLabel'].rect.width:0) },
			Box				: { right: scalePx($.temperatureScaleMarkers.rect.width*ldf - marker*scaleWidth - 1) }
		});
	};
	
	if(undefined === args.element.melting_point.val) {
		$.meltingBox.visible = false;
		if(undefined === args.element.boiling_point.val) {
			$.boilingBox.visible = false;			
		} else if(bp > 550) {
			rightTwoline(boil, "boiling");
		} else {
			leftTwoline(boil, "boiling");
		}
	} else if(undefined === args.element.boiling_point.val) {
		$.boilingBox.visible = false;
		if(mp > 550) {
			rightTwoline(melt, "melting");
		} else {
			leftTwoline(melt, "melting");
		}
	} else {
		if(melt < 0.3333 && boil > 0.6667 && (boil - melt) < 0.5) {
			if(melt > 1-boil) {
				leftTwoline(melt, "melting");
				leftTwoline(boil, "boiling");
			} else {
				rightTwoline(melt, "melting");
				rightTwoline(boil, "boiling");
			}
		} else if((boil - melt) < 0.4) {
			if(melt < 0.4 && boil < 0.6) {
				leftOneline(melt, "melting");
				leftOneline(boil, "boiling");
			} else if(boil > 0.6 && melt > 0.4) {
				rightOneline(melt, "melting");
				rightOneline(boil, "boiling");
			} else {
				rightTwoline(melt, "melting");
				leftTwoline(boil, "boiling");
			}
		} else {
			leftTwoline(melt, "melting");
			rightTwoline(boil, "boiling");
		}
	}
	
	// set the temperature scale markers
	var temps = [-200,-100,0,100,200,300,400,500,600,700,800,900,1000,1500,2000,2500,3000,3500];
	for(var i = 0; i < temps.length; i++) {
		var scale = 'scale' + (temps[i]<0?'n':'') + Math.abs(temps[i]).toString();
		var tempScale = f.temperatureToScale(temps[i])*scaleWidth;
		$[scale].left = scalePx(tempScale);
	}
	$.temperatureScale.removeEventListener('postlayout', elementPostLayout);
};
$.temperatureScale.addEventListener('postlayout', elementPostLayout);

