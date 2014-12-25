// delineate the constants for closure compiler (for later)
DRAW_MIN = 8;
DRAW_MAX = 57;

MANA_MIN = 0;
MANA_MAX = 10;

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
	this.arrow_gen_time = 25;
	this.mana_gen_time = 50;
	this.speed = TILE_WIDTH / 10;
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
			color: 0x3571C5, // for lack of a better color
			name: "Mana"
		});

		this.game.im.values["health"] = 100;

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

	    // make this editable constants
	    // if (this.shift.isDown && this.manatimer > 15){
	    // 	this.manatimer = (this.manatimer - this.manacost).clamp(0, 25);
	    // 	this.doMagic();
	    // }
	    // else {
	    // 	this.manatimer = (this.manatimer + 0.05).clamp(0, 25);
	    // }

	    // if (this.manatimer.in(0, this.manacost-0.1)) this.manabarcolor = "FF0000";
	    // else this.manabarcolor = "FFFFFF";

	    // handle mana charging and firing
	    if (this.shift.isDown){
	    	this.charging = true;
	    	this.game.im.values["mana"] = (this.game.im.values["mana"] + 1).clamp(MANA_MIN, MANA_MAX);
	    }
	    else {
		    if (this.manatimer > this.mana_gen_time && this.charging) {
		    	// fire the arrow
		    	this.castMagic(this.game.im.values["mana"]);
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
		    if (this.arrowtimer > this.arrow_gen_time && this.nocked) {
		    	// fire the arrow
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
	},

	castMagic: function(strength){
		// make strength even
		strength = strength - strength % 2;
		console.log("did magic: ", strength); // for debugging
		var tilemapref = this.game.level.map.layers[0].data;

		// what this will do is destroy the blocks around the player
		var tilex = Math.floor(this.sprite.body.position.x / TILE_WIDTH);
		var tiley = Math.floor(this.sprite.body.position.y / TILE_WIDTH);

		for (var i = Math.floor((tilex - (strength/2)).clamp(0, GAME_WIDTH)), fi = Math.floor((tilex + (strength/2)).clamp(0, GAME_WIDTH)); i < fi; i++) {
			for (var j = Math.floor((tiley - (strength/2)).clamp(0, GAME_HEIGHT)), fj = Math.floor((tiley + (strength/2)).clamp(0, GAME_HEIGHT)); j < fj; j++) {
				console.log(i, j)
				tilemapref[j][i].index = -1;
			}
		}

		// trigger a call to calculate faces
		this.game.level.map.removeTile(tilex, tiley, 0);

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

