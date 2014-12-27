/*
	Room System

	The Room System (RS) is the system that manages the randomly generated,
	dynamically moving room system.

	This change also removes the dungeon generation code from level.js

	The RS is tied to the RoomManager, which is a one-off object that holds all the rooms and metadata about the rooms
*/


/*
	Some thoughts - given that generating the rooms and setting everything up might take a long time
	it might be a good idea to have a loading indicator while this is running. Phaser
	has support for something called game state, which should help here


*/

function RoomManager(game) {
	this.game = game;
	this.rooms = [];

}