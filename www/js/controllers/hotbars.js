"use strict";

angular.module("hotbar.controllers")
  .controller("HotBarsCtrl", function($scope, $log, $timeout, $ionicLoading, GeoService, HotBars) {
    var _position = GeoService.getPosition();
    var _user = Parse.User.current();

    /* var _infowindow = new google.maps.InfoWindow();
    var _map;
    var _markers = [];

    $scope.map = {
      center: _position,
      zoom: 14,
      panControl: false,
      zoomControl: false,
      scaleControl: false,
      mapTypeControl: false,
      streetViewControl: false,
      events: {
        tilesloaded: function (map) {
          _map = map;
        }
      }
    }; */

    $ionicLoading.show();

    HotBars.all(function(err, hotbars) {
      if (err) {
        $log.error("HotBars all error: ", err);
        $ionicLoading.hide();
      } else {
        $scope.hotbars = hotbars;
        $timeout(function() {
          updateHotbars();
          $ionicLoading.hide();
        });
      }
    });

    // The following section was used to add lower case name field
    /* var HotBar = Parse.Object.extend("HotBar");
    var query = new Parse.Query(HotBar);
    query.limit(300);
    var _hotbars;
    $ionicLoading.show();
    query.find({
      success: function(hotbars) {
        var i = 0;
        var interval = setInterval(function() {
          var hotbar = hotbars[i];
          hotbar.set("nameLowercase", hotbar.get("name").toLowerCase());
          hotbar.save();
          ++i;
          if (i == hotbars.length) {
            clearInterval(interval);
            $ionicLoading.hide();
          }
        }, 1000);
      },
      error: function(error) {
        $log.error("Get all hotbars error: ", error);
      }
    }); */

    // The following section was used to get google place id for HotBars
    /* var numFound = 0;
    function getHotbarDetails(hotbar) {
      var point = hotbar.get("location");
      var request = {
        location: new google.maps.LatLng(point.latitude, point.longitude),
        radius: 50, // 10 meters
        types: ['bar'],
        rankby: 'distance'
      };

      _placeService.nearbySearch(request, function(results, status) {
        $log.debug(status);
        if (status == google.maps.places.PlacesServiceStatus.OK) {
          if (results[0].name.contains(hotbar.get("name")) ||
            hotbar.get("name").contains(results[0].name)) {
            $log.debug("Found ", results[0].name);
            hotbar.set("name", results[0].name);
            hotbar.set("googlePlaceId", results[0].place_id);
            hotbar.save();
            numFound++;
            $log.debug("Found " + numFound + " so far");
          }
        }
      });
    }

    var HotBar = Parse.Object.extend("HotBar");
    var query = new Parse.Query(HotBar);
    query.limit(300);
    var _hotbars;
    query.find({
      success: function(hotbars) {
        var i = 0;
        var interval = setInterval(function() {
          var hotbar = hotbars[i];
          getHotbarDetails(hotbar);
          ++i;
          if (i == hotbars.length) {
            clearInterval(interval);
          }
        }, 1000);
      },
      error: function(error) {
        $log.error("Get all hotbars error: ", error);
      }
    }); */

    $scope.search = {
      content: ""
    };
    $scope.searchHotbar = function(name) {
      $ionicLoading.show();
      var HotBar = Parse.Object.extend("HotBar");
      var query = new Parse.Query(HotBar);
      query.contains("nameLowercase", name.toLowerCase());
      query.find({
        success: function(hotbars) {
          if (!$scope.oldhotbars)
            $scope.oldhotbars = $scope.hotbars;
          $scope.hotbars = hotbars;
          $timeout(function() {
            updateHotbars();
            $ionicLoading.hide();
          });
        },
        error: function(error) {
          $log.error("Search hotbar error: ", error);
        }
      });
    };

    $scope.clearSearch = function() {
      $scope.search.content = "";
      if ($scope.oldhotbars) {
        $timeout(function() {
          $scope.hotbars = $scope.oldhotbars;
          $scope.oldhotbars = null;
          // createBarMarkers();
        });  
      }
    };

    function updateHotbars() {
      for (var i = 0; i < $scope.hotbars.length; ++i) {
        var hotbar = $scope.hotbars[i];
        hotbar.distance = GeoService.getDistance(hotbar.get("location")).toFixed(2);
        getFollowers(hotbar);
        getGooglePlaceDetails(hotbar);
      }
      if ($scope.hotbars.length == 0) {
        findBarsOnMap();
      }
      // createBarMarkers();
    }

    function getGooglePlaceDetails(hotbar) {
      if (hotbar.get("googlePlaceId")) {
        var request = {
          placeId: hotbar.get("googlePlaceId")
        };
        // console.assert(_map);
        var service = new google.maps.places.PlacesService(document.getElementById("hotbar"));
        service.getDetails(request, function(place, status) {
          if (status == google.maps.places.PlacesServiceStatus.OK) {
            $timeout(function() {
              hotbar.rating = place.rating;
              hotbar.openHours = place.opening_hours;
            });          
          }
        });
      }
    }

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

    function findBarsCallback(results, status) {
      $timeout(function(){
        $scope.bars = results;
        if (status == google.maps.places.PlacesServiceStatus.OK) {
          for (var i = 0; i < results.length; i++) {
            /* createMarker (results[i],
              "http://maps.google.com/mapfiles/ms/icons/blue-dot.png"); */
            var point = new Parse.GeoPoint(results[i].geometry.location.lat(),
                                           results[i].geometry.location.lng());
            results[i].distance = GeoService.getDistance(point).toFixed(2);
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
      _markers.push(marker);
      
      google.maps.event.addListener(marker, 'click', function() {
        _infowindow.setContent(bar.name);
        _infowindow.open(_map, this);
      });
    }

    function findBarsOnMap() {
      var loc = new google.maps.LatLng(_position.latitude, _position.longitude);
      var _radius = _user.get("radius");
      var request = {
        location: loc,
        radius: _radius,
        types: ['bar'],
        rankby: google.maps.places.RankBy.DISTANCE
      };
      var service = new google.maps.places.PlacesService(document.getElementById("hotbar"));
      service.nearbySearch(request, findBarsCallback);
    }

    function createBarMarkers() {
      // Clear existing markers;
      if (_markers.length > 0) {
        for (var i = 0; i < _markers.length; i++) {
          _markers[i].setMap(null);
        }
        _markers = [];
      }
      // markers for hotbars
      if ($scope.hotbars.length > 0) {
        for (var i = 0; i < $scope.hotbars.length; ++i) {
          createMarker($scope.hotbars[i]); 
        }
      } else {
        // markers for other bars
        findBarsOnMap();
      }
    }
  })
  .controller("HotBarDetailCtrl", 
    function($scope, $stateParams, $log, $timeout, $ionicLoading, $rootScope, GeoService, HotBars) {

      var _infowindow = new google.maps.InfoWindow();
      var _map;
      var _user = Parse.User.current();
      var _relation = _user.relation("following");

      function createMarker(bar) {
        var marker = new google.maps.Marker({
          map: _map,
          position: new google.maps.LatLng(bar.location.latitude,
            bar.location.longitude)
        });
         
        google.maps.event.addListener(marker, 'click', function() {
          _infowindow.setContent("<h2>" + bar.name + "</h2><p>" +
          bar.address+"</p>");
          _infowindow.open(_map, this);
        });
        _map.panTo(new google.maps.LatLng(bar.location.latitude, bar.location.longitude));
      }

      function getGooglePlaceDetails(hotbar) {
        if (hotbar.placeId) {
          var request = {
            placeId: hotbar.placeId
          };
          // console.assert(_map);
          var service = new google.maps.places.PlacesService(_map);
          service.getDetails(request, function(place, status) {
            if (status == google.maps.places.PlacesServiceStatus.OK) {
              hotbar.rating = place.rating;
              hotbar.openHours = place.opening_hours;
            }
          });
        }
      }

      function getFollowers(hotbar) {
        if (hotbar) {
          var hotbarRelation = hotbar._data.relation("followers");
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
      }

      $scope.toggleFollow = function() {
        var hotbarRelation = $scope.hotbar._data.relation("followers");
        var userRelation = _user.relation("following");
        if ($scope.hotbar.following) { // already following, unfollow
          userRelation.remove($scope.hotbar._data);
          hotbarRelation.remove(_user);
          $scope.hotbar.following = false;
          for (var i = 0; i < $scope.hotbar.followers.length; ++i) {
            if ($scope.hotbar.followers[i].id == _user.id) {
              $scope.hotbar.followers.splice(i, 1);
              break;
            }
          }
        } else {
          userRelation.add($scope.hotbar._data);
          hotbarRelation.add(_user);
          $scope.hotbar.following = true;
          $scope.hotbar.followers.push(_user);
        }
        _user.save();
        $scope.hotbar._data.save();
      };

      $scope.getBarDistance = function(hotbar) {
        if (hotbar) {
          return GeoService.getDistance(hotbar.location).toFixed(2);
        } else {
          return 0;
        }
      };

      $scope.openLink = function() {
        window.open($scope.hotbar.url, '_blank', 'location=yes');
      };

      $scope.map = {
        center: {
          latitude: GeoService.getPosition().latitude,
          longitude: GeoService.getPosition().longitude
        },
        zoom: 16,
        events: {
          tilesloaded: function (map) {
            _map = map;
            if (!$scope.hotbar)
              getRegularBar();
          }
        }
      };

      function getRegularBar() {
        var request = {
          placeId: $stateParams.hotbarId
        };
        var service = new google.maps.places.PlacesService(_map);
        service.getDetails(request, function(place, status) {
          if (status == google.maps.places.PlacesServiceStatus.OK) {
            $timeout(function() {
              $scope.hotbar = {
              name: place.name,
              address: place.vicinity,
              rating: place.rating,
              openHours: place.opening_hours,
              url: place.website,
              location: {
                latitude: place.geometry.location.lat(),
                longitude: place.geometry.location.lng()
              },
              isHotbar: false
            };
            createMarker($scope.hotbar);
            });
          }
        });
      }

      HotBars.get($stateParams.hotbarId, function(err, data) {
        if (err) {
          $log.debug("No HotBar found");
        } else {
          // $timeout(function() {
            $scope.hotbar = {
              name: data.get("name"),
              address: data.get("address"),
              url: data.get("url"),
              location: data.get("location"),
              placeId: data.get("placeId"),
              isHotbar: true,
              _data: data
            };
            getFollowers($scope.hotbar);
            // Get hotbar posts
            var _posts = [];
            var Post = Parse.Object.extend("Post");
            var query = new Parse.Query(Post);
            query.equalTo("hotbar", data);
            query.descending("createdAt");
            query.find({
              success: function(posts) {
                for (var i = 0; i < posts.length; ++i) {
                  getMedia(posts[i]);
                  getUser(posts[i]);
                  _posts.push(posts[i]);
                }
                $timeout(function() {
                  $scope.hotbar.posts = _posts;
                });
              },
              error: function(error) {
                $log.error("Getting hotbar posts error: ", error);
              }
            });
          // });
          $timeout(function() {
            createMarker($scope.hotbar);
            getGooglePlaceDetails($scope.hotbar);
          }, 1000);
        }
      });

      function getUser(post) {
        var user = post.get("user");
        user.fetch({
          success: function(obj) {
            var profilePicture = obj.get("profilePicture");
            if (profilePicture) {
              profilePicture = profilePicture.url();
            } else {
              profilePicture = obj.get("picture");
            }
            $timeout(function() {
              post.user = {
                displayName: obj.get("displayName"),
                email: obj.get("email"),
                picture: profilePicture,
                id: obj.id
              };
            });
          },
          error: function(error) {
            $log.error("Fetch user error: ", error);
          }
        });
      }
      function getMedia(post) {
        var media = post.get("media");
        media.fetch({
          success: function(obj) {
            $timeout(function() {
              post.media = {
                description: obj.get("description"),
                url: obj.get("url"),
                thumbnailUrl: obj.get("thumbnailUrl"),
                type: obj.get("type")
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
