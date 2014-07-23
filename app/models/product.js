// app/models/product.js
// load the things we need
var mongoose = require('mongoose');

// define the schema for our product model
var productSchema = mongoose.Schema({

	name : String,
	desc : String,
	code : String,
	category : String,
	form : String,
	ingredients : String,
	siteId : String,
	order : Number,
	
});

// for active virtual id field
productSchema.set('toJSON', { getters: true });


module.exports = mongoose.model('Product', productSchema);