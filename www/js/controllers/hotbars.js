angular.module('hotbar.controllers')
  .controller('HotBarsCtrl', function($scope, $ionicLoading, $log, $timeout,
                                      $rootScope, HotBars, Global) {
    var _infowindow = new google.maps.InfoWindow();
    var _map;
    
    var rad = function(x) {
      return x*Math.PI/180;
    }

    $rootScope.getDistance = function(p1, p2) {
      var R = 6378137; // Earth's mean radiu in meter
      var dLat = rad(p2.lat() - p1.lat());
      var dLng = rad(p2.lng() - p1.lng());
      var a = Math.sin(dLat / 2)*Math.sin(dLat / 2)+
        Math.cos(rad(p1.lat())) * Math.cos(rad(p2.lat())) *
        Math.sin(dLng / 2) * Math.sin(dLng / 2);
      var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
      var d = R * c;
      return (d/1600).toFixed(2); // returns the distance in miles
    }

    $scope.getBarDistance = function(bar) {
      var loc = (bar.geometry && bar.geometry.location) ||
        new google.maps.LatLng(bar.location.latitude,
                               bar.location.longitude);
      return $rootScope.getDistance(Global.get("position"), loc);
    }

    function findBarsCallback(results, status) {
      $timeout(function(){
        $scope.bars = results;
        if (status == google.maps.places.PlacesServiceStatus.OK) {
          for (var i = 0; i < results.length; i++) {
            createMarker
            (_map,
             results[i],
             "http://maps.google.com/mapfiles/ms/icons/blue-dot.png");
          }
        }
        $ionicLoading.hide();
      });
    }
    
    function createMarker(map, bar, icon) {
      console.assert(bar != null);
      var loc = (bar.geometry && bar.geometry.location) ||
        new google.maps.LatLng(bar.location.latitude,
                               bar.location.longitude);
      var marker = new google.maps.Marker({
        map: map,
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

    function findBarsOnMap(map) {
      _map = map;
      var request = {
        location: Global.get("position"),
        radius: Global.get("radius"),
        types: ['bar'],
        rankby: 'distance'
      };
      var service = new google.maps.places.PlacesService(map);
      service.nearbySearch(request, findBarsCallback);
    }

    function createBarMarkers(map, bars, icon) {
      console.assert(map != null && map != undefined);
      console.assert(bars != null && bars != undefined);
      if (map && bars) {
        for (var i = 0; i < bars.length; ++i) {
          var bar = bars[i];
          createMarker(map, bar, icon);
        }
      }
    }

    $scope.map = {
      center: {
        latitude: Global.get("position").lat(),
        longitude: Global.get("position").lng()
      },
      zoom: 14,
      events: {
        tilesloaded: function (map) {
          // Search for other bars if no hotbar found
          if ($scope.hotbars.length == 0) {
            findBarsOnMap(map);
          }
          createBarMarkers
          (map,
           $scope.hotbars,
           "http://maps.google.com/mapfiles/ms/icons/red-dot.png");
        }
      }
    };

    function createDemoHotbar() {
      var _hotbars = $scope.hotbars || [];
      var geocoder = new google.maps.Geocoder();
      var loc = Global.get("position");
      var uuid = "3de502ba-1408-11e4-8c3e-a754a9c45b40";
      HotBars.get(uuid, function(err, entity) {
        if (err) {
          $log.error("HotBarsCtrl::createDemoHotbar error");
          $log.error(err);
        } else {
          geocoder.geocode({'latLng': loc}, function(results, status) {
            if (status == google.maps.GeocoderStatus.OK) {
              if (results[1]) {
                var hotbar = {
                  uuid: entity.get("uuid"),
                  name: entity.get("name"),
                  address: results[1].formatted_address,
                  url: entity.get("url"),
                  location: {
                    latitude: loc.lat(),
                    longitude: loc.lng()
                  },
                  coverpicture: entity.get("coverpicture") || "img/hotbarcoverpicture.jpg"
                };
                
                if (_hotbars.length == 0) {
                  $timeout(function() {
                    _hotbars.push(hotbar);
                    $scope.hotbars = _hotbars
                      .concat($scope.hotbars || []);
                    $scope.getFollowers();
                    $rootScope.hotbars = $scope.hotbars;
                  });
                }
              }
            } else {
              $log.error("Error geocoding location");
              $log.error(loc);
            }
          });
        }
      });
    }

    $scope.getFollowers = function() {
      for (var i = 0; i < $scope.hotbars.length; ++i) {
        var bar = $scope.hotbars[i];
        HotBars.getFollowers(bar, function(err, entities) {
          $timeout(function() {
            bar.followers = entities;
          });
        });
      }
    };

    $scope.loadMore = function() {
      if ($scope._hotbars && $scope._hotbars.hasNextPage()) {
        $ionicLoading.show({
          template: "<i class=\"icon ion-loading-a\"></i> Loading..."
        });
        
        var _hotbars = [];
        $scope._hotbars.getNextPage(function (err, data, entities) {
          while (entities.hasNextEntity()) {
            var hotbar = entities.getNextEntity();
            var adr = hotbar.get("adr");
            var _hotbar = {
              uuid: hotbar.get("uuid"),
              name: hotbar.get("name"),
              address: adr.addr1 + ", " + adr.city + ", " + adr.state + " " + adr.zip,
              url: hotbar.get("url"),
              location: hotbar.get("location")
            };
            _hotbars.push(_hotbar);
          }
        });
        $timeout(function() {
          $scope.hotbars = ($scope.hotbars||[]).concat(_hotbars);
          $rootScope.hotbars = $scope.hotbars;
          // $scope.$broadcast('scroll.infiniteScrollComplete');
          // $scope.$broadcast('scroll.resize');
          $ionicLoading.hide();
        });
      }
    };

    (function () {
      $ionicLoading.show({
        template: "<i class=\"icon ion-loading-a\"></i> Loading..."
      });

      // Add a hotbar for demo
      if (Global.demo) {
        createDemoHotbar();
      }

      HotBars.all(function(err, hotbars) {
        $scope._hotbars = hotbars;
        var _hotbars = [];
        if (err) {
          $log.error("BarsCtrl::all: " + err);
        } else {
          while (hotbars.hasNextEntity()) {
            var hotbar = hotbars.getNextEntity();
            var adr = hotbar.get("adr");
            var _hotbar = {
              uuid: hotbar.get("uuid"),
              name: hotbar.get("name"),
              address: adr.addr1 + ", " + adr.city + ", " + adr.state + " " + adr.zip,
              url: hotbar.get("url"),
              location: hotbar.get("location")
            };
            _hotbars.push(_hotbar);
          }
        }
        $timeout(function() {
          $scope.hotbars = ($scope.hotbars || []).concat(_hotbars);
          $rootScope.hotbars = $scope.hotbars;
          $scope.getFollowers();
          $ionicLoading.hide();
        });
      });
    })();
  })

  .controller('HotBarDetailCtrl', function($scope, $stateParams, $ionicLoading, $log,
                                           $rootScope, $timeout, HotBars, Activities,
                                           Global) {
    /* var _infowindow = new google.maps.InfoWindow();
       var _map;
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
       } */

    $scope.toggleFollow = function() {
      $ionicLoading.show({
        template: '<i class=\"icon ion-loading-a\"></i> Loading...'
      });
      HotBars.toggleFollow($scope.hotbar, function(err, result) {
        if (err) {
          $log.error("BarDetailCtrl::follow: " + err);
        } else {
          HotBars.getFollowers(result.getEntity(), function(err, entities) {
            $timeout(function() {
              $scope.hotbar.followers = entities;
              $scope.hotbar.following = !$scope.hotbar.following;
            });
            $ionicLoading.hide();
          });
        }
      });
    };
    $scope.openLink = function(url) {
      var ref = window.open(url, '_blank');
      ref.addEventListener('loadstart', function(event) { $log.debug(event.url); });
    };

    $scope.getBarDistance = function(bar) {
      var loc = (bar.geometry && bar.geometry.location) ||
        new google.maps.LatLng(bar.location.latitude,
                               bar.location.longitude);
      return $rootScope.getDistance(Global.get("position"), loc);
    };

    (function() {
      $ionicLoading.show({
        template: '<i class=\"icon ion-loading-a\"></i> Loading...'
      });
      var _user = Global.get("user");
      HotBars.get($stateParams.hotbarId, function(err, entity) {
        if (err) {
          $log.error("HotBarsCtrl::init::HotBars.get:");
          $log.error(err);
        } else {
          $scope.hotbar = {
            uuid: entity.get("uuid"),
            name: entity.get("name"),
            address: entity.get("address") || $rootScope.hotbars[0].address,
            url: entity.get("url"),
            location: entity.get("location") || $rootScope.hotbars[0].location,
            coverpicture: entity.get("coverpicture") || "img/hotbarcoverpicture.jpg",
            following: false
          };

          // get followers
          HotBars.getFollowers($scope.hotbar, function(err, entities) {
            if (err) {
              $log.error("HotBarsCtrl::init::HotBars.getFollowers:");
              $log.error(err);
            } else {
              $scope.hotbar.followers = entities;
              // initialize following
              for (var i = 0; i < $scope.hotbar.followers.length; ++i) {
                var follower = $scope.hotbar.followers[i];
                if (_user.get("uuid") == follower.uuid) {
                  $scope.hotbar.following = true;
                  break;
                }
              }
            }
          });

          // get hotbar media
          Activities.getByHotbar($scope.hotbar, function(err, entities) {
            if (err) {
              $log.error("HotBarDetailCtrl::Activities.getByHotbar");
              $log.error(err);
              $ionicLoading.hide();
            } else {
              var _activities = [];
              while (entities.hasNextEntity()) {
                var entity = entities.getNextEntity();
                // Only media activity has an "object"
                if (!entity.get('object'))
                  continue;
                var actor = entity.get('actor');
                var _activity = {
                  uuid: entity.get('uuid'),
                  created: entity.get('created'),
                  name: actor.displayName || 'Anonymous',
                  username: actor.displayName,
                  avatar: actor.picture,
                  media: entity.get('object'),
                  comments: entity.get('comments') || [],
                  hotbar: entity.get('hotbar')
                };
                _activities.push(_activity);
              }
              $timeout(function() {
                $scope.activities = _activities;
                $ionicLoading.hide();
              });
            }
          });
        }
      });
      
      /* $scope.map = {
        center: {
          latitude: $scope.hotbar.location.latitude,
          longitude: $scope.hotbar.location.longitude
        },
        zoom: 16,
        events: {
          tilesloaded: function (map) {
            _map = map;
            createMarker($scope.hotbar);
          }
        }
      }; */
    })();
  });
