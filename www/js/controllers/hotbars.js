// hotbar.controllers.HotBarsCtrl

angular.module("hotbar.controllers")
  .controller("HotBarsCtrl", function($scope, $log, $timeout, $ionicLoading, $q, GeoService) {

    var currentUser = Parse.User.current();
    var _infowindow = new google.maps.InfoWindow();
    var _markers = [];

    $scope.search = {
      content: ""
    };

    function getGooglePlaceDetails(hotbar) {
      if (hotbar.get("googlePlaceId")) {
        var request = {
          placeId: hotbar.get("googlePlaceId")
        };
        // console.assert(_map);
        var service = new google.maps.places.PlacesService(document.getElementById("hotbar"));
        service.getDetails(request, function(place, status) {
          if (status == google.maps.places.PlacesServiceStatus.OK) {
            hotbar.rating = place.rating;
            hotbar.openHours = place.opening_hours;
          }
        });
      }
      GeoService.getDistance(hotbar.get("location"), function(err, distance) {
        if (err) {
          $log.error("Getting hotbar distance error: ", status);
        } else {
          hotbar.distance = Math.round(distance*10)/10;
        }
      });
    }

    function getFollowers(hotbar) {
      var dfd = $q.defer();
      var hotbarRelation = hotbar.relation("followers");
      hotbarRelation.query().find({
        success: function(list) {
          hotbar.followers = list;
          list.forEach(function(user) {
            if (user.id == currentUser.id)
              hotbar.following = true;
          });
          dfd.resolve(hotbar);
        },
        error: function(error) {
          $log.error("Get hotbar's number of followers error: ", error);
          dfd.reject(error);
        }
      });
      return dfd.promise;
    }

    function updateHotbars() {
      for (var i = 0; i < $scope.hotbars.length; ++i) {
        var hotbar = $scope.hotbars[i];
        getFollowers(hotbar).then(getGooglePlaceDetails(hotbar));
      }
      if ($scope.hotbars.length == 0) {
        findBarsOnMap();
      }
      createBarMarkers();
    }

    $scope.mapCreated = function(map) {
      $scope.map = map;
      $scope.doRefresh();
    };

    $scope.doRefresh = function() {
      $ionicLoading.show();
      GeoService.getPosition(function(err, position) {
        // alert("Current position: " + JSON.stringify(position));
        if (err) {
          $log.error("Getting position error: ", err);
          $ionicLoading.hide();
        } else {
          var pos = new google.maps.LatLng(position.latitude, position.longitude);
          $scope.map.setCenter(pos);
          var marker = new google.maps.Marker({
            map: $scope.map,
            position: pos,
            icon: "http://www.google.com/mapfiles/arrow.png"
          });
        }
      });

      GeoService.getPosition(function(err, position) {
        if (err) {
          $log.error("Get current position error: ", err);
          $ionicLoading.hide();
        } else {
          var pos = new google.maps.LatLng(position.latitude, position.longitude);
          $scope.map.setCenter(pos);
          var marker = new google.maps.Marker({
            map: $scope.map,
            position: pos,
            icon: "http://www.google.com/mapfiles/arrow.png"
          });
          var HotBar = Parse.Object.extend("HotBar");
          var query = new Parse.Query(HotBar);
          var point = new Parse.GeoPoint(position.latitude, position.longitude);
          var distance = (currentUser.get("radius") || 1609) / 1609;
          query.withinMiles("location", point, distance).find({
            success: function(hotbars) {
              $timeout(function() {
                $scope.hotbars = hotbars;
                updateHotbars();
                $ionicLoading.hide();
                $scope.$broadcast('scroll.refreshComplete');
              });
            },
            error: function(error) {
              $log.error("Getting hotbars error: ", error);
              $ionicLoading.hide();
              $scope.$broadcast('scroll.refreshComplete');
            }
          });
        }
      });
    };

    // $scope.doRefresh();

    // The following section was used to add current position as a hotbar
    /* var HotBar = Parse.Object.extend("HotBar");
    var hotbar1 = new HotBar();
    hotbar1.set("address", "20 Arch Street, Shresbury, MA 01545");
    hotbar1.set("name", "HotBar002");
    hotbar1.set("region", "Metro West");
    hotbar1.set("nameLowercase", "hotbar002");
    var geocoder = new google.maps.Geocoder();
    geocoder.geocode({'address': hotbar1.get("address")}, function(results, status) {
      if (status == google.maps.GeocoderStatus.OK) {
        var loc = {
          latitude: results[0].geometry.location.lat(),
          longitude: results[0].geometry.location.lng()
        };
        hotbar1.set("location", new Parse.GeoPoint(loc));
      }
      hotbar1.save(null, {
        success: function(hotbar1) {
          console.log("New hotbar created with objectId: ", hotbar1.id);
        },
        error: function(hotbar1, error) {
          console.error("Failed to create new hotbar, with error code: ", error.message);
        }
      });
    }); */

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
//          $timeout(function() {
            updateHotbars();
            $ionicLoading.hide();
//          });
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
          createBarMarkers();
        });
      }
    };

    function findBarsCallback(results, status) {
      $timeout(function(){
        $scope.bars = results;
        if (status == google.maps.places.PlacesServiceStatus.OK) {
          for (var i = 0; i < results.length; i++) {
            createMarker (results[i],
              "http://maps.google.com/mapfiles/ms/icons/blue-dot.png");
            var point = new Parse.GeoPoint(results[i].geometry.location.lat(),
                                           results[i].geometry.location.lng());
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
        map: $scope.map,
        position: loc
      });
      if (icon) {
        marker.setIcon(icon);
      }
      _markers.push(marker);

      google.maps.event.addListener(marker, 'click', function() {
        _infowindow.setContent(bar.name);
        _infowindow.open($scope.map, this);
      });
    }

    function findBarsOnMap() {
      var loc = new google.maps.LatLng(GeoService.position().latitude,
                                       GeoService.position().longitude);
      var _radius = currentUser.get("radius");
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
    function($scope, $stateParams, $log, $timeout, $ionicLoading, $rootScope, GeoService) {
      var currentUser = Parse.User.current();
      var _infowindow = new google.maps.InfoWindow();
      var _relation = currentUser.relation("following");

      $scope.mapCreated = function(map) {
        $scope.map = map;
      };

      function createMarker(bar) {
        var marker = new google.maps.Marker({
          map: $scope.map,
          position: new google.maps.LatLng(bar.location.latitude,
                                           bar.location.longitude)
        });

        google.maps.event.addListener(marker, 'click', function() {
          _infowindow.setContent("<h2>" + bar.name + "</h2><p>" +
          bar.address+"</p>");
          _infowindow.open($scope.map, this);
        });
        $scope.map.panTo(new google.maps.LatLng(bar.location.latitude, bar.location.longitude));
        GeoService.getDistance(bar.location, function(err, distance) {
          if (err) {
            $log.error("Getting bar distance error: ", err);
          } else {
            $timeout(function() {
              $scope.hotbar.distance = Math.round(distance*10)/10;
            });
          }
        });
      }

      function getGooglePlaceDetails(hotbar) {
        if (hotbar.placeId) {
          var request = {
            placeId: hotbar.placeId
          };
          var service = new google.maps.places.PlacesService($scope.map);
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
                if (user.id == currentUser.id) {
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

      var stop;
      function getNews(hotbar) {
        if (hotbar) {
          var News = Parse.Object.extend("News");
          var query = new Parse.Query(News);
          query.equalTo("hotbar", hotbar._data);
          query.descending("createdAt");
          query.find({
            success: function(news) {
              if (news.length > 0) {
                var length = Math.min(3, news.length);
                var index = 0;
                $timeout(function() {
                  $scope.news = {
                    content: news[index].get("content")
                  }
                  index++;
                });
                stop = $interval(function() {
                  var i = index % news.length;
                  $scope.news = {
                    content: news[i].get("content")
                  };
                  index++;
                }, 3000);
              }
            },
            error: function(error) {
              $log.error("Get hotbar news error: ", error);
            }
          });
        }
      }

      $scope.$on("$destroy", function() {
        if (stop) {
          $interval.cancel(stop);
        }
      });

      $scope.toggleFollow = function() {
        var hotbarRelation = $scope.hotbar._data.relation("followers");
        var userRelation = currentUser.relation("following");
        if ($scope.hotbar.following) { // already following, unfollow
          userRelation.remove($scope.hotbar._data);
          hotbarRelation.remove(currentUser);
          $scope.hotbar.following = false;
          for (var i = 0; i < $scope.hotbar.followers.length; ++i) {
            if ($scope.hotbar.followers[i].id == currentUser.id) {
              $scope.hotbar.followers.splice(i, 1);
              break;
            }
          }
        } else {
          userRelation.add($scope.hotbar._data);
          hotbarRelation.add(currentUser);
          $scope.hotbar.following = true;
          $scope.hotbar.followers.push(currentUser);
        }
        currentUser.save();
        $scope.hotbar._data.save();
      };

      $scope.openLink = function() {
        window.open($scope.hotbar.url, '_blank', 'location=yes');
      };

      /* $scope.map = {
        center: {
          latitude:  GeoService.position().latitude,
          longitude: GeoService.position().longitude
        },
        zoom: 16,
        events: {
          tilesloaded: function (map) {
            _map = map;
            if (!$scope.hotbar)
              getRegularBar();
          }
        }
      }; */

      function getRegularBar() {
        var request = {
          placeId: $stateParams.hotbarId
        };
        var service = new google.maps.places.PlacesService($scope.map);
        service.getDetails(request, function(place, status) {
          if (status == google.maps.places.PlacesServiceStatus.OK) {
            var pos = {
              latitude: place.geometry.location.lat(),
              longitude: place.geometry.location.lng()
            };
            $timeout(function() {
              $scope.hotbar = {
                name: place.name,
                address: place.vicinity,
                rating: place.rating,
                openHours: place.opening_hours,
                url: place.website,
                location: pos,
                isHotbar: false
              };
              createMarker($scope.hotbar);
            });
          }
        });
      }

      var HotBar = Parse.Object.extend("HotBar");
      var query = new Parse.Query(HotBar);
      query.get($stateParams.hotbarId, {
        success: function(hotbar) {
          $scope.hotbar = {
            name: hotbar.get("name"),
            address: hotbar.get("address"),
            url: hotbar.get("url"),
            location: hotbar.get("location"),
            placeId: hotbar.get("placeId"),
            isHotbar: true,
            _data: hotbar
          };
          getFollowers($scope.hotbar);
          getNews($scope.hotbar);
          // Get hotbar posts
          var _posts = [];
          var Post = Parse.Object.extend("Post");
          var query = new Parse.Query(Post);
          query.equalTo("hotbar", hotbar);
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
          $timeout(function() {
            createMarker($scope.hotbar);
            getGooglePlaceDetails($scope.hotbar);
          }, 1000);
        },
        error: function(error) {
          $log.error("Getting HotBar error: ", error);
        }
      });

      function getUser(post) {
        var user = post.get("user");
        user.fetch({
          success: function(obj) {
            var profilePicture = obj.get("profilePictureThumbnail");
            if (profilePicture) {
              profilePicture = profilePicture.url();
            } else {
              profilePicture = "http://www.stay.com/images/default-user-profile.png";
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

  });
