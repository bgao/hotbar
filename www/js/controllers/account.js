"use strict";

angular.module("hotbar.controllers")
  .controller("LoginCtrl", function($scope, $state, $log, $ionicModal, $ionicLoading, GeoService) {
    var alert = navigator.notification ? navigator.notification.alert : window.alert;

    $ionicModal.fromTemplateUrl('reset-password-modal.html', function($ionicModal) {
      $scope.resetPasswordModal = $ionicModal;
    }, {
      scope: $scope,
      animation: 'slide-in-up'
    });

    $scope.login = function(user) {
      if (user && user.email && user.password) {
        $ionicLoading.show();
        Parse.User.logIn(user.email, user.password, {
          success: function(user) {
            $ionicLoading.hide();
            $log.debug("Logged in as: ", user);
            $state.go("tab.posts");
          },
          error: function(user, error) {
            $ionicLoading.hide();
            $log.error("Login failed: ", error);
            alert(error.message, null, "Login Failed");
          }
        });
      } else {
        alert("Missing email or password!", null, "Error");
      }
    };
    $scope.loginFacebook = function() {
      Parse.FacebookUtils.logIn(null, {
        success: function(user) {
          if (!user.existed()) {
            alert("User signed up and logged in through Facebook!");
          } else {
            alert("User logged in through Facebook!");
          }
        },
        error: function(user, error) {
          $log.error(error);
          alert("User cancelled the Facebook login or did not fully authorize.");
        }
      });
    };
    $scope.loginTwitter = function() {
      
    };
    $scope.signup = function() {
      $state.go("signup");
    };
    $scope.resetPassword = function(email) {
      Parse.User.requestPasswordReset(email, {
        success: function() {
          // Password reset request was sent successfully
          alert("A temporary password has been sent to you",
            null, "Reset password succeeded");
          $scope.resetPasswordModal.hide();
        },
        error: function(error) {
          // Show the error message somewhere
          alert(error.message, null, "Error");
        }
      });
    };
    $scope.$on("$destroy", function(event) {
      $scope.resetPasswordModal.remove();
    });

    // Trigger geolocation callback
    GeoService.getPosition();

    if (Parse.User.current()) {
      $log.debug(Parse.User.current());
      $state.go("tab.posts");
    }
  })

  .controller("SignupCtrl", function($scope, $state, $log, $ionicModal) {
    var alert = navigator.notification ? navigator.notification.alert : window.alert;

    $ionicModal.fromTemplateUrl('user-agreement-modal.html', function($ionicModal) {
      $scope.userAgreementModal = $ionicModal;
    }, {
      scope: $scope,
      animation: 'slide-in-up'
    });
    $scope.signup = function(user) {
      if (user && user.email && user.password && user.displayName) {
        var _user = new Parse.User();
        _user.set("username", user.email); // email as username
        _user.set("password", user.password);
        _user.set("email", user.email);

        // other fields can be set just like with Parse.Object
        _user.set("displayName", user.displayName);
        _user.set("radius", 1609);
        _user.set("picture", "http://www.stay.com/images/default-user-profile.png");
         
        _user.signUp(null, {
          success: function(user) {
            // Hooray! Let them use the app now.
            $log.debug("Signed up: ", user);
            $state.go("tab.posts");
          },
          error: function(user, error) {
            // Show the error message somewhere and let the user try again.
            $log.error("Signup error: ", error);
            alert(error.message, null, "Signup Error");
          }
        });
      } else {
        alert("Missing required information!", null, "Error");
      }
    };
  })

  .controller("AccountCtrl", function($scope, $log, $state, $timeout, $ionicModal, $ionicLoading) {
    var alert = navigator.notification ? navigator.notification.alert : window.alert;

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
    };

    var _user = Parse.User.current();
    $scope.user = {
      displayName: _user.get("displayName"),
      email: _user.get("email"),
      picture: _user.get("picture"),
      radius: Number((_user.get("radius") / 1609).toFixed(2))
    };
    // Get user posts
    var Post = Parse.Object.extend("Post");
    var query = new Parse.Query(Post);
    query.equalTo("user", _user);
    query.find({
      success: function(posts) {
        $timeout(function() {
          $scope.user.posts = posts;
        });
      },
      error: function(error) {
        $log.error("Getting user posts error: ", error);
      }
    });
    // Get user followed hotbars
    var userRelation = _user.relation("following");
    userRelation.query().find({
      success: function(list) {
        $timeout(function() {
          $scope.user.followings = list;
        });
      },
      error: function(error) {
        $log.error("Getting user followings error: ", error);
      }
    });

    $scope.$on('$destroy', function(event) {
      _user.set("radius", $scope.user.radius * 1609);
      _user.set("pushnote", $scope.user.pushNote);
      _user.save();
      // Remove modals
      $scope.passwordModal.remove();
      $scope.userAgreementModal.remove();
    });

    $scope.logout = function() {
      Parse.User.logOut();
      $state.go("login");
    }
  })
.controller("UserCtrl", function($scope, $stateParams, $state, $log, $timeout, $ionicLoading, Users, HotBars) {
  var _user = Parse.User.current();

  if (_user.id == $stateParams.userId) {
    $state.go("tab.account");
  } else {
    Users.get($stateParams.userId, function(error, user) {
      if (error) {
        $log.error("Getting user error: ", error);
      } else {
        $scope.user = {
          displayName: user.get("displayName"),
          picture: user.get("picture")
        };
        // Get user posts
        $scope.posts = [];
        var Post = Parse.Object.extend("Post");
        var query = new Parse.Query(Post);
        query.equalTo("user", user);
        query.descending("createdAt");
        query.find({
          success: function(posts) {
            for (var i = 0; i < posts.length; ++i) {
              posts[i].media = posts[i].get("media");
              posts[i].user = $scope.user;
              getHotbar(posts[i]);
              $scope.posts.push(posts[i]);
            }
          },
          error: function(error) {
            $log.error("Getting user posts error: ", error);
          }
        });
      }
    });
  }

  function getHotbar(post) {
    HotBars.get(post.get("hotbar").id, function(err, hotbar) {
      if (err) {
        $log.error("Getting post hotbar error: ", error);
      } else {
        $timeout(function() {
          post.hotbar = {
            name: hotbar.get("name"),
            address: hotbar.get("address"),
            region: hotbar.get("region"),
            url: hotbar.get("url")
          };
        });
      }
    });
  }  
});
