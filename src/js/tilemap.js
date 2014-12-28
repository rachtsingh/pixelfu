/*
	Unfortunately, the Phaser API is a little limited in what it can do,
	so I've extended a few of the objects here. Rationale is given
*/

/**
* Recalculate the faces on a single tile
*
* @method Phaser.Tilemap#calculateFaces
* @param {number} x - X position to get the tile from (given in tile units, not pixels)
* @param {number} y - Y position to get the tile from (given in tile units, not pixels)
* @param {number} layer - The index of the TilemapLayer to operate on.
*/

Phaser.Tilemap.prototype.recalculateTile = function(x, y, layer) {
	var tile = this.layers[layer].data[y][x];

	if (tile) {
	    above = this.getTileAbove(layer, x, y);
	    below = this.getTileBelow(layer, x, y);
	    left = this.getTileLeft(layer, x, y);
	    right = this.getTileRight(layer, x, y);

	    if (tile.collides && tile.index) // this is a hack - check how to make this real
	    {
	        tile.faceTop = true;
	        tile.faceBottom = true;
	        tile.faceLeft = true;
	        tile.faceRight = true;

	        // added this to make sure that it works as expected
	        tile.collideUp = true;
	        tile.collideDown = true;
	        tile.collideLeft = true;
	        tile.collideRight = true;
	    }
	    else {
	        tile.faceTop = false;
	        tile.faceBottom = false;
	        tile.faceLeft = false;
	        tile.faceRight = false;

	        // added this to make sure that it works as expected
	        tile.collideUp = false;
	        tile.collideDown = false;
	        tile.collideLeft = false;
	        tile.collideRight = false;
	    }

	    if (above && above.collides)
	    {
	        //  There is a tile above this one that also collides, so the top of this tile is no longer interesting
	        tile.faceTop = false;
	    }

	    if (below && below.collides)
	    {
	        //  There is a tile below this one that also collides, so the bottom of this tile is no longer interesting
	        tile.faceBottom = false;
	    }

	    if (left && left.collides)
	    {
	        //  There is a tile left this one that also collides, so the left of this tile is no longer interesting
	        tile.faceLeft = false;
	    }

	    if (right && right.collides)
	    {
	        //  There is a tile right this one that also collides, so the right of this tile is no longer interesting
	        tile.faceRight = false;
	    }

	    console.log(tile.faceRight, tile.faceTop, tile.faceLeft, tile.faceBottom);
	}
};

/**
* Recalculate the faces on tiles in a specified area - useful if changing a lot of tiles in a specific area
*
* @method Phaser.Tilemap#calculateFaces
* @param {number} x - X position to get the tile from (given in tile units, not pixels)
* @param {number} y - Y position to get the tile from (given in tile units, not pixels)
* @param {number} [width] - The rendered width of the layer, should never be wider than Game.width. If not given it will be set to Game.width.
* @param {number} [height] - The rendered height of the layer, should never be wider than Game.height. If not given it will be set to Game.height.
* @param {number} layer - The index of the TilemapLayer to operate on.
*/

Phaser.Tilemap.prototype.recalculateArea = function(x, y, width, height, layer) {
	if (typeof width === 'undefined') { width = this.game.width; }
	if (typeof height === 'undefined') { height = this.game.height; }

	var fx = Math.min(x + width, this.game.width);
	var fy = Math.min(y + height, this.game.height);

	for (var i = x; i < fx; i++) {
		for (var j = y; j < fy; j++) {
			this.recalculateTile(i, j, layer);
		}
	}
};

/*
	This class is an extension on the Tilemap allowing for animated adding and clearing of tiles

*/

Phaser.Tilemap.prototype.queue = [];