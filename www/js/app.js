// HotBar App

// angular.module is a global place for creating, registering and retrieving
// Angular modules 'hotbar' is the name of this angular module example (also
// set in a <body> attribute in index.html)
// the 2nd parameter is an array of 'requires'
// 'hotbar.services' is found in services.js
// 'hotbar.controllers' is found in controllers.js
// 'hotbar.filters' is found in filters.js
// 'hotbar.directives' is found in directives.js
angular.module('hotbar', ['ionic',
                          'ngCordova',
                          'hotbar.config',
                          'hotbar.controllers',
                          'hotbar.services',
                          'hotbar.filters',
                          'hotbar.directives'])
  .run(function($ionicPlatform) {
    $ionicPlatform.ready(function() {
      // Hide the accessory bar by default (remove this to show the
      // accessory bar above the keyboard for form inputs)
      if(window.cordova && window.cordova.plugins && window.cordova.plugins.Keyboard) {
        cordova.plugins.Keyboard.hideKeyboardAccessoryBar(true);
      }
      if(window.StatusBar) {
        // org.apache.cordova.statusbar required
        StatusBar.styleDefault();
      }
    });
  })
  .config(function($sceDelegateProvider){
    $sceDelegateProvider.resourceUrlWhitelist(['https://*.amazonaws.com/**', 'self']);
  })
  .config(function($httpProvider) {
    $httpProvider.defaults.useXDomain = true;
    delete $httpProvider.defaults.headers.common['X-Requested-With'];
  })
  /* .config(function($ionicNavBarConfig, $ionicTabsConfig) {
    $ionicNavBarConfig.transition = 'fade-out';
    $ionicTabsConfig.type = '';
  }) */
  .config(function($ionicConfigProvider) {
    $ionicConfigProvider.tabs.position("bottom");
    $ionicConfigProvider.navBar.alignTitle("center");
  })

  .config(function($stateProvider, $urlRouterProvider) {

    // Ionic uses AngularUI Router which uses the concept of states
    // Learn more here: https://github.com/angular-ui/ui-router
    // Set up the various states which the app can be in.
    // Each state's controller can be found in controllers.js
    $stateProvider

    // login and signup
      .state('login', {
        url: "/login",
        templateUrl: "templates/login.html",
        controller: "LoginCtrl"
      })
      .state('signup', {
        url: "/login/signup",
        templateUrl: "templates/signup.html",
        controller: "SignupCtrl"
      })
      .state('retrievePass', {
        url: "/login/retrievePass",
        templateUrl: "templates/retrievePass.html",
        controller: "RetrievePassCtrl"
      })

    // setup an abstract state for the tabs directive
      .state('tab', {
        url: "/tab",
        abstract: true,
        templateUrl: "templates/tabs.html"
      })

    // Each tab has its own nav history stack:

      .state('tab.posts', {
        url: '/posts',
        views: {
          'tab-posts': {
            templateUrl: 'templates/tab-posts.html',
            controller: 'PostsCtrl'
          }
        }
      })
      .state('tab.post-detail', {
        url: '/posts/:postId',
        views: {
          'tab-posts': {
            templateUrl: 'templates/post-detail.html',
            controller: 'PostDetailCtrl'
          }
        }
      })
      .state('tab.hotbars', {
        url: '/hotbars',
        views: {
          'tab-hotbars': {
            templateUrl: 'templates/tab-hotbars.html',
            controller: 'HotBarsCtrl'
          }
        }
      })
      .state('tab.hotbar-detail', {
        url: '/hotbars/:hotbarId',
        views: {
          'tab-hotbars': {
            templateUrl: 'templates/hotbar-detail.html',
            controller: 'HotBarDetailCtrl'
          }
        }
      })
      .state('tab.hotbar-post-detail', {
        url: '/hotbars/:hotbarId/:postId',
        views: {
          'tab-hotbars': {
            templateUrl: 'templates/post-detail.html',
            controller: 'PostDetailCtrl'
          }
        }
      })
      .state('tab.capture', {
        url: '/capture',
        views: {
          'tab-capture': {
            templateUrl: 'templates/tab-capture.html',
            controller: 'CaptureCtrl'
          }
        }
      })
      .state('tab.capture.posts', {
        url: '/capture/posts',
        view: {
          'tab-capture': {
            templateUrl: 'templates/tab-capture-posts.html',
            controller: 'capturePostsCtrl'
          }
        }
      })
      .state('tab.capture.post-detail', {
        url: '/capture/posts/:postId',
        views: {
          'tab-capture': {
            templateUrl: 'templates/post-detail.html',
            controller: 'PostDetailCtrl'
          }
        }
      })
      .state('tab.capture.hotbars', {
        url: '/capture/hotbars',
        views: {
          'tab-capture': {
            templateUrl: 'templates/tab-capture-hotbars.html',
            controller: 'captureHotbarsCtrl'
          }
        }
      })
      .state('tab.capture.hotbar-detail', {
        url: '/capture/hotbars/:hotbarId',
        views: {
          'tab-capture': {
            templateUrl: 'templates/hotbar-detail.html',
            controller: 'HotbarDetailCtrl'
          }
        }
      })
      .state('tab.account', {
        url: '/account',
        views: {
          'tab-account': {
            templateUrl: 'templates/tab-account.html',
            controller: 'AccountCtrl'
          }
        }
      })
      .state('tab.user', {
        url: '/posts/users/:userId',
        views: {
          'tab-posts': {
            templateUrl: 'templates/tab-user.html',
            controller: 'UserCtrl'
          }
        }
      })
      .state('tab.user-post-detail', {
        url: '/posts/users/:userId/:postId',
        views: {
          'tab-posts': {
            templateUrl: 'templates/post-detail.html',
            controller: 'PostDetailCtrl'
          }
        }
      });

      // Initialize Parse TODO: the constants are defined in the config
      var PARSE_APP_ID = "VX9NoYMIpR0yA7srjpmncHmthF8sAuVP80Q5Kgo2";
      var PARSE_JS_KEY = "kiSDtIWzkyj1gaUCsJOIXHkRKXVDISeaQ8kgYBEH";
      Parse.initialize(PARSE_APP_ID, PARSE_JS_KEY);
      // if none of the above states are matched, use this as the fallback
      // if user logged in, go to /posts, otherwise, go to /login
      if (Parse.User.current()) {
        $urlRouterProvider.otherwise('/tab/posts');
      } else {
        $urlRouterProvider.otherwise('/login');
      }

  });
