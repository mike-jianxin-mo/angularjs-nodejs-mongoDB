'use strict'

var siteModule = angular.module('siteModule', []);

siteModule.controller('siteCtrl', ['$scope', '$rootScope', 'siteFactory', 'notificationFactory', 'settings', 'runTimeParam', '$modal', '$state',
    function($scope, $rootScope, siteFactory, notificationFactory, settings, runTimeParam, $modal, $state){

  // view states
  var viewStates = {form: '/site-form.html', show: '/site-show.html'};
  var operationTitle = 'Site Basic Information';

  // site CRUD return
  var getsiteSuccess = function(data){
    console.log('get site info success', data);
    $scope.site = {vs: viewStates, vo:data[0]};
    $scope.crudView = $scope.site.vs.show; 

    siteFactory.setSiteId(data[0].id);
    runTimeParam.curSite = data[0];

    console.log('runTimeParam is ', runTimeParam.curSite);

  };

  function serverError(err) {
    notificationFactory.error(); 
  }; 

  // popup window 
  $scope.showForm = function(site){

    var siteModalInstance = $modal.open({
      templateUrl: 'site-form.html',
      controller: editSiteCtrl,
      backdrop: 'static',
      resolve:{
        editSite: function(){
            return site;
          },
      },
    });

    siteModalInstance.result.then(function(confirm){
        console.log('confirm update!'); 
        $state.go($state.$current, null, { reload: true });
      }, function(){
        console.log('cancel update!');
      }
    );

  };

  var editSiteCtrl = function($scope, $modalInstance, editSite){
    $scope.site = editSite;

    var successCallback = function(data){
      $modalInstance.close('yes');
    };

    $scope.update = function(){
      // $modalInstance.close('yes');
      console.log('update section information!! ', editSite);
      siteFactory.updatesite($scope.site).success(successCallback).error(serverError);
    };

    $scope.cancel = function(){
      $modalInstance.dismiss('cancel')
    };
  };

  (function(){
    siteFactory.setSiteURI(settings.SITE_API_URI);
    siteFactory.getUserSites(runTimeParam.user.userSiteURI).success(getsiteSuccess).error(serverError);
  })();

}]);

// site layer
siteModule.factory('siteFactory', ['$http', function($http){
    var siteId= 0;
    var _URL_ = '';

    // remove view state and setup post data 
    return {
      // init parameters
      setSiteId : function(sId){
        siteId = sId;
      },
      setSiteURI : function(uri){
        _URL_ = uri;
      },
      // api actions
      savesite: function(siteData){
        siteData.owner = 1;
        return $http.post( _URL_ + siteId, siteData.vo);
      },
      updatesite: function(siteData){
        siteData.owner = 1;
        return $http.put(_URL_ + siteId, siteData.vo);
      },
      getUserSites : function(uri){
        return $http.get(uri);
      },
    }
  }]);