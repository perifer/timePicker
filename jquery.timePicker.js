/*
 * A time picker for jQuery
 *
 * Dual licensed under the MIT and GPL licenses.
 * Copyright (c) 2009-2011 Anders Fajerson
 * @name     timePicker
 * @author   Anders Fajerson (http://perifer.se)
 * @example  $("#mytime").timePicker();
 * @example  $("#mytime").timePicker({step:30, startTime:new Date(0, 0, 0, 15, 00, 0), endTime:"18:00", timeFormat:"hh:mm tt"});
 *
 * Based on timePicker by Sam Collet (http://www.texotela.co.uk)
 *
 */

(function($){
  $.fn.timePicker = function(options) {
    // Handle deprecated options.
    if (options !== undefined && (options.separator !== undefined || options.show24Hours !== undefined) && !options.timeFormat) {
      var show24Hours = (options.show24Hours === undefined || options.show24Hours);
      options.timeFormat = (show24Hours ? 'HH': 'hh') + (options.separator !== undefined ? options.separator : ':') + 'mm' + (show24Hours ? '': ' tt');
    };

    var settings = $.extend({}, $.fn.timePicker.defaults, options);
    return this.each(function() {
      $.timePicker(this, settings);
    });
  };

  $.timePicker = function (elm, settings) {
    var e = $(elm)[0];
    return e.timePicker || (e.timePicker = new jQuery._timePicker(e, settings));
  };

  $.timePicker.version = '0.4';

  // Public funtions.
  $.timePicker.formatTime = function(format, date, settings) {
    settings = settings || $.fn.timePicker.defaults;
    settings.timeFormat = format;
    return formatTime(date, settings);
  };
  $.timePicker.parseTime = function(format, input, settings) {
    settings = settings || $.fn.timePicker.defaults;
    settings.timeFormat = format;
    return parseTime(input, settings);
  };

  $._timePicker = function(elm, settings) {

    var tpOver = false;
    var keyDown = false;
    var startTime = parseTime(settings.startTime, settings);
    var endTime = parseTime(settings.endTime, settings);
    var selectedClass = "selected";
    var selectedSelector = "li." + selectedClass;

    $(elm).attr('autocomplete', 'OFF'); // Disable browser autocomplete

    var times = [];
    var time = new Date(startTime); // Create a new date object.
    while(time <= endTime) {
      times[times.length] = formatTime(time, settings);
      time = new Date(time.setMinutes(time.getMinutes() + settings.step));
    }

    var $tpDiv = $('<div class="time-picker'+ (settings.show24Hours ? '' : ' time-picker-12hours') +'"></div>');
    var $tpList = $('<ul></ul>');

    // Build the list.
    for(var i = 0; i < times.length; i++) {
      $tpList.append("<li>" + times[i] + "</li>");
    }
    $tpDiv.append($tpList);
    // Append the timPicker to the body and position it.
    $tpDiv.appendTo('body').hide();

    // Store the mouse state, used by the blur event. Use mouseover instead of
    // mousedown since Opera fires blur before mousedown.
    $tpDiv.mouseover(function() {
      tpOver = true;
    }).mouseout(function() {
      tpOver = false;
    });

    $("li", $tpList).mouseover(function() {
      if (!keyDown) {
        $(selectedSelector, $tpDiv).removeClass(selectedClass);
        $(this).addClass(selectedClass);
      }
    }).mousedown(function() {
       tpOver = true;
    }).click(function() {
      setTimeVal(elm, this, $tpDiv, settings);
      tpOver = false;
    });

    var showPicker = function() {
      if ($tpDiv.is(":visible")) {
        return false;
      }
      $("li", $tpDiv).removeClass(selectedClass);

      // Position
      var elmOffset = $(elm).offset();
      $tpDiv.css({'top':elmOffset.top + elm.offsetHeight, 'left':elmOffset.left});

      // Show picker. This has to be done before scrollTop is set since that
      // can't be done on hidden elements.
      $tpDiv.show();

      // Select startTime as default.
      var time = startTime;
      if (elm.value) {
        try {
          // Try to find a time in the list that matches the entered time.
          time = parseTime(elm.value, settings);
          var startMin = startTime.getHours() * 60 + startTime.getMinutes();
          var min = (time.getHours() * 60 + time.getMinutes()) - startMin;
          var steps = Math.round(min / settings.step);
          var roundTime = new Date(2001, 0, 0, 0, (steps * settings.step + startMin), 0);
          time = (startTime < roundTime && roundTime <= endTime) ? roundTime : startTime;

        }
        catch(e) {
          // Ignore parse errors.
        }
      };
      var $matchedTime = $("li:contains(" + formatTime(time, settings) + ")", $tpDiv);
      if ($matchedTime.length) {
        $matchedTime.addClass(selectedClass);
        // Scroll to matched time.
        $tpDiv[0].scrollTop = $matchedTime[0].offsetTop;
      }

      return true;
    };
    // Attach to click as well as focus so timePicker can be shown again when
    // clicking on the input when it already has focus.
    $(elm).focus(showPicker).click(showPicker);
    // Hide timepicker on blur
    $(elm).blur(function() {
      if (!tpOver) {
        $tpDiv.hide();
      }
    });
    // Keypress doesn't repeat on Safari for non-text keys.
    // Keydown doesn't repeat on Firefox and Opera on Mac.
    // Using kepress for Opera and Firefox and keydown for the rest seems to
    // work with up/down/enter/esc.
    var event = ($.browser.opera || $.browser.mozilla) ? 'keypress' : 'keydown';
    $(elm)[event](function(e) {
      var $selected;
      keyDown = true;
      var top = $tpDiv[0].scrollTop;
      switch (e.keyCode) {
        case 38: // Up arrow.
          // Just show picker if it's hidden.
          if (showPicker()) {
            return false;
          };
          $selected = $(selectedSelector, $tpList);
          var prev = $selected.prev().addClass(selectedClass)[0];
          if (prev) {
            $selected.removeClass(selectedClass);
            // Scroll item into view.
            if (prev.offsetTop < top) {
              $tpDiv[0].scrollTop = top - prev.offsetHeight;
            }
          }
          else {
            // Loop to next item.
            $selected.removeClass(selectedClass);
            prev = $("li:last", $tpList).addClass(selectedClass)[0];
            $tpDiv[0].scrollTop = prev.offsetTop - prev.offsetHeight;
          }
          return false;
          break;
        case 40: // Down arrow, similar in behaviour to up arrow.
          if (showPicker()) {
            return false;
          };
          $selected = $(selectedSelector, $tpList);
          var next = $selected.next().addClass(selectedClass)[0];
          if (next) {
            $selected.removeClass(selectedClass);
            if (next.offsetTop + next.offsetHeight > top + $tpDiv[0].offsetHeight) {
              $tpDiv[0].scrollTop = top + next.offsetHeight;
            }
          }
          else {
            $selected.removeClass(selectedClass);
            next = $("li:first", $tpList).addClass(selectedClass)[0];
            $tpDiv[0].scrollTop = 0;
          }
          return false;
          break;
        case 13: // Enter
          if ($tpDiv.is(":visible")) {
            var sel = $(selectedSelector, $tpList)[0];
            setTimeVal(elm, sel, $tpDiv, settings);
          }
          return false;
          break;
        case 27: // Esc
          $tpDiv.hide();
          return false;
          break;
      }
      return true;
    });
    $(elm).keyup(function(e) {
      keyDown = false;
    });
    // Helper function to get an inputs current time as Date object.
    // Returns a Date object.
    this.getTime = function() {
      return parseTime(elm.value, settings);
    };
    // Helper function to set a time input.
    // Takes a Date object or string.
    this.setTime = function(time) {
      elm.value = formatTime(parseTime(time, settings), settings);
      // Trigger element's change events.
      $(elm).change();
    };

  }; // End fn;

  // Plugin defaults.

  $.fn.timePicker.defaults = {
    step:30,
    startTime: new Date(0, 0, 0, 0, 0, 0),
    endTime: new Date(0, 0, 0, 23, 30, 0),
    timeFormat: 'HH:mm',
    amDesignator: 'AM',
    pmDesignator: 'PM'
  };

  // Private functions.

  function setTimeVal(elm, sel, $tpDiv, settings) {
    // Update input field
    elm.value = $(sel).text();
    // Trigger element's change events.
    $(elm).change();
    // Keep focus for all but IE (which doesn't like it)
    if (!$.browser.msie) {
      elm.focus();
    }
    // Hide picker
    $tpDiv.hide();
  }

  function formatTime(date, settings) {
    if (date) return parseFormat(settings, date);
  };

  function formatNumber(value) {
    return (value < 10 ? '0' : '') + value;
  }

  function parseTime(string, settings) {
    if (typeof string == 'object') {
      return normalizeTime(string);
    }

    var formatParts = settings.timeFormat.match(/(hh?|HH?|mm?|ss?|tt?)/g);
    var regexPattern = parseFormat(settings, false);
    var re = new RegExp('^' + regexPattern + '$');
    var stringParts = string.match(re);
    var ampm;
    var hours = -1;
    var minutes = -1;
    var seconds = 0;
    var am = settings.amDesignator;
    var pm = settings.pmDesignator;
    var date;
    for (var i=0; i < formatParts.length; i++) {
      if (stringParts && stringParts[i+1]) {
        switch (formatParts[i]) {
        case "hh":
        case "h":
          hours = parseInt(stringParts[i+1], 10);
          break;
        case "HH":
        case "H":
          hours   = parseInt(stringParts[i+1], 10);
          break;
        case "mm":
        case "m":
          minutes = parseInt(stringParts[i+1], 10);
          break;
        case "ss":
        case "s":
          seconds = parseInt(stringParts[i+1], 10);
          break;
        case "t":
          am = am.substring(0, 1);
          pm = pm.substring(0, 1);
          // break intentionally left out.
        case "tt":
          ampm = stringParts[i+1];
          break;
        }
      };
    };
    if (hours === 12 && ampm === am) {
      hours = 0;
    }
    else if (hours !== 12 && ampm === pm) {
      hours += 12;
    }

    date = new Date(2001,0,0,hours,minutes,seconds);
    if (date.getHours() != hours || date.getMinutes() != minutes || date.getSeconds() != seconds)
      throw 'Invalid time';
    return date;
 }

  /* Normalise date object to a common year, month and day. */
  function normalizeTime(date) {
    date.setFullYear(2001);
    date.setMonth(0);
    date.setDate(0);
    return date;
  }

  function parseFormat(settings, date) {
    var p = function p(s) {
         return (s < 10) ? "0" + s : s;
    };
    return settings.timeFormat.replace(/hh?|HH?|mm?|ss?|tt?/g, function(format) {
      var am = settings.amDesignator;
      var pm = settings.pmDesignator;
      switch (format) {
        case "hh":
          return date ? p(((date.getHours() + 11) % 12) + 1) : '([0-1][0-9])';
        case "h":
          return date ? ((date.getHours() + 11) % 12) + 1 : '([0-1]?[0-9])';
        case "HH":
          return date ? p(date.getHours()) : '([0-2][0-9])';
        case "H":
          return date ? date.getHours() : '([0-2]?[0-9])';
        case "mm":
          return date ? p(date.getMinutes()) : '([0-6][0-9])';
        case "m":
          return date ? date.getMinutes() : '([0-6]?[0-9])';
        case "ss":
          return date ? p(date.getSeconds()) : '([0-6][0-9])';
        case "s":
          return date ? date.getSeconds() : '([0-6]?[0-9])';
        case "t":
          return date ? date.getHours() < 12 ? am.substring(0, 1) : pm.substring(0, 1) : '(' + am.substring(0, 1) + '|' + pm.substring(0, 1) + ')';
        case "tt":
          return date ? date.getHours() < 12 ? am : pm : '(' + am + '|' + pm + ')';
      }
      return '';
    });
  }

})(jQuery);
