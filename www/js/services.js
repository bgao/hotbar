angular.module('hotbar.services', [])
.factory('Global', ['$log', function($log) {
    var _this = this;
    // _this._data = {
    //     client: window.client,
    //     user: window.user,
    //     authenticated: !!window.user
    // };
    if (!_this._data) 
        _this._data = {
            client: window.client, // window.localStorage['client'],
            user: window.user, // window.localStorage['user'],
            position: window.position, // window.localStorage['position']
            radius: window.radius,
            bar: "f03d4a00-ce79-11e3-a710-7f3db49e4552"
        };
    if (!_this._data.client) {
        var client_creds = {  // TODO: needs to be abstracted
            orgName: "hotbar",
            appName: "hotbar",
            logging: true
        };
        _this._data.client = new window.Apigee.Client(client_creds);
        window.client = _this._data.client;
    }
    if (!_this._data.position) {
        // default postion Boston
        _this._data.position =
            new google.maps.LatLng(42.358431, -71.059773);
        window.position = _this._data.position;
        $log.debug( "Getting device position" );
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(function(pos) {
                _this._data.position =
                    new google.maps.LatLng(pos.coords.latitude,
                                           pos.coords.longitude);
                window.position = _this._data.position;
            });
        }
    }
    if (!_this._data.radius) {
        _this._data.radius = 5*1.6*1000; // 5 miles = 8000 meters
        window.radius = _this._data.radius;
    }
    _this._data.setUser = function(user) {
        _this._data.user = user;
        window.user = user;
    }
    return _this._data;
}])
.factory('Bars', ['Global', function(Global) {
    var client = Global.client;
    var options = {
        method: 'GET',
        endpoint: 'bars'
    };
    return {
        all: function(callback) {
            if(client) {
                client.request(options, function(err, data) { // TODO: abstraction
                    if (err) {
                        callback(data, null);
                    } else {
                        callback(null, data.entities);
                    }
                });
            } else {
                callback(null, null);
            }
        },
        get: function(uuid, callback) {
            var options = {
                type: 'bars',
                uuid: uuid
            };
            if(client) {
                client.getEntity(options, function(err, entity, data) {
                    if(err) callback(entity, null);
                    else callback(null, entity._data);
                });
            } else {
                callback(null, null);
            }
        },
        getBar: function(position, callback) {
            
        }
    }
}])
.factory('Media', ['$window', '$http', '$log', 'Global',
                   function($window, $http, $log, Global) {
    var client = Global.client;
    var options = {
        method: 'GET',
        endpoint: 'media'
    };
    var access_token = "W_YxUsgeUvwAAAAAAAACaVjEraJtDmHnS3_s2ilMCX3jEABkDWp6H0Vg75w7AaBh";
    var dropbox_base = "https://api-content.dropbox.com/1/";
    /* var dropbox_client = new Dropbox.Client({
        // key: "kdCm1MecxvA=|j+Fjz4+qmXEAmMopy5Xj1NpkOoLB5KdAvfF3W2kxiw==", sandbox:true
        key: "yampzvmdl79llfo", sandbox:true
    }); */
    // dropbox_client.authDriver(new Dropbox.AuthDriver.Cordova());
    return {
        all: function(callback) {
            if(client) {
                client.request(options, function(err, data) {  // TODO: abstraction
                    if (err) {
                        callback(data, null);
                    } else {
                        callback(null, data.entities);
                    }
                });
            } else {
                callback(null, null);
            }
        },
        get: function(uuid, callback) {
            var options = {
                type: 'media',
                uuid: uuid
            };
            if (client) {
                client.getEntity(options, function(err, entity, data) {
                    if(err) callback(entity, null);
                    else callback(null, entity._data);
                });
            } else {
                callback(null, null);
            }
        },
        /* getAsset: function(media, callback) {
            var url = dropbox_base + "thumbnails/sandbox/test.jpg?access_token=" +
                access_token;
            $http.get(url)
                .success(function(data, status) {
                    $log.debug('success: ' + status);
                    callback(null, data);
                })
                .error(function(data, status) {
                    $log.error('error: ' + status);
                    callback(status, null);
                });
            // var header = media['file-metadata']['content-type'];
            // var url = "https://api.usergrid.com/hotbar/hotbar/media/"+
            //     media.uuid+"?access_token="+$window.localStorage.apigee_token;
            // $http.get(url, {headers:{'Accept': header}})
            //     .success(function(data, status){
            //         console.log('Type ' + typeof(data));
            //         console.log('success: ' + status);
            //         callback(null, data);
            //     })
            //     .error(function(data, status) {
            //         console.log('error: ' + status);
            //         callback(status, null);
            //     });
        }, */
        create: function(media, callback) {
            var mediaUrl = Global.user.username+"/"+media.filename;
            callback("error", null);
            /* dropbox_client.authenticate(function(err, data) {
                if (err) {
                    callback(err, null);
                } else {

            dropbox_client.writeFile(mediaUrl, media.data, function(err, stat) {
                if (err) {
                    callback(err, null);
                } else {
                    $log.debug(stat);
                    // create apigee media entity
                    var options = {
                        type: 'media',
                        caption: media.caption,
                        bar: media.bar,
                        user: Global.user.uuid,
                        position: Global.position,
                        url: mediaUrl
                    };
                    client.createUserActivityWithEntity
                    (Global.user, options, function(err, data){
                        if (err) {
                            callback(data, null);
                        } else {
                            callback(null, data);
                        }
                    });
                }
            });
                }}); */

            
            /* $http({
                method: 'POST',
                url: postUrl+"?access_token="+access_token,
                data: media.file,
                withCredentials: true,
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded'
                }
            }).success(function(data, status) {
                $log.debug(data);
                $log.debug(status);
            }).error(function(data,status) {
                $log.error(data);
                $log.debug(status);
            }); */

            /* $http.post(postUrl+"?access_token="+access_token, fd)
                .success(function(data, status) {
                    // create apigee media entity
                    var options = {
                        type: 'media',
                        caption: media.caption,
                        bar: media.bar,
                        user: Global.user.uuid,
                        position: Global.position,
                        url: mediaUrl,
                        thumbnail_url: thumbnailUrl
                    };
                    client.createUserActivityWithEntity(Global.user, options,
                        function(err, data) {
                        if (err) {
                            callback(data, null);
                        } else {
                            callback(null, data);
                        }
                    });
                })
                .error(function(data, status) {
                    $log.debug(data);
                    callback(status, null);
                }); */
        },
        getThumbnailUrl: function(url) {
            var thumbnailUrl = dropbox_base+"thumbnails/sandbox/"+url+"?size=l";
            return thumbnailUrl + "&access_token=" + access_token;
            // $http.get(thumbnailUrl+"&access_token="+access_token)
            //     .success(function(data, status) {
            //         callback(null, data);
            //     })
            //     .error(function(data, status) {
            //         $log.error('error: ' + status);
            //         callback(status, null);
            //     });
        },
        getMediaUrl: function(url) {
            var mediaUrl = dropbox_base + "files/sandbox/" + url;
            return mediaUrl + "?access_token=" + access_token;
            // $http.get(mediaUrl+"?access_token="+access_token)
            //     .success(function(data, status) {
            //         callback(null, data);
            //     })
            //     .error(function(data, status) {
            //         $log.error('error: ' + status);
            //         callback(status, null);
            //     });
        }
    }
}])
.factory('Users', ['Global', function(Global) {
    var client = Global.client;
    return {
        get: function(uuid, callback) {
            var options = {
                'type': 'users',
                'uuid': uuid
            };
            if (client) {
                client.getEntity(options, function(err, user, data) {
                    if(err) {
                        callback(user, null);
                    } else {
                        callback(null, user._data);
                    }
                });
            } else {
                callback(null, null);
            }
        },
        login: function(username, password, callback) {
            if (client) {
                client.login(username, password, function(err, data) {
                    if (err) {
                        callback(data, null);
                    } else {
                        client.getLoggedInUser(function(err, data, user) {
                            if (err) {
                                callback(err, null);
                            } else {
                                if (client.isLoggedIn()) {
                                    Global.setUser( user );
                                    callback(null, user);
                                } else {
                                    Global.setUser(null);
                                    callback(null, null);
                                }
                            }
                        });
                    }
                });
            } else {
                callback(null, null);
            }
        },
        logout: function() {
            if (client) {
                client.logout();
            }
        },
        signup: function(username, password, email, name, callback) {
            if (client) {
                client.signup(username, password, email, name, function (err, user) {
                    if (err) {
                        Global.setUser(null);
                        callback(user, null);
                    } else {
                        Global.setUser(user);
                        callback(null, user);
                    }
                });
            } else {
                callback(null, null);
            }
        }
    }
}]);
