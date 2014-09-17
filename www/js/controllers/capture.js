"use strict";

angular.module("hotbar.controllers")
  .controller("CaptureCtrl", function($scope, $log, $timeout, $ionicLoading, $http, $sce, GeoService, S3) {

    var alert = typeof navigator.notification == "undefined" ? window.alert : navigator.notification.alert;

    // Regex for getting file name extension
    var re = /(?:\.([^.]+))?$/;

    var _user = Parse.User.current();

    $scope.media = null;
    $scope.hotbar = null;
    $scope.posts = [];
    // Get cover picture
    $scope.coverPictureUrl = _user.get("coverPicture") ? _user.get("coverPicture").url() : "img/coverpicture.jpg";

    getHotbarNearby(function(err, hotbar) {
      if (err) {
        $log.error("Found nearby hotbar error: ", err);
      } else {
        if (hotbar) {
          $timeout(function() {
          	$scope.hotbar = {
	          name: hotbar.get("name"),
	          address: hotbar.get("address"),
	          location: hotbar.get("location"),
	          url: hotbar.get("url")
          	};
          });
        }
      }
    });

    var query = new Parse.Query(Parse.Role);
    query.equalTo("Administrator");
    query.find({
      success: function(roles) {
        roles[0].getUsers().query().find({
          success: function(users) {
            $log.debug(users);
          },
          error: function(error) {
            $log.error("Getting Administrator users error: ", error);
          }
        });
      },
      error: function(error) {
        $log.error("Getting Administrators error: ", error);
      }
    });

    // get hotbars followed by the current user
    var userRelation = _user.relation("following");
    $ionicLoading.show();
    userRelation.query().find({
      success: function(hotbars) {
        // get user posts
        var Post = Parse.Object.extend("Post");
        var query1 = new Parse.Query(Post);
        query1.equalTo("user", _user);
        var query2 = new Parse.Query(Post);
        query2.containedIn("hotbar", hotbars);
        var query = Parse.Query.or(query1, query2);
        query.descending("createdAt");
        query.find({
          success: function(posts) {
            for (var i = 0; i < posts.length; ++i) {
              /* var postGroup = [];
              for (var j = 0; j < 3; ++j) {
                if (i+j < posts.length) {
                  getMedia(posts[i+j]);
                  getHotbar(posts[i+j]);
                  posts[i+j].user = {
                    displayName: _user.get("displayName"),
                    email: _user.get("email"),
                    picture: _user.get("picture")
                  };
                  postGroup.push(posts[i+j]);
                }
              }
              $scope.posts.push(postGroup); */
              getMedia(posts[i]);
              getHotbar(posts[i]);
              getUser(posts[i]);
              $scope.posts.push(posts[i]);
            }
            $ionicLoading.hide();
          },
          error: function(error) {
            $log.error("Retrieving user's posts error: ", error);
            $ionicLoading.hide();
          }
        });
      },
      error: function(error) {
        $log.error("Getting hotbars followed by user error: ", error);
        $ionicLoading.hide();
      }
    });

  var query = new Parse.Query(Parse.Role);
  query.equalTo("Administrator");
  query.find({
    success: function(roles) {
      var adminRole = roles[0];
      // Add someone to the role
      /* var User = Parse.Object.extend("User");
      var query = new Parse.Query(User);
      query.get("0euRClL8bK", {
        success: function(user) {
          adminRole.getUsers().add(user);
          adminRole.save();
        },
        error: function(error) {
          $log.error("Query user error: ", error);
        }
      }); */

      adminRole.getUsers().query().find({
        success: function(users) {
          for (var i = 0; i < users.length; ++i) {
            if (users[i].id == _user.id) {
              $scope.adminUser = true;
              break;
            }
          }
        },
        error: function(error) {
          $log.error("Get Admin users error: ", error);
        }
      });
    },
    error: function(error) {
      $log.error("Get Admin Role error: ", error);
    }
  });

	function getUser(post) {
      var user = post.get("user");
      user.fetch({
        success: function(obj) {
          var profilePicture = obj.get("profilePicture");
          if (profilePicture) {
          	profilePicture = profilePicture.url();
          } else {
            profilePicture = obj.get("picture");
          }
          $timeout(function() {
            post.user = {
              displayName: obj.get("displayName"),
              email: obj.get("email"),
              profilePicture: profilePicture,
              id: obj.id
            };
          });
        },
        error: function(error) {
          $log.error("Fetch user error: ", error);
        }
      });
    }
    function getHotbar(post) {
      var hotbar = post.get("hotbar");
      if (hotbar) {
        hotbar.fetch({
          success: function(obj) {
            $timeout(function() {
              post.hotbar = {
                name: obj.get("name"),
                address: obj.get("address"),
                region: obj.get("region"),
                url: obj.get("url"),
                id: obj.id
              };
            });
          },
          error: function(error) {
            $log.error("Fetch hotbar error: ", error);
          }
        });
      }
    }
    function trustSrc(src) {
      return $sce.trustAsResourceUrl(src);
    }
    function getMedia(post) {
      var media = post.get("media");
      media.fetch({
        success: function(obj) {
          $timeout(function() {
            post.media = {
              description: obj.get("description"),
              url: obj.get("url"),
              secUrl: trustSrc(obj.get("url")),
              thumbnailUrl: obj.get("thumbnailUrl"),
              type: obj.get("type")
            };
          });
        }
      });
    };

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

    function cameraSuccess(imageFile) {
      console.assert(_user);
      $timeout(function() {
        var index = imageFile.lastIndexOf('/') + 1;
        $scope.media = {
          filename: _user.id + "_" + imageFile.substr(index),
          data: imageFile,
          type: 'image/jpeg'
          // src: "data:image/jpeg;base64,"+imageData
        };
      });
    };

    /* function cameraSuccess(imageData) {
      $timeout(function() {
        $scope.media = {
          filename: _user.id + "_" + Math.round(new Date().getTime()/1000) + ".jpg",
          data: "data:image/jepg;base64," + imageData,
          type: "image/jpeg"
        };
      });
    } */
    
    function cameraError(error) {
      if (error && error.code) {
        $log.error("Capture error: " + error.code);
        alert('Error code: ' + error.code, null, 'Capture Error');
      }
      $scope.cleanup();
    }
    
    function captureSuccess(mediaFiles) {
      // $scope.mediaSrc = $scope.trustSrc(mediaFiles[0].fullPath);
      //alert(mediaFiles[0].fullPath, null, "Original file path");
      var filePath = mediaFiles[0].fullPath;
      if (filePath.indexOf("file:") < 0) {
        // The path should look like /private/storage...
        filePath = "file://" + filePath;
      } else if (filePath.indexOf("file:///") < 0) {
        // The path should look like file:/storage...
        filePath = "file://" + filePath.substr(5);
      }
      // get file extension
      var ext = "." + re.exec(mediaFiles[0].name)[1];
      $timeout(function() {
        $scope.media = {
          filename: _user.id + "_" + Math.round(new Date().getTime()/1000) + ext,
          data: filePath,
          type: mediaFiles[0].type,
          size: mediaFiles[0].size
        };
        // debug
        // alert(mediaFiles[0].fullPath, null, "CameraSuccess:fullpath");
        //alert($scope.media.filename, null, "CameraSuccess:filename");
      });
    }

    function captureError(error) {
      if (error && error.code) {
        $log.error("Capture error: " + error.code);
        alert('Error code: ' + error.code, null, "Capture Error");
      }
    };

    $scope.captureImage = function() {
      if ($scope.hotbar || $scope.adminUser) {
        var options = {
          quality: 45,
          // destinationType: Camera.DestinationType.DATA_URL,
          destinationType: Camera.DestinationType.FILE_URI,
          sourceType: Camera.PictureSourceType.CAMERA
        };
        navigator.camera.getPicture(cameraSuccess, cameraError, options);
      } else {
        alert("In order to post image, you need to be in a HotBar", null, "Error");
      }
    };

    $scope.captureVideo = function() {
      if ($scope.hotbar || $scope.adminUser) {
        window.plugins.videocaptureplus.captureVideo(captureSuccess, captureError,
          { limit: 1, duration: 20, highquality: false, frontcamera: false });
      } else {
        alert("In order to post video, you need to be in a HotBar", null, "Error");
      }
    };

    function getImageSuccess(imageFile) {
      var index = imageFile.lastIndexOf('/') + 1;
      $scope.coverPicture = {
        filename: _user.id + "_" + imageFile.substr(index),
        data: imageFile,
        type: 'image/jpeg'
        // src: "data:image/jpeg;base64,"+imageData
      };
    }

    $scope.getImage = function() {
      var options = {
        // destinationType: Camera.DestinationType.DATA_URL,
        destinationType: Camera.DestinationType.FILE_URI,
        quality: 45,
        sourceType: Camera.PictureSourceType.PHOTOLIBRARY,
        encodingType: Camera.EncodingType.JPEG
      };
      navigator.camera.getPicture(getImageSuccess, cameraError, options);
    };

    function savePost(media) {
      var Post = Parse.Object.extend("Post");
      var post = new Post();
      var postACL = new Parse.ACL(_user);
      postACL.setPublicReadAccess(true);
      post.setACL(postACL);
      post.set("location", GeoService.getPosition());
      post.set("user", _user);
      post.set("media", media);
      post.set("hotbar", $scope.hotbar);
      post.save();
      post.media = {
        url: media.get("url"),
        thumbnailUrl: media.get("thumbnailUrl"),
        type: media.get("type"),
        description: media.get("description")
      };
      var _profilePicture = _user.get("profilePicture");
      if (_profilePicture) {
        _profilePicture = _profilePicture.url();
      } else {
        _profilePicture = _user.get("picture");
      }
      post.user = {
        displayName: _user.get("displayName"),
        profilePicture: _profilePicture
      };
      if ($scope.hotbar) {
        post.hotbar = {
          name: $scope.hotbar.get("name"),
          address: $scope.hotbar.get("address"),
          region: $scope.hotbar.get("region"),
          url: $scope.hotbar.get("url")
        };
      }      
      $scope.posts.unshift(post);
      $scope.cleanup();
    }

    /* function uploadImage() {
      $ionicLoading.show();
      // Parse File
      var mediaFile = new Parse.File($scope.media.filename, { base64: $scope.media.data });
      mediaFile.save().then(function() {
        var Media = Parse.Object.extend("Media");
        var media = new Media();
        media.set("url", mediaFile.url());
        media.set("type", $scope.media.type);
        media.set("description", $scope.media.description);
        media.set("file", mediaFile);
        media.save();
        savePost(media);
        $ionicLoading.hide();
      }, function(error) {
        $log.error("ParseFile save error: ", error);
        $ionicLoading.hide();
      });
    } */

    function uploadImage() {
      $ionicLoading.show();
      S3.put($scope.media, function(err, data) {
        if (err) {
          $log.error("HomeCtrl.S3.push error:  ", err);
          alert("Upload media error", null);
          $scope.cleanup();
          $ionicLoading.hide();
        } else {
          var filename = $scope.media.filename;
          var Media = Parse.Object.extend("Media");
          var media = new Media();
          media.set("url", "https://d2x86vdxy89a0s.cloudfront.net/" + filename);
          media.set("type", $scope.media.type);
          media.set("description", $scope.media.description);
          media.save();
          savePost(media);
          $ionicLoading.hide();
        }
      });
    }

    function uploadVideo() {
      $ionicLoading.show();
      S3.put($scope.media, function(err, data) {
        if (err) {
          $log.error("HomeCtrl.S3.push error:  ", err);
          alert("Upload media error", null);
          $scope.cleanup();
          $ionicLoading.hide();
        } else {
          // Send encoding request
          var filename = $scope.media.filename;
          filename = filename.substr(0, filename.lastIndexOf("."));
          var encodingData = {
            input: "s3://hotbar/" + $scope.media.filename,
            credentials: "s3",
            outputs: [{
              "url": "s3://hotbar/" + filename + ".mp4",
              "label": "mp4 high",
              "h264_profile": "high",
              "credentials": "s3",
              "thumbnails": [{
                "label": "poster",
                "public": true,
                "base_url": "s3://hotbar/",
                "filename": filename,
                "credentials": "s3",
                "height": 256
              }]
            }]
          };
          Parse.Cloud.run("encoding", {"data": encodingData}, {
            success: function(response) {
              var Media = Parse.Object.extend("Media");
              var media = new Media();
              media.set("url", "https://d2x86vdxy89a0s.cloudfront.net/" + filename + ".mp4");
              media.set("thumbnailUrl", "https://d2x86vdxy89a0s.cloudfront.net/" + filename + ".png");
              // media.set("type", $scope.media.type);
              media.set("type", "video/mp4");
              media.set("description", $scope.media.description);
              media.save();
              savePost(media);
              $ionicLoading.hide();
            },
            error: function(response) {
              $log.error("Encoding request error: ", response);
              $ionicLoading.hide();
            }
          });
        }
      });
    }

    $scope.uploadMedia = function() {
      if ($scope.media.type === "image/jpeg") {
        uploadImage();
      } else {
        uploadVideo();
      }
    }

    // Cleanup for ios
    $scope.cleanup = function() {      
      if ($scope.media.type === "image/jpeg" && navigator.camera) {
        navigator.camera.cleanup(function() {
          $log.debug("Camera cleanup success");
          //alert("Camera cleanup success", null);
        }, function(message) {
          $log.debug("Failed because: " + message);
          //alert("Camera cleanup fail", null);
        });
      }
      $scope.media = null;
    };

    $scope.filesChanged = function(elm) {
      $scope.files = elm.files;
      $scope.$apply();
    };

    $scope.encodingRequest = function() {
      var filename = "Rbt6ahdH5a_1408853521.3gp";
      var newFilename = filename.substr(0, filename.lastIndexOf(".")) + ".webm";
      var data = {
        input: "s3://hotbar/" + filename,
        credentials: "s3",
        outputs: [{
          url: "s3://hotbar/" + newFilename,
          label: "webm",
          format: "webm",
          credentials: "s3"
        }]
      };
      /* Parse.Cloud.httpRequest({
        method: "POST",
        url: "https://app.zencoder.com/api/v2/jobs",
        headers: {"Zencoder-Api-Key": "0f65557257eb754b293779d452951e94"},
        data: {
          "input": input,
          "outputs": outputs
        },
        success: function(httpResponse) {
          $log.debug(httpResponse.text);
        },
        error: function(httpResponse) {
          $log.error("Encoding request failed: ", httpResponse.status);
        }
      }); */
      Parse.Cloud.run("encoding", {"data": data}, {
        success: function(response) {
          $log.debug(response);
        },
        error: function(response) {
          $log.error(response);
        }
      });
    };

    $scope.uploadImage = function() {
      $log.info("uploading image...");
      $log.debug($scope.files);
      $log.debug($scope.files[0]);
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