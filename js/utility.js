/*
	Utility functions that should be kept separate from the rest of the code

*/

// crazy javascript global stuff
Number.prototype.clamp = function(min, max){
	return Math.max(Math.min(max - 1, this), min)
}	
/*
 Usage: number = (number + 5).clamp(0, 20);
 number increments by 5 but isn't allowed to go outside the bounds of [0, 20);
 (note that this a half-open interval)
*/

Number.prototype.in = function(min, max){
	return (this >= min && this <= max);
}
/*
 Usage: if (number.in(0, 20))
 returns true if the number is in the range [min, max], otherwise false
*/

// First, checks if it isn't implemented yet.
if (!String.prototype.format) {
	String.prototype.format = function() {
		var args = arguments;
		return this.replace(/{(\d+)}/g, function(match, number) { 
			return typeof args[number] != 'undefined'
			? args[number]
			: match
			;
		});
	};
}
/*
 Usage: "{0} is a goober, but {1} is a diamond in the {2}".format("Steven", "Jerry")
 will output "Steven is a goober, but Jerry is a diamond in the {2}"
 Note: arguments can be non strings, as long as they can be coerced via a .toString()
*/

// utility function for random generator
range = function(a, b) {
	return Math.floor((b - a) * Math.random() + a);
}

// since we need odd numbers so often, an *odd* number between a and b
odd_range = function(a, b) {
	return ((Math.floor((b - a) * Math.random() + a) / 2) >> 0) * 2 + 1;
}
