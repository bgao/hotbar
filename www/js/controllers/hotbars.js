"use strict";

angular.module("hotbar.controllers")
  .controller("HotBarsCtrl", function($scope, $log, $timeout, $ionicLoading, $rootScope, GeoService, HotBars) {
    var _position = GeoService.getPosition();
    var _user = Parse.User.current();

    var _infowindow = new google.maps.InfoWindow();
    var _map;

    $ionicLoading.show();
    HotBars.all(function(err, hotbars) {
      if (err) {
        $log.error("HotBars all error: ", err);
        $ionicLoading.hide();
      } else {
        $timeout(function() {
          $scope.hotbars = hotbars;
          $rootScope.hotbars = hotbars;
          $ionicLoading.hide();
        });
        hotbars.forEach(function(hotbar) {
          getFollowers(hotbar);
        });
      }
    });

    $scope.map = {
      center: _position,
      zoom: 14,
      events: {
        tilesloaded: function (map) {
          _map = map;
          $timeout(createBarMarkers, 1000); // delay 2 seconds
        }
      }
    };

    $scope.getBarDistance = function(hotbar) {
      return GeoService.getDistance(hotbar.get("location")).toFixed(2);
    };

    function getFollowers(hotbar) {
      var hotbarRelation = hotbar.relation("followers");
      hotbarRelation.query().find({
        success: function(list) {
          hotbar.followers = list;
          list.forEach(function(user) {
            if (user.id == _user.id) {
              hotbar.following = true;
            }
          });
        },
        error: function(error) {
          $log.error("Get hotbar's number of followers error: ", error);
        }
      });
    }

    function hotbarDetailCallback(results, status) {
      if (status == google.maps.places.PlacesServiceStatus.OK) {
        $log.debug(results[0]);
      }
    }

    function getHotbarDetails(hotbar) {
      var point = hotbar.get("location");
      var request = {
        location: new google.maps.LatLng(point.latitude, point.longitude),
        radius: 10, // 10 meters
        types: ['bar'],
        rankby: 'distance'
      };
      var service = new google.maps.places.PlacesService(_map);
      service.nearbySearch(request, hotbarDetailCallback);
    }

    function findBarsCallback(results, status) {
      $timeout(function(){
        $scope.bars = results;
        if (status == google.maps.places.PlacesServiceStatus.OK) {
          for (var i = 0; i < results.length; i++) {
            createMarker (results[i],
              "http://maps.google.com/mapfiles/ms/icons/blue-dot.png");
          }
        }
      });
    }
    
    function createMarker(bar, icon) {
      console.assert(bar != null);
      var loc = (bar.geometry && bar.geometry.location) || (bar.get("location") &&
        new google.maps.LatLng(bar.get("location").latitude,
                               bar.get("location").longitude));
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
      var loc = new google.maps.LatLng(_position.latitude, _position.longitude);
      var request = {
        location: loc,
        radius: _user.radius || 1609, // 1 mile = 1609 meters
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
          createMarker($scope.hotbars[i]); 
//            "http://maps.google.com/mapfiles/ms/icons/red-dot.png");
        }
      } else {
        // markers for other bars
        findBarsOnMap();
      }
    }
  })
  .controller("HotBarDetailCtrl", 
    function($scope, $stateParams, $log, $timeout, $ionicLoading, $rootScope, GeoService, Users) {

      var _infowindow = new google.maps.InfoWindow();
      var _map;
      var _user = Parse.User.current();
      var _relation = _user.relation("following");

      function createMarker(bar) {
        var marker = new google.maps.Marker({
          map: _map,
          position: new google.maps.LatLng(bar.get("location").latitude,
            bar.get("location").longitude)
        });
         
        google.maps.event.addListener(marker, 'click', function() {
          _infowindow.setContent("<h2>" + bar.get("name") + "</h2><p>" +
          bar.get("address")+"</p>");
          _infowindow.open(_map, this);
        });
      }

      $scope.toggleFollow = function() {
        var hotbarRelation = $scope.hotbar.relation("followers");
        var userRelation = _user.relation("following");
        if ($scope.hotbar.following) { // already following, unfollow
          userRelation.remove($scope.hotbar);
          hotbarRelation.remove(_user);
          $scope.hotbar.following = false;
          for (var i = 0; i < $scope.hotbar.followers.length; ++i) {
            if ($scope.hotbar.followers[i].id == _user.id) {
              $scope.hotbar.followers.splice(i, 1);
              break;
            }
          }
        } else {
          userRelation.add($scope.hotbar);
          hotbarRelation.add(_user);
          $scope.hotbar.following = true;
          $scope.hotbar.followers.push(_user);
        }
        _user.save();
        $scope.hotbar.save();
      };

      $scope.getBarDistance = function(hotbar) {
        return GeoService.getDistance(hotbar.get("location")).toFixed(2);
      };

      for (var i = 0; i < $rootScope.hotbars.length; ++i) {
        if ($rootScope.hotbars[i].id == $stateParams.hotbarId) {
          $scope.hotbar = $rootScope.hotbars[i];
          break;
        }
      }

      $scope.map = {
        center: {
          latitude: $scope.hotbar.get("location").latitude,
          longitude: $scope.hotbar.get("location").longitude
        },
        zoom: 16,
        events: {
          tilesloaded: function (map) {
            _map = map;
            createMarker($scope.hotbar);
          }
        }
      };

      // Get hotbar posts
      $scope.hotbar.posts = [];
      var Post = Parse.Object.extend("Post");
      var query = new Parse.Query(Post);
      query.equalTo("hotbar", $scope.hotbar);
      query.descending("createdAt");
      query.find({
        success: function(posts) {
          for (var i = 0; i < posts.length; ++i) {
            posts[i].media = posts[i].get("media");
            getUser(posts[i]);
            $scope.hotbar.posts.push(posts[i]);
          }
        },
        error: function(error) {
          $log.error("Getting hotbar posts error: ", error);
        }
      });

      function getUser(post) {
      Users.get(post.get("user").id, function(err, user) {
        if (err) {
          $log.error("Getting post user error: ", error);
        } else {
          $timeout(function(){
            post.user = {
              displayName: user.get("displayName"),
              email: user.get("email"),
              picture: user.get("picture")
            };  
          });
        }
      });
    }
      /* HotBars.get($stateParams.hotbarId, function(err, hotbar) {
        if (err) {
          $log.error("HotBars get error: ", err);
          $ionicLoading.hide();
        } else {
          $timeout(function() {
            $scope.hotbar = hotbar;
            $ionicLoading.hide();
          });
        }
      }); */
      
  });
