// hotbar.controllers.CaptureCtrl

angular.module("hotbar.controllers")
  .controller("CaptureCtrl", function($scope, $log, $timeout, $ionicLoading,
                                      $cordovaCamera, GeoService, S3) {
    var alert = typeof navigator.notification == "undefined" ?
      window.alert : navigator.notification.alert;
    // Regex for getting file name extension
    var re = /(?:\.([^.]+))?$/;
    var currentUser = Parse.User.current();
    $scope.user = currentUser;
    $scope.media = null;
    $scope.position = null;
    $scope.hotbars = [];
    $scope.hotbar = null;

    var getNearestHotbar = function(callback) {
      $ionicLoading.show();
      GeoService.getPosition(function(err, pos) {
        if (err) {
          $log.error("Get current position error: ", err);
          callback(err, null);
        } else {
          // alert("Current position: " + JSON.stringify(pos));
          $scope.position = pos;
          getHotbarNearby(pos, function(err, hotbars) {
            if (err) {
              $log.error("Found nearby hotbar error: ", err);
              callback(err, null);
            } else {
              if (hotbars) {
                $timeout(function() {
                  $scope.hotbars.length = 0;
                  for (var i = 0; i < hotbars.length; ++i) {
                    var hotbar = {
                      name: hotbars[i].get("name"),
                      address: hotbars[i].get("address"),
                      location: hotbars[i].get("location"),
                      url: hotbars[i].get("url")
                    };
                    $scope.hotbars.push(hotbar);
                  }
                  $scope.hotbar = hotbars[0];
                  // alert(JSON.stringify($scope.hotbar));
                });
              }
              callback(null, $scope.hotbars);
            }
          });
        }
      });
    };

    var init = function() {
      getNearestHotbar(function(err, hotbars) {
        $ionicLoading.hide();
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
                if (users[i].id == currentUser.id) {
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
    };

    $scope.doRefresh = function() {
      $ionicLoading.show();
      init();
      // Get user posts
      $scope.posts = [];
      var Post = Parse.Object.extend("Post");
      var query = new Parse.Query(Post);
      query.equalTo("user", currentUser);
      query.find({
        success: function(posts) {
          $scope.posts = posts;
        },
        error: function(error) {
          $log.error("Getting user posts error: ", error);
        }
      });
      // Get user followed hotbars
      var userRelation = currentUser.relation("following");
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
      // Get followed uesrs
      var followUsers = currentUser.relation("followingUsers");
      followUsers.query().find({
        success: function(list) {
          $timeout(function() {
            $scope.user.followingUsers = list;
          });
          $scope.$broadcast('scroll.refreshComplete');
          $ionicLoading.hide();
        },
        error: function(err) {
          $log.error("Getting followed users error: ", err);
          $scope.$broadcast('scroll.refreshComplete');
          $ionicLoading.hide();
        }
      });
    };

  	function getHotbarNearby(position, callback) {
      var HotBar = Parse.Object.extend("HotBar");
      var query = new Parse.Query(HotBar);
      var point = new Parse.GeoPoint(position);
      query.withinMiles("location", point, 200.0 / 1609.0); // find hotbars within 200 meters
      query.find({
        success: function(hotbars) {
          // $log.debug("Found a list of hotbars: ", hotbars);
          callback(null, hotbars);
        },
        error: function(list, error) {
          callback(error, null);
        }
      });
    }

    function cameraSuccess(imageFile) {
      console.assert(currentUser);
      $timeout(function() {
        var index = imageFile.lastIndexOf('/') + 1;
        $scope.media = {
          filename: currentUser.id + "_" + imageFile.substr(index),
          data: imageFile,
          type: 'image/jpeg'
          // src: "data:image/jpeg;base64,"+imageData
        };
      });
    };

    /* function cameraSuccess(imageData) {
      $timeout(function() {
        $scope.media = {
          filename: currentUser.id + "_" + Math.round(new Date().getTime()/1000) + ".jpg",
          data: "data:image/jepg;base64," + imageData,
          type: "image/jpeg"
        };
      });
    } */

    function cameraError(error) {
      if (error && error.code) {
        $log.error("Capture error: " + error.code);
        alert('Error code: ' + error.code, null, 'Camera Error');
      }
      $scope.cleanup();
    }

    function captureSuccess(mediaFiles) {
      // $scope.mediaSrc = $scope.trustSrc(mediaFiles[0].fullPath);
      alert(mediaFiles[0].fullPath, null, "Original file path");
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
          filename: currentUser.id + "_" + Math.round(new Date().getTime()/1000) + ext,
          data: filePath,
          type: mediaFiles[0].type,
          size: mediaFiles[0].size
        };
        // debug
        alert(mediaFiles[0].fullPath, null, "captureSuccess:fullpath");
        //alert($scope.media.filename, null, "captureSuccess:filename");
      });
    }

    function captureError(error) {
      if (error && error.code) {
        $log.error("Capture error: " + error.code);
        // alert('Error code: ' + error.code, null, "Video Capture Error");
      }
    }

    $scope.captureImage = function() {
      getNearestHotbar(function(err, hotbars) {
        $ionicLoading.hide();
        if ($scope.hotbar || $scope.adminUser) {
          var options = {
            quality: 50,
            // destinationType: Camera.DestinationType.DATA_URL,
            destinationType: Camera.DestinationType.FILE_URI,
            sourceType: Camera.PictureSourceType.CAMERA,
            encodingType: Camera.EncodingType.JPEG,
            saveToPhotoAlbum: false
          };
          $cordovaCamera.getPicture(options).then(cameraSuccess, cameraError);
        } else {
          alert("In order to post an image, you need to be in a HotBar", null, "Error");
        }
      });
    };

    $scope.captureVideo = function() {
      getNearestHotbar(function(err, hotbars) {
        $ionicLoading.hide();
        if ($scope.hotbar || $scope.adminUser) {
          /* var options = {
            limit: 1,
            duration: 20
          };
          $cordovaCapture.captureVideo(options).then(captureSuccess, captureError); */
          var options = {
            limit: 1,
            duration: 20,
            highquality: false,
            frontcamera: false
          };
          window.plugins.videocaptureplus.captureVideo(captureSuccess, captureError, options);
        } else {
          alert("In order to post a video, you need to be in a HotBar", null, "Error");
        }
      });
    };

    function getImageSuccess(imageFile) {
      var index = imageFile.lastIndexOf('/') + 1;
      $scope.coverPicture = {
        filename: currentUser.id + "_" + imageFile.substr(index),
        data: imageFile,
        type: 'image/jpeg'
        // src: "data:image/jpeg;base64,"+imageData
      };
    }

    $scope.getImage = function() {
      var options = {
        // destinationType: Camera.DestinationType.DATA_URL,
        destinationType: Camera.DestinationType.FILE_URI,
        quality: 50,
        sourceType: Camera.PictureSourceType.PHOTOLIBRARY,
        encodingType: Camera.EncodingType.JPEG
      };
      $cordovaCamera.getPicture(options).then(getImageSuccess, cameraError);
    };

    function savePost(media) {
      var Post = Parse.Object.extend("Post");
      var post = new Post();
      var postACL = new Parse.ACL(currentUser);
      postACL.setPublicReadAccess(true);
      post.setACL(postACL);
      post.set("location", $scope.position);
      post.set("user", currentUser);
      post.set("media", media);
      post.set("hotbar", $scope.hotbar);
      post.save();
      post.media = {
        url: media.get("url"),
        thumbnailUrl: media.get("thumbnailUrl"),
        type: media.get("type"),
        description: media.get("description")
      };
      var _profilePic = currentUser.get("profilePictureThumbnail");
      _profilePic = _profilePic ?
        _profilePic.url() : "http://www.stay.com/images/default-user-profile.png";
      post.user = {
        displayName: currentUser.get("displayName"),
        profilePicture: _profilePic
      };
      if ($scope.hotbar) {
        post.hotbar = {
          name: $scope.hotbar.get("name"),
          address: $scope.hotbar.get("address"),
          region: $scope.hotbar.get("region"),
          url: $scope.hotbar.get("url")
        };
      }
      // $scope.posts.unshift(post);
      $scope.cleanup();
      $ionicLoading.hide();
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
              console.log("[HOTBAR][ENCODING]: ", response);
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
    };

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
            filename: currentUser.id + "_" + /* $scope.files[0].name, */
            Math.round(new Date().getTime()/1000) + ".jpg",
            data: reader.result,
            type: "image/jpeg"
          };
        });
      };
      reader.readAsDataURL($scope.files[0]);
    };

    $scope.doRefresh();
  })
  .controller("CapturePostsCtrl", function($scope, $log, $timeout, $ionicLoading, $sce) {
    var currentUser = Parse.User.current();

    function trustSrc(src) {
      return $sce.trustAsResourceUrl(src);
    }
    var getPostDetails = function(posts) {
      posts.forEach(function(post) {
        post.user = {
          displayName: currentUser.get("displayName"),
          id: currentUser.id
        };
        var media = post.get("media");
        media.fetch({
          success: function(obj) {
            post.media = {
              description: obj.get("description"),
              url: obj.get("url"),
              secUrl: trustSrc(obj.get("url")),
              thumbnailUrl: obj.get("thumbnailUrl"),
              type: obj.get("type")
            };
          },
          error: function(err) {
            $log.error("Getting media error, post.id: ", post.id);
          }
        });
        var hotbar = post.get("hotbar");
        if (hotbar) {
          hotbar.fetch({
            success: function(obj) {
              post.hotbar = {
                name: obj.get("name"),
                address: obj.get("address"),
                region: obj.get("region"),
                url: obj.get("url"),
                id: obj.id
              };
            },
            error: function(error) {
              $log.error("Fetch hotbar error: ", error);
            }
          });
        }
        $timeout(function() {
          $scope.posts.push(post);
        });
      });
    };

    $scope.doRefresh = function() {
      $scope.posts = [];
      var Post = Parse.Object.extend("Post");
      var query = new Parse.Query(Post);
      query.equalTo("user", currentUser);
      $ionicLoading.show();
      query.find({
        success: function(posts) {
          getPostDetails(posts);
          $scope.$broadcast('scroll.refreshComplete');
          $ionicLoading.hide();
        },
        error: function(error) {
          $ionicLoading.hide();
          $scope.$broadcast('scroll.refreshComplete');
          $log.error("Getting user posts error: ", error);
        }
      });
    };

    $scope.doRefresh();
  })
  .controller("CaptureHotbarsCtrl", function($scope, $log, $timeout, $ionicLoading, $q, GeoService) {
    var currentUser = Parse.User.current();

    function getGooglePlaceDetails(hotbar) {
      if (hotbar.get("googlePlaceId")) {
        var request = {
          placeId: hotbar.get("googlePlaceId")
        };
        // console.assert(_map);
        var service = new google.maps.places.PlacesService(document.getElementById("hotbar"));
        service.getDetails(request, function(place, status) {
          if (status == google.maps.places.PlacesServiceStatus.OK) {
            hotbar.rating = place.rating;
            hotbar.openHours = place.opening_hours;
          }
        });
      }
      GeoService.getDistance(hotbar.get("location"), function(err, distance) {
        if (err) {
          $log.error("Getting hotbar distance error: ", status);
        } else {
          hotbar.distance = distance.text;
        }
      });
    }

    function getFollowers(hotbar) {
      var dfd = $q.defer();
      var hotbarRelation = hotbar.relation("followers");
      hotbarRelation.query().find({
        success: function(list) {
          hotbar.followers = list;
          list.forEach(function(user) {
            if (user.id == currentUser.id)
              hotbar.following = true;
          });
          dfd.resolve(hotbar);
        },
        error: function(error) {
          $log.error("Get hotbar's number of followers error: ", error);
          dfd.reject(error);
        }
      });
      return dfd.promise;
    }

    $scope.doRefresh = function() {
      $scope.hotbars = [];
      // Get user followed hotbars
      var userRelation = currentUser.relation("following");
      $ionicLoading.show();
      userRelation.query().find({
        success: function(hotbars) {
          hotbars.forEach(function(hotbar) {
            getFollowers(hotbar).then(getGooglePlaceDetails(hotbar));
            $timeout(function() {
              $scope.hotbars.push(hotbar);
            });
          });
          $scope.$broadcast('scroll.refreshComplete');
          $ionicLoading.hide();
        },
        error: function(error) {
          $log.error("Getting user followings error: ", error);
          $scope.$broadcast('scroll.refreshComplete');
          $ionicLoading.hide();
        }
      });
    };

    $scope.doRefresh();
  })
  .controller("CaptureUsersCtrl", function($scope, $log, $timeout, $ionicLoading, $q) {
    var currentUser = Parse.User.current();

    var getMedia = function(post) {
      var deferred = $q.defer()
        , media = post.get("media");
      if (media) {
        media.fetch({
          success: function(obj) {
            post.media = {
              description: obj.get("description"),
              url: obj.get("url"),
              thumbnailUrl: obj.get("thumbnailUrl"),
              type: obj.get("type")
            };
            deferred.resolve(post);
          },
          error: function(err) {
            $log.error("Getting media error: ", err);
            deferred.reject(err);
          }
        });
      }
      return deferred.promise;
    };

    var getHotbar = function(post) {
      var deferred = $q.defer()
        , hotbar = post.get("hotbar");
      if (hotbar) {
        post.hotbar = {
          name: hotbar.get("name"),
          address: hotbar.get("address"),
          region: hotbar.get("region"),
          url: hotbar.get("url")
        };
        deferred.resolve(post);
      } else {
        deferred.reject();
      }
      return deferred.promise;
    };

    $scope.showPosts = function(user) {
      user.showPosts = (user.showPosts == undefined) ? true : !user.showPosts;
      var Post = Parse.Object.extend("Post");
      var query = new Parse.Query(Post);
      query.equalTo("user", user);
      query.descending("createdAt");
      query.find({
        success: function(posts) {
          for (var i = 0; i < posts.length; ++i) {
            posts[i].user = user;
            getMedia(posts[i])
              .then(function(post) {
                return getHotbar(post);
              });
          }
          $timeout(function() {
            user.posts = posts;
          });
          $scope.$broadcast('scroll.refreshComplete');
          $ionicLoading.hide();
        },
        error: function(error) {
          $log.error("Getting user posts error: ", error);
          $scope.$broadcast('scroll.refreshComplete');
          $ionicLoading.hide();
        }
      });
    };

    $scope.doRefresh = function() {
      $scope.users = [];

      var userRelation = currentUser.relation("followingUsers");
      $ionicLoading.show();
      userRelation.query().find({
        success: function(users) {
          users.forEach(function(user) {
            var profilePic = user.get("profilePictureThumbnail");
            user["displayName"] = user.get("displayName");
            user["picture"] = profilePic ? profilePic.url() : "http://www.stay.com/images/default-user-profile.png";
            $timeout(function() {
              $scope.users.push(user);
            });
          });
          $scope.$broadcast('scroll.refreshComplete');
          $ionicLoading.hide();
        },
        error: function(err) {
          $log.error("Querying users error: ", err);
          $scope.$broadcast('scroll.refreshComplete');
          $ionicLoading.hide();
        }
      });
    };

    $scope.doRefresh();
  });
