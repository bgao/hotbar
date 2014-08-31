
"use strict";

angular.module('hotbar.controllers')
  .controller('AccountCtrl', function($scope, $ionicLoading, $log, $state, $timeout,
                                      $rootScope, $ionicModal, Global, Users) {

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
      var _user = Global.get("user");
      _user.changePassword(oldpassword, newpassword, function(err, user) {
        if (err) {
          navigator.notification.alert(err.message, null, "Error");
        } else {
          navigator.notification.confirm("Password change succeeded", null, "Success");
          $scope.passwordModal.hide();
        }
      });
    };

    $scope.changeProfilePicture = function(){
     navigator.camera.getPicture(cameraSuccess, cameraError, {
      quality : 50,
      destinationType : Camera.DestinationType.DATA_URL,
      sourceType : Camera.PictureSourceType.PHOTOLIBRARY,
      allowEdit : true
      encodingType : Camera.EncodingType.JPEG,
      targeWidth : 150,
      targetHeight: 150,
      popoverOptions: CameraPopoverOptions,
      saveToPhotoAlbum: false
     });

     /////////////////////////////// camera functions copied from home.js
      var cameraSuccess = function(imageFile) {
      var _user = Global.get("user");
      $timeout(function() {
        var index = imageFile.lastIndexOf('/') + 1;
        $scope.media = {
          filename: _user.get('username') + "_" + imageFile.substr(index),
          data: imageFile,
          type: 'image/jpeg'
          // src: "data:image/jpeg;base64,"+imageData
        };
        // debug
        navigator.notification.alert(imageFile, null, "CameraSuccess");
        navigator.notification.alert($scope.media.filename, null, "CameraSuccess");
      });
    };
    var cameraError = function(error) {
      if (error && error.code) {
        $log.error("Capture error: " + error.code);
        navigator.notification.alert('Error code: ' + error.code, null,
                                     'Capture Error');
      }
      $scope.cleanup();
    };
    var captureSuccess = function(mediaFiles) {
      var _user = Global.get("user");
      // $scope.mediaSrc = $scope.trustSrc(mediaFiles[0].fullPath);
      $scope.mediaSrc = mediaFiles[0].fullPath;
      $timeout(function() {
        navigator.notification.alert(mediaFiles, null, "CaptureSuccess");
        navigator.notification.alert(mediaFiles.length, null, "CaptureSuccess");
        $scope.media = {
          filename: _user.get('username') + "_" +
            mediaFiles[0].name,
          data: mediaFiles[0].fullPath,
          type: mediaFiles[0].type,
          size: mediaFiles[0].size
        };
        // debug
        navigator.notification.alert(mediaFiles[0].fullPath,
                                     null,
                                     "CameraSuccess:fullpath");
        navigator.notification.alert($scope.media.filename,
                                     null,
                                     "CameraSuccess:filename");
      });
    };
    var captureError = function(error) {
      if (error && error.code) {
        $log.error("Capture error: " + error.code);
        navigator.notification.alert('Error code: ' + error.code, null,
                                     'Capture Error');
      }
    };

    $scope.captureImage = function() {
      var options = {
        quality: 45,
        // destinationType: Camera.DestinationType.DATA_URL
        destinationType: Camera.DestinationType.FILE_URI,
        sourceType: Camera.PictureSourceType.CAMERA
      };
      navigator.camera.getPicture(cameraSuccess, cameraError, options);
    };

    $scope.getImage = function() {
      var options = {
        destinationType: Camera.DestinationType.DATA_URL,
        // destinationType: Camera.DestinationType.FILE_URI,
        quality: 50,
        sourceType: Camera.PictureSourceType.PHOTOLIBRARY,
        encodingType: Camera.EncodingType.JPEG
      };
      navigator.camera.getPicture(cameraSuccess, captureError, options);
    };

    function onFail(error) {
      $log.error("resolveLocalFileSystemURL: " + error.code);
      navigator.notification.alert('HomeCtrl::uploadMedia::onFaile:' + 
                                   error.code, null);
    }

    $scope.uploadMedia = function() {
      $ionicLoading.show({
        template: "<i class=\"icon ion-loading-a\"></i> Loading..."
      });
      console.assert($scope.media);

      // Get hotbar by name
      /* if ($scope.media.caption && $scope.media.caption.indexOf("@") >= 0) {
        var caption = $scope.media.caption;
        var idx = caption.indexOf("@");
        $scope.media.caption = caption.substr(0, idx).trim();
        var hotbarName = caption.substr(idx+1);
        if (hotbarName) {
          HotBars.getByName(hotbarName, function(err, entity) {
            if (err) {
              $log.error("HomeCtrl::uploadMedia::HotBars.getByName:");
              $log.error(err);
            } else {
              $scope.media.hotbar = entity._data;
            }
          });
        }
      } */
      // navigator.notification.alert($scope.media.size, null);
      navigator.notification.alert($scope.media.data, null);
      if (!$scope.media.hotbar || !$scope.media.hotbar.uuid) {
        navigator.notification.alert("Invalid HotBar", null);
        return;
      }
      S3.put($scope.media, function(err, data) {
        if (err) {
          $ionicLoading.hide();
          $log.error("HomeCtrl::uploadMedia: " + err);
          navigator.notification
            .alert('HomeCtrl::uploadMedia::Error', null);
          $scope.cleanup();
        }
        else {
          // $log.debug(data);
          // set media url
          $scope.media.url =
            "https://d2x86vdxy89a0s.cloudfront.net/" +
            $scope.media.filename;
          // $scope.media.type = "media";
          // $scope.media.data = null;
          Activities.create($scope.media, function(err, entity) {
            if (err) {
              $log.error("HomeCtrl::create: " + err);
              $ionicLoading.hide();
              navigator.notification
                .alert('HomeCtrl::create::Error', null);
            } else {
              $timeout(function() {
                $scope.media = null;
                $ionicLoading.hide();
              });
            }
            // cleanup for image
            if ($scope.media.type === 'image/jpeg')
              $scope.cleanup();
          });
        }
      });
    };

    $scope.cleanup = function() {
      $scope.media = null;
      if (navigator.camera) {
        navigator.camera.cleanup(function() {
          $log.debug("Camera cleanup success");
          navigator.notification.alert("Camera cleanup success", null);
        }, function(message) {
          $log.debug("Failed because: " + message);
          navigator.notification.alert("Camera cleanup fail", null);
        });
      }
    };
    $scope.filesChanged = function(elm) {
      $scope.files = elm.files;
      $scope.$apply();
    };
    $scope.uploadImage = function() {
      $log.info("uploading image...");
      $log.debug($scope.files);
      $log.debug($scope.files[0]);
      var _user = Global.get("user");
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
        $timeout(function() {
          $scope.media = {
            filename: _user.get('username') + "_" + /* $scope.files[0].name, */
            Math.round(new Date().getTime()/1000) + ".jpg",
            data: reader.result,
            type: "image/jpeg"
          };
        });
      };
      reader.readAsDataURL($scope.files[0]);
    };

     //////////////////////////////end of copied home.js copied code

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

    $scope.$on('$destroy', function(event) {
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

  .controller('SignupCtrl', function($scope, $ionicLoading, $state, $log,
                                     $ionicModal, Users) {

    $ionicModal.fromTemplateUrl('user-agreement-modal.html', function($ionicModal) {
      $scope.userAgreementModal = $ionicModal;
    }, {
      scope: $scope,
      animation: 'slide-in-up'
    });
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
  })

  .controller('PasswordModalCtrl', function($scope, Users) {
    $scope.changePassword = function() {
      $scope.modal.hide();
    };
  });
