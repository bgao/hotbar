"use strict";

angular.module("hotbar.controllers")
  .controller("HomeCtrl", function($scope, $log, $timeout, $ionicLoading, $http, $sce, GeoService, S3) {
    var alert = typeof navigator.notification == "undefined" ? window.alert : navigator.notification.alert;

    var _user = Parse.User.current();
    $scope.posts = [];

    // Create Administrator role
    /* var adminRoleACL = new Parse.ACL(_user);
    adminRoleACL.setPublicReadAccess(true);
    var adminRole = new Parse.Role("Administrator", adminRoleACL);
    adminRole.getUsers().add(_user);
    adminRole.save(); */

    /* var query = new Parse.Query(Parse.Role);
    query.equalTo("Administrator");
    query.find({
      success: function(roles) {
        var adminRole = roles[0];
        // Create HotBar Manager rol
        var managerRoleACL = new Parse.ACL(_user);
        managerRoleACL.setPublicReadAccess(true);
        var managerRole = new Parse.Role("Manager", managerRoleACL);
        managerRole.getRoles().add(adminRole);
        managerRole.save();
      },
      error: function(error) {
        $log.error("Creating HotBar Manager Role error: ", error);
      }
    }); */

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
              var profilePicture = _user.get("profilePicture");
              if (profilePicture) {
                profilePicture = profilePicture.url();
              } else {
                profilePicture = "http://www.stay.com/images/default-user-profile.png";
              }
              posts[i].user = {
                displayName: _user.get("displayName"),
                email: _user.get("email"),
                picture: profilePicture
              };
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

    // Get cover picture
    $scope.coverPictureUrl = "img/coverpicture.jpg"; // _user.get("coverPictureUrl");

    function getHotbar(post) {
      var hotbar = post.get("hotbar");
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

  });
