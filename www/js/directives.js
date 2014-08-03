
"use strict";

angular.module('hotbar.directives', [])
  .directive('fileInput', ['$parse', function($parse) {
    return {
      restrict: 'A',
      link: function(scope, elm, attrs) {
        elm.bind('change', function() {
          $parse(attrs.fileInput)
            .assign(scope,elm[0].files);
          console.log("fileInput directive");
          scope.$apply();
        })
      }
    }
  }])
  .directive('media', ['$window', function($window) {
    return {
      restrict: 'C',
      link: function(scope, elm, attr) {
        var size = ($window.outerWidth / 3) - 2;
        elm.css('width', size + 'px');
      }
    }
  }]);
