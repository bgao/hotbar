
"use strict";

angular.module('hotbar.filters', [])
  .filter('prettyDate', function() {
    /**
     *  The following code is used to display the posted dates as "x minutes ago, etc"
     *  instead of just a date.
     *
     *  Thank you John Resig and long live JQuery!
     *
     * JavaScript Pretty Date
     * Copyright (c) 2011 John Resig (ejohn.org)
     * Licensed under the MIT and GPL licenses.
     */

    // Takes a numeric date value (in seconds) and returns a string
    // representing how long ago the date represents.
    return function(dateValue) {
      var diff = (((new Date()).getTime() - dateValue) / 1000)
      var day_diff = Math.floor(diff / 86400);

      if ( isNaN(day_diff) || day_diff < 0 || day_diff >= 31 )
        return 'just now';

      var fred = day_diff == 0 && (
        diff < 60 && "just now" ||
          diff < 120 && "1 minute ago" ||
          diff < 3600 && Math.floor( diff / 60 ) + " minutes ago" ||
          diff < 7200 && "1 hour ago" ||
          diff < 86400 && Math.floor( diff / 3600 ) + " hours ago") ||
        day_diff == 1 && "Yesterday" ||
        day_diff < 7 && day_diff + " days ago" ||
        day_diff < 31 && Math.ceil( day_diff / 7 ) + " weeks ago";
      return fred;
    };
  });
