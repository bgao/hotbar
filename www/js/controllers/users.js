// hotbar.controllers.UserCtrl

angular.module("hotbar.controllers")
.controller("UserCtrl", function($scope, $stateParams, $state, $log, $timeout, $q, $ionicLoading, Users, HotBars) {

  var currentUser = Parse.User.current();

  Users.get($stateParams.userId, function(error, user) {
    $ionicLoading.show();
    if (error) {
      $log.error("Getting user error: ", error);
      $ionicLoading.hide();
    } else {
      var _profilePicture = user.get("profilePictureThumbnail");
      if (_profilePicture) {
        _profilePicture = _profilePicture.url();
      } else {
        _profilePicture = "http://www.stay.com/images/default-user-profile.png";
      }
      $scope.user = {
        displayName: user.get("displayName"),
        profilePicture: _profilePicture,
        parseUser: user
      };
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
            getMedia(posts[i])
              .then(function(post) {
                return getHotbar(post);
              });
            _posts.push(posts[i]);
          }
          $timeout(function() {
            $scope.posts = _posts;
          });
        },
        error: function(error) {
          $log.error("Getting user posts error: ", error);
          $ionicLoading.hide();
        }
      });
      // get followers
      var followingRelation = currentUser.relation("followingUsers");
      followingRelation.query().find({
        success: function(list) {
          $timeout(function() {
            for (var i = 0; i < list.length; ++i) {
              if (list[i].id == user.id) {
                $scope.user.followed = true;
                break;
              }
            }
            $ionicLoading.hide();
          });
        },
        error: function(error) {
          $log.error("Getting user followers error: ", error);
          $ionicLoading.hide();
        }
      });
    }
  });

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
      HotBars.get(hotbar.id, function(err, hotbar) {
        if (err) {
          $log.error("Getting post hotbar error: ", err);
          deferred.reject(err);
        } else {
          post.hotbar = {
            name: hotbar.get("name"),
            address: hotbar.get("address"),
            region: hotbar.get("region"),
            url: hotbar.get("url")
          };
          deferred.resolve(post);
        }
      });
    }
    return deferred.promise;
  };

  $scope.toggleFollow = function() {
    var followingRelation = currentUser.relation("followingUsers");
    if ($scope.user.followed) {
      followingRelation.remove($scope.user.parseUser);
      $scope.user.followed = false;
    } else {
      followingRelation.add($scope.user.parseUser);
      $scope.user.followed = true;
    }
    currentUser.save();
  };
});
