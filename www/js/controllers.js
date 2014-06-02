angular.module('hotbar.controllers', [])

.controller('MediaCtrl', function($scope, $ionicLoading, $log, Media, Users, Bars) {
    $ionicLoading.show({
        template: 'Loading...'
    });
    function setUser(media) {
        if(media && media.owner) {
            Users.get(media.owner, function(err, user){
                if(err) { $log.error(err); media.user = null; }
                else media.user = user;
                $scope.$apply();
            });
        } else {
            media.user = null;
        }
    }
    function setBar(media) {
        if (media && media.bar) {
            Bars.get(media.bar, function(err, bar) {
                if(err) { $log.error(err); media.bar = null; }
                else media.bar = bar;
                $scope.$apply();
            });
        } else {
            media.bar = null;
        }
    }
    Media.all(function(err, media) {
        if (err) {
            $log.error(err);
            $scope.media = [];
            $ionicLoading.hide();
        } else {
            $scope.$apply(function() {
                for(var i = 0; i < media.length; ++i) {
                    var m = media[i];
                    m.createdTime = new Date(m.created);
                    m.thumbnail_url = Media.getThumbnailUrl(m.url);
                    setUser(m);
                    setBar(m);
                }
                $scope.media = media;
                $ionicLoading.hide();
            });
        }
    });
})

.controller('MediaDetailCtrl', function($scope, $stateParams, $ionicLoading, $log, Media, Users, Bars) {
    $ionicLoading.show({
        template: 'Loading...'
    });
    function setUser(media) {
        Users.get(media.owner, function(err, user){
            if(err) { $log.error(err); media.user = null; }
            else media.user = user;
            $scope.$apply();
        });
    }
    function setBar(media) {
        Bars.get(media.bar, function(err, bar) {
            if(err) { $log.error(err); media.bar = null; }
            else media.bar = bar;
            $scope.$apply();
        });
    }
    Media.get($stateParams.mediaId, function(err, media) {
        var _media = null;
        if (err) {
            $log.error(err);
        } else {
            _media = media;
            _media.createdTime = new Date(_media.created);
            _media.url = Media.getMediaUrl(_media.url);
            setUser(_media);
            setBar(_media);
        }
        $scope.$apply(function(){ $scope.media = _media; });
        $ionicLoading.hide();
    });
})

.controller('HomeCtrl', function($scope, $ionicLoading, $state, $log, Global, Media) {
    var client = Global.client;
    var user = Global.user;
    var navigator = window.navigator;
    var captureSuccess = function(mediaFiles) {
        $log.info(mediaFiles[0].fullPath);
        uploadMedia(mediaFiles[0]);
    }
    var captureError = function(error) {
        navigator.notification.alert('Error code: ' + error.code, null,
                                     'Capture Error');
    }
    $scope.user = Global.user;
    // $scope.captureImage = function() {
    //     window.navigator.device.capture.captureImage(captureSuccess,
    //                                                  captureError,
    //                                                 {limit: 1});
    // }
    var cameraSuccess = function(imageData) {
        $scope.$apply(function() {
            $scope.media = {
                filename: Math.round(new Date().getTime()/1000)+".jpg",
                bar: Global.bar,
                data: "data:image/jpeg;base64,"+imageData
                // src: "data:image/jpeg;base64,"+imageData
            };            
        });       
    }
    $scope.captureImage = function() {
        navigator.camera.getPicture(cameraSuccess, captureError,
                                    {quality: 75,
                                     destinationType: Camera.DestinationType.DATA_URL});
    }
    $scope.captureVideo = function() {
        navigator.device.capture.captureVideo(captureSuccess,
                                              captureError,
                                              { duration: 20 });
    }
    $scope.getImage = function() {
        navigator.camera.getPicture(cameraSuccess, captureError,
                                    {destinationType: Camera.DestinationType.DATA_URL,
                                     sourceType: Camera.PictureSourceType.PHOTOLIBRARY});
    }
    $scope.uploadMedia = function() {
        $ionicLoading.show({
            template: "Loading..."
        });
        Media.create($scope.media, function(err, entity) {
            $ionicLoading.hide();
            if (err) {
                $log.error(err);
                $scope.message;
            }
            else {
                $log.info(entity);
                $state.go("tab.media");
            }
        });
    }
    $scope.cancelUpload = function() {
        $scope.media = null;
        navigator.camera.cleanup(function() { $log.debug("Camera cleanup success"); },
                                 function(message) { $log.debug("Failed because: " + 
                                                                message); });
    }
    $scope.filesChanged = function(elm) {
        $scope.files = elm.files;
        $scope.$apply();
    };
    $scope.uploadImage = function() {
        $log.info("uploading image...");
        $log.debug($scope.files);
        var reader = new FileReader();
        reader.onloadend = function() {
            $scope.$apply(function() {
                $scope.media = {
                    filename: Math.round(new Date().getTime()/1000)+".jpg",
                    bar: Global.bar,
                    data: reader.result
                };
                $log.debug($scope.media);
            });
        };
        reader.readAsDataURL($scope.files[0]);
    }
    if (user && client) {
        client.getFeedForUser(user.username, function(err, data, entities) {
            if (err) {
                $log.error(err);
                $scope.data = null;
            } else {
                $scope.$apply(function() {
                    $scope.data = entities;
                });
            }
        });
    }
})

.controller('BarsCtrl', function($scope, $ionicLoading, $log, Bars, Global) {
    var _infowindow = new google.maps.InfoWindow();
    var _map;
   
    $scope.getItemHeight = function(item, index) {
        //Make evenly indexed items be 10px taller, for the sake of example
        return (index % 2) === 0 ? 50 : 60;
    };

    function rad(x) {
        return x*Math.PI/180;
    }

    function getDistance(p1, p2) {
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
        return getDistance(Global.position, bar.geometry.location);
    }

    function callback(results, status) {
        $scope.$apply(function(){
            $scope.bars = results;
            Global.bars = results;
        });
        if (status == google.maps.places.PlacesServiceStatus.OK) {
            for (var i = 0; i < results.length; i++) {
                createMarker(results[i]);
            }
        }
        $ionicLoading.hide();
    }
    
    function createMarker(place) {
        var placeLoc = place.geometry.location;
        var marker = new google.maps.Marker({
            map: _map,
            position: place.geometry.location
        });
        
        google.maps.event.addListener(marker, 'click', function() {
            _infowindow.setContent(place.name);
            _infowindow.open(_map, this);
        });
    }

    function findBars(map) {
        _map = map;
        var request = {
            location: Global.position,
            radius: Global.radius,
            types: ['bar']
        };
        var service = new google.maps.places.PlacesService(map);
        service.nearbySearch(request, callback);
    };
    $scope.map = {
        center: {
            latitude: Global.position.lat(),
            longitude: Global.position.lng()
        },
        zoom: 12,
        events: {
            tilesloaded: function (map) {
                findBars(map);
            }
        }
    };

    $ionicLoading.show({
        template: "Loading..."
    });

    /* Bars.all(function(err, bars) {
        var _bars = [];
        if (err) {
            $log.error(err);
        } else {
            _bars = bars;
        }
        $scope.$apply(function(){ $scope.bars = _bars; });
        $ionicLoading.hide();
    }); */
})

.controller('BarDetailCtrl', function($scope, $stateParams, $ionicLoading, $log, Bars, Global) {
    if (!Global.bars) alert( "no bars" );
    var _infowindow = new google.maps.InfoWindow();
    var _map;
    function createMarker(place) {
        var placeLoc = place.geometry.location;
        var marker = new google.maps.Marker({
            map: _map,
            position: place.geometry.location
        });
        
        google.maps.event.addListener(marker, 'click', function() {
            _infowindow.setContent(place.name);
            _infowindow.open(_map, this);
        });
    }
    $scope.bar = Global.bars[$stateParams.barId];
    $scope.map = {
        center: {
            latitude: $scope.bar.geometry.location.lat(),
            longitude: $scope.bar.geometry.location.lng()
        },
        zoom: 12,
        events: {
            tilesloaded: function (map) {
                _map = map;
                createMarker($scope.bar);
            }
        }
    };

    $ionicLoading.show({
        template: 'Loading...'
    });
    createMarker($scope.bar);
    $ionicLoading.hide();
    // Bars.get($stateParams.mediaId, function(err, bar) {
    //     var _bar = null;
    //     if (err) {
    //         $log.error(err);
    //     } else {
    //         _bar = bar;
    //     }
    //     $scope.$apply(function(){ $scope.bar = _bar; });
    //     $ionicLoading.hide();
    // });
})

.controller('AccountCtrl', function($scope, $ionicLoading, $log, $state, Global, Users) {
    var client = Global.client;
    var user = Global.user;
    $ionicLoading.show({
        template: "Loading..."
    });
    $ionicLoading.hide();
    $scope.logout = function() {
        Users.logout();
        $state.go("login");
    }
})

.controller('LoginCtrl', function($scope, $ionicLoading, $state, $log, Global, Users) {
    var client = Global.client;
    client.getLoggedInUser(function(err, data, user) {
        if (err) {
            $log.error(data);
            client.logout();
        } else {
            if (client.isLoggedIn()) {
                Global.setUser( user._data );
                $state.go('tab.media');
            } else {
                Global.setUser( null );
                $log.debug("No logged in user");
            }
        }
    });

    $scope.logout = function() {
        Users.logout();
    };
    $scope.login = function(user) {
        var username = user.username;
        var password = user.password;
        $ionicLoading.show({
            template: "Loading..."
        });
        if (username && password) {
            Users.login(username, password, function(err, user) {
                if (err) {
                    $log.error(err);
                } else {
                    $state.go('tab.media');
                }
                $ionicLoading.hide();
            });
        }
    };
    $scope.signup = function() {
        $state.go('signup');
    };
})
.controller('SignupCtrl', function($scope, $ionicLoading, $state, Users) {
    $scope.signup = function(user) {
        var username = user.username;
        var password = user.password;
        var email = user.email;
        var name = user.name;
        $ionicLoading.show({
            template: "Loading..."
        });
        if (username && password && email) {
            Users.signup(username, password, email, name, function(err, user) {
                if (err) {
                    $log.error(err);
                } else {
                    $state.go('tab.media');
                }
                $ionicLoading.hide();
            });
        } else {
            $ionicLoading.hide();
        }
    }
})
.controller('ProfileCtrl', function($scope, $ionicLoading) {
})
.controller('RewardsCtrl', function($scope, $ionicLoading) {
})
;
