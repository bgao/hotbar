
"use strict";

angular.module('hotbar.controllers')
  .controller('AccountCtrl', function($scope, $ionicLoading, $log, $state, $timeout,
                                      $rootScope, Global, Users) {

    (function() {
      $ionicLoading.show({
        template: "<i class=\"icon ion-loading-a\"></i> Loading..."
      });
      var _user = Global.get("user");
      $scope.user = {
        username: _user.get("username"),
        email: _user.get("email"),
        picture: _user.get("picture"),
        password: null,
        name: _user.get("name"),
        radius: _user.get("radius")/1600 || 1, // radius in meters
        posts: null,
        pushNote: _user.get("pushnote") || true,
        followingHotbars: null
      };
      // Get number of user posts
      Users.getActivities(function(err, activities) {
        if (err) {
          $log.error("AccountCtrl::Users.getActivities::error:");
          $log.error(err);
          $ionicLoading.hide();
        } else {
          // Get number of following hotbars
          Users.getFollowing(function(err, hotbars) {
            if (err) {
              $log.error("AccountCtrl::Users.getFollowing");
              $log.error(err);
              $ionicLoading.hide();
            } else {
              $timeout(function() {
                $scope.user.posts = activities;
                $scope.user.followingHotbars = hotbars;
                $ionicLoading.hide();
              });
            }
          });
        }
      });
    })();

    $rootScope.$on('$locationChangeStart', function(event) {
      var _user = Global.get("user");
      if (_user && $scope.user) {
        _user.set("radius", $scope.user.radius * 1600);
        _user.set("pushnote", $scope.user.pushNote);
      }
    });

    $scope.update = function() {
      Users.update($scope.user.username, $scope.user.currentPass, 
                   $scope.user.password, $scope.user.email,
                   $scope.user.name, function(err) {
                     if (err) {
                       $log.error("AccountCtrl: " + err);
                       Users.logout();
                       $state.go("login");
                     } else {
                       navigator.notification.alert("Updated successfully", null);
                       $log.debug("updated");
                     }
                   });
    }
    $scope.logout = function() {
      Users.logout();
      $state.go("login");
    }
  })

  .controller('LoginCtrl', function($scope, $ionicLoading, $state, $log,
                                    Global, Users) {
    // hide splash screen
    // navigator.splashscreen.hide();

    (function() {
      var _client = Global.get("client");
      _client.getLoggedInUser(function(err, data, user) {
        if (err) {
          $log.error("LoginCtrl: " + data);
          _client.logout();
        } else {
          if (_client.isLoggedIn()) {
            Global.set("user", user);
            $state.go('tab.activities');
          } else {
            Global.set("user", null);
            $log.debug("No logged in user");
          }
        }
      });
    })();


    $scope.logout = function() {
      Users.logout();
    };
    $scope.login = function(user) {
      var email = user.email;
      var password = user.password;
      $ionicLoading.show({
        template: "<i class=\"icon ion-loading-a\"></i> Loading..."
      });
      if (email && password) {
        Users.login(email, password, function(err, user) {
          $ionicLoading.hide();
          if (err) {
            $log.error("LoginCtrl::login: " + err);
            navigator.notification.alert("Invalid email or password", null);
          } else {
            $state.go('tab.activities');
          }
        });
      } else {
        $ionicLoading.hide();
        navigator.notification.alert("Missing email or password!", null);
      }
    };
    $scope.signup = function() {
      $state.go('signup');
    };
  })

  .controller('SignupCtrl', function($scope, $ionicLoading, $state, $log, Users) {
    $scope.signup = function(user) {
      var username = user.username;
      var password = user.password;
      var email = user.email;
      var name = user.name;
      $ionicLoading.show({
        template: "<i class=\"icon ion-loading-a\"></i> Loading..."
      });
      if (username && password && email) {
        Users.signup(username, password, email, name, function(err, user) {
          $ionicLoading.hide();
          if (err) {
            $log.error("SignupCtrl::signup: " + err);
            navigator.notification.alert("Signup failed.", null);
          } else {
            $state.go('tab.activities');
          }
        });
      } else {
        $ionicLoading.hide();
        navigator.notification.alert("Username, email and password are required.",
                                     null);
      }
    }
  })

  .controller('RetrievePassCtrl', function($scope, $ionicLoading) {
    $scope.getPassword = function() {
      $ionicLoading.show({
        template: "<i class=\"icon ion-loading-a\"></i> Loading..."
      });
      if ($scope.email) {
        $timeout(function() {
          $ionicLoading.hide();
          navigator.notification
            .alert("An email with temporary password will be sent to " +
                   "your email box.", null);
        },500);
      } else {
        $ionicLoading.hide();
      }
    }
  });
