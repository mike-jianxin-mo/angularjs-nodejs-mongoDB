// app/models/site.js
// load the things we need
var mongoose = require('mongoose');

// define the schema for our site model
var siteSchema = mongoose.Schema({
	name : String,
	email: String,
	phone: String,
	contact_person: String,
	address: String,
	state : String,
	lon : String,
	lat : String,
	crdate: Date,
	owner: String,

	sections: String,
	products: String,
	photos: String,
	
});

// to solve the id problem, you should set the following, according to the https://github.com/learnboost/mongoose/issues/1137
// and http://mongoosejs.com/docs/guide.html#id virtual field
siteSchema.set('toJSON', { getters: true });

// add virtual fields 
/*
siteSchema.virtual('sections').get(function(){
	return this.sections;
});
*/
/*
siteSchema.virtual('sections').set(function(url){
	this.sections = url;
});
*/

module.exports = mongoose.model('Site', siteSchema);