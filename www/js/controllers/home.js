angular.module('hotbar.controllers')
  .controller('HomeCtrl', function($scope, $ionicLoading, $log, $timeout, $sce,
                                   $ionicModal,Global,Activities,Users,S3,HotBars) {

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

    function rad(x) {
      return x*Math.PI/180;
    }

    function getDistance(p1, p2) {
      var R = 6378137; // Earth's mean radiu in meter
      var dLat = rad(p2.lat() - p1.lat());
      var dLng = rad(p2.lng() - p1.lng());
      var a = Math.sin(dLat / 2)*Math.sin(dLat / 2)+
        Math.cos(rad(p1.lat())) * Math.cos(rad(p2.lat())) *
        Math.sin(dLng / 2) * Math.sin(dLng / 2);
      var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
      var d = R * c;
      return d.toFixed(2); // returns the distance in meters
    }

    (function() {
      // Load all media activities
      $ionicLoading.show({
        template: '<i class=\"icon ion-loading-a\"></i> Loading...'
      });
      var _user = Global.get('user');
      // Get cover picture
      $scope.coverpicture = _user.get("coverpicture") || "img/coverpicture.jpg";
      // Get nearby hotbars
      HotBars.all(function(err, entities) {
        var _hotbars = [];
        if (err) {
          $log.error("HomeCtrl::HotBars.all:");
          $log.error(err);
        } else {
          while (entities.hasNextEntity()) {
            var hotbar = entities.getNextEntity();
            var adr = hotbar.get("adr");
            var _hotbar = {
              uuid: hotbar.get("uuid"),
              name: hotbar.get("name"),
              address: adr.addr1 + ", " + adr.city + ", " + adr.state + " " + adr.zip,
              url: hotbar.get("url"),
              location: hotbar.get("location")
            };
            // Check the distance between the bar and current location
            if (getDistance(Global.get("position"),
                            new google.maps.LatLng(_hotbar.location.latitude,
                                                   _hotbar.location.longitude)) < 30){
              _hotbars.push(_hotbar);
            }
          }
          $timeout(function() {
            $scope.hotbars = _hotbars;
            if ($scope.hotbars.length == 0) {
              $scope.hotbars.push({name: "No HotBar found"});
            }
          });
        }
      });
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
