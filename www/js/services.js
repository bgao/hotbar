"use strict";

angular.module('hotbar.services', [])
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
  .factory('Global', [function() {
    // Initialization
    var _position = null;
    if (navigator.geolocation) {
      /* navigator.geolocation.watchPosition(function(pos) {
         _position = new google.maps.LatLng(pos.coords.latitude,
         pos.coords.longitude);
         }, function(err) {
         console.error("Watch device position error");
         console.error(err);
         }, { maximumAge: 60000, timeout: 5000, enableHighAccuracy:true }); */
      navigator.geolocation.getCurrentPosition(function(pos) {
        _position = new google.maps.LatLng(pos.coords.latitude,
                                           pos.coords.longitude);
      }, function(err) {
        console.error("Watch device position error");
        console.error(err);
      }, { enableHighAccuracy: true });
    }
    
    function set(key, value) {
      window[key] = value;
    }
    function get(key) {
      if (key === "position") {
        if (!_position) {
          _position = new google.maps.LatLng(42.358431, -71.059773); // boston
        }
        
        return _position;
      } else {
        return window[key];
      }
    }
    return {
      get: get,
      set: set
    };
  }])
  .factory("GMaps", ["GMAPS_API_KEY", function(GMAPS_API_KEY) {
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
  .factory('People', ["FirebaseSync", "LocalStorage", function(FirebaseSync,
                                                               LocalStorage) {
    return {
      set: function(userId, info, callback) {
        var sync = FirebaseSync(["people", userId]);
        sync.$update(info).then(function() {
          callback(null, info);
        }, function(err) {
          callback(err, null);
        });
      },
      get: function(userId, callback) {
        var sync = FirebaseSync(["people", userId]);
        var user = sync.$asObject();
        user.$loaded().then(function(info) {
          callback(null, info);
        }, function(err) {
          callback(err, null);
        });
      }
    };
  }])
  .factory('Sparks', ["FirebaseSync", "LocalStorage", "GeoService",
                      function(FirebaseSync, LocalStorage, GeoService) {
    return {
      create: function(media, callback) {
        var _user = LocalStorage.get("user");
        var spark = {
          author: _user.id,
          media: media,
          created: new Date().getTime()
        };

        // Using Firebase Javascript API
        /* var ref = new Firebase(FIREBASE_URL);
        var sparkRef = ref.child("sparks").push();
        var sparkRefId = sparkRef.name();
        sparkRef.set(spark, function(err) {
          if (err) {
            callback(err, null);
          } else {
            callback(null, sparkRefId);
          }
        }); */

        var sparkSync = FirebaseSync("sparks");
        var geoFire = GeoService.getGeoFire("sparks");
        var loc = GeoService.getPosition();
        sparkSync.$push(spark)
        .then(function(sparkRef) {
          // set geo location
          geoFire.set(sparkRef.name(), loc).then(function() {
            callback(null, media);
          }, function(err) {
            callback(err, null);
          });
        }, function(err) {
          callback(err, null);
        });
      },
      all: function(callback) {
        var sparkSync = FirebaseSync("sparks");
        var sparks = sparkSync.$asArray();
        sparks.$loaded().then(function() {
          callback(null, sparks);
        }, function(err) {
          callback(err, null);
        });
      },
      get: function(id, callback) {
        var sync = FirebaseSync(["sparks", id]);
        var spark = sync.$asObject();
        spark.$loaded().then(function() {
          // populate author, likes, comments fields

          callback(null, spark);
        }, function(err) {
          callback(err, null);
        });
      }
    }
  }])
  .factory('HotBars', ["FirebaseSync", "FirebaseRef", "LocalStorage", "GeoService",
                       function(FirebaseSync, FirebaseRef, LocalStorage, GeoService) {
    var _geoFire = GeoService.getGeoFire("hotbars");
    function updateGeolocation(id, hotbar) {
      _geoFire.get(id).then(function(loc) {
        hotbar.location = loc;
      }, function(err) {
        console.error("Get geo location error: ", err);
      });
    }
    return {
      create: function(hotbar, callback) {
        console.assert(hotbar.location);
        var sync = FirebaseSync("hotbars");
        sync.$push(hotbar).then(function(hotbarRef) {
          /* GeoService.getGeoFire().set(hotbarRef.name(),
                                      [hotbar.location.latitude,
                                       hotbar.location.longitude])
            .then(function() {
              console.debug("Set geo location for " + hotbarRef.name());
              callback(null, hotbar);
            }, function(err) {
              console.error("Set geo location error: ", err);
              callback(err, null);
            }); */
          callback(null, hotbar);
        }, function(err) {
          callback(err, null);
        });
      },
      all: function(hotbars) {
        var geoQuery = _geoFire.query({
          center: GeoService.getPosition(),
          radius: 1609 / 1000 // km, should be in LocalStorage
        });
        var hotbarRef = FirebaseRef("hotbars");
        geoQuery.on("key_entered", function(hotbarId, hotbarLoc) {
          console.log("hotbar " + hotbarId + " in");
          hotbarRef.child(hotbarId).once("value", function(hotbarSnapshot) {
            var hotbar = hotbarSnapshot.val();
            hotbar.uid = hotbarSnapshot.name();
            updateGeolocation(hotbarSnapshot.name(), hotbar);
            hotbars.push(hotbar);
          });
        });
        geoQuery.on("key_exited", function(hotbarId, hotbarLoc) {
          console.log("hotbar " + hotbarId + " out");
          for (var i = 0; i < hotbars.length; ++i) {
            if (hotbars[i].$id == hotbarId) {
              hotbars.splice(i, 1);
              break;
            }
          }
        });
        geoQuery.on("key_moved", function(hotbarId, hotbarLoc) {
          console.log("hotbar " + hotbarId + " moved");
        });
        /* var sync = FirebaseSync("hotbars");
        var hotbars = sync.$asArray();
        hotbars.$loaded().then(function() {
          // populate geo locations
          for (var i = 0; i < hotbars.length; ++i) {
            // add geo location
            updateGeolocation(hotbars[i]);
          }
          callback(null, hotbars);
        }, function(err) {
          callback(err, null);
        }); */
      },
      get: function(id, callback) {
        var sync = FirebaseSync(["hotbars", id]);
        var hotbar = sync.$asObject();
        hotbar.$loaded().then(function() {
          callback(null, hotbar);
        }, function(err) {
          callback(err, null);
        });
      }
    };
  }]);
