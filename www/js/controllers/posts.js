"use strict";

angular.module("hotbar.controllers")
  .controller("PostsCtrl", function($scope, $ionicLoading, $log, $timeout, Posts, GeoService) {
    // Get the device geolocation
    GeoService.getPosition();

    // Create AdMob banner
    var admobid = {};
    if (typeof device === "object") {
      if (device.platform == "Android") {
        admobid = {
          banner: "ca-app-pub-3029660904475322/7155482292"
        };
      } else if (device.platform == "iOS") {
        admobid = {
          banner: "ca-app-pub-3029660904475322/1108948698"
        };
      } 
    }

    if(typeof AdMob === "object") {
      var defaultOptions = {
        // bannerId: admobid.banner,
        // interstitialId: admobid.interstitial,
        // adSize: 'SMART_BANNER',
        // width: integer, // valid when set adSize 'CUSTOM'
        // height: integer, // valid when set adSize 'CUSTOM'
        position: AdMob.AD_POSITION.TOP_CENTER,
        offsetTopBar: true, // avoid overlapped by status bar, for iOS7+
        bgColor: 'black', // color name, or '#RRGGBB'
        // x: integer,    // valid when set position to 0 / POS_XY
        // y: integer,    // valid when set position to 0 / POS_XY
        isTesting: true, // set to true, to receiving test ad for testing purpose
        // autoShow: true // auto show interstitial ad when loaded, set to false if prepare/show
      };
      AdMob.setOptions(defaultOptions);
      AdMob.createBanner({adId: admobid.banner, adSize: "SMART_BANNER"});
    }

    function getMedia(post) {
      var media = post.get("media");
      media.fetch({
        success: function(obj) {
          $timeout(function() {
            post.media = {
              description: obj.get("description"),
              url: obj.get("url"),
              thumbnailUrl: obj.get("thumbnailUrl"),
              type: obj.get("type")
            };
          });
        }
      });
    }

    $scope.doRefresh = function() {
      // $ionicLoading.show();
      Posts.all(function(err, posts) {
        if (err) {
          $log.error("Posts all error: ", err);
          // $ionicLoading.hide();
          $scope.$broadcast('scroll.refreshComplete');
        } else {
          // Populate post fields
          var _posts = [];
          for (var i = 0; i < posts.length; i+=3) {
            // 3 posts a row, which are in a group
            var postGroup = [];
            for (var j = 0; j < 3; ++j) {
              if (i+j < posts.length) {
                getMedia(posts[i+j]);
                postGroup.push(posts[i+j]);
              }
            }
            _posts.push(postGroup);
          }
          $timeout(function() {
            $scope.posts = _posts;
            // $ionicLoading.hide();
            $scope.$broadcast('scroll.refreshComplete');
          });
        }
      });
    };

    $scope.doRefresh();
  })
  .controller("PostDetailCtrl", function($scope,$ionicLoading,$log,$timeout,$stateParams,$sce,$ionicModal,$state,Posts) {
    var confirm = navigator.notification ? navigator.notification.confirm : window.confirm;

    $scope.user = Parse.User.current();
    // check for admin user role
    var query = new Parse.Query(Parse.Role);
    query.equalTo("Administrator");
    query.find({
      success: function(roles) {
        var adminRole = roles[0];
        adminRole.getUsers().query().find({
          success: function(users) {
            for (var i = 0; i < users.length; ++i) {
              if (users[i].id == $scope.user.id) {
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

    $scope.hide = [{
      bars: true
    }];
    $ionicModal.fromTemplateUrl('templates/modal.html', function(modal) {
      $scope.modal = modal;
    }, {
      scope: $scope,
      animation: 'slide-in-up'
    });

    function onConfirm(buttonIndex) {
      if (buttonIndex == 2) {
        $scope.post.destroy({
          success: function(post) {
            var media = post.get("media");
            media.destroy({
              success: function(obj) {
                $state.go("tab.posts");
              },
              error: function(error) {
                $log.error("ERROR: delete media[" + media + "] of post[" + post +"]: ", error.message);
              }
            })
          },
          error: function(error) {
            $log.error("ERROR: delete post[" + post + "]: ", error.message);
          }
        });
      }      
    }

    $scope.deletePost = function() {
      if ( $scope.adminUser || $scope.user.id == $scope.post.user.id) {
        if (navigator.notification) {
          navigator.notification.confirm(
            "Delete this post?", // message
            onConfirm,           // callback to invoke with index of button pressed
            "CONFIRM DELETION",  // title
            ["CANCEL", "DELETE"] // button labels
          );
        } else {
          var ret = window.confirm("Delete this post?");
          if (ret == true)
            onConfirm(2);
        }
      }
    }

    $scope.openModal = function() {
      $scope.modal.show();
    };

    $scope.closeModal = function() {
      $scope.modal.hide();
      $scope.hide.bars = false;
    };

    $scope.toggleLike = function() {
      var postRelation = $scope.post.relation("liked");
      var userRelation = $scope.user.relation("likes");
      if ($scope.post.liked) {
        userRelation.remove($scope.post);
        postRelation.remove($scope.user);
        $scope.post.liked = false;
        for (var i = 0; i < $scope.post.likes.length; i++) {
          if ($scope.post.likes[i].id == $scope.user.id) {
            $scope.post.likes.splice(i, 1);
            break;
          }
        }
      } else {
        userRelation.add($scope.post);
        postRelation.add($scope.user);
        $scope.post.liked = true;
        $scope.post.likes.push($scope.user);
      }
      $scope.user.save();
      $scope.post.save();
    };

    $scope.submitComment = function(content) {
      var Comment = Parse.Object.extend("Comment");
      var comment = new Comment();
      comment.set("content", content);
      comment.set("post", $scope.post);
      comment.set("user", $scope.user);
      comment.save();
      var profilePicture = $scope.user.get("profilePictureThumbnail");
      if (profilePicture) {
        profilePicture = profilePicture.url();
      } else {
        profilePicture = "http://www.stay.com/images/default-user-profile.png";
      }
      comment.user = {
        displayName: $scope.user.get("displayName"),
        picture: profilePicture,
        id: $scope.user.id
      };
      $timeout(function() {
        $scope.post.comments.push(comment);
        $scope.post.comment = "";
      });
    };

    $scope.clearComment = function() {
      $scope.post.comment = "";
    };

    $scope.deleteComment = function(index) {
      var comment = $scope.post.comments[index];
      $scope.post.comments.splice(index, 1);
      comment.destroy({
        success: function(obj) {

        }, 
        error: function(error) {
          $log.error("Delete comment error: ", error);
        }
      })
    };

    function getUser(post) {
      var user = post.get("user");
      user.fetch({
        success: function(obj) {
          var profilePicture = obj.get("profilePictureThumbnail");
          if (profilePicture) {
            profilePicture = profilePicture.url();
          } else {
            profilePicture = "http://www.stay.com/images/default-user-profile.png";
          }
          $timeout(function() {
            post.user = {
              displayName: obj.get("displayName"),
              email: obj.get("email"),
              picture: profilePicture,
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
      if (hotbar ) {
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
    function getMedia(post) {
      var media = post.get("media");
      media.fetch({
        success: function(obj) {
          $timeout(function() {
            post.media = {
              description: obj.get("description"),
              url: obj.get("url"),
              secUrl: obj.get("type") !== "image/jpeg" ? trustSrc(obj.get("url")) : null,
              thumbnailUrl: obj.get("thumbnailUrl"),
              type: obj.get("type")
            };
          });
        }
      });
    };

    function trustSrc(src) {
      return $sce.trustAsResourceUrl(src);
    }

    $ionicLoading.show();
    Posts.get($stateParams.postId, function(err, post) {
      if (err) {
        $log.error("Posts get error: ", err);
        $ionicLoading.hide();
      } else {
        $scope.post = post;
        getMedia(post);
        getUser(post);
        getHotbar(post);
        // get likes
        var postRelation = $scope.post.relation("liked");
        postRelation.query().find({
          success: function(list) {
            $timeout(function() {
              $scope.post.likes = list;
              for (var i = 0; i < list.length; ++i) {
                if (list[i].id == $scope.user.id) {
                  $scope.post.liked = true;
                  break;
                }
              }  
            });
          },
          error: function(error) {
            $log.error("Getting post likes error: ", error);
          }
        });
        // get comments
        var Comment = Parse.Object.extend("Comment");
        var query = new Parse.Query(Comment);
        query.equalTo("post", $scope.post);
        query.find({
          success: function(comments) {
            $scope.post.comments = comments;
            // populate the user field
            for (var i = 0; i < comments.length; ++i) {
              getUser(comments[i]);
            }
          },
          error: function(comments, error) {
            $log.error("Getting post comments error: ", error);
          }
        });
        $ionicLoading.hide();
      }
    });
  });
