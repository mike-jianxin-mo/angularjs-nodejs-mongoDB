'use strict'

if (!('sendAsBinary' in XMLHttpRequest.prototype)) {
  XMLHttpRequest.prototype.sendAsBinary = function(string) {
    var bytes = Array.prototype.map.call(string, function(c) {
      return c.charCodeAt(0) & 0xff;
    });
    this.send(new Uint8Array(bytes).buffer);
  };
};


var addPhotoModule = angular.module('addPhotoModule', ['angularFileUpload', 'ngCookies']);

addPhotoModule.controller('addPhotoMainCtrl', ['$scope', '$state', 'runTimeParam',
	function($scope, $state, runTimeParam){
		$scope.backToList = function(){
			$state.go('admin.photo');
		};
		$state.go('admin.photo.add.select_product');
	}]);

addPhotoModule.controller('selectProductCtrl', ['$scope', '$state', 'runTimeParam',
	function($scope, $state, runTimeParam){
		$scope.selectProduct = function(product){
			runTimeParam.addPhotoProduct = product;
			$state.go('admin.photo.add.select_file');
		};
	}]);

addPhotoModule.controller('selectPhotoCtrl', ['$scope', '$location', 'notificationFactory', 'photoHandler', 'settings', 'runTimeParam', '$state',
	function($scope, $location, notificationFactory, photoHandler, settings, runTimeParam, $state){

		var jPreViewImg = jQuery("<img>", {id:"operImg"});
		
		$scope.onFileSelect = function($files) {
			console.log('start to read file!!!');
			var promise = photoHandler.showPreviewPhoto($files, jPreViewImg);

			/*
			$scope.imageOperation = true;
			$scope.showOriginImage = true;
			console.log('$scope.imageOperation = true;', $scope.imageOperation);
			$scope.$apply();
			*/
			console.log('read file finished???');
			// $state.go('admin.crop.crop');

			promise.then(function(p){
				console.log('read file success in main controller', p);
				photoHandler.setOriginalPhoto(p);
				$state.go('admin.crop.crop');
			}, function(p){
				console.log('read file failure!!', p)
			})
		};

	}]);

addPhotoModule.controller('cropPhotoCtrl', ['$scope', 'photoHandler', '$state',
	function($scope, photoHandler, $state){
		var jPreViewImg = photoHandler.getOriginalPhoto();

		$scope.cropImg = function(){
			// var img = document.getElementById("previewImgArea");
			photoHandler.cropPhoto(photoHandler.getCropResult(), jPreViewImg.get(0));
			console.log('crop finished???');
			$state.go('admin.crop.upload');
		};

		var initCropFun = function(){
			console.log("init crop function!");
			photoHandler.initJcropFun();
		};

		$scope.$on('$viewContentLoaded', function(){
			// console.log(jQuery('.home-flexslider').get(0), 'include Content Loaded!!!');
			var size = photoHandler.resize();
			jPreViewImg.width(size['width']);
			jPreViewImg.height(size['height']);
			jPreViewImg.appendTo('#previewImgArea');

			var jCanvas = jQuery("<canvas/>");
			photoHandler.setCropResult(jCanvas);

			initCropFun();
		});

	}]);


addPhotoModule.controller('uploadPhotoCtrl', ['$scope', 'photoHandler', 'settings', 'runTimeParam', '$state',
	function($scope, photoHandler, settings, runTimeParam, $state){

		// reference: http://stackoverflow.com/questions/5392344/sending-multipart-formdata-with-jquery-ajax
		$scope.upload = function(){
			photoHandler.sendPhoto(	settings.PHOTO_URI,
									runTimeParam.curSite.id,
									runTimeParam.addPhotoProduct.id, 
									"uploadFile",
									"test.png",
									photoHandler.getCropResult().get(0),
									"image/png", 
									function(){$state.go('admin.photo');}, 
									uploadFail );
		};

		function uploadFail(){
			alert("upload failure!");
		};

		$scope.$on('$viewContentLoaded', function(){
			// show crop result
			photoHandler.getCropResult().appendTo("#cropResult");
		});

	}]);
 	
addPhotoModule.factory('photoHandler', ['$cookies','$q', function($cookies, $q){
		// image data
		var x1=1, y1=1, x2=1, y2=1, w=1, h=1;
		var imgOrgWidth=1, imgOrgHeight=1;
		var MAX_WIDTH = 800, MAX_HEIGHT = 800;
		var realWidth=1, realHeight=1;
		var rate = 1;

		var originalPhoto;
		var cropResult;

		function initJcropFun(){
			jQuery('#previewImgArea').Jcrop({
				// onChange:   setPosition
				onSelect: setPos,
				aspectRatio: 4.5 / 6
			});
		};

		function setPos(p){
			x1 = p.x;
			y1 = p.y;
			x2 = p.x2;
			y2 = p.y2;
			w  = p.w;
			h  = p.h;
			console.log('set crop position',p ,  x1, y1, x2, y2, w, h);
		};

		function resize(){
			var width = imgOrgWidth;
			var height = imgOrgHeight;
			var widthScaleRate = width / MAX_WIDTH;
			var heightScaleRate= height/ MAX_HEIGHT;

			if (widthScaleRate > heightScaleRate) {
			  if (width > MAX_WIDTH) {
			  	rate = widthScaleRate;
			    height *= MAX_WIDTH / width;
			    width = MAX_WIDTH;			    
			  }
			} else {
			  if (height > MAX_HEIGHT) {
			  	rate = height / MAX_HEIGHT;
			    width *= MAX_HEIGHT / height;
			    height = MAX_HEIGHT;		    
			  }
			}
			realWidth = width;
			realHeight= height;

			console.log('*********', realWidth,realHeight);
			console.log("resize rate is " + rate)

			return {width: realWidth, height: realHeight, rate: rate};
		}

		/***
		 * @description        Uploads a file via multipart/form-data, via a Canvas elt
		 * @param url  String: Url to post the data
		 * @param name String: name of form element
		 * @param fn   String: Name of file
		 * @param canvas HTMLCanvasElement: The canvas element.
		 * @param type String: Content-Type, eg image/png
		 ***/
		// $scope.postCanvasToURL = function(url, name, fn, canvas, type) {

		/*** consider form data 
		var fileData = new FormData();
		console.log(fileData);
		// fileData.append('uploadFile', jCanvas.get(0).toDataURL('image/jpeg'));
		console.log(fileData)
		***/
		function sendPhoto(uploadURI, siteId, productId, name, fn, canvas, type, successCallBackFn, faileCallBackFn) {
		  var url = uploadURI;
		  var data = canvas.toDataURL(type);
		  data = data.replace('data:' + type + ';base64,', '');

		  var xhr = new XMLHttpRequest();

		  xhr.onreadystatechange=function()
		  {
		  if (xhr.readyState==4 && xhr.status==201)
		    {
		    	// $scope.switchView();
		    	console.log("on ready state change function ..........");
		    	console.log(xhr.readyState, xhr.status);
		    	successCallBackFn();
		    }else if(xhr.readyState==4 && xhr.status!=201)
		    	faileCallBackFn();
		  };

		  xhr.open('POST', url, true);
		  xhr.setRequestHeader('X-CSRFToken', $cookies.csrftoken);
		  var boundary ="---------------------------ajax"+ (new Date).getTime() + 'boundary';
		  xhr.setRequestHeader(
		    'Content-Type', 'multipart/form-data; boundary=' + boundary);
		  xhr.sendAsBinary([
		    '--' + boundary,
			'Content-Disposition: form-data; name="type"',
			"\r\n",
			"product",
		    '--' + boundary,
			'Content-Disposition: form-data; name="name"',
			"\r\n",
			"image name",
		    '--' + boundary,
			'Content-Disposition: form-data; name="siteId"',
			"\r\n",
			siteId,
		    '--' + boundary,
			'Content-Disposition: form-data; name="product"',
			"\r\n",
			productId,
		    '--' + boundary,
		    'Content-Disposition: form-data; name="image"; filename="' + fn + '"',
		    'Content-Type: ' + type,
		    '',
		    atob(data),
		    '--' + boundary + '--'
		  ].join('\r\n'));
		};

		function cropPhoto(jCanvas, img){
			console.log('start to crop photo', x1, y1, w, h, this.x1, this.y1, this.w, this.h);
			console.log(jCanvas);
			jCanvas.attr("width",w*rate);
			jCanvas.attr("height",h*rate);
			var canvas = jCanvas.get(0);
			var context = canvas.getContext("2d");
			// var targetImg = new Image()
			context.drawImage(img,x1*rate,y1*rate,w*rate,h*rate,0,0,w*rate,h*rate);
			console.log("crop area" + rate);
			console.log(x1, y1, w, h);
			console.log(x1*rate,y1*rate,w*rate,h*rate);
			console.log('crop finished!!');
		};

		// generate preview image 
		function showPreviewPhoto(inputFiles, jPreViewImg){
			var deferred = $q.defer();

			if(inputFiles && inputFiles[0]){
				var reader = new FileReader();
				reader.onload = function(e) {
					jPreViewImg.attr("src",e.target.result);

					imgOrgWidth = jPreViewImg.get(0).width;
					imgOrgHeight= jPreViewImg.get(0).height;
					console.log("imgOrgWidth " + imgOrgWidth + " imgOrgHeight" + imgOrgHeight);
					console.log('read file finished!!');
					deferred.resolve(jPreViewImg);	
				}
				reader.readAsDataURL(inputFiles[0]);
				console.log('start reading .....');
			}else{
				console.log('open file error!!');
				deferred.reject('open file error!!');
			}	

			return deferred.promise;		
		};

		return{
			initJcropFun: initJcropFun,
			resize: resize,
			showPreviewPhoto: showPreviewPhoto,
			cropPhoto: cropPhoto,
			sendPhoto: sendPhoto,
			setsiteId: function(sId){
				siteId = sId;
			},
			setOriginalPhoto: function(p){
				originalPhoto = p;
			},
			getOriginalPhoto: function(){
				return originalPhoto;
			},
			setCropResult: function(e){
				cropResult = e;
			},
			getCropResult: function(){
				return cropResult;
			},
		}
    }]);
