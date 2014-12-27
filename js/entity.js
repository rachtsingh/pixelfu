/**
* Creates a new Entity
*
* Entities can be simple or complicated, such as patrolling enemies 
* or powerups. Grouping them together like this helps allow complex AI
* behavior - such as guarding items or flocking
*
*
* Entity
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

function Entity(game, image, x, y, type, description, physics, physicsConfig, importance, actor) {
	this.game = game;

	this.sprite = game.add.sprite(TILE_WIDTH * x, TILE_WIDTH * y, image); 
	this.type = type;
	this.description = description; // could be overwritten

	if (physics) {
		game.physics.arcade.enable(this.sprite);

		// dangerous, but I'm assuming you're not being dumb
		for (key in physicsConfig) {
			this.sprite.body[key] = physicsConfig[key];
		}
	}

	this.update = function() {
		// do nothing
	};
}

/* 
	A collection of 'useful' objects
	Gold, Potions, Scrolls
*/

function Gold(game, x, y, amount) {
	this.base = Entity;
	// tweak how importance is calculated to give good AI
	this.base(game, "gold", x, y, "gold", "A glittering pile of dubloons\n{0} GP".format(amount), false, null, amount/100);
	this.amount = amount;
}
Gold.prototype = new Entity;

function Scroll(game, x, y, effect) {
	// Here we must be careful - effect is an object with variable attributes, but
	// we must guarantee that one of the attributes is named description
	this.base = Entity;
	// figure out how to calculate the value of a scroll
	this.base(game, "scroll", x, y, "scroll", effect.description, false, null, 0);
	this.effect = effect;
}
Scroll.prototype = new Entity;

function Potion(game, x, y, HP) {
	this.base = Entity;
	// again tweak
	this.base(game, "potion", x, y, "potion", "A gleaming green potion that looks delicious\n{0} HP".format(HP), false, null, HP);
	this.HP = HP;
}
Potion.prototype = new Entity;

function Crate(game, x, y, value) {
	this.base = Entity;
	// maybe make the importance random/0? Since the AI shouldn't be able to tell
	this.base(game, "crate", x, y, "potion", "A crate\nWho knows what mysteries lie inside?", true, {mass: 100}, value*10);
	// the value gives the importance of the object inside
	this.value = value;
}
Crate.prototype = new Entity;

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
	this.base(game, image, x, y, type, true, physicsConfig, sentience * 100);
	
	this.sentience = sentience;
	this.greediness = greediness;
	this.slowdown = slowdown;

	// variable used to calculate whether to step
	this.stepcountdown = 0;
	this.calculatetimer = 0;

	this.direction = 0; // same system, 0 - 3 based on standard rotation

	this.update = function() {
		/*
			Though this is entirely up to debate, I'm currently implementing
			actor movement as a sort of turn based discrete movement
			- while the player is moving in realtime
		*/

		this.stepcountdown++;
		this.calculatetimer++;

		// make decisions before moving
		if (this.calculatetimer >= this.sentience) {
			this.think();
		}

		if (this.stepcountdown >= this.slowdown) {
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

	this.think = function (argument) {
		// fill in via children
	};

	this.meets_action_condition = function(){
		return false; // obviously override
	};

	this.act = function() {
		// fill in
	}
}

Actor.prototype = new Entity;
