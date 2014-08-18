"use strict";

angular.module("hotbar.controllers")
  .controller("PostsCtrl", function($scope, $ionicLoading, $log, $timeout, Posts, GeoService, Users, HotBars) {
    function getUser(post) {
      Users.get(post.get("user").id, function(err, user) {
        if (err) {
          $log.error("Getting post user error: ", error);
        } else {
          $timeout(function(){
            post.user = {
              displayName: user.get("displayName"),
              email: user.get("email"),
              picture: user.get("picture")
            };  
          });
        }
      });
    }
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
    $ionicLoading.show();
    Posts.all(function(err, posts) {
      if (err) {
        $log.error("Posts all error: ", err);
        $ionicLoading.hide();
      } else {
        // Populate post fields
        var User = Parse.Object.extend("User");
        var HotBar = Parse.Object.extend("HotBar");
        for (var i = 0; i < posts.length; ++i){
          posts[i].media = posts[i].get("media");
          getUser(posts[i]);
          getHotbar(posts[i]);
        }
        $timeout(function() {
          $scope.posts = posts;
          $ionicLoading.hide();
        });
      }
    });
  })
  .controller("PostDetailCtrl", function($scope, $ionicLoading, $log, $timeout, $stateParams, Posts, Users, HotBars) {
    var _user = Parse.User.current();

    $scope.toggleLike = function() {
      var postRelation = $scope.post.relation("liked");
      var userRelation = _user.relation("likes");
      if ($scope.post.liked) {
        userRelation.remove($scope.post);
        postRelation.remove(_user);
        $scope.post.liked = false;
        for (var i = 0; i < $scope.post.likes.length; i++) {
          if ($scope.post.likes[i].id == _user.id) {
            $scope.post.likes.splice(i, 1);
            break;
          }
        }
      } else {
        userRelation.add($scope.post);
        postRelation.add(_user);
        $scope.post.liked = true;
        $scope.post.likes.push(_user);
      }
      _user.save();
      $scope.post.save();
    };

    $scope.submitComment = function(content) {
      var Comment = Parse.Object.extend("Comment");
      var comment = new Comment();
      comment.set("content", content);
      comment.set("post", $scope.post);
      comment.set("user", _user);
      comment.save();
      comment.user = _user;
      $timeout(function() {
        $scope.post.comments.push(comment);
        $scope.post.comment = "";
      });
    };

    function getUser(post) {
      Users.get(post.get("user").id, function(err, user) {
        if (err) {
          $log.error("Getting post user error: ", error);
        } else {
          $timeout(function(){
            post.user = {
              displayName: user.get("displayName"),
              email: user.get("email"),
              picture: user.get("picture")
            };  
          });
        }
      });
    }
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

    $ionicLoading.show();
    Posts.get($stateParams.postId, function(err, post) {
      if (err) {
        $log.error("Posts get error: ", err);
        $ionicLoading.hide();
      } else {
        $scope.post = post;
        $scope.post.media = $scope.post.get("media");
        getUser(post);
        getHotbar(post);
        // get likes
        var postRelation = $scope.post.relation("liked");
        postRelation.query().find({
          success: function(list) {
            $timeout(function() {
              $scope.post.likes = list;
              for (var i = 0; i < list.length; ++i) {
                if (list[i].id == _user.id) {
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
