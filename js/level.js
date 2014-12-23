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
		this.game.load.image('arrow', 'assets/arrow.png')
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
		generate_dungeon(this.map, this.layer);

		this.map.setCollisionBetween(1, 108, true, this.layer. true);

		this.baddie = game.add.sprite(TILE_WIDTH*3, TILE_WIDTH*3, 'baddie');
		game.physics.arcade.enable(this.baddie);

		this.baddie.body.mass = 100;

		// this.map.setTileIndexCallback(4, bounce, this);

		this.layer.dirty = true;

		this.arrows = game.add.group();
		this.arrows.enableBody = true;

		this.boxes = game.add.group();
		this.boxes.enableBody = true;

		// just to access the space button
		this.space = game.input.keyboard.addKey(Phaser.Keyboard.SPACEBAR);
		this.ctrl = game.input.keyboard.addKey(Phaser.Keyboard.SHIFT);

	},

	update: function() {
		// override updates - note that things in the physics scheme automaticall update
	},

	fireArrow: function(position, direction, velocity, type) {
		arrow = this.arrows.create(position.x, position.y, type);
		arrow.anchor.set(0.5, 0.5);

		arrow.type = "arrow";

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
				arrow.angle = 270;
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
				arrow.angle = 90;
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

/*
	The following is code for randomly generating the map
	the goal is to use it to randomly generate new squares of the map as the player explores, 
	but currently we're using a fixed size world 

	the code is based on this, but modified:
	https://github.com/munificent/hauberk/blob/db360d9efa714efb6d937c31953ef849c7394a39/lib/src/content/dungeon.dart
*/

// utility function for random generator
range = function(a, b) {
	return Math.floor((b - a) * Math.random() + a);
}

// since we need odd numbers so often, an *odd* number between a and b
odd_range = function(a, b) {
	return (Math.floor((b - a) * Math.random() + a) / 2) * 2 + 1;
}

generate_dungeon = function(map, layer) {
	// to visualize this correctly:

	/* randgen[i][j] is the ith column, jth down
	|[ a ]|[ a ]|[ a ]|[ a ]|
	|[ b ]|[ b ]|[ b ]|[ b ]|
	|[ c ]|[ c ]|[ c ]|[ c ]|
	*/

	var randgen = new Array(GAME_WIDTH);

	// for (var i = 0; i < GAME_WIDTH; i++) {
	// 	randgen[i] = new Array(GAME_HEIGHT);
	// 	for (var j = 0; j < GAME_HEIGHT; j++) {
	// 		randgen[i][j] = 1; // so we have to carve out of it
	// 	}
	// }
	map.fill(1, 0, 0, GAME_WIDTH, GAME_HEIGHT, layer);

	/*
	0 - default = space
	1 - wall
	2 - door? 
	*/


	// first, create some rooms
	rooms = add_rooms(randgen);

	// seems to be a bottleneck
	for (var i = 0; i < rooms.length; i++) {
		var room = rooms[i];
		map.fill(0, room.x, room.y, room.width, room.height, layer);
	}

	// then, use a maze growing algorithm to fill in the rest of the spaces
	// for (var x = 1; x < GAME_WIDTH; x += 2) {
	// 	for (var y = 1; y < GAME_HEIGHT; y += 2) {
	// 		if (randgen[x][y] != 0) continue;
	// 		grow_maze(x, y);
	// 	}
	// }

	// connect_regions(randgen);

	// remove_dead_ends(randgen);

	// postprocessing to make this reasonable
	map.fill(4, 0, 0, GAME_WIDTH, 1, layer);
	map.fill(4, 0, 0, 1, GAME_HEIGHT, layer);
	map.fill(4, 0, GAME_HEIGHT-1, GAME_WIDTH, 1, layer);
	map.fill(4, GAME_WIDTH - 1, 0, 1, GAME_HEIGHT, layer);

	map.fill(0, 0, 0, 10, 10, layer);
}

intersect_rooms = function(a, b) {
	// there's something wrong with this
	// returns whether the two rooms intersect
	return ((a.x <= b.x + b.width) && (a.x + a.width >= b.x) && (a.y <= b.y + b.height) && (a.y + a.height >= b.y));
}

add_rooms = function(randgen) {
	// this is different from the one linked above, I think (I haven't read that)

	// constants
	var MIN_SIZE = 3;
	var MAX_SIZE = 10;
	var FRUSTRATION_MAX = 15;

	var rooms = [];

	// number of times we've tried to add a new room and failed
	frustration = 0;
	it = 0;

	while (frustration < FRUSTRATION_MAX && it < 100) {
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

		for (var i = 0; i < rooms.length; i++) {
			if (intersect_rooms(rooms[i], room)) {
				frustation++;
				continue;
			}
		}

		// we succeeded in finding a room

		rooms.push(room);
		frustation = 0;
		continue;
	}

	// debug(randgen);

	return rooms;
}

debug = function(randgen) {
	// print out the generated maze into the debug console

	// here's the issue - I need to build it line by line
	for (var y = 0; y < GAME_HEIGHT; y++) {
		buffer = "";
		for (var x = 0; x < GAME_WIDTH; x++) {
			buffer += (randgen[x][y])
				.toString();
		}
		console.log(buffer);
	}

	return;
}

grow_maze = function(x, y) {

}