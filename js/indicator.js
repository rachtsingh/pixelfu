/*
	The IndicatorManager factory system (please excuse if I'm using the wrong jargon)
	is intended to make the process of creating indicators for various things - 
	like Mana, Health, Draw Strength, etc. - separated from the code for displaying it

	There's definitely a better way to do this, since the syntax for modifying/accessing
	the data is garbage right now, but I didn't know exactly how. Probably a way to use 
	this: 
	https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object/defineProperty

	-Rachit

	I'm hoping to grow this into the fully developed HUD system for the game, though
	it's a long way off from getting there
*/

INDICATOR_SIZE = 25; // in pixels

IndicatorManager = function(game) {
	this.game = game;
	this.indicators = [];
	this.values = {}; // simple dict for holding the values that we're talking about
}

IndicatorManager.prototype = {
	// not sure if I'll ever use this setter
	set: function(variable_name, value) {
		this.values[variable_name] = value;
	},

	update: function() {
		for (var i = 0, l = this.indicators.length; i < l; i++) {
			this.indicators[i].update();
		}
	},


	/**
	* Creates a new Indicator
	*
	* @method IndicatorManager#add_indicator
	* @param {object} binding - an object that contains the configuration settings for the new indicator:
		{
			variable_name: the name of the newly created reference,
			minimum: the minimum value for the variable,
			maximum: the maximum value for the variable,
			color: a HEX value containing the color for the indicator,
		}
	*/
	
	add_indicator: function(binding) {
		// this feels clunky but not sure how to architect
		var indicator = new Indicator(this, binding.variable_name, this.indicators.length, binding.minimum, binding.maximum, binding.color);
		this.indicators.push(indicator);
	}
};

Indicator = function(im, variable_name, index, minimum, maximum, color, name) {
	/* 
		im: the_indicator_manager
		variable_name: variable_name, // this will be the key inside the IndicatorManager.values
		index: the_horizontal_offset
		minimum: the_minimum, (optional)
		maximum: the_maximum, (optional)
		color: the_color, (optional)
	*/
	this.im = im;
	this.variable_name = variable_name;
	this.position = index;

	this.minimum = minimum || 0;
	this.maximum = maximum || 100;
	this.color = color || 0xFFFFFF;

	this.box = game.add.graphics(0, 0);
	this.box.fixedToCamera = true;
	this.box.beginFill(this.color);
	this.box.drawRect(this.position * INDICATOR_SIZE, 0, INDICATOR_SIZE, INDICATOR_SIZE);
}

Indicator.prototype = {
	update: function() {
		this.box.alpha = (this.im.values[this.variable_name] - this.minimum) / (this.maximum - this.minimum);
	}
};