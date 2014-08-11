"use strict";

angular.module("hotbar.controllers")
  .controller("HomeCtrl", function($scope, $log, $timeout, $ionicLoading,
                                   Sparks, FirebaseRef, GeoService, S3, LocalStorage) {
    var alert = typeof navigator.notification == "undefined" ?
      window.alert : navigator.notification.alert;

    var _sparkRef = FirebaseRef("sparks");
    var _hotbarRef = FirebaseRef("hotbars");
    var _geoFire = GeoService.getGeoFire("hotbars");
    var _geoQuery = _geoFire.query({
      center: GeoService.getPosition(),
      radius: 20 / 1000  // 20 meters
    });
    $scope.hotbars = [];

    // geoQuery event handlers
    _geoQuery.on("key_entered", function(hotbarId, hotbarLoc) {
      $log.debug("hotbar " + hotbarId + " in");
      _hotbarRef.child(hotbarId).once("value", function(snapshot) {
        var hotbar = snapshot.val();
        hotbar.uid = snapshot.name();
        updateGeolocation(snapshot.name(), hotbar);
        $scope.hotbars.push(hotbar);
      });
    });

    _geoQuery.on("key_exited", function(hotbarId, hotbarLoc) {
      for (var i = 0; i < _hotbarsNearby.length; ++i) {
        if (_hotbarsNearby[i].uid == hotbarId) {
          $scope.hotbars.splice(i, 1);
          break;
        }
      }
    });

    _geoQuery.on("key_moved", function(hotbarId, hotbarLoc) {
      console.log("hotbar " + hotbarId + " moved");
    });

    function updateGeolocation(id, hotbar) {
      _geoFire.get(id).then(function(loc) {
        hotbar.location = loc;
      }, function(err) {
        console.error("Get geo location error: ", err);
      });
    }

    var cameraSuccess = function(imageFile) {
      var _user = LocalStorage.get("user");
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
      var _user = LocalStorage.get("user");
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
        alert(mediaFiles[0].fullPath, null, "CameraSuccess:fullpath");
        alert($scope.media.filename, null, "CameraSuccess:filename");
      });
    };
    var captureError = function(error) {
      if (error && error.code) {
        $log.error("Capture error: " + error.code);
        alert('Error code: ' + error.code, null, "Capture Error");
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

    $scope.captureVideo = function() {
      window.plugins.videocaptureplus.captureVideo(captureSuccess,
                                                   captureError,
                                                   {
                                                     limit: 1,
                                                     duration: 20,
                                                     highquality: false,
                                                     frontcamera: false
                                                   });
    };

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
      alert($scope.media.size, null);
      alert($scope.media.data, null);
      if (!$scope.media.hotbar || !$scope.media.hotbar.uuid) {
        alert("Invalid HotBar", null);
        return;
      }
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
          $scope.media.hotbar = null;
          // $scope.media.type = "media";
          // $scope.media.data = null;
          Sparks.create($scope.media, function(err, media) {
            if (err) {
              $log.error("HomeCtrl.create error: ", err);
              $ionicLoading.hide();
              alert("Create spark error", null);
            } else {
              $log.debug(media);
              $timeout(function() {
                $scope.media = null;
                $ionicLoading.hide();
              });
            }
            // cleanup for image
            if ($scope.media.type === "image/jpeg")
              $scope.cleanup();
          });
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
