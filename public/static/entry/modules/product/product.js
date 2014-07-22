'use strict';

var productModule = angular.module('productModule', ['photoModule', 'ui.sortable']);

productModule.controller('productCtrl', ['$scope', 'runTimeParam', '$state', 'productFactory', 'notificationFactory', 'settings',
	function($scope, runTimeParam, $state, productFactory, notificationFactory, settings){
		// CRUD	
		$scope.products = [];

  		var viewStates = {list:'/pro-list.html', form: '/pro-form.html', show: '/pro-show.html'};

		var getProductsSuccessCallback = function (data, status) { 
			var sortData = _.sortBy(data, function(num){ return data.order; });
			console.log('sort data is ', sortData);
			$scope.products = {vo:sortData, vs: viewStates}; 
			$scope.crudView = $scope.products.vs.list;
		}; 

		$scope.productState = function(){
			return product.state? "Active":"Deactive";
		};

		$scope.editForm = function(product){
			$scope.product = product;
			$scope.crudView= $scope.products.vs.form;
		}

		$scope.show = function(product){
			$scope.product = product;
			$scope.crudView = $scope.products.vs.show;
		}

		$scope.backToList = function(){	
			$scope.product = {};
			$scope.crudView = $scope.products.vs.list;
		};

		$scope.submit = function(product){
			if(product.id)
				productFactory.updateProduct(product).success(successCallback).error(errorCallback); 
			else{
				product.order = 0;
				productFactory.addProduct(product).success(successCallback).error(errorCallback);
			}
		};

		var successCallback = function (data, status, headers, config) { 
			notificationFactory.success(); 
			$scope.product = {};
			return productFactory.getAllProducts(runTimeParam.curSite.products).success(getProductsSuccessCallback).error(errorCallback); 
		}; 

		var errorCallback = function (data, status, headers, config) { 
			notificationFactory.error(data.ExceptionMessage); 
		}; 

		$scope.delete = function (product) { 
			// changingType = 1;
			productFactory.deleteProduct(product).success(successCallback).error(errorCallback); 
		}; 

		$scope.photoManage = function(product){
			runTimeParam.curProduct = product;
			$scope.crudView = '';
			$state.go('admin.product.photo.list');
		};

		// other 
		var sortingLog = [];
		var curSeq;
		$scope.sortableOptions = {
			update: function(e, ui) {
				var logEntry = $scope.products.vo.map(function(pro){
					return pro.id;
				}).join(', ');
				sortingLog.push('Update: ' + logEntry);
				console.log(sortingLog);
			},
			stop: function(e, ui) {
				// this callback has the changed model
				var logEntry = $scope.products.vo.map(function(pro){
					return pro.id;
				}).join(', ');
				sortingLog.push('Stop: ' + logEntry);
				console.log(sortingLog);
				curSeq = logEntry;
				console.log('cur seq is ', curSeq);
			}
		};

		var refreshCurrentState = function(data){
			$state.go($state.$current, null, { reload: true });
		};

		var reGetProductData = function(data){
			productFactory.getAllProducts(runTimeParam.curSite.products + '?ordering=order').success(getProductsSuccessCallback).error(errorCallback); 
		};

		$scope.saveOrder = function(){

			var seq = $scope.products.vo.map(function(pro){
					return pro.id;
				}).join(', ');
	        productFactory.saveOrder(seq, settings.PRODUCT_ORDER_URI).success(reGetProductData).error(errorCallback); 
		};

		// First, Show list
		(function(){
			productFactory.setProductURI(settings.PRODUCT_URI);
			productFactory.setsiteId(runTimeParam.curSite.id);
			console.log(settings.PRODUCT_URI, runTimeParam.curSite.id, runTimeParam.curSite.products);
			productFactory.getAllProducts(runTimeParam.curSite.products + '?ordering=order').success(getProductsSuccessCallback).error(errorCallback); 
		})();

	}]);

productModule.factory('productFactory', ['$http', function($http){
		var siteId = 0;
		var _PRODUCT_URI_ = '';

		return {
			setsiteId:function(sId){
				siteId = sId;
			},
			setProductURI:function(uri){
				_PRODUCT_URI_ = uri
			},
			getAllProducts: function(uri){
				console.log('geting all product data ........', uri);
				return $http.get(uri);
			},
			addProduct: function(product){
				console.log("in product factory ", product);
				product.site = siteId;
				return $http.post(_PRODUCT_URI_, product);
			},
			deleteProduct: function(product){
				return $http.delete(_PRODUCT_URI_ + product.id);
			},
			updateProduct: function(product){
				return $http.put(_PRODUCT_URI_ + product.id + '/', product);
			},
			saveOrder : function(order, uri){
				return $http.post(uri , {order: order})
			},
		}
	}]);
