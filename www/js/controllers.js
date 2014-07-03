angular.module('hotbar.controllers', [])

.controller('MediaCtrl', function($scope, $ionicLoading, $log,
                                  MediaFeed, Users, Bars, Util) {
    $ionicLoading.show({
        template: 'Loading...'
    });
    // function setUser(media) {
    //     if(media && media.owner) {
    //         Users.get(media.owner, function(err, user){
    //             if(err) { $log.error(err); media.user = null; }
    //             else media.user = user;
    //             $scope.$apply();
    //         });
    //     } else {
    //         media.user = null;
    //     }
    // }
    // function setBar(media) {
    //     if (media && media.bar) {
    //         Bars.get(media.bar, function(err, bar) {
    //             if(err) { $log.error(err); media.bar = null; }
    //             else media.bar = bar;
    //             $scope.$apply();
    //         });
    //     } else {
    //         media.bar = null;
    //     }
    // }
    MediaFeed.all(function(err, feed) {
        if (err) {
            $log.error(err);
            // show network error
            $ionicLoading.hide();
        } else {
            if (feed) {
                $scope.feed = [];
                while(feed.hasNextEntity()) {
                    var _feed = {};
                    var message = feed.getNextEntity();

                    if (!message.get('object')) continue; // get media feed only
                    var email = '',
                    avatar = '',
                    actor = message.get('actor');

                    _feed.uuid = message.get('uuid');
                    _feed.created = message.get('created');
                    _feed.media = message.get('object');
                    _feed.content = message.get('content');
                    _feed.name = actor.displayName || 'Anonymous';
                    _feed.username = actor.displayName;
                    
                    if ('email' in actor) {
                        email = actor.email;
                        avatar = 'http://www.gravatar.com/avatar/' +
                            Util.MD5(email.toLowerCase()) + '?s=' + 50;
                    }
                    if (!email) {
                        if ('image' in actor && 'url' in actor.image) {
                            avatar = actor.image.url;
                        }
                    }
                    if (!avatar) {
                        avatar = 'http://www.gravatar.com/avatar/' +
                            Util.MD5('rod@apigee.com') + '?s=' + 50;
                    }
                    _feed.avatar = avatar;
                    _feed.formattedTime = Util.prettyDate(_feed.created);
                    $scope.feed.push(_feed);
                }
                $scope.$apply();
                $ionicLoading.hide();
            }
        }
    });
})

.controller('MediaDetailCtrl', function($scope, $stateParams, $ionicLoading, $log,
                                        Global, MediaFeed, Users, Bars, Util) {
    function getLikes(activity) {
        MediaFeed.getLikes(activity, function(err, entities) {
            if (err) {
                $log.error(err);
            } else {
                activity.liked = false;
                for (var i=0; i < entities.length; ++i) {
                    if (entities[i].uuid === Global.user.uuid) {
                        activity.liked = true;
                        break;
                    }
                }
                activity.likes = entities;
                $scope.$apply();
            }
            $ionicLoading.hide();
        });
    }

    $scope.like = function() {
        if ($scope.activity) {
            $ionicLoading.show({
                template: "Loading..."
            });
            if ($scope.activity.liked ) {
                MediaFeed.unlike($scope.activity, function(err, result) {
                    if (err) {
                        $log.error(err);
                    } else {
                        $log.debug(result)
                    }
                    getLikes($scope.activity);
                });
            } else {
                MediaFeed.like($scope.activity, function(err, result) {
                    if (err) {
                        $log.error(err);
                    } else {
                        $log.debug(result);
                    }
                    getLikes($scope.activity);
                });
            }
        }
    };
    $scope.submitComment = function() {
        MediaFeed.comment($scope.activity, function(err, result) {
            if (err) {
                $log.error(err);
            } else {
                $log.debug(result);
            }
        });
        $scope.clearComment();
    };
    $scope.clearComment = function() { $scope.activity.comment = ''; }

    $ionicLoading.show({
        template: 'Loading...'
    });
    MediaFeed.get($stateParams.mediaId, function(err, activity) {
        var _activity = {};
        if (err) {
            $log.error(err);
        } else {
            var email = ''
              , avatar = ''
              , actor = activity.get('actor');
            _activity.uuid = activity.get('uuid');
            _activity.created = activity.get('created');
            _activity.media = activity.get('object');
            _activity.content = activity.get('content');
            _activity.name = actor.displayName || 'Anonymous';
            _activity.username = actor.displayName;
            if ('email' in actor) {
                email = actor.email;
                avatar = 'http://www.gravatar.com/avatar/' +
                    Util.MD5(email.toLowerCase()) + '?s=' + 50;
            }
            if (!email) {
                if ('image' in actor && 'url' in actor.image) {
                    avatar = actor.image.url;
                }
            }
            if (!avatar) {
                avatar = 'http://www.gravatar.com/avatar/' +
                    Util.MD5('rod@apigee.com') + '?s=' + 50;
            }
            _activity.avatar = avatar;
            _activity.formattedTime = Util.prettyDate(_activity.created);
            _activity.likes = [];
            _activity.liked = false;
            $scope.activity = _activity;
            getLikes($scope.activity);
        }
        // $ionicLoading.hide();
    });
})

.controller('HomeCtrl', function($scope, $ionicLoading, $state, $log, $ionicModal,
                                 Global, MediaFeed, Users, Util, S3) {
    var client = Global.client;
    var user = Global.user;
    var navigator = window.navigator;

    /* var cameraSuccess = function(imageData) {
        $scope.$apply(function() {
            $scope.media = {
                filename: Global.user.username+"_" + 
                    Math.round(new Date().getTime()/1000)+".jpg",
                bar: Global.bar,
                // data: imageData
                data: "data:image/jpeg;base64,"+imageData
            };            
        });       
    } */
    var cameraSuccess = function(imageFile) {
        $scope.$apply(function() {
            $scope.media = {
                filename: Global.user.username + "_" +
                    Math.round(new Date().getTime()/1000) + "_" +
                    imageFile,
                bar: Global.bar,
                path: imageFile
                // src: "data:image/jpeg;base64,"+imageData
            };            
        });       
    }
    var captureSuccess = function(mediaFiles) {
        $scope.$apply(function() {
            $scope.media = {
                filename: Global.user.username + "_" +
                    mediaFiles[0].name,
                path: mediaFiles[0].fullPath,
                type: mediaFiles[0].type,
                size: mediaFiles[0].size,
                bar: Global.bar
            };
            $scope.message = mediaFiles[0].type;
        });
        // uploadMedia(mediaFiles[0]);
    }
    var captureError = function(error) {
        navigator.notification.alert('Error code: ' + error.code, null,
                                     'Capture Error');
    }


    /* $scope.captureImage = function() {
        navigator.camera.getPicture(cameraSuccess, captureError,
                                    { quality: 75,
                                      // destinationType: Camera.DestinationType.DATA_URL});
                                      destinationType: Camera.DestinationType.FILE_URI });
    } */
    $scope.captureImage = function() {
        navigator.device.capture.captureImage(captureSuccess,
                                              captureError);
                                              // { limit: 1 });
    }
    $scope.captureVideo = function() {
        navigator.device.capture.captureVideo(captureSuccess,
                                              captureError,
                                              { duration: 20 });
    }
    $scope.getImage = function() {
        navigator.camera.getPicture(cameraSuccess, captureError,
                                    { // destinationType: Camera.DestinationType.DATA_URL,
                                      destinationType: Camera.DestinationType.FILE_URI,
                                      sourceType: Camera.PictureSourceType.PHOTOLIBRARY,
                                      encodingType: Camera.EncodingType.JPEG });
    }
    $scope.uploadMedia = function() {
        $ionicLoading.show({
            template: "Loading..."
        });
        
        var reader = new FileReader();
        reader.onloadend = function() {
            $scope.media.data = reader.result;
            S3.put($scope.media, function(err, data) {
                $ionicLoading.hide();
                if (err) {
                    $log.error(err);
                    $scope.message;
                }
                else {
                    $log.debug(data);
                    // set media url
                    $scope.media.url =
                        "http://d2x86vdxy89a0s.cloudfront.net/"+$scope.media.filename;
                    MediaFeed.create($scope.media, function(err, entity) {
                        if (err) {
                            $log.error(err);
                        } else {
                            $log.debug(entity);
                            $state.go("tab.media");
                        }
                    });
                }
            });
            $scope.$apply();
        };
        reader.readAsBinaryString($scope.media.path);
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
        // Resize the image to get thumbnail
        var img = new Image();
        img.src = $scope.files[0];
        img.onload = function() {
            var canvas = document.createElement("canvas");
            new thumbnailer(canvas, img, 188, 3);
            var data = canvas.toDataURL();
        }
        var reader = new FileReader();
        reader.onloadend = function() {
            $scope.media = {
                filename: Global.user.username + "_" +
                    Math.round(new Date().getTime()/1000)+".jpg",
                bar: Global.bar,
                data: reader.result
            };
            S3.put($scope.media, function(err, data) {
                $ionicLoading.hide();
                if (err) {
                    $log.error(err);
                    $scope.message;
                }
                else {
                    $log.debug(data);
                    // set media url
                    $scope.media.url =
                        "http://d2x86vdxy89a0s.cloudfront.net/"+$scope.media.filename;
                    MediaFeed.create($scope.media, function(err, entity) {
                        if (err) {
                            $log.error(err);
                        } else {
                            $log.debug(entity);
                            $state.go("tab.media");
                        }
                    });
                }
            });
            $scope.$apply();
        };
        reader.readAsDataURL($scope.files[0]);
    };

    function getAvatar() {
        var email = ''
        , avatar = '';
        if (Global.user && Global.user.email) {
            email = Global.user.email;
            avatar = 'http://www.gravatar.com/avatar/' +
                Util.MD5(email.toLowerCase()) + '?s=' + 50;
        }
        if (!email) {
            if ( Global.user && Global.user.image &&
                 Global.user.image.url ) {
                avatar = Global.user.image.url;
            }
        }
        if (!avatar) {
            avatar = 'http://www.gravatar.com/avatar/' +
                Util.MD5('rod@apigee.com') + '?s=' + 50;
        }
        $scope.avatar = avatar;
    }

    function getLikes(activity) {
        MediaFeed.getLikes(activity, function(err, entities) {
            if (err) {
                $log.error(err);
            } else {
                activity.liked = false;
                for (var i=0; i < entities.length; ++i) {
                    if (entities[i].uuid === Global.user.uuid) {
                        activity.liked = true;
                        break;
                    }
                }
                activity.likes = entities;
                $scope.$apply();
            }
            $ionicLoading.hide();
        });
    }
    
    $scope.like = function(activity) {
        if (activity) {
            $ionicLoading.show({
                template: "Loading..."
            });
            if (activity.liked ) {
                MediaFeed.unlike(activity, function(err, result) {
                    if (err) {
                        $log.error(err);
                    } else {
                        $log.debug(result)
                    }
                    getLikes(activity);
                });
            } else {
                MediaFeed.like(activity, function(err, result) {
                    if (err) {
                        $log.error(err);
                    } else {
                        $log.debug(result);
                    }
                    getLikes(activity);
                });
            }
        }
    };
    $scope.comment = function(activity) {
        MediaFeed.comment(activity, function(err, result) {
            if (err) {
                $log.error(err);
            } else {
                $log.debug(result);
            }
        });
    };
    getAvatar();
    $ionicLoading.show({
        template: "Loading..."
    });
    Users.getActivityFeed(function(err, entities) {
        if (err)
            $log.error(err);
        else {
            $scope.activities = [];
            for(var i = 0; i < entities.length; ++i) {
                var _activity = {};
                _activity.uuid = entities[i].uuid;
                _activity.created = entities[i].created;
                _activity.media = entities[i].object;
                _activity.content = entities[i].content;
                _activity.formattedTime = Util.prettyDate(_activity.created);
                getLikes(_activity, function(err, data) {
                    if (err) {
                    } else {
                        $scope.activities.push(data);
                    }
                });
                
            }
            $scope.$apply();
        }
        $ionicLoading.hide();
    });
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

.controller('AccountCtrl', function($scope, $ionicLoading, $log, $state, Global, Users,Util) {
    var client = Global.client;
    var user = Global.user;
    $ionicLoading.show({
        template: "Loading..."
    });
    $ionicLoading.hide();
    $scope.update = function() {
        users.update($scope.username, $scope.oldPass, $scope.newPass,
                     $scope.email, $scope.name, function(err) {
                         if (err) {
                             $log.error(err);
                             Users.logout();
                             $state.go("login");
                         } else {
                             $log.debug("updated");
                         }
                     });
    }
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
