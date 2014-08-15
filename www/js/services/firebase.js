"use strict";

function pathRef(args) {
  for(var i=0; i < args.length; i++) {
    if( args[i] && angular.isArray(args[i]) ) {
      args[i] = pathRef(args[i]);
    }
  }
  return args.join('/');
}

angular.module("hotbar.services")
  // a simple utility to create references to Firebase paths
  .factory("FirebaseRef", ["FIREBASE_URL", function(FIREBASE_URL) {
    /**
     * @function
     * @name FirebaseRef
     * @param {String|Array...} path
     * @return a Firebase instance
     */
    return function(path) {
      var ref = new Firebase(FIREBASE_URL);
      if (arguments.length > 0) {
        ref = ref.child(pathRef([].concat(Array.prototype.slice.call(arguments))));
      }
      return ref;
    }
  }])
  // a simple utility to create $firebase objects from angularFire
  .factory("FirebaseSync", ["$firebase", "FirebaseRef",
                            function($firebase, FirebaseRef) {
    /**
     * @function
     * @name FirebaseSync
     * @param {String|Array...} path
     * @return a Firebase instance
     */
    return function(path, limit) {
      var ref = FirebaseRef(path);
      limit && (ref = ref.limit(limit));
      return $firebase(ref);
    }
  }])
  /**
   * A service that authenticates against Fireabase using simple login
   */
  .factory('AuthManager', ["$firebaseSimpleLogin", "$rootScope", "FirebaseRef",
                           "LocalStorage", function($firebaseSimpleLogin, $rootScope,
                                                    FirebaseRef, LocalStorage) {
      var _auth = $firebaseSimpleLogin(FirebaseRef());
      var _logoutCallback = null
                             
      $rootScope.$on("$firebaseSimpleLogin:login", function(event, user) {
        LocalStorage.set("user", user);
      });
      $rootScope.$on("$firebaseSimpleLogin:logout", function(event) {
        LocalStorage.remove("user");
        if (_logoutCallback && typeof _logoutCallback == "function") {
          _logoutCallback();
        }
        /* window.cookies.clear(function() {
           console.log("Cookies cleared!");
           }); */
      });
      $rootScope.$on("$firebaseSimpleLogin:error", function(event, error) {
        console.error("$firebaseSimpleLogin error: ", error);
      });

      return {
        login: function(user) {
          return _auth.$login("password", {
            email: user.email,
            password: user.password,
            rememberMe: true
          });
        },
        loginFacebook: function() {
          return _auth.$login("facebook", {
            rememberMe: true
          });
        },
        loginTwitter: function() {
          return _auth.$login("twitter", {
            rememberMe: true
          });
        },
        logout: function(cb) {
          _logoutCallback = cb;
          _auth.$logout();
        },
        signup: function(user) {
          return _auth.$createUser(user.email, user.password);
        },
        resetPassword: function(email) {
          return _auth.$sendPasswordResetEmail(email);
        },
        changePassword: function(email, oldPass, newPass) {
          return _auth.$changePassword(email, oldPass, newPass);
        }
      }
    }])
  .factory("GeoService", ["FirebaseRef", function(FirebaseRef) {
    // default location is Boston
    var _position = [42.358431, -71.059773];
    // Assign the geolocation callback
    if (navigator.geolocation) {
      navigator.geolocation.watchPosition(function(pos) {
        console.debug("Updated geolocation: ", pos);
        _position = [pos.coords.latitude, pos.coords.longitude];
      }, function(err) {
        console.error("Watch device position error");
        console.error(err);
      }, { maximumAge: 60000, timeout: 5000, enableHighAccuracy:true });
    }

    return {
      getPosition: function() {
        return _position;
      },
      getGeoFire: function(path) {
        return new GeoFire(FirebaseRef([path, "_geofire"]));
      }
    };
    
  }]);
