Player = function(game) {

	this.game = game;
	this.sprite = null;

	this.x_vel = 900;
	this.time = 0;
};

Player.prototype = {

	preload: function () {
		this.game.load.spritesheet('bullet', 'assets/bullet.png', 4, 4);
	},

	create: function () {
		this.sprite = game.add.sprite(16, player.sprite.body.position.x + (player.direction == "right" ? 16 : -16 ), 'bullet');
		game.physics.arcade.enable(this.sprite);
	    this.sprite.body.bounce.y = 0.5;
	    this.sprite.body.gravity.y = 200;
	    this.sprite.body.collideWorldBounds = true;
	    this.sprite.body.velocity.x = (player.direction == "right" ? 1 : -1 )*this.x_vel;
	    this.sprite.body.velocity.y = (Math.random() * 100) - 50;
	    this.time = 0;
	},

	update: function() {
		this.time++;
		if (this.time > 200){
			this.sprite.kill();

			if (this.sprite.group)
			{
			   this.sprite.group.remove(this.sprite);
			}
			else if (this.sprite.parent)
			{
			   this.sprite.parent.removeChild(this.sprite);
			}
		}
	}
};