// delineate the constants for closure compiler (for later)
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
};

Player.prototype = {

	preload: function () {
		// this.game.load.spritesheet('dude', 'assets/cube.png', 32, 32);
		this.game.load.image('box', 'assets/box.png');
	},

	create: function () {
		this.sprite = game.add.sprite(0, 0, 'box');
		
		game.physics.arcade.enable(this.sprite);
	    
	    this.sprite.body.collideWorldBounds = true;
	    this.sprite.body.setSize(TILE_WIDTH * 0.8, TILE_WIDTH * 0.8);

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
		// access via this.game.im.values["health"] (kludgy I know)

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

		this.game.im.values["health"] = 100;

		for (var i = 0; i < NUM_BREADCRUMBS; i++) {
		    this.breadcrumbs.push(new Phaser.Point(this.sprite.body.position.x, this.sprite.body.position.y));
		}
	},

	update: function() {

        if (this.cursors.left.isDown) {
            this.sprite.body.position.x -= this.speed;
            this.direction = 2;
        } else if (this.cursors.right.isDown) {
            this.sprite.body.position.x += this.speed;
            this.direction = 0;
        } else if (this.cursors.up.isDown) {
            this.sprite.body.position.y -= this.speed;
            this.direction = 1;
        } else if (this.cursors.down.isDown) {
            this.sprite.body.position.y += this.speed;
            this.direction = 3;
        }

	    // handle mana charging and firing
	    if (this.shift.isDown){
	    	this.charging = true;
	    	this.game.im.values["mana"] = (this.game.im.values["mana"] + 1).clamp(MANA_MIN, MANA_MAX);
	    }
	    else {
		    if (this.manatimer > this.mana_gen_time && this.charging && this.game.im.values["mana"] > MANA_THRESHOLD) {
		    	// fire the arrow
		    	this.castMagic((this.game.im.values["mana"]/ 2) | 0);
		    	this.manatimer = 0;
		    }
		    else {
		    	this.manatimer++;
		    }
		    // this feels expensive
	    	this.charging = false;
	    	this.game.im.values["mana"] = 0;
	    } 

	    // handle the arrow nocking and firing
	    if (this.space.isDown){
	    	this.nocked = true;
	    	this.game.im.values["draw"] = (this.game.im.values["draw"] + 1).clamp(DRAW_MIN, DRAW_MAX);
	    }
	    else {
		    if (this.arrowtimer > this.arrow_gen_time && this.nocked && this.game.im.values["draw"] > DRAW_THRESHOLD) {
		    	// fire the arrow, only if there's a sufficient draw
		    	this.fireArrow(this.game.im.values["draw"] * 15);
		    	this.arrowtimer = 0;		    		
		    }
		    else {
		    	this.arrowtimer++;
		    }
		    // this feels expensive
	    	this.nocked = false;
	    	this.game.im.values["draw"] = 0; 
	    } 

	    // now handle updating the breadcrumb positions
	    if (!(this.game.frames % BREADCRUMB_FRAMES)) {
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

		var startx = Math.floor((tilex - (strength/2)).clamp(0, GAME_WIDTH));
		var starty = Math.floor((tiley - (strength/2)).clamp(0, GAME_HEIGHT))

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

