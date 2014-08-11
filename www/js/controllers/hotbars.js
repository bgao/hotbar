"use strict";

angular.module("hotbar.controllers")
  .controller("HotBarsCtrl", function($scope, $log, $timeout, $ionicLoading,
                                      GeoService, FirebaseRef, LocalStorage) {
    var _hotbarRef = FirebaseRef("hotbars");
    var _geoFire = GeoService.getGeoFire("hotbars");
    var _geoQuery = _geoFire.query({
      center: GeoService.getPosition(),
      radius: (LocalStorage.get("radius") || 1609) / 1000 // km
    });
    var _infowindow = new google.maps.InfoWindow();
    var _map;

    // geoQuery event handlers
    _geoQuery.on("key_entered", function(hotbarId, hotbarLoc) {
      console.log("hotbar " + hotbarId + " in");
      _hotbarRef.child(hotbarId).once("value", function(hotbarSnapshot) {
        var hotbar = hotbarSnapshot.val();
        hotbar.uid = hotbarSnapshot.name();
        updateGeolocation(hotbarSnapshot.name(), hotbar);
        $scope.hotbars.push(hotbar);
      });
    });
    _geoQuery.on("key_exited", function(hotbarId, hotbarLoc) {
      console.log("hotbar " + hotbarId + " out");
      for (var i = 0; i < hotbars.length; ++i) {
        if (hotbars[i].$id == hotbarId) {
          $scope.hotbars.splice(i, 1);
          break;
        }
      }
    });
    _geoQuery.on("key_moved", function(hotbarId, hotbarLoc) {
      console.log("hotbar " + hotbarId + " moved");
    });

    $scope.hotbars = [];

    $scope.map = {
      center: {
        latitude: GeoService.getPosition()[0],
        longitude: GeoService.getPosition()[1]
      },
      zoom: 14,
      events: {
        tilesloaded: function (map) {
          _map = map;
          createBarMarkers();
        }
      }
    };

    function findBarsCallback(results, status) {
      $timeout(function(){
        $scope.bars = results;
        if (status == google.maps.places.PlacesServiceStatus.OK) {
          for (var i = 0; i < results.length; i++) {
            createMarker
            (results[i],
             "http://maps.google.com/mapfiles/ms/icons/blue-dot.png");
          }
        }
      });
    }
    
    function createMarker(bar, icon) {
      console.assert(bar != null);
      var loc = (bar.geometry && bar.geometry.location) || (bar.location &&
        new google.maps.LatLng(bar.location[0],
                               bar.location[1]));
      var marker = new google.maps.Marker({
        map: _map,
        position: loc
      });
      if (icon) {
        marker.setIcon(icon);
      }
      
      google.maps.event.addListener(marker, 'click', function() {
        _infowindow.setContent(bar.name);
        _infowindow.open(_map, this);
      });
    }

    function findBarsOnMap() {
      var loc = new google.maps.LatLng(GeoService.getPosition()[0],
                                       GeoService.getPosition()[1]);
      var request = {
        location: loc,
        radius: 1609, // 1 mile = 1609 meters
        types: ['bar'],
        rankby: 'distance'
      };
      var service = new google.maps.places.PlacesService(_map);
      service.nearbySearch(request, findBarsCallback);
    }

    function createBarMarkers() {
      // markers for hotbars
      if ($scope.hotbars.length > 0) {
        for (var i = 0; i < $scope.hotbars.length; ++i) {
          createMarker($scope.hotbars[i],
                       "http://maps.google.com/mapfiles/ms/icons/red-dot.png");
        }
      } else {
        // markers for other bars
        findBarsOnMap();
      }
    }

    function updateGeolocation(id, hotbar) {
      _geoFire.get(id).then(function(loc) {
        hotbar.location = loc;
      }, function(err) {
        console.error("Get geo location error: ", err);
      });
    }
  })
  .controller("HotBarDetailCtrl", function($scope, $stateParams, $log, $timeout,
                                           $ionicLoading, FirebaseRef) {
    var _hotbarRef = FirebaseRef("hotbars");
    var _geoFire = new GeoFire(_hotbarRef);

    $ionicLoading.show();
    _geoFire.get($stateParams.hotbarId).then(function(loc) {
      _hotbarRef.child($stateParams.hotbarId).once("value", function(snapshot) {
        var hotbar = snapshot.val();
        hotbar.location = loc;
        $timeout(function() {
          $scope.hotbar = hotbar;
          $ionicLoading.hide();
        });
      }, function(err) {
        $log.error("Get hotbar error: ", err);
        $ionicLoading.hide();
      });
    });
  });
