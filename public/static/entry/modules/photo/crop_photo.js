'use strict'

if (!('sendAsBinary' in XMLHttpRequest.prototype)) {
  XMLHttpRequest.prototype.sendAsBinary = function(string) {
    var bytes = Array.prototype.map.call(string, function(c) {
      return c.charCodeAt(0) & 0xff;
    });
    this.send(new Uint8Array(bytes).buffer);
  };
};


var cropPhotoModule = angular.module('cropPhotoModule', ['angularFileUpload', 'ngCookies']);

cropPhotoModule.controller('cropPhotoCtrl', ['$scope', '$location', 'notificationFactory', 'photoHandler', 'settings', 'runTimeParam',
	function($scope, $location, notificationFactory, photoHandler, settings, runTimeParam){
		// View Section Controller
		/** once I used state to control the display, later have better way to do it.
			1: list, 2: add, 3: edit, 4: show, 5: upload file step1, 6: upload file step2, 7: upload file step3
		*/
		$scope.uploadOperation= false;
		$scope.imageOperation = false;
		$scope.showOriginImage= false; 
		$scope.photos = [];
		$scope.cropFinish = false;
 
		// view object
		var jPreViewImg = jQuery("<img>", {id:"operImg"});
		var jCanvas = $("<canvas/>").appendTo("#cropResult");
		jPreViewImg.appendTo('#previewImgArea');

		// CRUD
		// UI OPERATION
		$scope.cancelCrop = function(){
			$scope.showOriginImage = true;
			// $scope.$apply();
		};

		$scope.addForm = function(photo){
			$scope.photo = {};
			$scope.uploadOperation = true;
		};

		$scope.backToList = function(){
			$scope.photo = {};
			// go('admin.product');
		};

		var successCallback = function (data, status, headers, config) { 
			notificationFactory.success(); 
		}; 

		var errorCallback = function (data, status, headers, config) { 
			notificationFactory.error(data.ExceptionMessage); 
		}; 

		$scope.onFileSelect = function($files) {
			photoHandler.showPreviewPhoto($files, jPreViewImg);
			$scope.imageOperation = true;
			$scope.showOriginImage = true;
			console.log('$scope.imageOperation = true;', $scope.imageOperation);
			$scope.$apply();
		};

		$scope.cropImg = function(){
			var img = document.getElementById("operImg");
			// var area = photoHandler.getCropArea();
			photoHandler.cropPhoto(jCanvas, img);
			$scope.showOriginImage = false;
		};

		$scope.initCropFun = function(){
			console.log("init crop function!");
			$("#cropImageBtn").hide();

			$("#cropOperateBtn").css("display","block");
			photoHandler.resize();

			photoHandler.initJcropFun();

		};

		// reference: http://stackoverflow.com/questions/5392344/sending-multipart-formdata-with-jquery-ajax
		$scope.sendImg = function(){
			photoHandler.sendPhoto($scope.product.id, "uploadFile","test.png",jCanvas.get(0),"image/png", $scope.backToList, uploadFaile);
		};

		function uploadFaile(){
			alert("upload failure!");
			$scope.backToList();
		};

		(function(){
			photoHandler.setsiteId(runTimeParam.curSite.id);
			$scope.product = runTimeParam.curProduct;
		})();

	}]);

cropPhotoModule.factory('photoHandler', ['$cookies', function($cookies){
    	var photoUrl = '/product-api/photos/';
		// image data
		var x1=1, y1=1, x2=1, y2=1, w=1, h=1;
		var imgOrgWidth=1, imgOrgHeight=1;
		var MAX_WIDTH = 800, MAX_HEIGHT = 800;
		var realWidth=1, realHeight=1;
		var rate = 1;
		var siteId;

		function initJcropFun(){
			$('#operImg').Jcrop({
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


			if (width > height) {
			  if (width > MAX_WIDTH) {
			  	rate = width / MAX_WIDTH;
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
			console.log(realWidth,realHeight);
			console.log("resize rate is " + rate)
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

		/*** consider form data, once used data, but fail
		var fileData = new FormData();
		console.log(fileData);
		// fileData.append('uploadFile', jCanvas.get(0).toDataURL('image/jpeg'));
		console.log(fileData)
		***/
		function sendPhoto(urlProductId, name, fn, canvas, type, successCallBackFn, faileCallBackFn) {
		  var url = photoUrl;
		  var data = canvas.toDataURL(type);
		  data = data.replace('data:' + type + ';base64,', '');

		  var xhr = new XMLHttpRequest();

		  xhr.onreadystatechange=function()
		  {
		  if (xhr.readyState==4 && xhr.status==200)
		    {
		    	// $scope.switchView();
		    	console.log("on ready state change function ..........");
		    	console.log(xhr.readyState, xhr.status);
		    	successCallBackFn();
		    }else if(xhr.readyState==4 && xhr.status != 200)
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
			urlProductId,
		    '--' + boundary,
		    'Content-Disposition: form-data; name="image"; filename="' + fn + '"',
		    'Content-Type: ' + type,
		    '',
		    atob(data),
		    '--' + boundary + '--'
		  ].join('\r\n'));
		};

		function cropPhoto(jCanvas, img, area){
			console.log('start to crop photo', x1, y1, w, h, this.x1, this.y1, this.w, this.h);
			jCanvas.attr("width",w*rate);
			jCanvas.attr("height",h*rate);
			var canvas = jCanvas.get(0);
			var context = canvas.getContext("2d");
			// var targetImg = new Image()
			context.drawImage(img,x1*rate,y1*rate,w*rate,h*rate,0,0,w*rate,h*rate);
			console.log("crop area" + rate);
			console.log(x1, y1, w, h);
			console.log(x1*rate,y1*rate,w*rate,h*rate);
		};

		// generate preview image 
		function showPreviewPhoto(inputFiles, jPreViewImg){
			if(inputFiles && inputFiles[0]){
				var reader = new FileReader();
				reader.onload = function(e) {
					jPreViewImg.attr("src",e.target.result);

					imgOrgWidth = jPreViewImg.get(0).width;
					imgOrgHeight= jPreViewImg.get(0).height;
					console.log("imgOrgWidth " + imgOrgWidth + " imgOrgHeight" + imgOrgHeight);
					resize();
					jPreViewImg.css("width",MAX_WIDTH);
					console.log(jPreViewImg.get(0).width);
					console.log(jPreViewImg.get(0).height);
				}
				reader.readAsDataURL(inputFiles[0]);
			}			
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
		}
    }]);
