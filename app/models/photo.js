// app/models/photo.js
// load the things we need
var mongoose = require('mongoose');

// define the schema for our photo model
var photoSchema = mongoose.Schema({

	name : String,
	productId : String,
	is_default : Number,
	category : String,
	image : String,
	thumbnail : String,
	
});

// for active virtual id field
photoSchema.set('toJSON', { getters: true });


module.exports = mongoose.model('photo', photoSchema);