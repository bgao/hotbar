angular.module('hotbar.controllers')
  .controller('ActivitiesCtrl', function($scope, $ionicLoading, $log, $timeout,
                                         Activities) {
    // Check network connection
    /*    var connectState = navigator.connection.type;
    // Connection.UNKNOWN
    // Connection.ETHERNET
    // Connection.WIFI
    // Connection.CELL
    // Connection.NONE
    if (connectState == Connection.UNKNOWN)
    navigator.notification.alert("Connection status: UNKNOWN",
    null,
    "Connection Type");
    else if (connectState == Connection.ETHERNET)
    navigator.notification.alert("Connection status: ETHERNET",
    null,
    "Connection Type");
    else if (connectState == Connection.WIFI)
    navigator.notification.alert("Connection status: WIFI",
    null,
    "Connection Type");
    else if (connectState == Connection.CELL)
    navigator.notification.alert("Connection status: CELL",
    null,
    "Connection Type");
    else if (connectState == Connection.NONE)
    navigator.notification.alert("Connection status: NONE",
    null,
    "Connection Type");
    else
    navigator.notification.alert("Connection status: ERROR",
    null,
    "Connection Type");
    */
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
        });
        $timeout(function() {
          $scope.activities = ($scope.activities || []).concat(_activities);
          $ionicLoading.hide();
        });
      }
    };

    (function() {
      // Load all media activities
      $ionicLoading.show({
        template: '<i class=\"icon ion-loading-a\"></i> Loading...'
      });
      Activities.all(function(err, activities) {
        $scope._activities = activities;
        var _activities = [];
        if (err) {
          $log.error("Activities::all: " + err);
          // show network error
        } else {
          while(activities.hasNextEntity()) {
            var entity = activities.getNextEntity();

            // Only media activity has an "object"
            if (!entity.get('object'))
              continue;
            var actor = entity.get('actor');
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
        $timeout(function() {
          $scope.activities = _activities;
          $ionicLoading.hide();
        });
      });
    })();
  })

  .controller('ActivityDetailCtrl', function($scope, $stateParams, $ionicLoading,
                                             $log, $timeout, $sce,Global, Activities) {

    function getLikes() {
      var _user = Global.get("user");
      if ($scope.activity) {
        Activities.getLikes($scope.activity, function(err, entities) {
          if (err) {
            $log.error("ActivityDetailCtrl::getLikes: " + err);
            $ionicLoading.hide();
          } else {
            $scope.activity.liked = false;
            for (var i = 0; i < entities.length; ++i) {
              if (entities[i].email == _user.get("email")) {
                $scope.activity.liked = true;
                break;
              }
            }
            $timeout(function() {
              $scope.activity.likes = entities;
              $ionicLoading.hide();
            });
          }
        });
      }
    }

    $scope.toggleLike = function() {
      if ($scope.activity) {
        $ionicLoading.show({
          template: "<i class=\"icon ion-loading-a\"></i> Loading..."
        });
        Activities.toggleLike($scope.activity, function(err, result) {
          if (err) {
            $log.error("ActivityDetailCtrl::like: " + err);
          } else {
            getLikes();
          }
        });
      }
    };
    $scope.submitComment = function() {
      $ionicLoading.show({
        template: '<i class=\"icon ion-loading-a\"></i> Loading...'
      });
      Activities.submitComment($scope.activity, function(err, result) {
        $ionicLoading.hide();
        if (err) {
          $log.error("ActivityDetailCtrl::submitComment: " + err);
        } else {
          // $log.debug(result);
          // $scope.update();
        }
      });
      $scope.activity.comment = '';
    };

    $scope.clearComment = function() { 
      $scope.activity.comment = ''; 
    };

    $scope.trustSrc = function(src) {
      return $sce.trustAsResourceUrl(src);
    };

    (function() {
      $ionicLoading.show({
        template: '<i class=\"icon ion-loading-a\"></i> Loading...'
      });
      Activities.getOne($stateParams.activityId, function(err, activity) {
        var _activity = {};
        if (err) {
          $log.error("ActivityDetailCtrl::get: " + err);
          $ionicLoading.hide();
        } else {
          var actor = activity.actor;
          _activity.uuid = activity.uuid;
          _activity.created = activity.created;
          _activity.media = activity.object
          _activity.name = actor.displayName || 'Anonymous';
          _activity.username = actor.username;
          _activity.avatar = actor.picture;
          _activity.comments = activity.comments || [];
          _activity.hotbar = activity.hotbar;
          _activity.likes = [];
          _activity.liked = false;
          $scope.mediaUrl = $scope.trustSrc(activity.object.url);
          $timeout(function() {
            $scope.activity = _activity;
            getLikes();
          });
        }
      });
    })();
  });
