// crazy javascript global stuff
Number.prototype.clamp = function(min, max){
	return Math.max(Math.min(max - 1, this), min)
}
/*
 Usage: number = (number + 5).clamp(0, 20);
 number increments by 5 but isn't allowed to go outside the bounds of [0, 20];

*/

Number.prototype.in = function(min, max){
	return (this >= min && this <= max);
}
/*
 Usage: if (number.in(0, 20))
 returns true if the number is in the range ([]), otherwise false

*/

// the overall size of the game will be 40x40 tiles, or 640x640
TILE_WIDTH = 16; // in pixels
GAME_WIDTH = 101; // MUST BE ODD!
GAME_HEIGHT = 101; // MUST BE ODD!
CAMERA_WIDTH = 25;
CAMERA_HEIGHT = 25;

// the values that are actually used by Phaser
WIDTH = TILE_WIDTH * CAMERA_WIDTH; 
HEIGHT = TILE_WIDTH * CAMERA_HEIGHT;

AI = false; // not being used right now

// player defaults
MOVEDURATION = 60; // experiment

// 

// set up the game object - width and height here are of the canvas/WebGL object
var game = new Phaser.Game(WIDTH, HEIGHT, Phaser.AUTO, '', { preload: preload, create: create, update: update, render: render });

// The order of the functions being called is:
// preload() -> create() -> update() -v, so it loops at update()
//                             ^------

function preload() {
    im = new IndicatorManager(game);
    game.im = im;

	// linked in level.js
	level = new Level(game);
    level.preload();
	game.level = level;

    // linked in player.js
    player = new Player(game);
    player.preload();
    game.player = player;

    players = game.add.group();
}

function create() {
	game.world.setBounds(0, 0, GAME_WIDTH * TILE_WIDTH, GAME_HEIGHT * TILE_WIDTH);
	
	game.physics.startSystem(Phaser.Physics.ARCADE);

	level.create();
	player.create();
    players.add(player.sprite);
	
    game.camera.follow(player.sprite, Phaser.Camera.FOLLOW_TOPDOWN);

    // if you need to debug the FPS
    // game.time.advancedTiming = true;	
}


function update() {

	resetText = function(){
		var tween = game.add.tween(this.scale).to({x:1, y:1}, 100, Phaser.Easing.Linear.In);
		tween.start();
		this.tweening = false;
		this.fill = "white";
	}

	gameOver = function(winner){
		// #! refine this, this is garbage
		gameover = game.add.text(WIDTH/2, HEIGHT/2, "GAME OVER: " + winner + " Wins!", {
	        font: "45px Arial",
	        fill: "#ffffff",
	        align: "center"
	    });
	};

	stuck_arrow = function(arrow, obstacle) {
		console.log(obstacle);
		// console.log("arrow hit an obstacle");
		arrow.body.velocity = {x: 0, y: 0};
		// console.log(arrow);
		arrow.lifespan = 4 * Phaser.Timer.SECOND;
		level.map.recalculateTile(obstacle.x, obstacle.y, 0);
		console.log(obstacle);
	};

	hit_wall = function(sprite, obstacle) {
		console.log(sprite, obstacle);
	}

    level.update();
    player.update();
    im.update();

    //  Collide objects
    game.physics.arcade.collide(level.layer, level.baddie);
    game.physics.arcade.collide(level.layer, level.arrows, stuck_arrow);
    game.physics.arcade.collide(level.baddie, level.arrows);

    game.physics.arcade.collide(level.layer, player.sprite, hit_wall);
    game.physics.arcade.collide(level.layer, players); // ok weird, this works but the above line is useless
}

function render(){
	// debug the last fired arrow
	// game.debug.body(level.main_arrow);

	// debug the frames per second
	// game.debug.text(game.time.fps || '--', 2, 14, "#00ff00");   

	// not sure if this goes here
}