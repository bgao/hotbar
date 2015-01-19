
"use strict";

angular.module("hotbar.controllers")
.controller("UserCtrl", function($scope, $stateParams, $state, $log, $timeout, $ionicLoading, Users, HotBars) {
  var _user = Parse.User.current();

  /* if (_user.id == $stateParams.userId) {
    $state.go("tab.account");
  } else { */
    Users.get($stateParams.userId, function(error, user) {
      if (error) {
        $log.error("Getting user error: ", error);
      } else {
        var _profilePicture = user.get("profilePictureThumbnail");
        if (_profilePicture) {
          _profilePicture = _profilePicture.url();
        } else {
          _profilePicture = "http://www.stay.com/images/default-user-profile.png";
        }
        var _coverPicture = user.get("coverPicture");
        if (_coverPicture) {
          _coverPicture = _coverPicture.url();
        } else {
          _coverPicture = "img/coverPicture.jpg";
        }
        // $timeout(function() {
          $scope.user = {
            displayName: user.get("displayName"),
            profilePicture: _profilePicture,
            coverPicture: _coverPicture
          };
        // });        
        // Get user posts
        var _posts = [];
        var Post = Parse.Object.extend("Post");
        var query = new Parse.Query(Post);
        query.equalTo("user", user);
        query.descending("createdAt");
        query.find({
          success: function(posts) {
            for (var i = 0; i < posts.length; ++i) {
              posts[i].user = $scope.user;
              getHotbar(posts[i]);
              getMedia(posts[i]);
              _posts.push(posts[i]);
            }
            $timeout(function() {
              $scope.posts = _posts;
            });
          },
          error: function(error) {
            $log.error("Getting user posts error: ", error);
          }
        });
      }
    });
  // }

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

  function getHotbar(post) {
    if (post.get("hotbar")) {
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
  }  
});