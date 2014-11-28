"use strict";

angular.module("hotbar.controllers")
  .controller("PostsCtrl", function($scope, $ionicLoading, $log, $timeout, $interval, Posts, GeoService) {

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
    $ionicLoading.show();
    Posts.all(function(err, posts) {
      if (err) {
        $log.error("Posts all error: ", err);
        $ionicLoading.hide();
      } else {
        // Populate post fields
        var _posts = [];
        for (var i = 0; i < posts.length; i+=3) {
          var postGroup = [];
          for (var j = 0; j < 3; ++j) {
            if (i+j < posts.length) {
              getMedia(posts[i+j]);
              // getUser(posts[i+j]);
              // getHotbar(posts[i+j]);
              postGroup.push(posts[i+j]);
            }
          }
          _posts.push(postGroup);
        }
        $timeout(function() {
          $scope.posts = _posts;
          $ionicLoading.hide();
        });
      }
    });

    $scope.$on("$destroy", function() {
      if (stop) {
        $interval.cancel(stop);
      }
    });

    // load sponsor advertisements
    var stop;
    var News = Parse.Object.extend("News");
    // Create demo news
    /* for (var i = 1; i < 4; ++i) {
      var news = new News();
      news.set("content", "Exciting news " + i);
      news.save();
    } */
    var query = new Parse.Query(News);
    query.descending("createdAt");
    query.find({
      success: function(news) {
        var index = 0;
        $timeout(function() {
          $scope.news = {
            content: news[index].get("content")
          };
          index++;
        });
        stop = $interval(function() {
          var i = index % news.length;
          $scope.news = {
            content: news[i].get("content")
          };
          index++;
        }, 3000);
      },
      error: function(error) {
        $log.error("Get news error: ", error);
      }
    });
  })
  .controller("PostDetailCtrl", function($scope, $ionicLoading, $log, $timeout, $stateParams, $sce, Posts) {
    $scope.user = Parse.User.current();

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
        profilePicture = $scope.user.get("picture");
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
            profilePicture = obj.get("picture");
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
