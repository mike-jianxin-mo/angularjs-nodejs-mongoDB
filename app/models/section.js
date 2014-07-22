// app/models/section.js
// load the things we need
var mongoose = require('mongoose');

// define the schema for our section model
var sectionSchema = mongoose.Schema({
	name : String,
	content: String,
	type: String,
	state : String,
	siteId : String,	
});

sectionSchema.set('toJSON', { getters: true });


module.exports = mongoose.model('Section', sectionSchema);