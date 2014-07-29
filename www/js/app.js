// HotBar App

"use strict";

// angular.module is a global place for creating, registering and retrieving
// Angular modules 'hotbar' is the name of this angular module example (also
// set in a <body> attribute in index.html)
// the 2nd parameter is an array of 'requires'
// 'hotbar.services' is found in services.js
// 'hotbar.controllers' is found in controllers.js
// 'hotbar.filters' is found in filters.js
angular.module('hotbar', ['ionic',
                          'hotbar.controllers',
                          'hotbar.services',
                          'hotbar.filters',
                          'google-maps'])

  .run(function($ionicPlatform) {
    $ionicPlatform.ready(function() {
      // Hide the accessory bar by default (remove this to show the
      // accessory bar above the keyboard for form inputs)
      if(window.cordova && window.cordova.plugins.Keyboard) {
        cordova.plugins.Keyboard.hideKeyboardAccessoryBar(true);
      }
      if(window.StatusBar) {
        // org.apache.cordova.statusbar required
        StatusBar.styleDefault();
      }
    });
  })

  .config(function($httpProvider) {
    $httpProvider.defaults.useXDomain = true;
    delete $httpProvider.defaults.headers.common['X-Requested-With'];
  })

/* .config(['localStorageServiceProvider', function(localStorageServiceProvider){
   localStorageServiceProvider.setPrefix('hotbar');
   }]) */

/* .config(function(DropboxProvider) {
   DropboxProvider.config("yampzvmdl79llfo", "http://localhost:8100");
   }) */

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

      .state('tab.activities', {
        url: '/activities',
        views: {
          'tab-activities': {
            templateUrl: 'templates/tab-activities.html',
            controller: 'ActivitiesCtrl'
          }
        }
      })
      .state('tab.activity-detail', {
        url: '/activities/:activityId',
        views: {
          'tab-activities': {
            templateUrl: 'templates/activity-detail.html',
            controller: 'ActivityDetailCtrl'
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
      .state('tab.hotbar-activity-detail', {
        url: '/hotbars/:hotbarId/:activityId',
        views: {
          'tab-hotbars': {
            templateUrl: 'templates/activity-detail.html',
            controller: 'ActivityDetailCtrl'
          }
        }
      })
      .state('tab.home', {
        url: '/home',
        views: {
          'tab-home': {
            templateUrl: 'templates/tab-home.html',
            controller: 'HomeCtrl'
          }
        }
      })
      .state('tab.home-detail', {
        url: '/home/:activityId',
        views: {
          'tab-home': {
            templateUrl: 'templates/activity-detail.html',
            controller: 'ActivityDetailCtrl'
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
      .state('tab.account.rewards', {
        url: '/rewards',
        view: {
          'tab-account-rewards': {
            templateUrl: 'templates/rewards.html',
            controller: 'RewardsCtrl'
          }
        }
      });

    // if none of the above states are matched, use this as the fallback
    $urlRouterProvider.otherwise('/login');

  });

