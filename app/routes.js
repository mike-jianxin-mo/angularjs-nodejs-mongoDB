// app/routes.js
var urlConfig= require('./urlConfig');
var Site     = require('./models/site');
var Section  = require('./models/section');
var Product  = require('./models/product');
var Photo    = require('./models/photo');

module.exports = function(app, passport) {

	// =====================================
	// HOME PAGE (with login links) ========
	// =====================================
	app.get('/home', function(req, res) {
		res.json({message: 'show home page'}); // load the index.ejs file
	});

	// =====================================
	// LOGIN ===============================
	// =====================================
	// show the login form
	app.get('/login', function(req, res) {

		// json the page and pass in any flash data if it exists
		res.json({ message: req.flash('loginMessage'), code: '401' });
	});

	// process the login form
	app.post('/api/login', function(req, res, next) {
		passport.authenticate('local-login', 
			function(err, user, info){
				console.log(err, user, info);
				
				if (err) { return next(err); }
					if (!user) { return res.json({code: '401', message: info }); }

				req.logIn(user, function(err) {
					if (err) { return next(err); }
					return res.json({code: '200', 
									message: 'login successful', 
									username: user.local.email, 
									id: user._id,
									sites: urlConfig.SITES_URL + user._id});	
				});
				
			}
		)(req, res, next);
	});

	// =====================================
	// SIGNUP ==============================
	// =====================================
	// show the signup form
	app.get('/signup', function(req, res) {

		// json the page and pass in any flash data if it exists
		res.json({ message: req.flash('signupMessage') });
	});

	// process the signup form
	app.post('/signup', passport.authenticate('local-signup', {
		successRedirect : '/profile', // redirect to the secure profile section
		failureRedirect : '/signup', // redirect back to the signup page if there is an error
		failureFlash : true // allow flash messages
	}));

	// =====================================
	// PROFILE SECTION =========================
	// =====================================
	// we will want this protected so you have to be logged in to visit
	// we will use route middleware to verify this (the isLoggedIn function)
	app.get('/profile', isLoggedIn, function(req, res) {
		console.log('get user profile !!');
		res.json({
			userId : req.user._id, name: req.user.local.email // get the user out of session and pass to template
		});
	});

	// =====================================
	// LOGOUT ==============================
	// =====================================
	app.get('/logout', function(req, res) {
		req.logout();
		res.redirect('/');
	});

	// application -------------------------------------------------------------
	app.get('/', function(req, res) {
		res.sendfile('index.html'); // load the single view file (angular will handle the page changes on the front-end)
	});

	app.get('/site-api/sites/:ownerId', function(req, res, next){
		console.log(req.params.ownerId);

		Site.find({owner : req.params.ownerId}, function(err, siteInfo, next){
			if (err) return next(err);
			for(var i = 0 ; i < siteInfo.length; i++){
				siteInfo[i].sections = urlConfig.SECTIONS_URL + siteInfo[i]._id;
				siteInfo[i].products = urlConfig.PRODUCTS_URL + siteInfo[i]._id;
				siteInfo[i].photos = urlConfig.PHOTOS_URL + siteInfo[i]._id;
			}
			return res.json(siteInfo);
		});

		/*
		Site.findById(req.params.id, function(err, sites){
			if(err)
				res.send(err);
			sites.id = sites._id;
			console.log(sites);
			res.json(sites);
		});
		*/
	});

	app.put('/site-api/sites/:siteId', function(req, res, next){
		console.log(req.body);
		Site.findById(req.params.siteId, function(err, siteInfo, next){
			if (err) return next(err);
			siteInfo.name  = req.body.name ;
			siteInfo.email = req.body.email;
			siteInfo.phone = req.body.phone;
			siteInfo.contact_person = req.body.contact_person;
			siteInfo.address = req.body.address;
			siteInfo.lon  = req.body.lon ;
			siteInfo.lat  = req.body.lat ;
			siteInfo.owner = req.body.owner;
			siteInfo.save(function(err){
				if(err) 
					return next(err);
				res.json({message: 'site updated!'});
			});
		});
	});

	// section functions:
	app.get('/site-api/sections/:siteId', function(req, res, next){
		console.log(req.params.siteId);

		Section.find({siteId : req.params.siteId}, function(err, sectionInfo){
			if (err) return next(err);
			return res.json(sectionInfo);
		});
	});

	app.put('/site-api/sections/:sectionId', function(req, res, next){

		Section.findById(req.params.sectionId, function(err, sectionInfo, next){
			if (err) return next(err);

			sectionInfo.name = req.body.name ;
			sectionInfo.content= req.body.content;
			sectionInfo.type= req.body.type;
			sectionInfo.state = req.body.state ;
			sectionInfo.siteId = req.body.siteId ;

			sectionInfo.save(function(err, next){
				if(err) 
					return next(err);
				res.json({message: 'section updated!'});
			});
		});
	});

	// product functions
	app.get('/product-api/products/:siteId', function(req, res){
		console.log(req.params.siteId);

		Product.find({siteId : req.params.siteId}, function(err, productInfo){
			if (err) return next(err);
			return res.json(productInfo);
		});
	});

	app.post('/product-api/products/', function(req, res, next){

		Site.findById(req.body.site, function(err, siteInfo){
			// console.log(next);
			if (err) return next(err);

			var productInfo = new Product();
			productInfo.name = req.body.name ;
			productInfo.desc = req.body.desc ;
			productInfo.code = req.body.code ;
			productInfo.category = req.body.category ;
			productInfo.form = req.body.form ;
			productInfo.ingredients = req.body.ingredients ;
			productInfo.siteId = siteInfo._id ;
			console.log(productInfo);

			Product.count({siteId : req.body.site}, function(err, count){

				if(err) return next(err);
				console.log(count + 1, productInfo);
				if(!count) productInfo.order = 1;
				else productInfo.order =  count + 1;

				productInfo.save(function(err){
					if(err) return next(err);
					res.json({message: 'product created!'});
				});

			});

			/* you can get the productInfo variable from parent scope
			Product.count({siteId : req.body.site }, function(err, count){
				console.log("xxxx", count, productInfo);	// no count value!!!

				if(!count) productInfo.order = 1;
				else productInfo.order =  count + 1;
				

				
				console.log(productInfo);

				productInfo.save(function(err){
					if(err) 
						return next(err);
					res.json({message: 'product created!'});
				});
			}(productInfo));
			*/
		});

	});

	app.put('/product-api/products/:productId', function(req, res, next){

		Product.findById(req.params.productId, function(err, productInfo){
			if (err) return next(err);

			productInfo.name = req.body.name ;
			productInfo.desc = req.body.desc ;
			productInfo.code = req.body.code ;
			productInfo.category = req.body.category ;
			productInfo.form = req.body.form ;
			productInfo.ingredients = req.body.ingredients ;
			productInfo.site = req.body.site ;
			productInfo.order = req.body.order;

			productInfo.save(function(err){
				if(err) 
					return next(err);
				res.json({message: 'product updated!'});
			});
		});

	});

	app.delete('/product-api/products/:productId', function(req, res, next){
		Product.findById(req.params.productId, function(err, product){
			if(!err) return next(err);
			product.remove(function(err){
				if(!err) return next(err);
				return res.json({message: 'product deleted!'});
			}); 
		});
	});

	// change the product order
	app.setOrder('/product-api/products/order/', function(req, res, next){

	});

	// photos CRUD functions
	// get all photos
	app.get('/product-api/photos', function(req, res, next){
		Photo.find({}, function(err, photos){
			if(!err) return next(err);
			return res.json(photos);
		});	
	});

	// get product photos
	app.get('/product-api/products/:productId/photos', function(req, res, next){
		Photo.find({productId: req.params.productId}, function(err, photos){
			if(!err) return next(err);
			return res.json(photos);
		});	
	});

	// upload photos


	// delete photos
	app.delete('/product-api/photos/:photoId', function(req, res, next){
		Photo.findById(req.params.photoId, function(err, photo){
			if(!err) return next(err);
			photo.remove(function(err){
				if(!err) return next(err);
				return res.json({message: 'photo deleted!'});
			});
		});
	});

	// set default photos



	// test functions: for count test
	/*
	app.get('/test_count/:siteId', function(req, res, next){
		Product.count({siteId: req.params.siteId}, function(err, count){
			if(err) return next(err);
			return res.json({message: count});
		});
	});
	*/

};

// route middleware to make sure
function isLoggedIn(req, res, next) {

	// if user is authenticated in the session, carry on
	if (req.isAuthenticated())
		return next();

	// if they aren't redirect them to the home page
	res.redirect('/');
};


