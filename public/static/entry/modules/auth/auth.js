'use strict'

angular.module('authModule', [])
	.controller('authCtrl', ['$scope', 'authApi', '$rootScope', '$state', 'settings', 'userApi', 'runTimeParam', 'notificationFactory',
		function($scope, authApi, $rootScope, $state, settings, userApi, runTimeParam, notificationFactory){
	   	console.log('in auth module');
	   	// Angular does not detect auto-fill or auto-complete. If the browser
	    // autofills "username", Angular will be unaware of this and think
	    // the $scope.username is blank. To workaround this we use the 
	    // autofill-event polyfill [4][5]
	    // $('#id_auth_form input').checkAndTriggerAutoFillEvent();

	    $scope.getCredentials = function(){
	        return {username: $scope.username, password: $scope.password};
	    };

	    $scope.login = function(){
	        authApi.auth.login($scope.getCredentials()).
	            $promise.
	                then(function(data){
	                    // on good username and password
	                    console.log(data);
	                    if(data.code == '200'){
	                    	// runTimeParam.user = {name : data.username, id : data.id, userSiteURI : data.sites};
							runTimeParam.user = {name : data.username, id : data.id, userSiteURI : data.sites};

                			// $location.path(settings.DEFAULT_LANDING_URL);
                			$state.go('admin.site');
	                    }

	                }).
	                catch(function(data){
	                    notificationFactory.error('username and password not correct!'); 
	                    console.log('auth failure!!', data);
	                });
					
	    };

	    $scope.logout = function(){
	        authApi.auth.logout(function(){
	            $scope.user = undefined;
	        });
	    };
	    $scope.register = function($event){
	        // prevent login form from firing
	        $event.preventDefault();
	        // create user and immediatly login on success
	        authApi.users.create($scope.getCredentials()).
	            $promise.
	                then($scope.login).
	                catch(function(data){
	                    alert(data.data.username);
	                });
	        };
	}])
	.factory('authApi', function($resource){
        function add_auth_header(data, headersGetter){
            // as per HTTP authentication spec [1], credentials must be
            // encoded in base64. Lets use window.btoa [2]
            var headers = headersGetter();
            headers['Authorization'] = ('Basic ' + btoa(data.username + ':' + data.password));
        }
        // defining the endpoints. Note we escape url trailing dashes: Angular
        // strips unescaped trailing slashes. Problem as Django redirects urls
        // not ending in slashes to url that ends in slash for SEO reasons, unless
        // we tell Django not to [3]. This is a problem as the POST data cannot
        // be sent with the redirect. So we want Angular to not strip the slashes!
        return {
            auth: $resource('/api/login\\/', {}, {
                login: {method: 'POST', 
                		params: {email: '@username', password: '@password'}, 
                		transformRequest: add_auth_header
                	   },
                logout: {method: 'DELETE'}
            }),
            users: $resource('/auth/api/users\\/', {}, {
                create: {method: 'POST'}
            })
        };
    })
	.factory('userApi', function($resource, settings){
		var userSitesURI = '';
		return {
			setUserURI: function(uri){
				userSitesURI = uri;
				console.log(userSitesURI, 'in the userAPI function ');
			},
			user: $resource(settings.USER_API_URI , {},{
				sites: {method: 'GET'},
			}),
		};
	});