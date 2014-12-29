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
};

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
};

Indicator.prototype = {
	update: function() {
		this.box.alpha = (this.im.values[this.variable_name] - this.minimum) / (this.maximum - this.minimum);
	}
};


/*
	Set up the mobile controls, using the Nadion library

	To bootstrap the process:
*/

var Nadion = {};

// controls (keyboard/touch) module for Nadion
//
// Copyright 2013 Joshua C. Shepard
//
// Permission is hereby granted, free of charge, to any person obtaining a copy
// of this software and associated documentation files (the "Software"), to deal
// in the Software without restriction, including without limitation the rights
// to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
// copies of the Software, and to permit persons to whom the Software is
// furnished to do so, subject to the following conditions:
// 
// The above copyright notice and this permission notice shall be included in
// all copies or substantial portions of the Software.
// 
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
// IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
// FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
// AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
// LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
// OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
// THE SOFTWARE.

/** 
 * @class Nadion#Nadion.Controls
 * @classdesc Class providing simple on-screen touch controls for touch devices
 * @constructor
 * @description (Safe to use as constructor or simple call)
 * @arg {Phaser.Game} game
 * @arg {number} screen_width Viewport / screen width in pixels
 * @arg {number} num_buttons Number of buttons to display
 */
Nadion.Controls = function( game, screen_width, num_buttons )
{
	// initialize touch input
	game.input.addPointer();
	game.input.addPointer();

	game.input.multiInputOverride = Phaser.Input.TOUCH_OVERRIDES_MOUSE;

	// private data
	var pointer1 = game.input.pointer1;
	var pointer2 = game.input.pointer2;
	var button_size = screen_width / num_buttons;

	var buttons = [];
	var prev_x = 0;
	for( var i = 0; i < num_buttons; i++ )
	{
		var button = 
		{
			left : prev_x,
			right : prev_x + button_size
		};
		buttons.push( button );
		prev_x += button_size;
	}

	/** Array of buttonPressed functions
	 * @prop {Array} buttonPressed
	 * @public */
	var buttonPressed = [];
	// onPressed events (callbacks)
	var onPressed = [];

	// helper to create a closure for each button
	var create_f = function( btn )
	{
		return function()
		{ 
			var x1;
			if( pointer1.isDown )
				x1 = pointer1.x;
			var x2;
			if( pointer2.isDown )
				x2 = pointer2.x;
			if( x1 !== undefined && x1 > btn.left && x1 < btn.right )
				return 1;
			if( x2 !== undefined && x2 > btn.left && x2 < btn.right )
				return 2;
		};
	};
	// set-up buttonPressed functions and onPressed callbacks for each
	// button
	for( i = 0; i < num_buttons; i++ )
	{
		var btn = buttons[i];
		buttonPressed.push( create_f( btn ) );

		// callbacks are undefined (non-existent) to begin with
		onPressed.push( undefined );
	}

	/** Set a callback for when a button is pressed
	 * @method Nadion.Controls#setOnPressedCallback
	 * @memberof Nadion.Controls
	 * @arg {number} button Index of button
	 * @arg {Function} callback Callback function
	 * @arg {Object} context Context ('this' object) for the callback function
	 */
	var setOnPressedCallback = function( button, callback, context )
	{
		// set the callback
		onPressed[button] = {callback : callback, context : context};
	};

	// touch handler 
	var onTouchStart = function( ptr )
	{
		// check each button
		for( var i = 0; i < num_buttons; i++ )
		{
			if( onPressed[i] )
				if( ptr.x > buttons[i].left && ptr.x < buttons[i].right )
					onPressed[i].callback.call( onPressed[i].context );
		}
	};

	// add touch handler
	game.input.onDown.add( onTouchStart );

	/** Add the on-screen buttons. Override this method if you wish to present
	 * different images/buttons.
	 * @method Nadion.Controls#addButtons
	 * @memberof Nadion.Controls
	 */
	var addButtons = function()
	{
		game.load.image('button-left', 'dist/assets/button_left.png');
		console.log("line is being executed as well");
		game.load.image('button-right', 'dist/assets/button_right.png');
		game.load.image('button-circle', 'dist/assets/button_square.png');
		game.load.image('button-square', 'dist/assets/button_circle.png');
		console.log("this line is being changed");
		// add a group containing the images for the touch controls
		var button_imgs = game.add.group();
		button_imgs.alpha = 0.33;
		button_imgs.visible = true;
		// add buttons to the group
		var gutter = (button_size - 64) / 2;
		var tmp = game.add.sprite( 0, 0, 'button-left' );
		tmp.fixedToCamera = true;
		tmp.cameraOffset.x = buttons[0].left + gutter;
		tmp.cameraOffset.y = 384-64;
		button_imgs.add( tmp );

		tmp = game.add.sprite( 0, 0, 'button-right' );
		tmp.fixedToCamera = true;
		tmp.cameraOffset.x = buttons[1].left + gutter;
		tmp.cameraOffset.y = 384-64;
		button_imgs.add( tmp );

		tmp = game.add.sprite( 0, 0, 'button-circle' );
		tmp.fixedToCamera = true;
		tmp.cameraOffset.x = buttons[3].left + gutter;
		tmp.cameraOffset.y = 384-64;
		button_imgs.add( tmp );

		tmp = game.add.sprite( 0, 0, 'button-square' );
		tmp.fixedToCamera = true;
		tmp.cameraOffset.x = buttons[4].left + gutter;
		tmp.cameraOffset.y = 384-64;
		button_imgs.add( tmp );
	};

	// public functionality
	return {
		buttonPressed : buttonPressed,
		setOnPressedCallback : setOnPressedCallback,
		addButtons : addButtons
	};
};