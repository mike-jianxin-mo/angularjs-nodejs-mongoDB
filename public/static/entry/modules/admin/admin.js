'use strict'

angular.module('adminMainModule', [	 'productModule',
	                                 'photoModule',
	                                 'cropPhotoModule',
	                                 'siteModule',
	                                 'sectionModule',
	                                 'authModule'])
.run(function($rootScope, $location, $state){
	$rootScope.$on('$locationChangeSuccess', function(){
		/*
		console.log('$locationChangeSuccess changed!', new Date());
		$rootScope.ac = "active";
		console.log($location.path());
		if($location.path() != '/')
			$('#homeMenu').removeClass('active');
		console.log($location.hash());
		*/
		
	});	

})
.controller('adminMainCtrl', ['$scope', '$cookies', '$location', 'runTimeParam', '$state', 'settings',
	function($scope, $cookies, $location, runTimeParam, $state, settings){
	
	$scope.userName = runTimeParam.user.name;


	$scope.logout = function(){

		runTimeParam.user = {};
		$cookies.seesionid = '';
		var now = new Date();
		var exp = new Date(now.getTime() - 60*1000);
		document.cookie = 'expires=' + exp.toUTCString();
		$location.path('/auth');

	};

	$scope.$on('$stateChangeSuccess', function(event, viewConfig){ 
		var stateArr = $state.current.name.split('.');
		console.log('***************', stateArr);
		if(stateArr.length > 1){
			var key = stateArr[0] + '.' + stateArr[1];
			console.log(key);
			if(stateArr.length > 2 && stateArr[1] == 'product' && stateArr[2] == 'photo' ){
				$scope.operationTitle = 'Product Photo Management';
			}else
				$scope.operationTitle = settings.OPERATION_TITLE[key];	
		}
	});

	$scope.currentMenu = function(item){
		return ($state.current.name.split('.')[1] == item)? 'active' : '';
	};
}]);
