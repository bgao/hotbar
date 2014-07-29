angular.module('hotbar.controllers')
  .controller('HomeCtrl', function($scope, $ionicLoading, $log, $timeout, $sce,
                                   Global, Activities, Users, S3, HotBars) {

    /* var cameraSuccess = function(imageData) {
      var _user = Global.get("user");
      $timeout(function() {
        $scope.media = {
          filename: _user.get('username') + "_" + 
            Math.round(new Date().getTime()/1000)+".jpg",
          // data: imageData
          data: "data:image/jpeg;base64," + imageData,
          type: "image/jpeg"
        };            
      });       
    } */
    var cameraSuccess = function(imageFile) {
      var _user = Global.get("user");
      $timeout(function() {
        var index = imageFile.lastIndexOf('/') + 1;
        $scope.media = {
          filename: _user.get('username') + "_" +
            imageFile.substr(index),
          data: imageFile,
          type: 'image/jpeg'
          // src: "data:image/jpeg;base64,"+imageData
        };
        // debug
        navigator.notification.alert(imageFile, null, "CameraSuccess");
        navigator.notification.alert($scope.media.filename, null, "CameraSuccess");
      });
    };
    var captureSuccess = function(mediaFiles) {
      var _user = Global.get("user");
      // $scope.mediaSrc = $scope.trustSrc(mediaFiles[0].fullPath);
      navigator.notification.alert(mediaFiles, null, "CaptureSuccess");
      navigator.notification.alert(mediaFiles.length, null, "CaptureSuccess");
      $scope.mediaSrc = mediaFiles[0].fullPath;
      $timeout(function() {
        $scope.media = {
          filename: _user.get('username') + "_" +
            mediaFiles[0].name,
          data: mediaFiles[0].fullPath,
          type: mediaFiles[0].type,
          size: mediaFiles[0].size
        };
      });
      // debug
      navigator.notification.alert(mediaFiles[0].fullPath,
                                   null,
                                   "CameraSuccess:fullpath");
      navigator.notification.alert($scope.media.filename,
                                   null,
                                   "CameraSuccess:filename");
    };
    var captureError = function(error) {
      if (error && error.code) {
        $log.error("Capture error: " + error.code);
        navigator.notification.alert('Error code: ' + error.code, null,
                                     'Capture Error');
      }
      $scope.cleanup();
    };

    $scope.captureImage = function() {
      var options = {
        quality: 45,
        // destinationType: Camera.DestinationType.DATA_URL
        destinationType: Camera.DestinationType.FILE_URI,
        sourceType: Camera.PictureSourceType.CAMERA
      };
      navigator.camera.getPicture(cameraSuccess, captureError, options);
    };
    /* $scope.captureImage = function() {
       navigator.device.capture.captureImage(captureSuccess,
       captureError);
       // { limit: 1 });
       } */
    $scope.captureVideo = function() {
      navigator.device.capture.captureVideo(captureSuccess,
                                            captureError,
                                            { duration: 20 });
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
      if ($scope.media.caption && $scope.media.caption.indexOf("@") >= 0) {
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
      }
      navigator.notification.alert($scope.media.size, null);
      navigator.notification.alert($scope.media.data, null);
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
            $scope.cleanup();
          });
        }
      });
    };

    /* $scope.uploadMedia = function() {
       $ionicLoading.show({
       template: "Loading..."
       });
       $log.debug("media.path = " + $scope.media.path);
       window.resolveLocalFileSystemURL($scope.media.path, function(fileEntry) {
       $log.debug("fileEntry.toURL()");
       $log.debug(fileEntry.toURL());
       fileEntry.file(function(file) {
       var reader = new FileReader();
       reader.onloadend = function() {
       navigator.notification
       .alert('HomeCtrl::uploadMedia::FileReader', null);
       $scope.media.data = reader.result;
       S3.put($scope.media, function(err, data) {
       if (err) {
       $ionicLoading.hide();
       $log.error("HomeCtrl::uploadMedia: " + err);
       navigator.notification
       .alert('HomeCtrl::uploadMedia::Error', null);
       $scope.message;
       }
       else {
       $log.debug(data);
       // set media url
       $scope.media.url =
       "https://d2x86vdxy89a0s.cloudfront.net/" +
       $scope.media.filename;
       Activities.create($scope.media, function(err, entity) {
       $ionicLoading.hide();
       if (err) {
       $log.error("HomeCtrl::create: " + err);
       navigator.notification
       .alert('HomeCtrl::create::Error', null);
       } else {
       $log.debug(entity);
       $state.go("tab.activities");
       }
       });
       }
       });
       $scope.$apply();
       };
       reader.readAsDataURL(file);
       }, onFail);
       }, onFail);
       }; */

    $scope.cleanup = function() {
      $scope.media = null;
      if (navigator.camera) {
        navigator.camera.cleanup(function() {
          $log.debug("Camera cleanup success");
        }, function(message) {
          $log.debug("Failed because: " + message);
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
        /* S3.put($scope.media, function(err, data) {
           $ionicLoading.hide();
           if (err) {
           $log.error("HomeCtrl::uploadImage: " + err);
           $scope.message;
           }
           else {
           $log.debug(data);
           // set media url
           $scope.media.url =
           "https://d2x86vdxy89a0s.cloudfront.net/"+$scope.media.filename;
           Activities.create($scope.media, function(err, entity) {
           if (err) {
           $log.error("HomeCtrl::create: " + err);
           } else {
           $log.debug(entity);
           $state.go("tab.media");
           }
           });
           }
           }); */
      };
      reader.readAsDataURL($scope.files[0]);
    };

    /* function getAvatar() {
      var _user = Global.get("user");
      var email = ''
      , avatar = '';
      if (_user && _user.get('email')) {
        email = _user.get('email');
        avatar = 'http://www.gravatar.com/avatar/' +
          Util.MD5(email.toLowerCase()) + '?s=' + 50;
      }
      if (!email) {
        avatar = _user && _user.get('image') && _user.get('image').url;
      }
      if (!avatar) {
        avatar = 'http://www.gravatar.com/avatar/' +
          Util.MD5('rod@apigee.com') + '?s=' + 50;
      }
      $scope.avatar = avatar;
    } */

    function getLikes() {
      var _user = Global.get("user");
      console.assert($scope.activities);
      for (var i = 0; i < $scope.activities.length; ++i) {
        var activity = $scope.activities[i];
        Activities.getLikes(activity, function(err, entities) {
          if (err) {
            $log.error("HomeCtrl::getLikes: " + err);
          } else {
            activity.liked = false;
            for (var i = 0; i < entities.length; ++i) {
              if (entities[i].email == _user.get("email")) {
                activity.liked = true;
                break;
              }
            }
            $timeout(function() {
              activity.likes = entities;
            });
          }
        });
      }
      $ionicLoading.hide();
    }
    
    function isFollowing(hotbar) {
      console.assert(hotbar);
      if ($scope.followingHotbars) {
        for (var i = 0; i < $scope.followingHotbars.length; ++i) {
          if ($scope.followingHotbars[i].uuid == hotbar)
            return true;
        }
      }
      return false;
    }

    $scope.loadMore = function() {
      if ($scope._activities && $scope._activities.hasNextPage()) {
        $ionicLoading.show({
          template: "<i class=\"icon ion-loading-a\"></i> Loading..."
        });

        var _activities = [];
        $scope._activities.getNextPage(function(err, data, entities) {
          while (entities.hasNextEntity()) {
            var entity = entities.getNextEntity();
            // Only media activity has an "object"
            if (!entity.get('object'))
              continue;

            var actor = entity.get('actor');
            var hotbar = entity.get('hotbar');
            // Get only the user's activities or activities for the hotbar
            // the user following
            if ((actor.username == _user.get('username')) ||
                (hotbar && isFollowing(hotbar))) {

              var _activity = {
                uuid: entity.get('uuid'),
                created: entity.get('created'),
                name: actor.displayName || 'Anonymous',
                username: actor.displayName,
                avatar: actor.picture,
                media: entity.get('object'),
                comments: entity.get('comments') || []
              };
              _activities.push(_activity);
            }
          }
          $timeout(function() {
            $scope.activities = ($scope.activities || []).concat(_activities);
            getLikes();
            $ionicLoading.hide();
          });
        });
      }
    };

    $scope.trustSrc = function(src) {
      return $sce.trustAsResourceUrl(src);
    };

    (function() {
      // Load all media activities
      $ionicLoading.show({
        template: '<i class=\"icon ion-loading-a\"></i> Loading...'
      });
      var _user = Global.get('user');
      // Get user following hotbars
      Users.getFollowing(function(err, hotbars) {
        if (err) {
          $log.error("HomeCtrl::getFollowing");
          $log.error(err);
        } else {
          $scope.followingHotbars = hotbars;
          Activities.all(function(err, activities) {
            $scope._activities = activities;
            var _activities = [];
            if (err) {
              $log.error("Activities::all: " + err);
            } else {
              while(activities.hasNextEntity()) {
                var entity = activities.getNextEntity();

                // Only media activity has an "object"
                if (!entity.get('object'))
                  continue;

                var actor = entity.get('actor');
                var hotbar = entity.get('hotbar');
                // Get only the user's activities or activities for the hotbar
                // the user following
                if ((actor.username == _user.get('username')) ||
                    (hotbar && isFollowing(hotbar))) {
                  var _activity = {
                    uuid: entity.get('uuid'),
                    created: entity.get('created'),
                    name: actor.displayName || 'Anonymous',
                    username: actor.displayName,
                    avatar: actor.picture,
                    media: entity.get('object'),
                    comments: entity.get('comments') || [],
                    hotbar: entity.get('hotbar')
                  };
                  _activities.push(_activity);
                }
              }
            }
            $timeout(function() {
              $scope.activities = _activities;
              getLikes();
              $ionicLoading.hide();
            });
          });
        }
      });
    })();
  });
