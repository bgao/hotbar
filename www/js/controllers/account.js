"use strict";

angular.module("hotbar.controllers")
  .controller("LoginCtrl", function($scope, $state, $log, $ionicModal,
                                    AuthManager, LocalStorage) {
    var notification = navigator.notification ? navigator.notification : window;

    $ionicModal.fromTemplateUrl('reset-password-modal.html', function($ionicModal) {
      $scope.resetPasswordModal = $ionicModal;
    }, {
      scope: $scope,
      animation: 'slide-in-up'
    });

    $scope.login = function(user) {
      if (user && user.email && user.password) {
        AuthManager.login(user)
          .then(function(user) {
            $log.debug("Logged in as: ", user.uid);
            $state.go("tab.sparks");
          }, function(error) {
            $log.error("Login failed: ", error);
            var message = error.message.substr(error.message.indexOf(":")+1);
            notification.alert(message, null, "Login failed");
          });
      } else {
        notification.alert("Missing email or password!", null, "Error");
      }
    };
    $scope.loginFacebook = function() {
      AuthManager.loginFacebook().then(function(user) {
        $log.debug("Logged in with Facebook: ", user);
        $state.go("tab.sparks");
      }, function(err) {
        $log.error("Login with Facebook error: ", err);
      });
    };
    $scope.loginTwitter = function() {
      AuthManager.loginTwitter().then(function(user) {
        $log.debug("Logged in with Twitter: ", user);
        $state.go("tab.sparks");
      }, function(err) {
        $log.error("Login with Twitter error: ", err);
      });
    };
    $scope.signup = function() {
      $state.go("signup");
    };
    $scope.resetPassword = function(email) {
      AuthManager.resetPassword(email).then(function() {
        notification.alert("A temporary password has been sent to your email box",
                           null, "Reset password succeeded");
        resetPasswordModal.hide();
      }, function(err) {
        $log.error("Reset password failed: ", err);
        var message = err.message.substr(err.message.lastIndexOf(":")+1);
        notification.alert(message, null, "Reset password failed");
      });
    };
    $scope.$on("$destroy", function(event) {
      $scope.resetPasswordModal.remove();
    });

    (function() {
      if (LocalStorage.get("user")) {
        $log.debug(LocalStorage.get("user"));
        $state.go("tab.sparks");
      }
    })();
  })

  .controller("SignupCtrl", function($scope, $state, $log, $ionicModal,
                                     AuthManager, People) {
    var notification = navigator.notification ? navigator.notification : window;

    $ionicModal.fromTemplateUrl('user-agreement-modal.html', function($ionicModal) {
      $scope.userAgreementModal = $ionicModal;
    }, {
      scope: $scope,
      animation: 'slide-in-up'
    });
    $scope.signup = function(user) {
      if (user && user.email && user.password && user.name) {
        AuthManager.signup(user)
          .then(function(user) {
            $log.debug("Created user: ", user.uid);
            // Updated user info
            var info = {
              name: user.name,
              searchRadius: 1609,
              picture: "http://www.stay.com/images/default-user-profile.png"
            };
            People.set(uid, info, function(err) {
              if (err) {
                $log.error("SignupCtrl.People.set error: ", err);
              } else {
                $log.debug("Set user info for user: " + uid);
              }
            });
          }, function(error) {
            $log.error("Signup failed: ", error);
            var message = error.message.substr(error.message.indexOf(":")+1);
            notification.alert(message, null, "Signup failed");
          });
      } else {
        notification.alert("Missing required information!", null, "Error");
      }
    };
  })

  .controller("AccountCtrl", function($scope, $log, $state, $timeout, $ionicModal,
                                      $ionicLoading, AuthManager, LocalStorage) {
    var notification = navigator.notification ? navigator.notification : window;

    $ionicModal.fromTemplateUrl('change-password-modal.html', function($ionicModal) {
      $scope.passwordModal = $ionicModal;
    }, {
      scope: $scope,
      animation: 'slide-in-up'
    });

    $ionicModal.fromTemplateUrl('user-agreement-modal.html', function($ionicModal) {
      $scope.userAgreementModal = $ionicModal;
    }, {
      scope: $scope,
      animation: 'slide-in-up'
    });

    $scope.changePassword = function(oldpassword, newpassword) {
      var _user = LocalStorage.get("user");
      console.assert(_user);
      AuthManager.changePassword(_user.email, oldpassword, newpassword)
      .then(function(success) {
          notification.alert("Password change succeeded", null, "Success");
          $scope.passwordModal.hide();
      }, function(error) {
        $log.error("Password change failed: ", error);
        var message = error.message.substr(error.message.indexOf(":")+1);
        notification.alert(message, null, "Password change failed");
      });
    };

    /* (function() {
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
    })(); */

    $scope.$on('$destroy', function(event) {
      /* var _user = Global.get("user");
      if (_user && $scope.user) {
        _user.set("radius", $scope.user.radius * 1600);
        _user.set("pushnote", $scope.user.pushNote);
      } */
      // Remove modals
      $scope.passwordModal.remove();
      $scope.userAgreementModal.remove();
    });

    $scope.logout = function() {
      AuthManager.logout(function() { $state.go("login"); });
    }
  });
