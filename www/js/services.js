// hotbar.services

angular.module('hotbar.services', [])
  .run(["PARSE_APP_ID", "PARSE_JS_KEY", "FACEBOOK_APP_ID",
    function(PARSE_APP_ID, PARSE_JS_KEY, FACEBOOK_APP_ID, FACEBOOK_SECRET) {
    // Parse.initialize(PARSE_APP_ID, PARSE_JS_KEY);
    // Defaults to sessionStorage for storing the Facebook token
    openFB.init({appId: FACEBOOK_APP_ID, secret: FACEBOOK_SECRET});

    //  Uncomment the line below to store the Facebook token in localStorage instead of sessionStorage
    //  openFB.init({appId: 'YOUR_FB_APP_ID', tokenStore: window.localStorage});
  }])
  .factory("LocalStorage", [function() {
    var loc = {
      /**
       * @param {string} key
       * @param value objects are converted to json strings, undefined is converted
       *              to null (removed)
       * @returns {localStorage}
       */
      set: function(key, value) {
        console.log("localStorage.set", key, value);
        if (typeof(value) === "undefined" || value === null) {
          // storing a null value returns "null" (a string) when get is called
          // so to make it actually null, just remove it, whih returns null
          loc.remove(key);
        } else {
          value = angular.toJson(value);
          if (typeof(localStorage) === "undefined") {
            console.error("Local Storage is not supported");
          } else {
            localStorage.setItem(key, value);
          }
        }
        return loc;
      },
      /**
       * @param {string} key
       * @returns {*} the value or null if not found
       */
      get: function(key) {
        var v = null;
        if (typeof(localStorage) === "undefined") {
          console.error("Local Storage is not supported");
        } else {
          v = localStorage.getItem(key);
        }
        return angular.fromJson(v);
      },
      /**
       * @param {string} key
       * @returns {localStorage}
       */
      remove: function(key) {
        if (typeof(localStorage) === "undefined") {
          console.error("Local Storage is not supported");
        } else {
          localStorage.removeItem(key);
        }
        return loc;
      }
    };
    return loc;
  }])
  .factory("GeoService", ["$cordovaGeolocation", function($cordovaGeolocation) {
    // default location is Boston
    // var _position = {latitude: 42.358431, longitude: -71.059773};
    // For debugging
    var _position = { latitude: 42.3578035, longitude: -71.0603367 };
    var _lastUpdate = null;
    var posOptions = {timeout: 10000, enableHighAccuracy: true};
    $cordovaGeolocation
      .getCurrentPosition(posOptions)
      .then(function(position) {
        _position.latitude = position.coords.latitude;
        _position.longitude = position.coords.longitude;
        _lastUpdate = new Date();
      }, function(err) {
        // err
      });

    return {
      position: function() { return _position; },
      getPosition: function(callback) {
        var now = new Date();
        if (now - _lastUpdate > 60000) { // 60 seconds
          $cordovaGeolocation
            .getCurrentPosition(posOptions)
            .then(function(position) {
              _position.latitude = position.coords.latitude;
              _position.longitude = position.coords.longitude;
              _lastUpdate = new Date();
              callback(null, _position);
            }, function(err) {
              callback(err, null);
            });
        } else {
          callback(null, _position);
        }
      },
      getDistance: function(place, callback) {
        /* var point1 = new Parse.GeoPoint(_position);
        var point2 = place;
        return point1.milesTo(point2); */
        var o = new google.maps.LatLng(_position.latitude, _position.longitude);
        var d = new google.maps.LatLng(place.latitude, place.longitude);
        var service = new google.maps.DistanceMatrixService();
        service.getDistanceMatrix({
          origins: [o],
          destinations: [d],
          travelMode: google.maps.TravelMode.DRIVING,
          unitSystem: google.maps.UnitSystem.IMPERIAL
        }, function(response, status) {
          if (status != google.maps.DistanceMatrixStatus.OK) {
            callback(status, null);
          } else {
            var results = response.rows[0].elements;
            callback(null, results[0].distance);
          }
        });
      }
    };
  }])
  .factory("S3", ["S3_URL", "S3_POLICY_BASE64", "S3_SIGNATURE", "S3_ACCESS_KEY",
                  "S3_SECRET_ACCESS_KEY", "S3_REGION",
    function(S3_URL, S3_POLICY_BASE64, S3_SIGNATURE, S3_ACCESS_KEY,
             S3_SECRET_ACCESS_KEY, S3_REGION) {
    var s3URI = encodeURI(S3_URL);
    // AWS config
    AWS.config.credentials = {
      accessKeyId: S3_ACCESS_KEY,
      secretAccessKey: S3_SECRET_ACCESS_KEY
    };

    // Configure your region
    AWS.config.region = S3_REGION;

    function dataURItoBlob(dataURI) {
      var binary = atob(dataURI.split(',')[1]);
      var array = [];
      for(var i = 0; i < binary.length; i++) {
        array.push(binary.charCodeAt(i));
      }
      return new Blob([new Uint8Array(array)], {type: 'image/jpeg'});
    }

    return {
      all: function(callback) {
        var bucket = new AWS.S3({params: {Bucket: 'hotbar'}});
        bucket.listObjects(function(err, data) {
          if (err) { callback(err, null); }
          else { callback(null, data); }
        });
      },
      get: function(id, callback) {

      },
      put: function(media, callback) {
        // put binary
        /* var bucket = new AWS.S3({params: {Bucket: 'hotbar'}});
        // var buf = dataURItoBlob(media.data.replace(/^data:image\/\w+;base64,/, ""));
        var buf = dataURItoBlob(media.data);
        // var buf = media.data;
        var params = {
          Key: media.filename, // required
          ACL: 'public-read',
          // ContentType: media.type,
          Body: buf
        };
        bucket.putObject(params, function(err, data) {
          if (err) {
            callback(err, null);
          } else {
            callback(null, data);
          }
        }); */

        // cordova FileTransfer
        var ft = new FileTransfer()
        , options = new FileUploadOptions();

        options.fileKey = "file";
        options.fileName = media.filename;
        options.mimeType = media.contentType;
        options.chunkedMode = false;
        options.params = {
          "key": media.filename,
          "AWSAccessKeyId": S3_ACCESS_KEY,
          "acl": "public-read",
          "policy": S3_POLICY_BASE64,
          "signature": S3_SIGNATURE,
          "Content-Type": media.contentType
        };

        ft.upload(media.data, s3URI, function (e) {
          // deferred.resolve(e);
          console.log(e);
          callback(null, "uploaded");
        }, function (e) {
          // deferred.reject(e);
          console.log(e);
          callback("error", null);
        }, options);
      }
    }
  }])
  .factory("ParseFile", ["PARSE_APP_ID", "PARSE_REST_KEY", function(PARSE_APP_ID, PARSE_REST_KEY) {

    return {
      /* put: function(media, callback) {
        var ft = new FileTransfer()
        , options = new FileUploadOptions();

        options.fileKey = "file";
        options.fileName = media.filename;
        options.mimeType = media.contentType;
        options.chunkedMode = true;
        options.headers = {
          "X-Parse-Application-Id": PARSE_APP_ID,
          "X-Parse-REST-API-Key": PARSE_REST_KEY,
          "Content-Type": media.contentType
        };
        var uri = encodeURI("https://api.parse.com/1/files/" + media.filename);
        ft.upload(media.data, uri, function(e) {
          console.log(e);
          callback(null, "uploaded");
        }, function(e) {
          console.log(e);
          callback("error", null);
        }, options);
      } */
    }
  }])
  .factory('Posts', ["GeoService", function(GeoService) {
    var _user = Parse.User.current();
    var Post = Parse.Object.extend("Post");
    var _position;
    GeoService.getPosition(function(err, pos) {
      if (err) {
        console.log("Get current position error: ", err);
      } else {
        _position = pos;
      }
    });
    return {
      create: function(media, callback) {
        var post = new Post();
        post.set("location", _position);
        post.set("media", media);
        post.save();
        callback(null, post);
      },
      all: function(callback) {
        var query = new Parse.Query(Post);
        query.descending("createdAt");
        query.find({
          success: function(posts) {
            callback(null, posts);
          },
          error: function(posts, error) {
            callback(error, null);
          }
        });
      },
      get: function(id, callback) {
        var query = new Parse.Query(Post);
        query.get(id, {
          success: function(post) {
            callback(null, post);
          },
          error: function(post, error) {
            callback(error, post);
          }
        });
      }
    }
  }])
  .factory('HotBars', ["GeoService", function(GeoService) {
    var _user = Parse.User.current();
    var HotBar = Parse.Object.extend("HotBar");
    var _position = null;
    var _hotbars = null;

    return {
      create: function(hotbar, callback) {
      },
      all: function(callback) {
        GeoService.getPosition(function(err, pos) {
          if (err) {
            console.log("Get current position error: ", err);
          } else {
            if (!_position ||
                (_position.latitude !== pos.latitude ||
                 _position.longitude !== pos.longitude)) {
              console.log("Querying hotbars")
              _position = pos;
              var query = new Parse.Query(HotBar);
              var point = new Parse.GeoPoint(_position);
              var distance = (_user.get("radius") || 1609) / 1609;
              query.withinMiles("location", point, distance).find({
                success: function(results) {
                  _hotbars = results;
                  callback(null, results);
                },
                error: function(error) {
                  callback(error, null);
                }
              });
            } else {
              callback(null, _hotbars);
            }
          }
        });
      },
      get: function(id, callback) {
        var query = new Parse.Query(HotBar);
        query.get(id, {
          success: function(hotbar) {
            callback(null, hotbar);
          },
          error: function(hotbar, error) {
            callback(error, hotbar);
          }
        });
      }
    };
  }])
  .factory("Users", ["$log", function($log) {
    return {
      current: function() {
        return Parse.User.current();
      },
      isAdmin: function(user, callback) {
        var query = new Parse.Query(Parse.Role);
        query.equalTo("Administrator");
        query.find({
          success: function(roles) {
            var adminRole = roles[0];
            adminRole.getUsers().query().find({
              success: function(users) {
                for (var i = 0; i < users.length; ++i) {
                  if (users[i].id == user.id) {
                    callback(null, true);
                    break;
                  }
                }
              },
              error: function(err) {
                $log.error("Getting Admin users error: ", err);
                callback(err, false);
              }
            });
          },
          error: function(err) {
            $log.error("Getting Admin role error: ", err);
            callback(err, false);
          }
        });
      },
      get: function(id, callback) {
        var User = Parse.Object.extend("User");
        var query = new Parse.Query(User);
        query.get(id, {
          success: function(user) {
            callback(null, user);
          },
          error: function(user, error) {
            callback(error, user);
          }
        });
      }
    };
  }]);
