Level = function(game) {
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
		this.game.load.image('bullet', 'assets/bullet.png');
		this.game.load.image('specialbullet', 'assets/specialbullet.png');
		this.game.load.image('lrarrow', 'assets/lrarrow.png'); // a left-right arrow
		this.game.load.image('udarrow', 'assets/udarrow.png'); // an up-down arrow
		this.game.load.image('tiles', 'assets/tiles.png');
		this.game.load.image('baddie', 'assets/space-baddie.png');
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
		
		for (var x = 0; x < GAME_WIDTH; x++) {
			for (var y = 0; y < GAME_HEIGHT; y++) {
				this.map.layers[0].data[x][y].index = this.game.rm.tilearray[x][y];
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
};