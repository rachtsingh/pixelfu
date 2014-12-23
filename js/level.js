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

	/* constants */
};

Level.prototype = {

	preload: function() {
		// this.game.load.tilemap('map', 'levels/Level 1 Updated.csv', null, Phaser.Tilemap.CSV);
		this.game.load.image('tiles', 'assets/tiles_new2.png');
		this.game.load.image('bullet', 'assets/bullet.png');
		this.game.load.image('specialbullet', 'assets/specialbullet.png');
		this.game.load.image('arrow', 'assets/arrow.png')
	},

	create: function() {

		// do magic!
		var randgen = generate_dungeon();

		// commented code left here for posterity
		// blow = function(sprite, tile) {
		// 	if (sprite.type != "bullet"){
		// 		return;
		// 	}
		// 	if (this.redtimer < 30){
		// 		return;
		// 	}
		// 	for(var i = 0; i < this.redbullets; i++){
		// 		var angle = 2*Math.PI*i/this.redbullets;
		// 		var ghostbullet = this.fireBullet({x: sprite.position.x + 0 /*+ 5*Math.cos(angle)*/, y: sprite.position.y + 0 /*+ 5*Math.sin(angle)*/}, {x: 200*Math.cos(angle), y:200*Math.sin(angle)}, 'specialbullet');
		// 		ghostbullet.type = "ghostbullet";
		// 	}
		// 	if (sprite.type == "bullet"){
		// 		sprite.kill();
		// 	}
		// 	this.redtimer = 0;
		// }

		// this.map = this.game.add.tilemap('map', 16, 16);
		this.map = new Phaser.Tilemap(this.game, null, 40, 40, 16, 16);
		this.map.addTilesetImage('tiles');
		this.map.setCollisionBetween(1, 108);

		// keeping around for example
		// this.map.setTileIndexCallback(4, bounce, this);

		this.layer = this.map.createLayer(0);
		// this.layer.resizeWorld(); // this is an override, not necessary

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

		// slow down the arrow's speed exponentially until it hits steady state
		for (var i = 0; i < this.arrows.length; i++) {
			var arrow = this.arrows[i];
		}
	},

	fireArrow: function(position, direction, velocity, type) {
		arrow = this.arrows.create(position.x, position.y, type);
		arrow.type = "arrow";

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
				break;
			case 1:
				arrow.direction = {
					x: 0,
					y: -1
				};
				arrow.angle = 270;
				break;
			case 2:
				arrow.direction = {
					x: -1,
					y: 0
				};
				arrow.angle = 180;
				arrow.body.position.y += TILE_WIDTH;
				break;
			case 3:
				arrow.direction = {
					x: 0,
					y: 1
				};
				arrow.angle = 90;
				arrow.body.position.x += TILE_WIDTH;
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
		arrow.metadata = {};
		arrow.metadata.speed = velocity; // again

		// return a reference so that the player object can keep track of its arrows;
		return arrow;
	}

	// again code left here for reference
	// fireBullet: function(position, velocity, type){
	// 	bullet = this.bullets.create(position.x, position.y, type);
	// 	bullet.type = "bullet";
	// 	bullet.body.bounce.x = 0.7;
	// 	bullet.body.bounce.y = 0.2;
	//     bullet.body.gravity.y = (1-Math.random())*20;
	//     bullet.body.mass = 10;
	//     bullet.body.collideWorldBounds = true;
	//     bullet.lifespan = 4 * Phaser.Timer.SECOND;
	//     bullet.body.velocity = velocity;
	//     return bullet;
	// }

};

// utility function for random generator
range = function(a, b) {
	return Math.floor((b - a) * Math.random() + a);
}

generate_dungeon = function() {
	// this is a standalone function that I'll experiment with
	// a good deal of this is from here:
	// https://github.com/munificent/hauberk/blob/db360d9efa714efb6d937c31953ef849c7394a39/lib/src/content/dungeon.dart

	// to visualize this correctly:

	/* randgen[i][j] is the ith column, jth down
	|[ a ]|[ a ]|[ a ]|[ a ]|
	|[ b ]|[ b ]|[ b ]|[ b ]|
	|[ c ]|[ c ]|[ c ]|[ c ]|
	*/

	var randgen = new Array(GAME_WIDTH);

	for (var i = 0; i < GAME_WIDTH; i++) {
		randgen[i] = new Array(GAME_HEIGHT);
		for (var j = 0; j < GAME_HEIGHT; j++) {
			randgen[i][j] = 0;
		}
	}

	/*
	0 - default = wall
	1 - room space
	2 - wall space
	3 - door
	*/


	// first, create some rooms
	add_rooms(randgen);

	// then, use a maze growing algorithm to fill in the rest of the spaces
	for (var x = 1; x < GAME_WIDTH; x += 2) {
		for (var y = 1; y < GAME_HEIGHT; y += 2) {
			if (randgen[x][y] != 0) continue;
			grow_maze(x, y);
		}
	}

	connect_regions(randgen);

	remove_dead_ends(randgen);

	return randgen;
}

intersect_rooms = function(a, b) {
	// there's something wrong with this
	// returns whether the two rooms intersect
	return (a.x < b.x + b.width && a.x + a.width > b.x && a.y < b.y + b.height && a.y + a.height > b.y);
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
		var width = range(MIN_SIZE, MAX_SIZE);
		var height = range(MIN_SIZE, MAX_SIZE);

		var room = {
			x: range(0, GAME_WIDTH - width),
			y: range(0, GAME_HEIGHT - height),
			width: width,
			height: height
		};

		for (var i = 0; i < rooms.length; i++) {
			if (intersect_rooms(rooms[i], room)) {
				frustation++;
				console.log("COULDN'T FIND A ROOM");
				continue;
			}
		}

		// we succeeded in finding a room

		rooms.push(room);
		console.log("FOUND A ROOM");
		frustation = 0;
		continue;
	}

	console.log(rooms);

	for (var i = 0; i < rooms.length; i++) {
		var room = rooms[i];
		for (var x = room.x; x < room.x + room.width; x++) {
			for (var y = room.y; y < room.y + room.height; y++) {
				randgen[x][y] = 1;
			}
		}
	}

	debug(randgen);

	return;
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