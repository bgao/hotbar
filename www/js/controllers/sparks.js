"use strict";

angular.module("hotbar.controllers")
  .controller("SparksCtrl", function($scope, $ionicLoading, $log, $timeout, 
                                     GeoService, Sparks) {
    $ionicLoading.show();
    // Get current geo location
    GeoService.getPosition(); // trigger the callback being assigned
    Sparks.all(function(err, sparks) {
      if (err) {
        $log.error("SparksCtrl.all error: ", err);
        $ionicLoading.hide();
      } else {
        $timeout(function() {
          $scope.sparks = sparks;
          $ionicLoading.hide();
        });
      }
    });
  })
  .controller("SparkDetailCtrl", function($scope, $ionicLoading, $log, $timeout,
                                          $stateParams, Sparks) {
    (function() {
      $ionicLoading.show();
      Sparks.get($stateParams.sparkId, function(err, spark) {
        if (err) {
          $log.error("SparkDetailCtrl.get error: ", err);
          $ionicLoading.hide();
        } else {
          $timeout(function() {
            $scope.spark = spark;
            $ionicLoading.hide();
          });
        }
      });
    })();
  });
