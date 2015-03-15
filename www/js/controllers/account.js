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

    // Get current position
    GeoService.getPosition();

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
    // Login with Facebook using simple OAuth way introduced here:
    // http://coenraets.org/blog/2014/04/facebook-phonegap-cordova-without-plugin/
    // with addition trick described here:
    // https://www.parse.com/questions/facebook-with-cordovaphonegap
    $scope.loginFacebook = function() {
      openFB.login(function(response) {
        if (response.status === "connected") {
          // $log.debug(response);
          var expirationDate = new Date(response.authResponse.expiresin*1000+
            (new Date()).getTime()).toJSON();
          // get info
          openFB.api({path: '/me',
            success: function(data) {
              Parse.FacebookUtils.logIn(
                {"id": data.id,
                 "access_token": response.authResponse.token,
                 "expiration_date": expirationDate}, {
                success: function(user) {
                  // $log.debug("Logged in as: ", user);
                  user.set("displayName", data.name);
                  user.set("email", data.email);
                  user.save();
                  $state.go("tab.posts");
                },
                error: function(user, error) {
                  $log.error("Login failed: ", error);
                  alert("Facebook login failed: " + error, null, "Login Failed");
                }
              });
            },
            error: function(error) {
              $log.error("Get Facebook User Info error: ", error);
            }});
        } else {
          alert("Facebook login failed: " + response.error, null, "Login Failed");
        }
      }, {scope: 'email,read_stream'});
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
        // _user.set("picture", "http://www.stay.com/images/default-user-profile.png");

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

  .controller("AccountCtrl", function($scope, $log, $state, $timeout, $ionicModal, $ionicLoading, $http) {
    var alert = navigator.notification ? navigator.notification.alert : window.alert;
    var _user = Parse.User.current();

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

    function savePicture(imageData, pictureType, callback) {
      var picture = {
        filename: _user.id + "_" + Math.round(new Date().getTime()/1000) + ".jpg",
        data: imageData,
        type: 'image/jpeg'
      };
      // save the image file
      var file = new Parse.File(picture.filename, { base64: picture.data });
      file.save().then(function() {
        _user.set(pictureType, file);
        _user.save();
        callback(null, _user.get(pictureType));
      }, function(error) {
        callback(error, null);
      });
    }

    function getProfilePicSuccess(imageData) {
      // remove old profile picture
      var oldProfilePicture = _user.get("profilePicture");
      var oldProfileThumbnail = _user.get("profilePictureThumbnail");
      var config = {
        headers: {
          "X-Parse-Application-Id": "VX9NoYMIpR0yA7srjpmncHmthF8sAuVP80Q5Kgo2",
          "X-Parse-Master-Key": "5jdnO46S55ZodQrr8HmlQrKcPm1svSJYHQtwsQyL"
        }
      };
      $ionicLoading.show();
      if (oldProfilePicture) {
        $http.delete(oldProfilePicture.url(), config).then({
          success: function(data, status) {
            $log.debug("Delete profile picture success: ", data);
          },
          error: function(data, status) {
            $log.error("Delete profile picture error: ", data);
          }
        });
      }
      if (oldProfileThumbnail) {
        $http.delete(oldProfileThumbnail.url(), config).then({
          success: function(data, status) {
            $log.debug("Delete profile picture thumbnail success: ", data);
          },
          error: function(data, status) {
            $log.error("Delete profile picture thumbnail error: ", data);
          }
        });
      }
      savePicture(imageData, "profilePicture", function(error, profilePicture) {
        if (error) {
          $log.error("Save profile picture error: ", error);
        } else {
          var thumbnail = _user.get("profilePictureThumbnail");
          var p =  thumbnail ? thumbnail.url() : null;
          $timeout(function() {
            $scope.user.profilePicture = p;
          });
          $ionicLoading.hide();
        }
      });
      /* Parse.Cloud.run("saveProfilePicture", picture, {
        success: function() {
          var profilePicture = _user.get("profilePicture").url();
          $timeout(function() {
            $scope.user.profilePicture = profilePicture;
          });
        },
        error: function(error) {
          $log.error("Save profile picture error: ", error);
        }
      }); */
    }

    function getCoverPicSuccess(imageData) {
      savePicture(imageData, "coverPicture", function(error, coverPicture) {
        if (error) {
          $log.error("Save cover picture error: ", error);
        } else {
          if (coverPicture) {
            $timeout(function() {
              $scope.user.coverPicture = coverPicture.url();
            });
          }
        }
      });
    }

    function cameraError(error) {
      if (error && error.code) {
        $log.error("Capture error: " + error.code);
        alert('Error code: ' + error.code, null, 'Capture Error');
      }
      // $scope.cleanup();
    }

    $scope.setProfilePicture = function() {
      var options = {
        destinationType: Camera.DestinationType.DATA_URL,
        // destinationType: Camera.DestinationType.FILE_URI,
        quality: 25,
        sourceType: Camera.PictureSourceType.PHOTOLIBRARY,
        encodingType: Camera.EncodingType.JPEG
      };
      navigator.camera.getPicture(getProfilePicSuccess, cameraError, options);
    };

    $scope.setCoverPicture = function() {
      var options = {
        destinationType: Camera.DestinationType.DATA_URL,
        // destinationType: Camera.DestinationType.FILE_URI,
        quality: 45,
        sourceType: Camera.PictureSourceType.PHOTOLIBRARY,
        encodingType: Camera.EncodingType.JPEG
      };
      navigator.camera.getPicture(getCoverPicSuccess, cameraError, options);
    };

    var _coverPicture = _user.get("coverPicture");
    if (_coverPicture) {
      _coverPicture = _coverPicture.url();
    } else {
      _coverPicture = "img/coverpicture.jpg";
    }

    var _profilePicture = _user.get("profilePictureThumbnail");
    if (_profilePicture) {
      _profilePicture = _profilePicture.url();
    } else {
      _profilePicture = "http://www.stay.com/images/default-user-profile.png";
    }
    $timeout(function() {
      $scope.user = {
        displayName: _user.get("displayName"),
        email: _user.get("email"),
        profilePicture: _profilePicture,
        radius: Number((_user.get("radius") / 1609).toFixed(2)),
        coverPicture: _coverPicture,
        hotbar: _user.get("hotbar")
      };
    });

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
      // update user
      _user.set("radius", $scope.user.radius * 1609);
      _user.set("pushnote", $scope.user.pushNote);
      _user.save();
      // update hotbar news
      if ($scope.user.hotbar) {
        var News = Parse.Object.extend("News");
        var news = new News();
        news.set("content", $scope.user.hotbarNews);
        news.set("hotbar", $scope.user.hotbar);
        news.save();
      }
      // Remove modals
      $scope.passwordModal.remove();
      $scope.userAgreementModal.remove();
    });

    $scope.logout = function() {
      Parse.User.logOut();
      openFB.logout(function() {
        $log.debug("Logout successful");
      }, function(error) {
        $log.error("Logout FB error: ", error.message);
      });
      $state.go("login");
    };
  });
