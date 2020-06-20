var mongoose = require('mongoose');

// schema setup
var campgroundSchema = new mongoose.Schema({
    name: String,
    image: String,
    description: String,
	// Object References - Referencing data
	comments: [
		{
			type: mongoose.Schema.Types.ObjectID,
			ref: 'Comment'
		}
	]
});

module.exports = mongoose.model('Campground', campgroundSchema);