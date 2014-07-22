'use strict'

angular.module('nkApp', [
  'ngRoute',
  'ui.router',
  'ngResource',
  'ui.bootstrap',
  'ngSanitize',
  'ngAnimate',
  
  'adminMainModule',
])
.config(function($stateProvider, $urlRouterProvider, $httpProvider){
  console.log('app config init!');
  // django and angular both support csrf tokens. This tells
  // angular which cookie to add to what header.
  $httpProvider.defaults.xsrfCookieName = 'csrftoken';
  $httpProvider.defaults.xsrfHeaderName = 'X-CSRFToken';

  $stateProvider
    // auth
    .state('auth', {url: '/auth', templateUrl: '/static/entry/modules/auth/auth.html', controller: 'authCtrl'})
    // admin layout:
    .state('admin', {url: '/admin', templateUrl: '/static/entry/modules/admin/admin.layout.html', controller: 'adminMainCtrl'}) // or use a empty url='' to set the default state
    // admin views:
    /*
    .state('admin.site', {url: '/:userId', templateUrl: '/static/entry/modules/site/admin.site.html', controller: 'siteCtrl'})
    .state('admin.section', {url: '/:siteId/section', templateUrl: '/static/entry/modules/section/admin.section.html', controller: 'sectionCtrl'})
    .state('admin.product', {url: '/:siteId/product', templateUrl: '/static/entry/modules/product/admin.product.html', controller: 'productCtrl'})
    .state('admin.photo', {url: '/:siteId/product/photo/:productId', templateUrl: '/static/entry/modules/photo/admin.photo.html', controller: 'photoCtrl'});
    */
    .state('admin.site', {url: '/site', templateUrl: '/static/entry/modules/site/admin.site.html', controller: 'siteCtrl'})
    .state('admin.section', {url: '/section', templateUrl: '/static/entry/modules/section/admin.section.html', controller: 'sectionCtrl'})
    .state('admin.product', {url: '/product', template: '<div ui-view ></div>'})
    .state('admin.product.list', {url: '/list', templateUrl: '/static/entry/modules/product/admin.product.html', controller: 'productCtrl'})
    .state('admin.product.photo', {url: '/photo', templateUrl: '/static/entry/modules/product/photo/product_photo_layout.html'})

    .state('admin.product.photo.list', {url: '/list', templateUrl: '/static/entry/modules/photo/product/product_photos.html', controller: 'productPhotoCtrl'})
    .state('admin.product.photo.new', {url: '/new', templateUrl: '/static/entry/modules/photo/product/new/layout.html', controller: 'cropPhotoMainCtrl'})
    .state('admin.product.photo.new.select', {url: '/select', templateUrl: '/static/entry/modules/photo/product/new/select.html', controller: 'selectPhotoCtrl'})
    .state('admin.product.photo.new.crop', {url: '/crop', templateUrl: '/static/entry/modules/photo/product/new/crop.html', controller: 'cropPhotoCtrl'})
    .state('admin.product.photo.new.upload', {url: '/upload', templateUrl: '/static/entry/modules/photo/product/new/upload.html', controller: 'uploadPhotoCtrl'})

    // .state('admin.photo', {url: '/photo', templateUrl: '/static/entry/modules/photo/layout.html'})
    .state('admin.photo', {url: '/photo/list', templateUrl: '/static/entry/modules/photo/list/photos.html', controller: 'photoListCtrl'});


  $urlRouterProvider.when('/', '/admin');

  // handle permission error issues
  var logsOutUserOn401 = ['$q', '$location', function ($q, $location) {
    var success = function (response) {
        return response;
    };

    var error = function (response) {
      if (response.status === 401) {
        //redirect them back to login page
        $location.path('/login');

        return $q.reject(response);
      } 
      else {
        return $q.reject(response);
      }
    };

    return function (promise) {
      return promise.then(success, error);
    };

  }];

  // intercept permission handler
  $httpProvider.responseInterceptors.push(logsOutUserOn401);

}).run(function ($rootScope, $location, AuthenticationService) {
  console.log('app run init!');
  // enumerate routes that don't need authentication
  var routesThatDontRequireAuth = ['/auth'];
  
  // check if current location matches route  
  var routeClean = function (route) {
    return _.find(routesThatDontRequireAuth,
      function (noAuthRoute) {
        return _.str.startsWith(route, noAuthRoute);
      });
  };

  // change state auth check 
  $rootScope.$on('$locationChangeStart', function (ev, to, toParams, from, fromParams) {
    // if route requires auth and user is not logged in
    if (!routeClean($location.url()) && !AuthenticationService.isLoggedIn()) {
      // redirect back to login
      $location.path('/auth');
    }
  });

  // inject global service
 
}).service('AuthenticationService', function(runTimeParam){
	return {
			isLoggedIn : function(){
      		return ( !!runTimeParam.user.name && !!runTimeParam.user.id )? true: false;
    	}
	}
}).service('settings', function(){
  var DEFAULT_SITE_ID = 1;
  var BASE_URL = '';
  return{
    MODE : 'site',
    BASE_URL : BASE_URL,
    // DEFAULT_SITE_ID : DEFAULT_SITE_ID,
    DEFAULT_LANDING_URL : 'admin',
    USER_API_URI: BASE_URL + '/auth/users/:userId', 
    SITE_API_URI: BASE_URL + '/site-api/sites/',
    SECTION_URI : BASE_URL + '/site-api/sections/',
    PRODUCT_URI : BASE_URL + '/product-api/products/',
    PHOTO_URI : BASE_URL + '/product-api/photos/',
    PRODUCT_ORDER_URI : BASE_URL + '/product-api/products/order/',

    OPERATION_TITLE: {'admin.site' : 'Basic Information Management', 
                      'admin.section' : 'Content Management',
                      'admin.product' : 'Product Management',
                      'admin.photo' : 'Photo Management'},
  };

})
.service('runTimeParam', function(){
  var user = {};
  var curSite = {};
  var curPhoto = {};
  var curProduct = {};
  var curTitle = function(){

  };
  return {
    user : user,
    curSite : curSite,
    curProduct : curProduct,
    curPhoto : curPhoto,
    curTitle : curTitle,
  }
})
.factory('notificationFactory', function () {   
  return { 
    success: function () { 
      toastr.success('Success'); 
    }, 
    error: function (text) { 
      // console.log('error', text)
      toastr.error(text, 'Error!'); 
    } 
  }; 
})
.directive('my-dialog', function(){
  return { 
    template: 'warning: {{warning.title}} <br>{{warning.content}}' 
  };
});