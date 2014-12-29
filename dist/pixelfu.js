/**
* Creates a new Entity
*
* Entities can be simple or complicated, such as patrolling enemies 
* or powerups. Grouping them together like this helps allow complex AI
* behavior - such as guarding items or flocking
*
*
* Entity
*
* init parameters
* @param {object} game - the game object to bind to
* @param {string} image - the Cache key to use to create the object  
* @param {number} x - X position in tile units
* @param {number} y - Y position in tile units
* @param {string} type - the type of object, e.g. "gold", "scroll", etc.
* @param {string} description - a description - used for the tooltip
* @param {bool} physics - whether the object is physics-enabled 
* @param {object} physicsConfig - parameters for the object (see code)
* @param {number} importance - the intrinsic importance (for AI calculations)
* @param {bool} actor - whether the entity is an actor (for AI calculations)
*/

function Entity (){
	// I'm not sure how this works
}

Entity.prototype.init = function(game, image, x, y, type, description, physics, physicsConfig, importance, actor) {
	this.game = game;

	this.sprite = game.add.sprite(TILE_WIDTH * x, TILE_WIDTH * y, image); 
	this.type = type;
	this.description = description; // could be overwritten

	if (physics) {
		game.physics.arcade.enable(this.sprite);

		// dangerous, but I'm assuming you're not being dumb
		for (var key in physicsConfig) {
			this.sprite.body[key] = physicsConfig[key];
		}
	}
};

Entity.prototype.update = function() {
	// do nothing

};

/* 
	A collection of 'useful' objects
	Gold, Potions, Scrolls
*/

function Gold(game, x, y, amount) {
	this.base = Entity;
	// tweak how importance is calculated to give good AI
	this.base.init(game, "gold", x, y, "gold", "A glittering pile of dubloons\n{0} GP".format(amount), false, null, amount/100);
	this.amount = amount;
}

// there's something wrong with passing nothing on, but I 
// can't quite figure it out - should I change Entity to have a 
// separate constructor

Gold.prototype = new Entity();

function Scroll(game, x, y, effect) {
	// Here we must be careful - effect is an object with variable attributes, but
	// we must guarantee that one of the attributes is named description
	this.base = Entity;
	// figure out how to calculate the value of a scroll
	this.base.init(game, "scroll", x, y, "scroll", effect.description, false, null, 0);
	this.effect = effect;
}

Scroll.prototype = new Entity();

function Potion(game, x, y, HP) {
	this.base = Entity;
	// again tweak
	this.base.init(game, "potion", x, y, "potion", "A gleaming green potion that looks delicious\n{0} HP".format(HP), false, null, HP);
	this.HP = HP;
}

Potion.prototype = new Entity();

function Crate(game, x, y, value) {
	this.base = Entity;
	// maybe make the importance random/0? Since the AI shouldn't be able to tell
	this.base.init(game, "crate", x, y, "potion", "A crate\nWho knows what mysteries lie inside?", true, {mass: 100}, value*10);
	// the value gives the importance of the object inside
	this.value = value;
}

Crate.prototype = new Entity();

// Just a test of a rudimentary AI system

/*
	Actor objects will be able to move and make decisions about their next step. 

	The higher the sentience level, the more complicated a decision they'll be able to make. 
		0 - basic movement towards player/items or just random
		1 - ?
		2 - ?
		3 - ?
		4 - Making complicated value judgements and history (?)
	I'm also using the sentience value to offset calculations - a low sentience creature calculates every 10 steps, 
	high sentience character calculates every step, etc.
	
	Greediness denotes their attraction to high-value entities 

	Slowdown is the number of frames to skip between - 1 is the lowest
*/

function Actor(game, image, x, y, type, physicsConfig, sentience, greediness, slowdown) {
	this.base = Entity;
	this.base.init(game, image, x, y, type, true, physicsConfig, sentience * 100);
	
	this.sentience = sentience;
	this.greediness = greediness;
	this.slowdown = slowdown;

	this.direction = 0; // same system, 0 - 3 based on standard rotation
}

Actor.prototype = new Entity();

Actor.prototype.update = function() {
	/*
		Though this is entirely up to debate, I'm currently implementing
		actor movement as a sort of turn based discrete movement
		- while the player is moving in realtime
	*/

	// make decisions before moving
	// #! this line of code is wrong
	if (this.game.frames % this.sentience === 0) {
		this.think();
	}

	if (this.game.frames % this.slowdown === 0) {
		this.stepcountdown = 0;
		
		// I'm not worry about accidently walking through walls because
		// our wonderful physics libraries handles that even at this 
		// resolution (at least in my tests)
		switch(this.direction) {
			case 0: 
				this.sprite.body.position.x += TILE_WIDTH;
				break;
			case 1:
				this.sprite.body.position.y -= TILE_WIDTH;
				break;
			case 2:
				this.sprite.body.position.x -= TILE_WIDTH;
				break;
			case 3:
				this.sprite.body.position.y += TILE_WIDTH;
				break;
		}
	}

	// depending on what we need, could move this outside 'if'
	if (this.meets_action_condition()) {
		this.act();
	}
};

Actor.prototype.think = function (argument) {
	// fill in via children
};

Actor.prototype.meets_action_condition = function(){
	return false; // obviously override
};

Actor.prototype.act = function() {
	// fill in
};
;/*
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
};;Level = function(game) {
	/*
	The level contains almost all of the objects that aren't under 
	the direct control of the player. This includes thngs like
	- obstacles
	- arrows
	- monsters
	- traps
	- items
	- magic (though the mana is under the player object)
	*/

	this.game = game;
	this.monsters = [];

	// for debug purposes
	this.main_arrow = {};

	/* constants */
};

Level.prototype = {

	preload: function() {
		this.game.load.image('bullet', 'dist/assets/bullet.png');
		this.game.load.image('specialbullet', 'dist/assets/specialbullet.png');
		this.game.load.image('lrarrow', 'dist/assets/lrarrow.png'); // a left-right arrow
		this.game.load.image('udarrow', 'dist/assets/udarrow.png'); // an up-down arrow
		this.game.load.image('tiles', 'dist/assets/tiles.png');
		this.game.load.image('baddie', 'dist/assets/space-baddie.png');

		// // load the images for the touch screen library
		// this.game.load.image('button-left', 'dist/assets/button_left.png');
		// this.game.load.image('button-right', 'dist/assets/button_right.png');
		// this.game.load.image('button-circle', 'dist/assets/button_square.png');
		// this.game.load.image('button-square', 'dist/assets/button_circle.png');
	},

	create: function() {

		// do magic!
		// debug(randgen);

		this.map = game.add.tilemap(null, 16, 16, GAME_WIDTH, GAME_HEIGHT);
		this.map.addTilesetImage('tiles');

		this.layer = this.map.create('base_layer', GAME_WIDTH, GAME_HEIGHT, TILE_WIDTH, TILE_WIDTH);

		// this.layer.resizeWorld(); // this is an override, not necessary

		// this.map.fill(1, 0, 0, 5, 5, this.layer);
		// var randgen = generate_dungeon(this.map, this.layer);
		
		// here's a trick that makes things roomier
		for (var x = 0; x < GAME_WIDTH; x++) {
			for (var y = 0; y < GAME_HEIGHT; y++) {
				this.map.layers[0].data[x][y].index = this.game.rm.tilearray[x/2 |0][y/2 |0];
			}
		}

		this.map.setCollisionBetween(1, 15, true, this.layer. true);

		this.baddie = game.add.sprite(TILE_WIDTH*3, TILE_WIDTH*3, 'baddie');
		game.physics.arcade.enable(this.baddie);

		this.baddie.body.mass = 100;

		// this.map.setTileIndexCallback(4, bounce, this);

		this.layer.dirty = true;

		this.arrows = game.add.group();
		this.arrows.enableBody = true;

		// just to access the space button
		this.space = game.input.keyboard.addKey(Phaser.Keyboard.SPACEBAR);
		this.ctrl = game.input.keyboard.addKey(Phaser.Keyboard.SHIFT);

	},

	update: function() {
		// override updates - note that things in the physics scheme automaticall update
	},

	fireArrow: function(position, direction, velocity, type) {
		// 

		arrow = this.arrows.create(position.x, position.y, type);
		arrow.anchor.set(0.5, 0.5);

		// arrow.type = "arrow";

		this.main_arrow = arrow;

		// sensible default
		arrow.direction = {
			x: 1,
			y: 0
		};

		// don't forget about switch y axis
		switch (direction) {
			case 0:
				arrow.direction = {
					x: 1,
					y: 0
				};
				arrow.angle = 0;
				arrow.body.position.x += TILE_WIDTH;
				arrow.body.position.y += TILE_WIDTH/2;
				break;
			case 1:
				arrow.direction = {
					x: 0,
					y: -1
				};
				arrow.angle = 180;
				arrow.body.position.x += TILE_WIDTH/2;
				break;
			case 2:
				arrow.direction = {
					x: -1,
					y: 0
				};
				arrow.angle = 180;
				arrow.body.position.y += TILE_WIDTH/2;
				break;
			case 3:
				arrow.direction = {
					x: 0,
					y: 1
				};
				arrow.angle = 0;
				arrow.body.position.x += TILE_WIDTH/2;
				arrow.body.position.y += TILE_WIDTH;
				break;
		}
		// let's give this a try
		// arrow.body.bounce.x = direction.x * 0.5;
		// arrow.body.bounce.y = direction.y * 0.5;

		arrow.body.mass = 10;
		arrow.body.velocity = {
			x: arrow.direction.x * velocity,
			y: arrow.direction.y * velocity
		};
		arrow.body.collideWorldBounds = true;

		arrow.direction = direction; // so that it remembers its true direction
		arrow.metadata = {
			speed: velocity
		};

		// return a reference so that the player object can keep track of its arrows;
		return arrow;
	}
};;// the overall size of the game will be 40x40 tiles, or 640x640
var TILE_WIDTH = 16; // in pixels
var GAME_WIDTH = 101; // MUST BE ODD!
var GAME_HEIGHT = 101; // MUST BE ODD!
var CAMERA_WIDTH = 25;
var CAMERA_HEIGHT = 25;

var MOBILE = false;

// the values that are actually used by Phaser for the webGL/Canvas object
var WIDTH = TILE_WIDTH * CAMERA_WIDTH; 
var HEIGHT = TILE_WIDTH * CAMERA_HEIGHT;

// set up the game object - width and height here are of the canvas/WebGL object
var game = new Phaser.Game(WIDTH, HEIGHT, Phaser.AUTO, '', { preload: preload, create: create, update: update, render: render });

// The order of the functions being called is:
// preload() -> create() -> update() -v, so it loops at update()
//                             ^------

function preload() {
	// this is a global timing tool - there is probably a better thing somewhere in Phaser
	game.frames = 0;

	// linked in indicator.js
    im = new IndicatorManager(game);
    game.im = im;

    // linkedin room_manager.js
    rm = new RoomManager(game);
    game.rm = rm;

	// linked in level.js
	level = new Level(game);
    level.preload();
	game.level = level;

    // linked in player.js
    player = new Player(game);
    player.preload();
    game.player = player;

    // should be a group of one object, but somehow necessary
    players = game.add.group();

    // contains all the entities that are physics objects
    physics_entities = game.add.group();

    // this is just a group of all the entities - overlaps with above
    entities = game.add.group();

}

function create() {
	game.world.setBounds(0, 0, GAME_WIDTH * TILE_WIDTH, GAME_HEIGHT * TILE_WIDTH);
	
	game.physics.startSystem(Phaser.Physics.ARCADE);

	rm.create();
	level.create();
	player.create();
    players.add(player.sprite);
	
    game.camera.follow(player.sprite, Phaser.Camera.FOLLOW_TOPDOWN);

    // if you need to debug the FPS
    // game.time.advancedTiming = true;	
	
	// literally just need the following to enable mobile support 
	if (MOBILE) {
		GameController.init({
	        left: {
	            type: 'dpad',
	            dpad: {
	            	up: {
	            		touchStart: function() {
	            			player.touchcontrols.up = true;
	            		},
	            		touchEnd: function() {
	            			player.touchcontrols.up = false;
	            		}
	            	},
	            	down: {
	            		touchStart: function() {
	            			player.touchcontrols.down = true;
	            		},
	            		touchEnd: function() {
	            			player.touchcontrols.down = false;
	            		}
	            	},
	            	left: {
	            		touchStart: function() {
	            			player.touchcontrols.left = true;
	            		},
	            		touchEnd: function() {
	            			player.touchcontrols.left = false;
	            		}
	            	},
	            	right: {
	            		touchStart: function() {
	            			player.touchcontrols.right = true;
	            		},
	            		touchEnd: function() {
	            			player.touchcontrols.right = false;
	            		}
	            	}
	            }
	        },
	        right: {
	            // We're not using anything on the right for this demo, but you can add buttons, etc.
	            // See https://github.com/austinhallock/html5-virtual-game-controller/ for examples.
	            type: 'buttons',
	            buttons: [
	            	{
	            		label: "B",
	            		touchStart: function() {
	            			player.touchcontrols.shift = true;
	            		},
	            		touchEnd: function() {
	            			player.touchcontrols.shift = false;
	            		}
	            	},
	            	{
	            		label: "A",
	            		touchStart: function() {
	            			player.touchcontrols.space = true;
	            		},
	            		touchEnd: function() {
	            			player.touchcontrols.space = false;
	            		}

	            	},
	            	false,
	            	false
	            ]
	        }
	    });
	}
}


function update() {
	// update the number of frames
	game.frames++;

	var resetText = function(){
		var tween = game.add.tween(this.scale).to({x:1, y:1}, 100, Phaser.Easing.Linear.In);
		tween.start();
		this.tweening = false;
		this.fill = "white";
	};

	var gameOver = function(winner){
		// #! refine this, this is garbage
		gameover = game.add.text(WIDTH/2, HEIGHT/2, "GAME OVER: " + winner + " Wins!", {
	        font: "45px Arial",
	        fill: "#ffffff",
	        align: "center"
	    });
	};

	var stuck_arrow = function(arrow, obstacle) {
		console.log(obstacle);
		// console.log("arrow hit an obstacle");
		arrow.body.velocity = {x: 0, y: 0};
		// console.log(arrow);
		arrow.lifespan = 4 * Phaser.Timer.SECOND;
		level.map.recalculateTile(obstacle.x, obstacle.y, 0);
		console.log(obstacle);
	};

	var hit_wall = function(sprite, obstacle) {
		console.log(sprite, obstacle);
	};

    level.update();
    player.update();
    im.update();

    // update all the entities
    physics_entities.callAll("update");

    //  Collide objects
    game.physics.arcade.collide(level.layer, level.baddie);
    game.physics.arcade.collide(level.layer, level.arrows, stuck_arrow);
    game.physics.arcade.collide(level.baddie, level.arrows, stuck_arrow);

    game.physics.arcade.collide(level.layer, player.sprite, hit_wall);
    game.physics.arcade.collide(level.layer, players); // ok weird, this works but the above line is useless
}

function render(){
	// debug the last fired arrow
	// game.debug.body(level.main_arrow);

	// debug the frames per second
	// game.debug.text(game.time.fps || '--', 2, 14, "#00ff00");   

	// not sure if this goes here
	for (var i = 0; i < player.breadcrumbs.length; i++) {
		game.debug.geom(player.breadcrumbs[i]);
	}
};// delineate the constants for closure compiler (for later)
DRAW_MIN = 8;
DRAW_THRESHOLD = 15;
DRAW_MAX = 57;

MANA_MIN = 0;
MANA_THRESHOLD = 15;
MANA_MAX = 25;

NUM_BREADCRUMBS = 5;
BREADCRUMB_FRAMES = 15;

Player = function(game) {
	this.game = game;
	this.sprite = {};
	this.cursors = null;

	// in case we need it
	this.arrows = [];

	// variables
	this.direction = 0; // should be 0 - 3, +x, +y, -x, -y
	this.manatimer = 0;
	this.arrowtimer = 0;
	this.nocked = false; // for arrows
	this.charging = false; // for mana

	// we have to be careful and put all of the indicator variables in the indicator manager
	// this.draw = 0; // the amount of draw the arrow has right now

	// constants (probably need to get rid of 'em)
	// this a weird system because the player doesn't know how quickly they can fire
	this.arrow_gen_time = 25;
	this.mana_gen_time = 25; // this is a broken amount of magic
	this.speed = TILE_WIDTH / 10;

	// breadcrumbs are an AI technique adapted from TinyKeep
	this.breadcrumbs = [];

	this.use_touch_controls = !this.game.device.desktop;

	this.touchcontrols = {
		left: false,
		right: false,
		up: false,
		down: false,
		shift: false,
		space: false	
	};
};

Player.prototype = {

	preload: function () {
		// this.game.load.spritesheet('dude', 'assets/cube.png', 32, 32);
		this.game.load.image('box', 'dist/assets/box.png');
	},

	create: function () {
		this.sprite = game.add.sprite(0, 0, 'box');
		
		game.physics.arcade.enable(this.sprite);
	    
	    this.sprite.body.collideWorldBounds = true;

	    // no longer necessary
	    // this.sprite.body.setSize(TILE_WIDTH * 0.8, TILE_WIDTH * 0.8);

	    //  Our two animations, walking left and right.
	    // this.sprite.animations.add('left', [0, 1, 2, 3], 10, true);
	    // this.sprite.animations.add('right', [5, 6, 7, 8], 10, true);
	    // this.sprite.animations.add('jump', [9, 10, 11], 10, true);

	    this.cursors = {};
		this.cursors = this.game.input.keyboard.createCursorKeys();
		this.space = game.input.keyboard.addKey(Phaser.Keyboard.SPACEBAR);
		this.shift = game.input.keyboard.addKey(Phaser.Keyboard.SHIFT);

		this.sprite.type = "player";

		// set up the indicators
		this.game.im.add_indicator({
			variable_name: "health",
			minimum: 0,
			maximum: 100,
			color: 0x41C535 , // green
			name: "Health Points"
		});

		this.game.im.add_indicator({
			variable_name: "draw",
			minimum: DRAW_MIN,
			maximum: DRAW_MAX,
			color: 0xFFFFFF, // for lack of a better color
			name: "Draw Strength"
		});

		this.game.im.add_indicator({
			variable_name: "mana",
			minimum: MANA_MIN,
			maximum: MANA_MAX,
			color: 0x5591E5, // for lack of a better color
			name: "Mana"
		});

		// just an alias for easier to read code
		this.indicators = this.game.im.values; 

		this.indicators.health = 100;

		for (var i = 0; i < NUM_BREADCRUMBS; i++) {
		    this.breadcrumbs.push(new Phaser.Point(this.sprite.body.position.x, this.sprite.body.position.y));
		}
	},

	update: function() {

        if (this.cursors.left.isDown || this.touchcontrols.left) {
            this.sprite.body.position.x -= this.speed;
            this.direction = 2;
        } else if (this.cursors.right.isDown || this.touchcontrols.right) {
            this.sprite.body.position.x += this.speed;
            this.direction = 0;
        } else if (this.cursors.up.isDown || this.touchcontrols.up) {
            this.sprite.body.position.y -= this.speed;
            this.direction = 1;
        } else if (this.cursors.down.isDown || this.touchcontrols.down) {
            this.sprite.body.position.y += this.speed;
            this.direction = 3;
        }

        // make the handoff between touch and desktop controls
	    var shift = false;
	    var space = false;
	    if (game.desktop) {
	    	shift = this.shift.isDown;
	    	space = this.space.isDown;
	    }
	    else {
	    	shift = this.touchcontrols.shift;
	    	space = this.touchcontrols.space;
	    }

	    // handle mana charging and firing
	    if (shift){
	    	this.charging = true;
	    	this.indicators.mana = (this.indicators.mana + 1).clamp(MANA_MIN, MANA_MAX);
	    }
	    else {
		    if (this.manatimer > this.mana_gen_time && this.charging && this.indicators.mana > MANA_THRESHOLD) {
		    	// fire the arrow
		    	this.castMagic((this.indicators.mana/ 2) | 0);
		    	this.manatimer = 0;
		    }
		    else {
		    	this.manatimer++;
		    }
		    // this feels expensive
	    	this.charging = false;
	    	this.indicators.mana = 0;
	    } 

	    // handle the arrow nocking and firing
	    if (space){
	    	this.nocked = true;
	    	this.indicators.draw = (this.indicators.draw + 1).clamp(DRAW_MIN, DRAW_MAX);
	    }
	    else {
		    if (this.arrowtimer > this.arrow_gen_time && this.nocked && this.indicators.draw > DRAW_THRESHOLD) {
		    	// fire the arrow, only if there's a sufficient draw
		    	this.fireArrow(this.indicators.draw * 15);
		    	this.arrowtimer = 0;		    		
		    }
		    else {
		    	this.arrowtimer++;
		    }
		    // this feels expensive
	    	this.nocked = false;
	    	this.indicators.draw = 0; 
	    } 

	    // now handle updating the breadcrumb positions
	    if (this.game.frames % BREADCRUMB_FRAMES === 0) {
		    this.breadcrumbs.shift();
		    this.breadcrumbs.push(new Phaser.Point(this.sprite.body.position.x, this.sprite.body.position.y));
	    }
	},

	castMagic: function(strength){
		// make strength even
		strength = strength - strength % 2;
		console.log("did magic: ", strength); // for debugging
		var tilemapref = this.game.level.map.layers[0].data;

		// what this will do is destroy the blocks around the player
		var tilex = Math.floor(this.sprite.body.position.x / TILE_WIDTH);
		var tiley = Math.floor(this.sprite.body.position.y / TILE_WIDTH);

		var startx = Math.max(tilex - (strength/2 |0), 0);
		var starty = Math.max(tiley - (strength/2 |0), 0);

		/*
				startx      2           | startx + strength
		starty	|___|___|___|___|___|___| 
				|___|___|___|___|___|___|
				|___|___|___|___|___|___|
			1	|___|___|___P___|___|___|  3
				|___|___|___|___|___|___|
				|___|___|___|___|___|___|
				|___|___|___|___|___|___|
		starty  |___|___|___|___|___|___|
		+ strength - 1		4
		*/

		this.game.level.map.fill(0, startx, starty, strength, strength, 0);

		// some good tolerance on what to recalculate
		this.game.level.map.recalculateArea((startx - 2).clamp(0, GAME_WIDTH), (starty - 2).clamp(0, GAME_HEIGHT), strength + 4, strength + 4, 0);

		this.game.level.map.layers[0].dirty = true;
	},

	fireArrow: function(strength){
		var position = this.sprite.body.position;
		var velocity = strength; // work with this
		var direction = this.direction;
		var type = "lrarrow";
		if (direction % 2) type = "udarrow";
		
		this.arrows.push(this.game.level.fireArrow(position, direction, velocity, type));
	}

};

;/*
	Room System

	The Room System (RS) is the system that creates the randomly generated dungeon.

	This change also removes the dungeon generation code from level.js

	The RS is tied to the RoomManager, which is a one-off object that holds 
	all the rooms and metadata about the rooms.

	There's a trade-off to be made here - the more intelligent that the Room
	System is, creating and removing edges/rooms, the less ability to tinker with
	the landscape can we give the player. Right now I'm going to go ahead with the
	assumption that we give the player full control and that dungeon creation is a 
	one-off process, with no relevant metadata being stored.

	Also, we might want to consider rewriting this to use asm.js for speed reasons	

*/

// constants
var ROOM_DISTANCE_THRESHOLD = 15;
var CONNECT_SPACES_THRESHOLD = 0.8;

// utilities

// determine whether two rooms intersect, or are within 1 square of intersecting
var intersect_rooms = function(a, b) {
	// there's something wrong with this
	// returns whether the two rooms intersect
	return ((a.x < b.x + b.width + 3) && (a.x + a.width + 3 > b.x) && 
		(a.y < b.y + b.height + 3) && (a.y + a.height + 3 > b.y));
};

// determine whether a point is inside a room
var in_room = function(point, room) {
	return (point.x < room.x + room.width) && (point.x >= room.x) && 
		(point.y < room.y + room.height) && (point.y >= room.y);
};

// this is very sketchy
var sketchy_room_distance = function(a, b) {
	return Math.min(Math.abs(a.x - b.x) + Math.abs(a.y - b.y), 
		Math.abs(a.x + a.width - b.x - b.width) + Math.abs(a.y + a.height - b.y - b.height));
};

// for debugging only
debug = function(randgen) {
	// print out the generated maze into the debug console

	// here's the issue - I need to build it line by line
	for (var y = 0; y < GAME_HEIGHT; y++) {
		buffer = "";
		for (var x = 0; x < GAME_WIDTH; x++) {
			buffer += (randgen[x][y]).toString();
		}
		console.log(buffer);
	}

	return;
};


/*
	Some thoughts - given that generating the rooms and setting everything up might take a long time
	it might be a good idea to have a loading indicator while this is running. Phaser
	has support for something called game state, which should help here
*/

function RoomManager(game) {
	this.game = game;
	this.rooms = [];
	this.edge_tiles = [];
}
	/*
		The setup will follow the following steps: 
		1. Populate the map with a randomly selected group of rooms
		2. Carve out these rooms from the tilearray
		3. Carve out paths in the middle between these edges, etc.
		4. Randomly connect rooms and edges for a long time

		As with all games, speed is vital. That's why when we're generating the dungeon,
		we can't have any extraneous calls to calculateFaces(). If we look at the source,
		it looks like the underlying call in many of these is just to create a new tile
		or to change the tile index. So it'll be least expensive to just initialize,
		create the dungeon in a 2D array, and then change the index property on each tile
		(done in main)
	*/

RoomManager.prototype.create = function() {

	/*
		this.tilearray: 1/0 depending on whether there's obstacle
		this.tilearray_metadata: {
			type: 0 if nothing, 1 if room, 2 if edge
		}
	*/

	// create the array of all 1s to carve out of
	this.tilearray = new Array(GAME_WIDTH);
	this.tilearray_metadata = new Array(GAME_WIDTH);

	for (var i = 0; i < GAME_WIDTH; i++) {
		this.tilearray[i] = new Int8Array(GAME_HEIGHT);
		this.tilearray_metadata[i] = new Int8Array(GAME_HEIGHT);
		for (var j = 0; j < GAME_HEIGHT; j++) {
			this.tilearray[i][j] = 1; // so we have to carve out of it
			this.tilearray_metadata[i][j] = {};
		}
	}

	// Step 1
	this.rooms = this.find_rooms();

	// Step 2
	// this.edges = this.find_edges();

	// Step 2 - carve the rooms
	this.carve_rooms();

	// debug(this.tilearray);

	// Step 3
	this.carve_edges();

	// debug(this.tilearray);

	// Step 4
	this.connect_spaces();
};

RoomManager.prototype.find_rooms = function() {
	// this is different from the one linked above, I think (I haven't read that)

	// constants
	var MIN_SIZE = 3;
	var MAX_SIZE = 10;
	var FRUSTRATION_MAX = 50;
	var MAX_ITERATIONS = 500;

	var rooms = [];

	// number of times we've tried to add a new room and failed
	frustration = 0;
	it = 0;

	while (frustration < FRUSTRATION_MAX && it < MAX_ITERATIONS) {
		it++;

		// try to add a room - upperleft corner, width and height
		var width = odd_range(MIN_SIZE, MAX_SIZE);
		var height = odd_range(MIN_SIZE, MAX_SIZE);

		var room = {
			x: odd_range(0, GAME_WIDTH - width),
			y: odd_range(0, GAME_HEIGHT - height),
			width: width,
			height: height
		};

		var flag = false;

		for (var i = 0; i < rooms.length; i++) {
			if (intersect_rooms(rooms[i], room)) {
				frustation++;
				flag = true;
				break;
			}
		}

		if (flag) continue;

		// we succeeded in finding a room

		rooms.push(room);
		frustation = 0;
		continue;
	}

	return rooms;
};

RoomManager.prototype.carve_rooms = function() {
	for (var i = 0; i < this.rooms.length; i++) {
		var room = this.rooms[i];
		for (var x = room.x, xmax = room.x + room.width; x < xmax; x++) {
			for (var y = room.y, ymax = room.y + room.height; y < ymax; y++) {
				this.tilearray[x][y] = 0;
				this.tilearray_metadata[x][y] = 1;
			}
		}
	}
};

// deprecated
/*
RoomManager.prototype.find_edges = function() {
	for (var i = 0; i < rooms.length; i++) {
		for (var j = 0; j < rooms.length; j++) {
			if (i != j && sketchy_room_distance(rooms[i], rooms[j]) < ROOM_DISTANCE_THRESHOLD) {
				this.edges.push({first: i, second: j});
			} 
		}
	}
};
*/

// the number of adjacent spaces that are 1s
// doesn't add 1 for 
RoomManager.prototype.num_adjacent_spaces = function(x, y) {
	return (y + 1 < GAME_HEIGHT && this.tilearray[x][y + 1]) + 
	(y > 0 && this.tilearray[x][y - 1]) + 
	(x + 1 < GAME_WIDTH && this.tilearray[x + 1][y]) + 
	(x > 0 && this.tilearray[x - 1][y]);
};


RoomManager.prototype.can_carve_edge = function(x, y) {
	// basically, we can carve an edge iff there is only max 1 open space 
	// next to the cell, from the previous edge cell
	return (this.num_adjacent_spaces(x, y) > 2) && !this.adjacent_to_wall(x, y);
};

RoomManager.prototype.adjacent_to_wall = function(x, y) {
	// each clause individually checks whether we're too close to a wall
	return ((y + 1 < GAME_HEIGHT && this.tilearray_metadata[x][y + 1] == 1) ||
	(y > 0 && this.tilearray_metadata[x][y - 1] == 1) ||
	(x + 1 < GAME_WIDTH && this.tilearray_metadata[x + 1][y] == 1) ||
	(x > 0 && this.tilearray_metadata[x - 1][y] == 1));
};

RoomManager.prototype.carve_edges = function() {
	for (var x = 0; x < GAME_WIDTH; x += 2) {
		for (var y = 0; y < GAME_HEIGHT; y += 2) {
			if (this.tilearray[x][y] && this.can_carve_edge(x, y)) this.recursive_carve(x, y);
		}
	}
};

RoomManager.prototype.recursive_carve = function(x, y) {
	this.tilearray[x][y] = 0;
	this.tilearray_metadata[x][y] = 2;

	// there's a bias introduced here because of the order
	if (y + 1 < GAME_HEIGHT && this.tilearray[x][y + 1]) {
		if (this.can_carve_edge(x, y + 1)) this.recursive_carve(x, y + 1);
	}
	if (y > 0 && this.tilearray[x][y - 1]) {
		if (this.can_carve_edge(x, y - 1)) this.recursive_carve(x, y - 1);
	}
	if (x + 1 < GAME_WIDTH && this.tilearray[x + 1][y]) {
		if (this.can_carve_edge(x + 1, y)) this.recursive_carve(x + 1, y);
	}
	if (x > 0 && this.tilearray[x - 1][y]) {
		if (this.can_carve_edge(x - 1, y)) this.recursive_carve(x - 1, y);
	}
};

RoomManager.prototype.connect_spaces = function() {
	// let's believe in randomized functions
	for (var x = 0; x < GAME_WIDTH; x += 1) {
		for (var y = 0; y < GAME_HEIGHT; y += 1) {
			if (this.tilearray[x][y] && 
				Math.random() > CONNECT_SPACES_THRESHOLD && 
				this.adjacent_to_wall(x, y) && 
				this.num_adjacent_spaces(x,y) == 2) {
				this.tilearray[x][y] = 0;
			}
		}
	}
};;/*
	Unfortunately, the Phaser API is a little limited in what it can do,
	so I've extended a few of the objects here. Rationale is given
*/

/**
* Recalculate the faces on a single tile
*
* @method Phaser.Tilemap#calculateFaces
* @param {number} x - X position to get the tile from (given in tile units, not pixels)
* @param {number} y - Y position to get the tile from (given in tile units, not pixels)
* @param {number} layer - The index of the TilemapLayer to operate on.
*/

Phaser.Tilemap.prototype.recalculateTile = function(x, y, layer) {
	var tile = this.layers[layer].data[y][x];

	if (tile) {
	    above = this.getTileAbove(layer, x, y);
	    below = this.getTileBelow(layer, x, y);
	    left = this.getTileLeft(layer, x, y);
	    right = this.getTileRight(layer, x, y);

	    if (tile.collides && tile.index) // this is a hack - check how to make this real
	    {
	        tile.faceTop = true;
	        tile.faceBottom = true;
	        tile.faceLeft = true;
	        tile.faceRight = true;

	        // added this to make sure that it works as expected
	        tile.collideUp = true;
	        tile.collideDown = true;
	        tile.collideLeft = true;
	        tile.collideRight = true;
	    }
	    else {
	        tile.faceTop = false;
	        tile.faceBottom = false;
	        tile.faceLeft = false;
	        tile.faceRight = false;

	        // added this to make sure that it works as expected
	        tile.collideUp = false;
	        tile.collideDown = false;
	        tile.collideLeft = false;
	        tile.collideRight = false;
	    }

	    if (above && above.collides)
	    {
	        //  There is a tile above this one that also collides, so the top of this tile is no longer interesting
	        tile.faceTop = false;
	    }

	    if (below && below.collides)
	    {
	        //  There is a tile below this one that also collides, so the bottom of this tile is no longer interesting
	        tile.faceBottom = false;
	    }

	    if (left && left.collides)
	    {
	        //  There is a tile left this one that also collides, so the left of this tile is no longer interesting
	        tile.faceLeft = false;
	    }

	    if (right && right.collides)
	    {
	        //  There is a tile right this one that also collides, so the right of this tile is no longer interesting
	        tile.faceRight = false;
	    }
	}
};

/**
* Recalculate the faces on tiles in a specified area - useful if changing a lot of tiles in a specific area
*
* @method Phaser.Tilemap#calculateFaces
* @param {number} x - X position to get the tile from (given in tile units, not pixels)
* @param {number} y - Y position to get the tile from (given in tile units, not pixels)
* @param {number} [width] - The rendered width of the layer, should never be wider than Game.width. If not given it will be set to Game.width.
* @param {number} [height] - The rendered height of the layer, should never be wider than Game.height. If not given it will be set to Game.height.
* @param {number} layer - The index of the TilemapLayer to operate on.
*/

Phaser.Tilemap.prototype.recalculateArea = function(x, y, width, height, layer) {
	if (typeof width === 'undefined') { width = this.game.width; }
	if (typeof height === 'undefined') { height = this.game.height; }

	var fx = Math.min(x + width, this.game.width);
	var fy = Math.min(y + height, this.game.height);

	for (var i = x; i < fx; i++) {
		for (var j = y; j < fy; j++) {
			this.recalculateTile(i, j, layer);
		}
	}
};

/*
	This class is an extension on the Tilemap allowing for animated adding and clearing of tiles

*/

Phaser.Tilemap.prototype.queue = [];;/*
	Utility functions that should be kept separate from the rest of the code

	need to add this: https://github.com/jcd-as/nadion/blob/master/src/controls.js

*/

// crazy javascript global stuff
Number.prototype.clamp = function(min, max){
	return Math.max(Math.min(max - 1, this), min);
};	
/*
 Usage: number = (number + 5).clamp(0, 20);
 number increments by 5 but isn't allowed to go outside the bounds of [0, 20);
 (note that this a half-open interval)
*/

Number.prototype.in = function(min, max){
	return (this >= min && this <= max);
};
/*
 Usage: if (number.in(0, 20))
 returns true if the number is in the range [min, max], otherwise false
*/

// First, checks if it isn't implemented yet.
if (!String.prototype.format) {
	String.prototype.format = function() {
		var args = arguments;
		return this.replace(/{(\d+)}/g, function(match, number) { 
			return typeof args[number] != 'undefined' ? 
			args[number] : match;
		});
	};
}
/*
 Usage: "{0} is a goober, but {1} is a diamond in the {2}".format("Steven", "Jerry")
 will output "Steven is a goober, but Jerry is a diamond in the {2}"
 Note: arguments can be non strings, as long as they can be coerced via a .toString()
*/

// utility function for random generator
range = function(a, b) {
	return Math.floor((b - a) * Math.random() + a);
};

// since we need odd numbers so often, an *odd* number between a and b
odd_range = function(a, b) {
	return ((Math.floor((b - a) * Math.random() + a) / 2) >> 0) * 2 + 1;
};
