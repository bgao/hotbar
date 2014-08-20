"use strict";

angular.module("hotbar.controllers")
  .controller("HomeCtrl", function($scope, $log, $timeout, $ionicLoading, GeoService, S3, HotBars) {
    var alert = typeof navigator.notification == "undefined" ?
      window.alert : navigator.notification.alert;

    var _user = Parse.User.current();
    $scope.posts = [];

    // get hotbars followed by user
    var userRelation = _user.relation("following");
    userRelation.query().find({
      success: function(hotbars) {
        // get user posts
        var Post = Parse.Object.extend("Post");
        var query1 = new Parse.Query(Post);
        query1.equalTo("user", _user);
        var query2 = new Parse.Query(Post);
        query2.containedIn("hotbar", hotbars);
        var query = Parse.Query.or(query1, query2);
        query.find({
          success: function(posts) {
            for (var i = 0; i < posts.length; ++i) {
              posts[i].media = posts[i].get("media");
              getHotbar(posts[i]);
              posts[i].user = {
                displayName: _user.get("displayName"),
                email: _user.get("email"),
                picture: _user.get("picture")
              };
              $scope.posts.push(posts[i]);
            }
          },
          error: function(error) {
            $log.error("Retrieving user's posts error: ", error);
          }
        });
      },
      error: function(error) {
        $log.error("Getting hotbars followed by user error: ", error);
      }
    });

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

    function getHotbarNearby(callback) {
      var HotBar = Parse.Object.extend("HotBar");
      var query = new Parse.Query(HotBar);
      var point = new Parse.GeoPoint(GeoService.getPosition());
      query.withinMiles("location", point, 20.0 / 1609.0); // find hotbars within 20 meters
      query.find({
        success: function(hotbars) {
          $log.debug("Found a list of hotbars: ", hotbars);
          callback(null, hotbars[0]);
        },
        error: function(list, error) {
          callback(error, null);
        }
      });  
    }

    var cameraSuccess = function(imageFile) {
      console.assert(_user);
      $timeout(function() {
        var index = imageFile.lastIndexOf('/') + 1;
        $scope.media = {
          filename: _user.id + "_" + imageFile.substr(index),
          data: imageFile,
          type: 'image/jpeg'
          // src: "data:image/jpeg;base64,"+imageData
        };
        // debug
        alert(imageFile, null, "CameraSuccess");
        alert($scope.media.filename, null, "CameraSuccess");
      });
    };
    var cameraError = function(error) {
      if (error && error.code) {
        $log.error("Capture error: " + error.code);
        alert('Error code: ' + error.code, null, 'Capture Error');
      }
      $scope.cleanup();
    };
    var captureSuccess = function(mediaFiles) {
      // $scope.mediaSrc = $scope.trustSrc(mediaFiles[0].fullPath);
      $scope.mediaSrc = mediaFiles[0].fullPath;
      $timeout(function() {
        alert(mediaFiles, null, "CaptureSuccess");
        alert(mediaFiles.length, null, "CaptureSuccess");
        $scope.media = {
          filename: _user.id + "_" + mediaFiles[0].name,
          data: mediaFiles[0].fullPath,
          type: mediaFiles[0].type,
          size: mediaFiles[0].size
        };
        // debug
        // alert(mediaFiles[0].fullPath, null, "CameraSuccess:fullpath");
        // alert($scope.media.filename, null, "CameraSuccess:filename");
      });
    };
    var captureError = function(error) {
      if (error && error.code) {
        $log.error("Capture error: " + error.code);
        alert('Error code: ' + error.code, null, "Capture Error");
      }
    };

    $scope.captureImage = function() {
      // Get the hotbar nearby
      getHotbarNearby(function(err, hotbar) {
        if (err) {
          $log.error("Found nearby hotbar error: ", err);
        } else {
          if (hotbar) {
            $scope.hotbar = hotbar;
            var options = {
              quality: 45,
              // destinationType: Camera.DestinationType.DATA_URL
              destinationType: Camera.DestinationType.FILE_URI,
              sourceType: Camera.PictureSourceType.CAMERA
            };
            navigator.camera.getPicture(cameraSuccess, cameraError, options);
          } else {
            alert("In order to post image, you need to be in a HotBar", null, "Error");
          }
        }
      });
    };

    $scope.captureVideo = function() {
      // Get the hotbar nearby
      getHotbarNearby(function(err, hotbar) {
        if (err) {
          $log.error("Found nearby hotbar error: ", err);
        } else {
          if (hotbar) {
            $scope.hotbar = hotbar;
            window.plugins.videocaptureplus.captureVideo(captureSuccess, captureError,
              { limit: 1, duration: 20, highquality: false, frontcamera: false });
          } else {
            alert("In order to post video, you need to be in a HotBar", null, "Error");
          }
        }
      });
    };

    $scope.uploadMedia = function() {
      $ionicLoading.show();
      console.assert($scope.media);

      // alert($scope.media.size, null);
      // alert($scope.media.data, null);

      S3.put($scope.media, function(err, data) {
        if (err) {
          $ionicLoading.hide();
          $log.error("HomeCtrl.S3.push error:  ", err);
          alert("Upload media error", null);
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
          var Post = Parse.Object.extend("Post");
          var post = new Post();
          post.set("location", GeoService.getPosition());
          post.set("user", _user);
          post.set("media", $scope.media);
          post.set("hotbar", $scope.hotbar);
          post.save();
          // cleanup for image
          if ($scope.media.type === "image/jpeg") {
            $scope.cleanup();
          }
          $ionicLoading.hide();
        }
      });
    };

    // Cleanup for ios
    $scope.cleanup = function() {
      $scope.media = null;
      if (navigator.camera) {
        navigator.camera.cleanup(function() {
          $log.debug("Camera cleanup success");
          alert("Camera cleanup success", null);
        }, function(message) {
          $log.debug("Failed because: " + message);
          alert("Camera cleanup fail", null);
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
      var _user = LocalStorage.get("user");
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
            filename: _user.id + "_" + /* $scope.files[0].name, */
            Math.round(new Date().getTime()/1000) + ".jpg",
            data: reader.result,
            type: "image/jpeg"
          };
        });
      };
      reader.readAsDataURL($scope.files[0]);
    };

  });
