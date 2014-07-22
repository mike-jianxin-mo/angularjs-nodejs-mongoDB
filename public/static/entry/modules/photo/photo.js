'use strict'

var photoModule = angular.module('photoModule', ['angularFileUpload', 'ngCookies']);

photoModule.controller('productPhotoCtrl', ['$scope', 'photoFactory', 'notificationFactory', '$state', 'settings', 'runTimeParam', '$modal',
	function($scope, photoFactory, notificationFactory, $state, settings, runTimeParam, $modal){
		
		$scope.photos = [];
  		var viewStates = {list:'/photo-list.html'};
  		var setDefaultInfo = 'This picture will be the default image of the product';
  		var answer = '';

		var getPhotosSuccessCallback = function(data){
			$scope.photos = data;
			$scope.crudView = viewStates.list;
		};

		var successCallback = function () { 
			notificationFactory.success();
			photoFactory.getPhotos(runTimeParam.curProduct.photos).success(getPhotosSuccessCallback).error(errorCallback);
		}; 

		var errorCallback = function (data) { 
			notificationFactory.error(data.ExceptionMessage); 
		}; 

		// CRUD 
		$scope.addForm = function(){
			runTimeParam.curPhoto = $scope.photo;
			$state.go('admin.product.photo.new')
		};

		$scope.delete = function(photo){
			photoFactory.delete(photo).success(successCallback).error(errorCallback);
		};

		// Other Actions
		var cleanOtherDefaultState = function(photo){
			for (var i = 0; i < $scope.photos.length; i++)
				if($scope.photos[i].is_default) $scope.photos[i].is_default = 0;
			photo.is_default = 1;
		};

		$scope.setDefault = function(photo){
			var modalInstance = $modal.open({
				templateUrl: 'setDefaultNotice.html',
				controller: setDefaultNoticeCtrl,
				resolve:{
					info: function(){
							return setDefaultInfo;
						}
				},
			});

			modalInstance.result.then(function(confirm){
					answer = confirm;
					console.log('confirm update!');	
					cleanOtherDefaultState(photo);
					photo.is_default = 1;
					photoFactory.setDefault(photo).success(successCallback).error(errorCallback);
				}, function(){
					photo.is_default = !photo.is_default;
					console.log('cancel update!');
				}
			);

		};

		var setDefaultNoticeCtrl = function($scope, $modalInstance, info){
			$scope.info = info;

			$scope.ok = function(){
				$modalInstance.close('yes');
			};

			$scope.cancel = function(){
				$modalInstance.dismiss('cancel')
			};
		};

		// init 
		(function(){
			console.log('in photo controller .... ...');
			$scope.product = runTimeParam.curProduct;
			photoFactory.setPhotoURI(settings.PHOTO_URI);	
			photoFactory.siteId = runTimeParam.curSite.id;
			photoFactory.productId = runTimeParam.curProduct.id;
			photoFactory.getPhotos(runTimeParam.curProduct.photos).success(getPhotosSuccessCallback).error(errorCallback);

			// for debug
			/*
			photoFactory.setPhotoURI(settings.PHOTO_URI);	
			photoFactory.siteId = 1;
			photoFactory.productId = 1;
			photoFactory.getPhotos('http://localhost:8014/product-api/products/1/photos').success(getPhotosSuccessCallback).error(errorCallback);
			*/

		})();

	}]);

photoModule.controller('photoListCtrl', ['$scope', 'photoFactory', 'notificationFactory', '$state', 'runTimeParam', '$modal', 'settings',
	function($scope, photoFactory, notificationFactory, $state, runTimeParam, $modal, settings){
		var addPhotoInfo = 'Pleas select a product item before adding photos';

		$scope.addInfo = function(){
			var infoInstance = $modal.open({
				templateUrl: 'addPhotoInfo.html',
				controller: addPhotoInfoCtrl,
				resolve:{
					info: function(){
							return addPhotoInfo;
						}
				},
			});

			infoInstance.result.then(function(confirm){
					console.log('go to the product list state');	
					$state.go('admin.product.list');
				}, function(){
					console.log('cancel update!');
				}
			);

		};

		var addPhotoInfoCtrl = function($scope, $modalInstance, info){
			$scope.info = info;

			$scope.ok = function(){
				$modalInstance.close('yes');
			};

			$scope.cancel = function(){
				$modalInstance.dismiss('cancel')
			};
		};

		var getPhotosSuccessCallback = function(data){
			$scope.photos = data;
		};

		var successCallback = function () { 
			notificationFactory.success();
			photoFactory.getPhotos(runTimeParam.curSite.photos).success(getPhotosSuccessCallback).error(errorCallback);
			// $state.go($state.$current, null, { reload: true });
		}; 

		var errorCallback = function (data) { 
			notificationFactory.error(data.ExceptionMessage); 
		}; 

		$scope.delete = function(photo){
			photoFactory.delete(photo).success(successCallback).error(errorCallback);
		};

		(function(){
			console.log('in the photo list controller', runTimeParam.curSite);
			photoFactory.setPhotoURI(settings.PHOTO_URI);	
			photoFactory.getPhotos(runTimeParam.curSite.photos).success(getPhotosSuccessCallback).error(errorCallback);
		})();
	}]);

photoModule.factory('photoFactory', ['$http', function($http){
		var productId = 0;
		var siteId = 0;
		var product = {};
		var _PHOTO_URI_ = '';

		return {
			siteId : siteId,
			productId : productId,

			setPhotoURI: function(uri){
				_PHOTO_URI_ = uri;
			},
			delete: function(photo){
				return $http.delete(_PHOTO_URI_ + photo.id);
			},
			setDefault: function(photo){
				return $http.put(_PHOTO_URI_ + "setdefault/" + photo.id + '/', {id: photo.id, is_default:photo.is_default});
			},
			getPhotos: function(uri){
				return $http.get(uri);
			},
		}
	}]);