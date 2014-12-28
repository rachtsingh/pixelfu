pixelfu
=======

A small 2D roguelike with dynamically generated dungeons - an experiment in procedurally generated games

### Demo
Go to [https://simplydragons.github.io/pixelfu](https://simplydragons.github.io/pixelfu)

### How to install
- Git clone the repository `git clone git@github.com:simplydragons/pixelfu.git`
- Go to the folder `cd pixelfu`
- Start a server (e.g. `python -m SimpleHTTPServer`)
- Go to `localhost:8000` in your browser

### How to play
Things are progressing a little! To move around, use the arrow keys. To draw and arrow, press and hold space. To cast magic, press and hold shift.

### How to contribute
The organization is starting to shape up slowly, but currently all the files are just in `src/js/`. There you can find, for example, in `player.js` the code that manages the player. The interesting stuff is mostly in `room_manager.js` and `entity.js`.

### todo
- finish HUD
- create a menu system
- create a randomly generating item system
- actor-intent system for AI (talk to me/Charles)
- package in format for CocoonJS or Crosswalk -> $$? 