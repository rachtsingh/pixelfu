Player = function(game) {
	this.game = game;
	this.sprite = {};
	this.cursors = null;

	// in case we need it
	this.arrows = [];

	// variables
	this.direction = 0; // should be 0 - 3, +x, +y, -x, -y
	this.manatimer = 25;
	this.arrowtimer = 0;

	this.acceptInput = true;
	this.moveTimer = this.game.time.time;

	// random constants
	this.manabarcolor = "#ffffff";
	this.manacost = 15;
	
	this.arrow_gen_time = 25;
};

Player.prototype = {

	preload: function () {
		this.game.load.spritesheet('dude', 'assets/cube.png', 32, 32);
		this.game.load.image('box', 'assets/box.png');
	},

	create: function () {
		this.sprite = game.add.sprite(game.world.width/2, game.world.height/2, 'box');
		
		game.physics.arcade.enable(this.sprite);
	    
	    this.sprite.body.bounce.y = 0.0;
	    this.sprite.body.bounce.x = 0.0;
	    this.sprite.body.gravity.y = 0;

	    this.sprite.body.collideWorldBounds = true;

	    //  Our two animations, walking left and right.
	    // this.sprite.animations.add('left', [0, 1, 2, 3], 10, true);
	    // this.sprite.animations.add('right', [5, 6, 7, 8], 10, true);
	    // this.sprite.animations.add('jump', [9, 10, 11], 10, true);

	    this.cursors = {};
	    this.sprite.health = 100;
	    this.sprite.type = "player";
	},

	createCursors: function(){
		this.cursors = this.game.input.keyboard.createCursorKeys();
		this.space = game.input.keyboard.addKey(Phaser.Keyboard.SPACEBAR);
		this.shift = game.input.keyboard.addKey(Phaser.Keyboard.SHIFT);
	},

	update: function() {
		if (this.acceptInput) {
	        if (this.cursors.left.isDown) {
	            this.acceptInput = false;
	            this.moveTimer = this.game.time.time;
	            this.sprite.body.position.x -= TILE_WIDTH;
	            this.direction = 2;
	        } else if (this.cursors.right.isDown) {
	            this.acceptInput = false;
	            this.moveTimer = this.game.time.time;
	            this.sprite.body.position.x += TILE_WIDTH;
	            this.direction = 0;
	        } else if (this.cursors.up.isDown) {
	            this.acceptInput = false;
	            this.moveTimer = this.game.time.time;
	            this.sprite.body.position.y -= TILE_WIDTH;
	            this.direction = 1;
	        } else if (this.cursors.down.isDown) {
	            this.moveTimer = this.game.time.time;
	            this.acceptInput = false;
	            this.sprite.body.position.y += TILE_WIDTH;
	            this.direction = 3;
	        }
	    }
	    else 
	    {
	        if (this.game.time.time > this.moveTimer + MOVEDURATION) { 
	        	this.acceptInput = true; 
	        }
	    }

	    // make this editable constants
	    if (this.shift.isDown && this.manatimer > 15){
	    	this.manatimer = (this.manatimer - this.manacost).clamp(0, 25);
	    	this.doMagic();
	    }
	    else {
	    	this.manatimer = (this.manatimer + 0.05).clamp(0, 25);
	    }

	    if (this.manatimer.in(0, this.manacost-0.1)) this.manabarcolor = "FF0000";
	    else this.manabarcolor = "FFFFFF";

	    if (this.space.isDown && this.arrowtimer > this.arrow_gen_time) {
	    	this.fireArrow();
	    	this.arrowtimer = 0;
	    }
	    else {
	    	this.arrowtimer++;
	    }
	},

	doMagic: function(){
		console.log("did magic");	// figure out something here
	},

	fireArrow: function(){
		var position = this.sprite.body.position;
		var velocity = 250; // work with this constant
		var type = "arrow"; // arrow variants coming later
		var direction = this.direction;
		
		this.arrows.push(this.game.level.fireArrow(position, direction, velocity, type));
	}

};

