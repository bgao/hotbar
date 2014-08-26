"use strict";

angular.module('hotbar.services', [])
  .run(["PARSE_APP_ID", "PARSE_JS_KEY", "FACEBOOK_APP_ID", function(PARSE_APP_ID, PARSE_JS_KEY, FACEBOOK_APP_ID) {
    Parse.initialize(PARSE_APP_ID, PARSE_JS_KEY);
    Parse.FacebookUtils.init({
        appId      : FACEBOOK_APP_ID, // Facebook App ID
        // channelUrl : '//www.anyyolk.com/channel.html', // Channel File
        // status     : true, // check login status
        cookie     : true, // enable cookies to allow Parse to access the session
        xfbml      : false  // parse XFBML
    });
    /* window.fbAsyncInit = function() {
      // init the FB JS SDK
      
    };
    (function(d, s, id) {
      var js, fjs = d.getElementsByTagName(s)[0];
      if (d.getElementById(id)) return;
      js = d.createElement(s); js.id = id;
      js.src = "//connect.facebook.net/en_US/all.js";
      fjs.parentNode.insertBefore(js, fjs);
    }(document, 'script', 'facebook-jssdk')); */
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
  .factory("GeoService", [function() {
    // default location is Boston
    // var _position = {latitude: 42.358431, longitude: -71.059773};
    // For debugging
    var _position = { latitude: 42.3578035, longitude: -71.0603367 };
    // Assign the geolocation callback
    /* if (navigator.geolocation) {
      navigator.geolocation.watchPosition(function(pos) {
        console.debug("Updated geolocation: ", pos);
        _position.latitude = pos.coords.latitude;
        _position.longitude = pos.coords.longitude;
      }, function(err) {
        console.error("Watch device position error: ", err);
      }, { maximumAge: 60000, timeout: 5000, enableHighAccuracy:true });
    } */

    function getDistance(place) {
      var point1 = new Parse.GeoPoint(_position);
      var point2 = place;
      return point1.milesTo(point2);
    }

    return {
      getPosition: function() { return _position; },
      getDistance: getDistance
    }
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
  .factory('Posts', ["GeoService", function(GeoService) {
    var _user = Parse.User.current();
    var Post = Parse.Object.extend("Post");
    return {
      create: function(media, callback) {
        var post = new Post();
        post.set("location", GeoService.getPosition());
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
    var _position = GeoService.getPosition();
    var HotBar = Parse.Object.extend("HotBar");

    return {
      create: function(hotbar, callback) {
      },
      all: function(callback) {
        var query = new Parse.Query(HotBar);
        var point = new Parse.GeoPoint(_position);
        var distance = (_user.get("radius") || 1609) / 1609;
        query.withinMiles("location", point, distance).find({
          success: function(results) {
            callback(null, results);
          },
          error: function(error) {
            callback(error, null);
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
  .factory("Users", [function() {
    return {
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
