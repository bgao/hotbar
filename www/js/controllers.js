angular.module('hotbar.controllers', [])

.controller('MediaCtrl', function($scope, $ionicLoading, $log, $timeout,
                                  MediaFeed, Users, Bars, Util) {
    // Check network connection
    /* var connectState = navigator.connection.type;
    // Connection.UNKNOWN
    // Connection.ETHERNET
    // Connection.WIFI
    // Connection.CELL
    // Connection.NONE
    if (connectState == Connection.UNKNOWN)
        navigator.notification.alert("Connection status: UNKNOWN", null, "Connection Type");
    else if (connectState == Connection.ETHERNET)
        navigator.notification.alert("Connection status: ETHERNET", null, "Connection Type");
    else if (connectState == Connection.WIFI)
        navigator.notification.alert("Connection status: WIFI", null, "Connection Type");
    else if (connectState == Connection.CELL)
        navigator.notification.alert("Connection status: CELL", null, "Connection Type");
    else if (connectState == Connection.NONE)
        navigator.notification.alert("Connection status: NONE", null, "Connection Type");
    else
        navigator.notification.alert("Connection status: ERROR", null, "Connection Type"); */

    // Load all media activities
    $ionicLoading.show({
        template: '<i class=\"icon ion-loading-a\"></i>Loading...'
    });
    MediaFeed.all(function(err, feed) {
        if (err) {
            $log.error("MediaFeed::all: " + err);
            // show network error
            $ionicLoading.hide();
        } else {
            if (feed) {
                var media = [];
                // var comments = [];
                while(feed.hasNextEntity()) {
                    var _feed = {};
                    var message = feed.getNextEntity();

                    if (!message.get('object'))
                        continue; // get only media and comments
                    var object = message.get('object');
                    var email = ''
                    avatar = '',
                    actor = message.get('actor');

                    _feed.uuid = message.get('uuid');
                    _feed.created = message.get('created');
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
                    /* if (object.type == 'comment') {
                        _feed.comment = object;
                        comments.push(_feed);
                    } else */ if (object.type == 'media') {
                        _feed.media = object;
                        _feed.comments = [];
                        media.push(_feed);
                    }
                }
                $timeout(function() {
                    $scope.media = media;
                    /* for (var i = 0; i < comments.length; ++i) {
                        for (var j = 0; j < media.length; ++j) {
                            if (comments[i].comment.media ==
                                media[j].uuid) {
                                media[j].comments.push(comments[i]);
                                break;
                            }
                        }
                    } */
                    $ionicLoading.hide();
                }, 500);
            }
        }
    });
})

.controller('MediaDetailCtrl', function($scope, $stateParams, $ionicLoading, $log,
                                        $timeout, Global, MediaFeed, Users, Bars, Util) {
    function getLikes(activity, callback) {
        var _user = Global.getUser();
        MediaFeed.getLikes(activity, function(err, entities) {
            $ionicLoading.hide();
            if (err) {
                $log.error("MediaDetailCtrl::getLikes: " + err);
                callback && callback(err, null);
            } else {
                activity.liked = (entities.length > 0);
                activity.likes = entities;
                callback && callback(null, activity);
            }
        });
    }

    $scope.like = function() {
        if ($scope.activity) {
            $ionicLoading.show({
                template: "<i class=\"icon ion-loading-a\"></i>Loading..."
            });
            if ($scope.activity.liked ) {
                MediaFeed.unlike($scope.activity, function(err, result) {
                    if (err) {
                        $log.error("MediaDetailCtrl::unlike: " + err);
                    } else {
                        // $log.debug(result)
                    }
                    getLikes($scope.activity);
                });
            } else {
                MediaFeed.like($scope.activity, function(err, result) {
                    if (err) {
                        $log.error("MediaDetailCtrl::like: " + err);
                    } else {
                        $log.debug(result);
                    }
                    getLikes($scope.activity);
                });
            }
        }
    };
    $scope.submitComment = function() {
        $ionicLoading.show({
            template: '<i class=\"icon ion-loading-a\"></i>Loading...'
        });
        MediaFeed.submitComment($scope.activity, function(err, result) {
            $ionicLoading.hide();
            if (err) {
                $log.error("MediaDetailCtrl::submitComment: " + err);
            } else {
                $log.debug(result);
            }
        });
        $scope.activity.comment = '';
    };
    $scope.clearComment = function() { $scope.activity.comment = ''; }

    $ionicLoading.show({
        template: '<i class=\"icon ion-loading-a\"></i>Loading...'
    });
    MediaFeed.get($stateParams.mediaId, function(err, activity) {
        var _activity = {};
        if (err) {
            $log.error("MediaDetailCtrl::get: " + err);
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
            getLikes(_activity, function(err, activity) {
                if (err) {
                    $log.error("MediaDetailCtrl::getLikes: " + err);
                } else {
                    $timeout(function() {
                        $scope.activity = activity;
                    });
                }
            });
        }
        // $ionicLoading.hide();
    });
})

.controller('HomeCtrl', function($scope, $ionicLoading, $state, $log, $ionicModal, 
                                 $timeout, Global, MediaFeed, Users, Util, S3) {
    var navigator = window.navigator;

    var cameraSuccess = function(imageData) {
        var _user = Global.getUser();
        $timeout(function() {
            $scope.media = {
                filename: _user.get('username') + "_" + 
                    Math.round(new Date().getTime()/1000)+".jpg",
                bar: Global.bar,
                // data: imageData
                data: "data:image/jpeg;base64," + imageData,
                type: "image/jpeg"
            };            
        });       
    }
    /* var cameraSuccess = function(imageFile) {
        var _user = Global.getUser();
        $scope.$apply(function() {
            var index = imageFile.lastIndexOf('/') + 1;
            $scope.media = {
                filename: _user.get('username') + "_" +
                    imageFile.substr(index),
                bar: Global.bar,
                path: imageFile,
                type: 'image/jpeg'
                // src: "data:image/jpeg;base64,"+imageData
            };
            // debug
            navigator.notification.alert(imageFile, null, "CameraSuccess");
            navigator.notification.alert($scope.media.filename, null, "CameraSuccess");
        });
    }; */
    var captureSuccess = function(mediaFiles) {
        var _user = Global.getUser();
        $timeout(function() {
            $scope.media = {
                filename: _user.get('username') + "_" +
                    mediaFiles[0].name,
                path: mediaFiles[0].fullPath,
                type: mediaFiles[0].type,
                size: mediaFiles[0].size,
                bar: Global.bar
            };
            $scope.message = mediaFiles[0].type;
        });
        navigator.notification.alert($scope.media.filename, null, "CameraSuccess:filename");
    };
    var captureError = function(error) {
        navigator.notification.alert('Error code: ' + error.code, null,
                                     'Capture Error');
    };

    $scope.captureImage = function() {
        navigator.camera.getPicture(cameraSuccess, captureError,
                                    { quality: 50,
                                      destinationType: Camera.DestinationType.DATA_URL});
                                      //destinationType: Camera.DestinationType.FILE_URI });
    };
    /* $scope.captureImage = function() {
        navigator.device.capture.captureImage(captureSuccess,
                                              captureError);
                                              // { limit: 1 });
    } */
    $scope.captureVideo = function() {
        navigator.device.capture.captureVideo(captureSuccess,
                                              captureError,
                                              { duration: 20 });
    };
    $scope.getImage = function() {
        navigator.camera.getPicture(cameraSuccess, captureError,
                                    { destinationType: Camera.DestinationType.DATA_URL,
                                      // destinationType: Camera.DestinationType.FILE_URI,
                                      quality: 50,
                                      sourceType: Camera.PictureSourceType.PHOTOLIBRARY,
                                      encodingType: Camera.EncodingType.JPEG });
    };

    function onFail(error) {
        $log.error("resolveLocalFileSystemURL: " + error.code);
        navigator.notification.alert('HomeCtrl::uploadMedia::onFaile:' + 
                                     error.code, null);
    }

    $scope.uploadMedia = function() {
        $ionicLoading.show({
            template: "<i class=\"icon ion-loading-a\"></i>Loading..."
        });
        S3.put($scope.media, function(err, data) {
            if (err) {
                $ionicLoading.hide();
                $log.error("HomeCtrl::uploadMedia: " + err);
                navigator.notification
                    .alert('HomeCtrl::uploadMedia::Error', null);
                $scope.message;
                $scope.cleanup();
            }
            else {
                // $log.debug(data);
                // set media url
                $scope.media.url =
                    "http://d2x86vdxy89a0s.cloudfront.net/" +
                    $scope.media.filename;
                $scope.media.data = null;
                MediaFeed.create($scope.media, function(err, entity) {
                    $ionicLoading.hide();
                    if (err) {
                        $log.error("HomeCtrl::create: " + err);
                        navigator.notification
                            .alert('HomeCtrl::create::Error', null);
                    } else {
                        // $log.debug(entity);
                        $state.go("tab.home");
                    }
                    $scope.cleanup();
                });
            }
        });
    };

    /* $scope.uploadMedia = function() {
        $ionicLoading.show({
            template: "Loading..."
        });
        $log.debug("media.path = " + $scope.media.path);
        window.resolveLocalFileSystemURL($scope.media.path, function(fileEntry) {
            $log.debug("fileEntry.toURL()");
            $log.debug(fileEntry.toURL());
            fileEntry.file(function(file) {
                var reader = new FileReader();
                    reader.onloadend = function() {
                        navigator.notification
                            .alert('HomeCtrl::uploadMedia::FileReader', null);
                        $scope.media.data = reader.result;
                        S3.put($scope.media, function(err, data) {
                            if (err) {
                                $ionicLoading.hide();
                                $log.error("HomeCtrl::uploadMedia: " + err);
                                navigator.notification
                                    .alert('HomeCtrl::uploadMedia::Error', null);
                                $scope.message;
                            }
                            else {
                                $log.debug(data);
                                // set media url
                                $scope.media.url =
                                    "http://d2x86vdxy89a0s.cloudfront.net/" +
                                    $scope.media.filename;
                                MediaFeed.create($scope.media, function(err, entity) {
                                    $ionicLoading.hide();
                                    if (err) {
                                        $log.error("HomeCtrl::create: " + err);
                                        navigator.notification
                                            .alert('HomeCtrl::create::Error', null);
                                    } else {
                                        $log.debug(entity);
                                        $state.go("tab.media");
                                    }
                                });
                            }
                        });
                        $scope.$apply();
                    };
                    reader.readAsDataURL(file);
            }, onFail);
        }, onFail);
    }; */

    $scope.cleanup = function() {
        $scope.media = null;
        navigator.camera.cleanup(function() { $log.debug("Camera cleanup success"); },
                                 function(message) { $log.debug("Failed because: " + 
                                                                message); });
    };
    $scope.filesChanged = function(elm) {
        $scope.files = elm.files;
        $scope.$apply();
    };
    $scope.uploadImage = function() {
        $log.info("uploading image...");
        $log.debug($scope.files);
        $log.debug($scope.files[0]);
        var _user = Global.getUser();
        // Resize the image to get thumbnail
        /* var img = new Image();
        img.src = $scope.files[0];
        img.onload = function() {
            var canvas = document.createElement("canvas");
            new thumbnailer(canvas, img, 188, 3);
            var data = canvas.toDataURL();
        } */
        var reader = new FileReader();
        reader.onloadend = function() {
            $scope.media = {
                filename: _user.get('username') + "_" + $scope.files[0].name,
                    // Math.round(new Date().getTime()/1000)+".jpg",
                bar: Global.bar,
                path: null,
                data: reader.result
            };
            /* S3.put($scope.media, function(err, data) {
                $ionicLoading.hide();
                if (err) {
                    $log.error("HomeCtrl::uploadImage: " + err);
                    $scope.message;
                }
                else {
                    $log.debug(data);
                    // set media url
                    $scope.media.url =
                        "http://d2x86vdxy89a0s.cloudfront.net/"+$scope.media.filename;
                    MediaFeed.create($scope.media, function(err, entity) {
                        if (err) {
                            $log.error("HomeCtrl::create: " + err);
                        } else {
                            $log.debug(entity);
                            $state.go("tab.media");
                        }
                    });
                }
            }); */
            $scope.$apply();
        };
        reader.readAsDataURL($scope.files[0]);
    };

    function getAvatar() {
        var _user = Global.getUser();
        var email = ''
        , avatar = '';
        if (_user && _user.get('email')) {
            email = _user.get('email');
            avatar = 'http://www.gravatar.com/avatar/' +
                Util.MD5(email.toLowerCase()) + '?s=' + 50;
        }
        if (!email) {
            avatar = _user && _user.get('image') && _user.get('image').url;
        }
        if (!avatar) {
            avatar = 'http://www.gravatar.com/avatar/' +
                Util.MD5('rod@apigee.com') + '?s=' + 50;
        }
        $scope.avatar = avatar;
    }

    function getLikes(activity, callback) {
        var _user = Global.getUser();
        MediaFeed.getLikes(activity, function(err, entities) {
            if (err) {
                $log.error("HomeCtrl::getLikes: " + err);
                callback && callback(err, null);
            } else {
                activity.liked = entities.length > 0;
                activity.likes = entities;
                callback && callback(null, activity);
            }
            $ionicLoading.hide();
        });
    }
    
    $scope.like = function(activity) {
        if (activity) {
            $ionicLoading.show({
                template: "<i class=\"icon ion-loading-a\"></i>Loading..."
            });
            if (activity.liked ) {
                MediaFeed.unlike(activity, function(err, result) {
                    if (err) {
                        $log.error("HomeCtrl::unlike: " + err);
                    } else {
                        $log.debug(result)
                    }
                    getLikes(activity);
                });
            } else {
                MediaFeed.like(activity, function(err, result) {
                    if (err) {
                        $log.error("HomeCtrl::like: " + err);
                    } else {
                        $log.debug(result);
                    }
                    getLikes(activity);
                });
            }
        }
    };
    $scope.submitComment = function(activity) {
        MediaFeed.submitComment(activity, function(err, result) {
            if (err) {
                $log.error("HomeCtrl::comment: " + err);
            } else {
                $log.debug(result);
            }
        });
    };

    getAvatar();
    $ionicLoading.show({
        template: "<i class=\"icon ion-loading-a\"></i>Loading..."
    });
    Users.getActivityFeed(function(err, entities) {
        if (err)
            $log.error("HomeCtrl::getActivityFeed: " + err);
        else {
            $scope.activities = [];
            for(var i = 0; i < entities.length; ++i) {
                if (entities[i].object.type == 'media') {
                var _activity = {};
                    _activity.uuid = entities[i].uuid;
                    _activity.created = entities[i].created;
                    _activity.media = entities[i].object;
                    _activity.content = entities[i].content;
                    _activity.formattedTime = Util.prettyDate(_activity.created);
                    getLikes(_activity, function(err, data) {
                        if (err) {
                            $log.error("HomeCtrl::getActivityFeed::getLikes: " + err);
                        } else {
                            $timeout(function() {
                                $scope.activities.push(data)
                            });
                        }
                    });
                }
            }
            // $scope.$apply();
        }
        $ionicLoading.hide();
    });
})

.controller('BarsCtrl', function($scope, $ionicLoading, $log, $timeout, Bars, Global) {
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
        return getDistance(Global.getPosition(), bar.geometry.location);
    }

    function callback(results, status) {
        $timeout(function(){
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
            location: Global.getPosition(),
            radius: Global.radius,
            types: ['bar']
        };
        var service = new google.maps.places.PlacesService(map);
        service.nearbySearch(request, callback);
    };
    $scope.map = {
        center: {
            latitude: Global.getPosition().lat(),
            longitude: Global.getPosition().lng()
        },
        zoom: 12,
        events: {
            tilesloaded: function (map) {
                findBars(map);
            }
        }
    };

    $ionicLoading.show({
        template: "<i class=\"icon ion-loading-a\"></i>Loading..."
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

.controller('BarDetailCtrl', function($scope, $stateParams, $ionicLoading, $log,
                                      Bars, Global) {
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

    $scope.checkin = function() {
        $ionicLoading.show({
            template: '<i class=\"icon ion-loading-a\"></i>Loading...'
        });
        Bars.checkin($scope.bar, function(err, data) {
            if (err) {
                $log.error("BarDetailCtrl::checkin: " + err);
            } else {
                $log.debug("BarDetailCtrl::checkin: " + data);
                $state.go('tab.media');
            }
        });
    };

    $ionicLoading.show({
        template: '<i class=\"icon ion-loading-a\"></i>Loading...'
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

.controller('AccountCtrl', function($scope, $ionicLoading, $log, $state,
                                    Global, Users,Util) {
    var user = Global.getUser();
    $ionicLoading.show({
        template: "<i class=\"icon ion-loading-a\"></i>Loading..."
    });
    $ionicLoading.hide();
    $scope.update = function() {
        Users.update($scope.username, $scope.oldPass, $scope.newPass,
                     $scope.email, $scope.name, function(err) {
                         if (err) {
                             $log.error("AccountCtrl: " + err);
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
    var client = Global.getClient();
    client.getLoggedInUser(function(err, data, user) {
        if (err) {
            $log.error("LoginCtrl: " + data);
            client.logout();
        } else {
            if (client.isLoggedIn()) {
                Global.setUser( user );
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
            template: "<i class=\"icon ion-loading-a\"></i>Loading..."
        });
        if (username && password) {
            Users.login(username, password, function(err, user) {
                if (err) {
                    $log.error("LoginCtrl::login: " + err);
                } else {
                    $state.go('tab.media');
                }
                $ionicLoading.hide();
            });
        } else {
            $ionicLoading.hide();
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
            template: "<i class=\"icon ion-loading-a\"></i>Loading..."
        });
        if (username && password && email) {
            Users.signup(username, password, email, name, function(err, user) {
                if (err) {
                    $log.error("SignupCtrl::signup: " + err);
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
