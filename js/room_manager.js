/*
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
var CONNECT_SPACES_THRESHOLD = 0.8

// utilities

// determine whether two rooms intersect, or are within 1 square of intersecting
var intersect_rooms = function(a, b) {
	// there's something wrong with this
	// returns whether the two rooms intersect
	return ((a.x < b.x + b.width + 3) && (a.x + a.width + 3 > b.x) && 
		(a.y < b.y + b.height + 3) && (a.y + a.height + 3 > b.y));
}

// determine whether a point is inside a room
var in_room = function(point, room) {
	return (point.x < room.x + room.width) && (point.x >= room.x) && 
		(point.y < room.y + room.height) && (point.y >= room.y);
}

// this is very sketchy
var sketchy_room_distance = function(a, b) {
	return Math.min(Math.abs(a.x - b.x) + Math.abs(a.y - b.y), 
		Math.abs(a.x + a.width - b.x - b.width) + Math.abs(a.y + a.height - b.y - b.height));
}

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
}


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
}

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
	return (y + 1 < GAME_HEIGHT && this.tilearray[x][y + 1])
	+ (y > 0 && this.tilearray[x][y - 1])
	+ (x + 1 < GAME_WIDTH && this.tilearray[x + 1][y])
	+ (x > 0 && this.tilearray[x - 1][y]);
}


RoomManager.prototype.can_carve_edge = function(x, y) {
	// basically, we can carve an edge iff there is only max 1 open space 
	// next to the cell, from the previous edge cell
	return (this.num_adjacent_spaces(x, y) > 2) && !this.adjacent_to_wall(x, y);
}

RoomManager.prototype.adjacent_to_wall = function(x, y) {
	// each clause individually checks whether we're too close to a wall
	return ((y + 1 < GAME_HEIGHT && this.tilearray_metadata[x][y + 1] == 1)
	|| (y > 0 && this.tilearray_metadata[x][y - 1] == 1)
	|| (x + 1 < GAME_WIDTH && this.tilearray_metadata[x + 1][y] == 1)
	|| (x > 0 && this.tilearray_metadata[x - 1][y] == 1));
}

RoomManager.prototype.carve_edges = function() {
	for (var x = 0; x < GAME_WIDTH; x += 2) {
		for (var y = 0; y < GAME_HEIGHT; y += 2) {
			if (this.tilearray[x][y] && this.can_carve_edge(x, y)) this.recursive_carve(x, y);
		}
	}
}

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
			if (this.tilearray[x][y] 
				&& Math.random() > CONNECT_SPACES_THRESHOLD 
				&& this.adjacent_to_wall(x, y) 
				&& this.num_adjacent_spaces(x,y) == 2) {
				this.tilearray[x][y] = 0;
			}
		}
	}
};

generate_dungeon = function(map, layer) {
	// to visualize this correctly:

	/* randgen[i][j] is the ith column, jth down
	|[ a ]|[ a ]|[ a ]|[ a ]|
	|[ b ]|[ b ]|[ b ]|[ b ]|
	|[ c ]|[ c ]|[ c ]|[ c ]|
	*/

	// first, create some rooms
	rooms = add_rooms(randgen);

	// seems to be a bottleneck
	


	for (var i = 0; i < GAME_WIDTH; i++) {
		for (var j = 0; j < GAME_HEIGHT; j++) {
			if (j == 0 || i == 0 || j == GAME_HEIGHT - 1 || i == GAME_WIDTH - 1) randgen[i][j] = 5;
			if (j < 10 && i < 10) randgen[i][j] = -1;
		}
	}

	return randgen;
}
