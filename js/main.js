// crazy javascript global stuff
Number.prototype.clamp = function(min, max){
	return Math.max(Math.min(max, this), min)
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
GAME_WIDTH = 100; 
GAME_HEIGHT = 100;
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
	// create a group for the players
	players = game.add.group();

	// linked in level.js
	level = new Level(game);
    level.preload();

    // linked in player.js
    player1 = new Player(game);
    player1.preload();
}

function create() {
	game.world.setBounds(0, 0, GAME_WIDTH * TILE_WIDTH, GAME_HEIGHT * TILE_WIDTH);
	
	game.physics.startSystem(Phaser.Physics.ARCADE);

	level.create();
	// need access to these references so that players can access the level
	game.level = level;

    player1.create();
    player1.createCursors("arrow");
    game.player = player1;

    text1 = game.add.text(15, 30, "100", {
        font: "18px Arial",
        fill: "#ffffff",
        align: "center"
    });

    text1.tweening = false;
    text1.fixedToCamera = true;

    // players.add(player1.sprite);

    player1.manabar = new Phaser.Rectangle(0, 0, 250, 15);

    game.camera.follow(player1.sprite, Phaser.Camera.FOLLOW_TOPDOWN);
}


function update() {

	resetText = function(){
		var tween = game.add.tween(this.scale).to({x:1, y:1}, 100, Phaser.Easing.Linear.In);
		tween.start();
		this.tweening = false;
		this.fill = "white";
	}

	gameOver = function(winner){
		// #! refine this
		gameover = game.add.text(WIDTH/2, HEIGHT/2, "GAME OVER: " + winner + " Wins!", {
	        font: "45px Arial",
	        fill: "#ffffff",
	        align: "center"
	    });
	}

	stuck_arrow = function(obstacle, arrow) {
		console.log("arrow hit an obstacle");
		arrow.body.velocity = {x: 0, y: 0};
		arrow.lifetime = 4 * Phaser.Timer.SECOND;
	}

    //  Collide the player1 and the stars with the platforms
    game.physics.arcade.collide(players, level.layer);
    game.physics.arcade.collide(players, level.boxes);
    game.physics.arcade.collide(level.boxes, level.arrows, stuck_arrow);
    game.physics.arcade.collide(level.layer, level.arrows, stuck_arrow);
    // game.physics.arcade.overlap(players, level.arrows, playerHit, null, this);

    level.update();
    player1.update();	

    player1.manabar.width = player1.manatimer * 10;

    // this is pretty annoying, but we have to manually move 
    // the rectangle w.r.t the camera
    // this is jittery as hell we'll have to figure something out

    // player1.manabar.setTo(game.camera.x, game.camera.y, player1.manabar.width, player1.manabar.height);
}

function render(){
	game.debug.geom(player1.manabar, player1.manabarcolor);
}