/*!

Split Pane v0.4.0

Copyright (c) 2014 Simon Hagström

Released under the MIT license
https://raw.github.com/shagstrom/split-pane/master/LICENSE

*/
(function($) {
	
	$.fn.splitPane = function() {
		var $splitPanes = this;
		$splitPanes.each(setMinHeightAndMinWidth);
		$splitPanes.append('<div class="split-pane-resize-shim">');
		$splitPanes.children('.split-pane-divider').bind('mousedown touchstart', mousedownHandler);
		setTimeout(function() {
			// Doing this later because of an issue with Chrome (v23.0.1271.64) returning split-pane width = 0
			// and triggering multiple resize events when page is being opened from an <a target="_blank"> .
			$splitPanes.each(function() {
				$(this).bind('_splitpaneparentresize', createParentresizeHandler($(this)));
			});
			$(window).trigger('resize');
		}, 100);
	};

	var SPLITPANERESIZE_HANDLER = '_splitpaneparentresizeHandler';

	/**
	 * A special event that will "capture" a resize event from the parent split-pane or window.
	 * The event will NOT propagate to grandchildren.
	 */
	jQuery.event.special._splitpaneparentresize = {
		setup: function(data, namespaces) {
			var element = this,
				parent = $(this).parent().closest('.split-pane')[0] || window;
			$(this).data(SPLITPANERESIZE_HANDLER, function(event) {
				var target = event.target === document ? window : event.target;
				if (target === parent) {
					event.type = "_splitpaneparentresize";
					jQuery.event.dispatch.apply(element, arguments);
				} else {
					event.stopPropagation();
				}
			});
			$(parent).bind('resize', $(this).data(SPLITPANERESIZE_HANDLER));
		},
		teardown: function(namespaces) {
			var parent = $(this).parent().closest('.split-pane')[0] || window;
			$(parent).unbind('resize', $(this).data(SPLITPANERESIZE_HANDLER));
			$(this).removeData(SPLITPANERESIZE_HANDLER);
		}
	};

	function setMinHeightAndMinWidth() {
		var $splitPane = $(this),
			$firstComponent = $splitPane.children('.split-pane-component:first'),
			$divider = $splitPane.children('.split-pane-divider'),
			$lastComponent = $splitPane.children('.split-pane-component:last');
		if ($splitPane.is('.fixed-top, .fixed-bottom, .horizontal-percent')) {
			$splitPane.css('min-height', (minHeight($firstComponent) + minHeight($lastComponent) + $divider.height()) + 'px');
		} else {
			$splitPane.css('min-width', (minWidth($firstComponent) + minWidth($lastComponent) + $divider.width()) + 'px');
		}
	}

	function mousedownHandler(event) {
		event.preventDefault();
		var isTouchEvent = event.type.match(/^touch/),
			moveEvent = isTouchEvent ? 'touchmove' : 'mousemove',
			endEvent = isTouchEvent? 'touchend' : 'mouseup',
			$divider = $(this),
			$splitPane = $divider.parent(),
			$resizeShim = $divider.siblings('.split-pane-resize-shim');
		$resizeShim.show();
		$divider.addClass('dragged');
		if (isTouchEvent) {
			$divider.addClass('touch');
		}
		$(document).on(moveEvent, createMousemove($splitPane, pageXof(event), pageYof(event)));
		$(document).one(endEvent, function(event) {
			$(document).unbind(moveEvent);
			$divider.removeClass('dragged touch');
			$resizeShim.hide();
		});
	}

	function createParentresizeHandler($splitPane) {
		var splitPane = $splitPane[0],
			firstComponent = $splitPane.children('.split-pane-component:first')[0],
			divider = $splitPane.children('.split-pane-divider')[0],
			lastComponent = $splitPane.children('.split-pane-component:last')[0];
		if ($splitPane.is('.fixed-top')) {
			var lastComponentMinHeight = minHeight(lastComponent);
			return function(event) {
				var maxfirstComponentHeight = splitPane.offsetHeight - lastComponentMinHeight - divider.offsetHeight;
				if (firstComponent.offsetHeight > maxfirstComponentHeight) {
					setTop(firstComponent, divider, lastComponent, maxfirstComponentHeight + 'px');
				}
				$splitPane.resize();
			};
		} else if ($splitPane.is('.fixed-bottom')) {
			var firstComponentMinHeight = minHeight(firstComponent);
			return function(event) {
				var maxLastComponentHeight = splitPane.offsetHeight - firstComponentMinHeight - divider.offsetHeight;
				if (lastComponent.offsetHeight > maxLastComponentHeight) {
					setBottom(firstComponent, divider, lastComponent, maxLastComponentHeight + 'px')
				}
				$splitPane.resize();
			};
		} else if ($splitPane.is('.horizontal-percent')) {
			var lastComponentMinHeight = minHeight(lastComponent),
				firstComponentMinHeight = minHeight(firstComponent);
			return function(event) {
				var maxLastComponentHeight = splitPane.offsetHeight - firstComponentMinHeight - divider.offsetHeight;
				if (lastComponent.offsetHeight > maxLastComponentHeight) {
					setBottom(firstComponent, divider, lastComponent, (maxLastComponentHeight / splitPane.offsetHeight * 100) + '%');
				} else {
					if (splitPane.offsetHeight - firstComponent.offsetHeight - divider.offsetHeight < lastComponentMinHeight) {
						setBottom(firstComponent, divider, lastComponent, (lastComponentMinHeight / splitPane.offsetHeight * 100) + '%');
					}
				}
				$splitPane.resize();
			};
		} else if ($splitPane.is('.fixed-left')) {
			var lastComponentMinWidth = minWidth(lastComponent);
			return function(event) {
				var maxFirstComponentWidth = splitPane.offsetWidth - lastComponentMinWidth - divider.offsetWidth;
				if (firstComponent.offsetWidth > maxFirstComponentWidth) {
					setLeft(firstComponent, divider, lastComponent, maxFirstComponentWidth + 'px');
				}
				$splitPane.resize();
			};
		} else if ($splitPane.is('.fixed-right')) {
			var firstComponentMinWidth = minWidth(firstComponent);
			return function(event) {
				var maxLastComponentWidth = splitPane.offsetWidth - firstComponentMinWidth - divider.offsetWidth;
				if (lastComponent.offsetWidth > maxLastComponentWidth) {
					setRight(firstComponent, divider, lastComponent, maxLastComponentWidth + 'px');
				}
				$splitPane.resize();
			};
		} else if ($splitPane.is('.vertical-percent')) {
			var lastComponentMinWidth = minWidth(lastComponent),
				firstComponentMinWidth = minWidth(firstComponent);
			return function(event) {
				var maxLastComponentWidth = splitPane.offsetWidth - firstComponentMinWidth - divider.offsetWidth;
				if (lastComponent.offsetWidth > maxLastComponentWidth) {
					setRight(firstComponent, divider, lastComponent, (maxLastComponentWidth / splitPane.offsetWidth * 100) + '%');
				} else {
					if (splitPane.offsetWidth - firstComponent.offsetWidth - divider.offsetWidth < lastComponentMinWidth) {
						setRight(firstComponent, divider, lastComponent, (lastComponentMinWidth / splitPane.offsetWidth * 100) + '%');
					}
				}
				$splitPane.resize();
			};
		}
	}

	function createMousemove($splitPane, pageX, pageY) {
		var splitPane = $splitPane[0],
			firstComponent = $splitPane.children('.split-pane-component:first')[0],
			divider = $splitPane.children('.split-pane-divider')[0],
			lastComponent = $splitPane.children('.split-pane-component:last')[0];
		if ($splitPane.is('.fixed-top')) {
			var firstComponentMinHeight =  minHeight(firstComponent),
				maxFirstComponentHeight = splitPane.offsetHeight - minHeight(lastComponent) - divider.offsetHeight,
				topOffset = divider.offsetTop - pageY;
			return function(event) {
				event.preventDefault();
				var top = Math.min(Math.max(firstComponentMinHeight, topOffset + pageYof(event)), maxFirstComponentHeight);
				setTop(firstComponent, divider, lastComponent, top + 'px');
				$splitPane.resize();
			};
		} else if ($splitPane.is('.fixed-bottom')) {
			var lastComponentMinHeight = minHeight(lastComponent),
				maxLastComponentHeight = splitPane.offsetHeight - minHeight(firstComponent) - divider.offsetHeight,
				bottomOffset = lastComponent.offsetHeight + pageY;
			return function(event) {
				event.preventDefault();
				var bottom = Math.min(Math.max(lastComponentMinHeight, bottomOffset - pageYof(event)), maxLastComponentHeight);
				setBottom(firstComponent, divider, lastComponent, bottom + 'px');
				$splitPane.resize();
			};
		} else if ($splitPane.is('.horizontal-percent')) {
			var splitPaneHeight = splitPane.offsetHeight,
				lastComponentMinHeight = minHeight(lastComponent),
				maxLastComponentHeight = splitPaneHeight - minHeight(firstComponent) - divider.offsetHeight,
				bottomOffset = lastComponent.offsetHeight + pageY;
			return function(event) {
				event.preventDefault();
				var bottom = Math.min(Math.max(lastComponentMinHeight, bottomOffset - pageYof(event)), maxLastComponentHeight);
				setBottom(firstComponent, divider, lastComponent, (bottom / splitPaneHeight * 100) + '%');
				$splitPane.resize();
			};
		} else if ($splitPane.is('.fixed-left')) {
			var firstComponentMinWidth = minWidth(firstComponent),
				maxFirstComponentWidth = splitPane.offsetWidth - minWidth(lastComponent) - divider.offsetWidth,
				leftOffset = divider.offsetLeft - pageX;
			return function(event) {
				event.preventDefault();
				var left = Math.min(Math.max(firstComponentMinWidth, leftOffset + pageXof(event)), maxFirstComponentWidth);
				setLeft(firstComponent, divider, lastComponent, left + 'px')
				$splitPane.resize();
			};
		} else if ($splitPane.is('.fixed-right')) {
			var lastComponentMinWidth = minWidth(lastComponent),
				maxLastComponentWidth = splitPane.offsetWidth - minWidth(firstComponent) - divider.offsetWidth,
				rightOffset = lastComponent.offsetWidth + pageX;
			return function(event) {
				event.preventDefault();
				var right = Math.min(Math.max(lastComponentMinWidth, rightOffset - pageXof(event)), maxLastComponentWidth);
				setRight(firstComponent, divider, lastComponent, right + 'px');
				$splitPane.resize();
			};
		} else if ($splitPane.is('.vertical-percent')) {
			var splitPaneWidth = splitPane.offsetWidth,
				lastComponentMinWidth = minWidth(lastComponent),
				maxLastComponentWidth = splitPaneWidth - minWidth(firstComponent) - divider.offsetWidth,
				rightOffset = lastComponent.offsetWidth + pageX;
			return function(event) {
				event.preventDefault();
				var right = Math.min(Math.max(lastComponentMinWidth, rightOffset - pageXof(event)), maxLastComponentWidth);
				setRight(firstComponent, divider, lastComponent, (right / splitPaneWidth * 100) + '%');
				$splitPane.resize();
			};
		}
	}

	function pageXof(event) {
		return event.pageX || event.originalEvent.pageX;
	}

	function pageYof(event) {
		return event.pageY || event.originalEvent.pageY;
	}

	function minHeight(element) {
		return parseInt($(element).css('min-height')) || 0;
	}

	function minWidth(element) {
		return parseInt($(element).css('min-width')) || 0;
	}

	function setTop(firstComponent, divider, lastComponent, top) {
		firstComponent.style.height = top;
		divider.style.top = top;
		lastComponent.style.top = top;
	}

	function setBottom(firstComponent, divider, lastComponent, bottom) {
		firstComponent.style.bottom = bottom;
		divider.style.bottom = bottom;
		lastComponent.style.height = bottom;
	}

	function setLeft(firstComponent, divider, lastComponent, left) {
		firstComponent.style.width = left;
		divider.style.left = left;
		lastComponent.style.left = left;
	}

	function setRight(firstComponent, divider, lastComponent, right) {
		firstComponent.style.right = right;
		divider.style.right = right;
		lastComponent.style.width = right;
	}

})(jQuery);


/* **********************************************
     Begin bootbox.js
********************************************** */

/**
 * bootbox.js [v4.4.0]
 *
 * http://bootboxjs.com/license.txt
 */

// @see https://github.com/makeusabrew/bootbox/issues/180
// @see https://github.com/makeusabrew/bootbox/issues/186
(function (root, factory) {

  "use strict";
  if (typeof define === "function" && define.amd) {
    // AMD. Register as an anonymous module.
    define(["jquery"], factory);
  } else if (typeof exports === "object") {
    // Node. Does not work with strict CommonJS, but
    // only CommonJS-like environments that support module.exports,
    // like Node.
    module.exports = factory(require("jquery"));
  } else {
    // Browser globals (root is window)
    root.bootbox = factory(root.jQuery);
  }

}(this, function init($, undefined) {

  "use strict";

  // the base DOM structure needed to create a modal
  var templates = {
    dialog:
      "<div class='bootbox modal' tabindex='-1' role='dialog'>" +
        "<div class='modal-dialog'>" +
          "<div class='modal-content'>" +
            "<div class='modal-body'><div class='bootbox-body'></div></div>" +
          "</div>" +
        "</div>" +
      "</div>",
    header:
      "<div class='modal-header'>" +
        "<h4 class='modal-title'></h4>" +
      "</div>",
    footer:
      "<div class='modal-footer'></div>",
    closeButton:
      "<button type='button' class='close-modal' data-dismiss='modal'></button>",
    form:
      "<form class='bootbox-form'></form>",
    inputs: {
      text:
        "<input class='bootbox-input bootbox-input-text form-control' autocomplete=off type=text />",
      textarea:
        "<textarea class='bootbox-input bootbox-input-textarea form-control'></textarea>",
      email:
        "<input class='bootbox-input bootbox-input-email form-control' autocomplete='off' type='email' />",
      select:
        "<select class='bootbox-input bootbox-input-select form-control'></select>",
      checkbox:
        "<div class='checkbox'><label><input class='bootbox-input bootbox-input-checkbox' type='checkbox' /></label></div>",
      date:
        "<input class='bootbox-input bootbox-input-date form-control' autocomplete=off type='date' />",
      time:
        "<input class='bootbox-input bootbox-input-time form-control' autocomplete=off type='time' />",
      number:
        "<input class='bootbox-input bootbox-input-number form-control' autocomplete=off type='number' />",
      password:
        "<input class='bootbox-input bootbox-input-password form-control' autocomplete='off' type='password' />"
    }
  };

  var defaults = {
    // default language
    locale: "en",
    // show backdrop or not. Default to static so user has to interact with dialog
    backdrop: "static",
    // animate the modal in/out
    animate: true,
    // additional class string applied to the top level dialog
    className: null,
    // whether or not to include a close button
    closeButton: true,
    // show the dialog immediately by default
    show: true,
    // dialog container
    container: "body"
  };

  // our public object; augmented after our private API
  var exports = {};

  /**
   * @private
   */
  function _t(key) {
    var locale = locales[defaults.locale];
    return locale ? locale[key] : locales.en[key];
  }

  function processCallback(e, dialog, callback) {
    e.stopPropagation();
    e.preventDefault();

    // by default we assume a callback will get rid of the dialog,
    // although it is given the opportunity to override this

    // so, if the callback can be invoked and it *explicitly returns false*
    // then we'll set a flag to keep the dialog active...
    var preserveDialog = $.isFunction(callback) && callback.call(dialog, e) === false;

    // ... otherwise we'll bin it
    if (!preserveDialog) {
      dialog.modal("hide");
    }
  }

  function getKeyLength(obj) {
    // @TODO defer to Object.keys(x).length if available?
    var k, t = 0;
    for (k in obj) {
      t ++;
    }
    return t;
  }

  function each(collection, iterator) {
    var index = 0;
    $.each(collection, function(key, value) {
      iterator(key, value, index++);
    });
  }

  function sanitize(options) {
    var buttons;
    var total;

    if (typeof options !== "object") {
      throw new Error("Please supply an object of options");
    }

    if (!options.message) {
      throw new Error("Please specify a message");
    }

    // make sure any supplied options take precedence over defaults
    options = $.extend({}, defaults, options);

    if (!options.buttons) {
      options.buttons = {};
    }

    buttons = options.buttons;

    total = getKeyLength(buttons);

    each(buttons, function(key, button, index) {

      if ($.isFunction(button)) {
        // short form, assume value is our callback. Since button
        // isn't an object it isn't a reference either so re-assign it
        button = buttons[key] = {
          callback: button
        };
      }

      // before any further checks make sure by now button is the correct type
      if ($.type(button) !== "object") {
        throw new Error("button with key " + key + " must be an object");
      }

      if (!button.label) {
        // the lack of an explicit label means we'll assume the key is good enough
        button.label = key;
      }

      if (!button.className) {
        if (total <= 2 && index === total-1) {
          // always add a primary to the main option in a two-button dialog
          button.className = "btn-primary";
        } else {
          button.className = "btn-default";
        }
      }
    });

    return options;
  }

  /**
   * map a flexible set of arguments into a single returned object
   * if args.length is already one just return it, otherwise
   * use the properties argument to map the unnamed args to
   * object properties
   * so in the latter case:
   * mapArguments(["foo", $.noop], ["message", "callback"])
   * -> { message: "foo", callback: $.noop }
   */
  function mapArguments(args, properties) {
    var argn = args.length;
    var options = {};

    if (argn < 1 || argn > 2) {
      throw new Error("Invalid argument length");
    }

    if (argn === 2 || typeof args[0] === "string") {
      options[properties[0]] = args[0];
      options[properties[1]] = args[1];
    } else {
      options = args[0];
    }

    return options;
  }

  /**
   * merge a set of default dialog options with user supplied arguments
   */
  function mergeArguments(defaults, args, properties) {
    return $.extend(
      // deep merge
      true,
      // ensure the target is an empty, unreferenced object
      {},
      // the base options object for this type of dialog (often just buttons)
      defaults,
      // args could be an object or array; if it's an array properties will
      // map it to a proper options object
      mapArguments(
        args,
        properties
      )
    );
  }

  /**
   * this entry-level method makes heavy use of composition to take a simple
   * range of inputs and return valid options suitable for passing to bootbox.dialog
   */
  function mergeDialogOptions(className, labels, properties, args) {
    //  build up a base set of dialog properties
    var baseOptions = {
      className: "bootbox-" + className,
      buttons: createLabels.apply(null, labels)
    };

    // ensure the buttons properties generated, *after* merging
    // with user args are still valid against the supplied labels
    return validateButtons(
      // merge the generated base properties with user supplied arguments
      mergeArguments(
        baseOptions,
        args,
        // if args.length > 1, properties specify how each arg maps to an object key
        properties
      ),
      labels
    );
  }

  /**
   * from a given list of arguments return a suitable object of button labels
   * all this does is normalise the given labels and translate them where possible
   * e.g. "ok", "confirm" -> { ok: "OK, cancel: "Annuleren" }
   */
  function createLabels() {
    var buttons = {};

    for (var i = 0, j = arguments.length; i < j; i++) {
      var argument = arguments[i];
      var key = argument.toLowerCase();
      var value = argument.toUpperCase();

      buttons[key] = {
        label: _t(value)
      };
    }

    return buttons;
  }

  function validateButtons(options, buttons) {
    var allowedButtons = {};
    each(buttons, function(key, value) {
      allowedButtons[value] = true;
    });

    each(options.buttons, function(key) {
      if (allowedButtons[key] === undefined) {
        throw new Error("button key " + key + " is not allowed (options are " + buttons.join("\n") + ")");
      }
    });

    return options;
  }

  exports.alert = function() {
    var options;

    options = mergeDialogOptions("alert", ["ok"], ["message", "callback"], arguments);

    if (options.callback && !$.isFunction(options.callback)) {
      throw new Error("alert requires callback property to be a function when provided");
    }

    /**
     * overrides
     */
    options.buttons.ok.callback = options.onEscape = function() {
      if ($.isFunction(options.callback)) {
        return options.callback.call(this);
      }
      return true;
    };

    return exports.dialog(options);
  };

  exports.confirm = function() {
    var options;

    options = mergeDialogOptions("confirm", ["cancel", "confirm"], ["message", "callback"], arguments);

    /**
     * overrides; undo anything the user tried to set they shouldn't have
     */
    options.buttons.cancel.callback = options.onEscape = function() {
      return options.callback.call(this, false);
    };

    options.buttons.confirm.callback = function() {
      return options.callback.call(this, true);
    };

    // confirm specific validation
    if (!$.isFunction(options.callback)) {
      throw new Error("confirm requires a callback");
    }

    return exports.dialog(options);
  };

  exports.prompt = function() {
    var options;
    var defaults;
    var dialog;
    var form;
    var input;
    var shouldShow;
    var inputOptions;

    // we have to create our form first otherwise
    // its value is undefined when gearing up our options
    // @TODO this could be solved by allowing message to
    // be a function instead...
    form = $(templates.form);

    // prompt defaults are more complex than others in that
    // users can override more defaults
    // @TODO I don't like that prompt has to do a lot of heavy
    // lifting which mergeDialogOptions can *almost* support already
    // just because of 'value' and 'inputType' - can we refactor?
    defaults = {
      className: "bootbox-prompt",
      buttons: createLabels("cancel", "confirm"),
      value: "",
      inputType: "text"
    };

    options = validateButtons(
      mergeArguments(defaults, arguments, ["title", "callback"]),
      ["cancel", "confirm"]
    );

    // capture the user's show value; we always set this to false before
    // spawning the dialog to give us a chance to attach some handlers to
    // it, but we need to make sure we respect a preference not to show it
    shouldShow = (options.show === undefined) ? true : options.show;

    /**
     * overrides; undo anything the user tried to set they shouldn't have
     */
    options.message = form;

    options.buttons.cancel.callback = options.onEscape = function() {
      return options.callback.call(this, null);
    };

    options.buttons.confirm.callback = function() {
      var value;

      switch (options.inputType) {
        case "text":
        case "textarea":
        case "email":
        case "select":
        case "date":
        case "time":
        case "number":
        case "password":
          value = input.val();
          break;

        case "checkbox":
          var checkedItems = input.find("input:checked");

          // we assume that checkboxes are always multiple,
          // hence we default to an empty array
          value = [];

          each(checkedItems, function(_, item) {
            value.push($(item).val());
          });
          break;
      }

      return options.callback.call(this, value);
    };

    options.show = false;

    // prompt specific validation
    if (!options.title) {
      throw new Error("prompt requires a title");
    }

    if (!$.isFunction(options.callback)) {
      throw new Error("prompt requires a callback");
    }

    if (!templates.inputs[options.inputType]) {
      throw new Error("invalid prompt type");
    }

    // create the input based on the supplied type
    input = $(templates.inputs[options.inputType]);

    switch (options.inputType) {
      case "text":
      case "textarea":
      case "email":
      case "date":
      case "time":
      case "number":
      case "password":
        input.val(options.value);
        break;

      case "select":
        var groups = {};
        inputOptions = options.inputOptions || [];

        if (!$.isArray(inputOptions)) {
          throw new Error("Please pass an array of input options");
        }

        if (!inputOptions.length) {
          throw new Error("prompt with select requires options");
        }

        each(inputOptions, function(_, option) {

          // assume the element to attach to is the input...
          var elem = input;

          if (option.value === undefined || option.text === undefined) {
            throw new Error("given options in wrong format");
          }

          // ... but override that element if this option sits in a group

          if (option.group) {
            // initialise group if necessary
            if (!groups[option.group]) {
              groups[option.group] = $("<optgroup/>").attr("label", option.group);
            }

            elem = groups[option.group];
          }

          elem.append("<option value='" + option.value + "'>" + option.text + "</option>");
        });

        each(groups, function(_, group) {
          input.append(group);
        });

        // safe to set a select's value as per a normal input
        input.val(options.value);
        break;

      case "checkbox":
        var values   = $.isArray(options.value) ? options.value : [options.value];
        inputOptions = options.inputOptions || [];

        if (!inputOptions.length) {
          throw new Error("prompt with checkbox requires options");
        }

        if (!inputOptions[0].value || !inputOptions[0].text) {
          throw new Error("given options in wrong format");
        }

        // checkboxes have to nest within a containing element, so
        // they break the rules a bit and we end up re-assigning
        // our 'input' element to this container instead
        input = $("<div/>");

        each(inputOptions, function(_, option) {
          var checkbox = $(templates.inputs[options.inputType]);

          checkbox.find("input").attr("value", option.value);
          checkbox.find("label").append(option.text);

          // we've ensured values is an array so we can always iterate over it
          each(values, function(_, value) {
            if (value === option.value) {
              checkbox.find("input").prop("checked", true);
            }
          });

          input.append(checkbox);
        });
        break;
    }

    // @TODO provide an attributes option instead
    // and simply map that as keys: vals
    if (options.placeholder) {
      input.attr("placeholder", options.placeholder);
    }

    if (options.pattern) {
      input.attr("pattern", options.pattern);
    }

    if (options.maxlength) {
      input.attr("maxlength", options.maxlength);
    }

    // now place it in our form
    form.append(input);

    form.on("submit", function(e) {
      e.preventDefault();
      // Fix for SammyJS (or similar JS routing library) hijacking the form post.
      e.stopPropagation();
      // @TODO can we actually click *the* button object instead?
      // e.g. buttons.confirm.click() or similar
      dialog.find(".btn-primary").click();
    });

    dialog = exports.dialog(options);

    // clear the existing handler focusing the submit button...
    dialog.off("shown.bs.modal");

    // ...and replace it with one focusing our input, if possible
    dialog.on("shown.bs.modal", function() {
      // need the closure here since input isn't
      // an object otherwise
      input.focus();
    });

    if (shouldShow === true) {
      dialog.modal("show");
    }

    return dialog;
  };

  exports.dialog = function(options) {
    options = sanitize(options);

    var dialog = $(templates.dialog);
    var innerDialog = dialog.find(".modal-dialog");
    var body = dialog.find(".modal-body");
    var buttons = options.buttons;
    var buttonStr = "";
    var callbacks = {
      onEscape: options.onEscape
    };

    if ($.fn.modal === undefined) {
      throw new Error(
        "$.fn.modal is not defined; please double check you have included " +
        "the Bootstrap JavaScript library. See http://getbootstrap.com/javascript/ " +
        "for more details."
      );
    }

    each(buttons, function(key, button) {

      // @TODO I don't like this string appending to itself; bit dirty. Needs reworking
      // can we just build up button elements instead? slower but neater. Then button
      // can just become a template too
      buttonStr += "<button data-bb-handler='" + key + "' type='button' class='btn " + button.className + "'>" + button.label + "</button>";
      callbacks[key] = button.callback;
    });

    body.find(".bootbox-body").html(options.message);

    if (options.animate === true) {
      dialog.addClass("fade");
    }

    if (options.className) {
      dialog.addClass(options.className);
    }

    if (options.size === "large") {
      innerDialog.addClass("modal-lg");
    } else if (options.size === "small") {
      innerDialog.addClass("modal-sm");
    }

    if (options.title) {
      body.before(templates.header);
    }

    if (options.closeButton) {
      var closeButton = $(templates.closeButton);

      if (options.title) {
        dialog.find(".modal-header").prepend(closeButton);
      } else {
        closeButton.css("margin-top", "-10px").prependTo(body);
      }
    }

    if (options.title) {
      dialog.find(".modal-title").html(options.title);
    }

    if (buttonStr.length) {
      body.after(templates.footer);
      dialog.find(".modal-footer").html(buttonStr);
    }


    /**
     * Bootstrap event listeners; used handle extra
     * setup & teardown required after the underlying
     * modal has performed certain actions
     */

    dialog.on("hidden.bs.modal", function(e) {
      // ensure we don't accidentally intercept hidden events triggered
      // by children of the current dialog. We shouldn't anymore now BS
      // namespaces its events; but still worth doing
      if (e.target === this) {
        dialog.remove();
      }
    });

    /*
    dialog.on("show.bs.modal", function() {
      // sadly this doesn't work; show is called *just* before
      // the backdrop is added so we'd need a setTimeout hack or
      // otherwise... leaving in as would be nice
      if (options.backdrop) {
        dialog.next(".modal-backdrop").addClass("bootbox-backdrop");
      }
    });
    */

    dialog.on("shown.bs.modal", function() {
      dialog.find(".btn-primary:first").focus();
    });

    /**
     * Bootbox event listeners; experimental and may not last
     * just an attempt to decouple some behaviours from their
     * respective triggers
     */

    if (options.backdrop !== "static") {
      // A boolean true/false according to the Bootstrap docs
      // should show a dialog the user can dismiss by clicking on
      // the background.
      // We always only ever pass static/false to the actual
      // $.modal function because with `true` we can't trap
      // this event (the .modal-backdrop swallows it)
      // However, we still want to sort of respect true
      // and invoke the escape mechanism instead
      dialog.on("click.dismiss.bs.modal", function(e) {
        // @NOTE: the target varies in >= 3.3.x releases since the modal backdrop
        // moved *inside* the outer dialog rather than *alongside* it
        if (dialog.children(".modal-backdrop").length) {
          e.currentTarget = dialog.children(".modal-backdrop").get(0);
        }

        if (e.target !== e.currentTarget) {
          return;
        }

        dialog.trigger("escape.close.bb");
      });
    }

    dialog.on("escape.close.bb", function(e) {
      if (callbacks.onEscape) {
        processCallback(e, dialog, callbacks.onEscape);
      }
    });

    /**
     * Standard jQuery event listeners; used to handle user
     * interaction with our dialog
     */

    dialog.on("click", ".modal-footer button", function(e) {
      var callbackKey = $(this).data("bb-handler");

      processCallback(e, dialog, callbacks[callbackKey]);
    });

    dialog.on("click", ".bootbox-close-button", function(e) {
      // onEscape might be falsy but that's fine; the fact is
      // if the user has managed to click the close button we
      // have to close the dialog, callback or not
      processCallback(e, dialog, callbacks.onEscape);
    });

    dialog.on("keyup", function(e) {
      if (e.which === 27) {
        dialog.trigger("escape.close.bb");
      }
    });

    // the remainder of this method simply deals with adding our
    // dialogent to the DOM, augmenting it with Bootstrap's modal
    // functionality and then giving the resulting object back
    // to our caller

    $(options.container).append(dialog);

    dialog.modal({
      backdrop: options.backdrop ? "static": false,
      keyboard: false,
      show: false
    });

    if (options.show) {
      dialog.modal("show");
    }

    // @TODO should we return the raw element here or should
    // we wrap it in an object on which we can expose some neater
    // methods, e.g. var d = bootbox.alert(); d.hide(); instead
    // of d.modal("hide");

   /*
    function BBDialog(elem) {
      this.elem = elem;
    }

    BBDialog.prototype = {
      hide: function() {
        return this.elem.modal("hide");
      },
      show: function() {
        return this.elem.modal("show");
      }
    };
    */

    return dialog;

  };

  exports.setDefaults = function() {
    var values = {};

    if (arguments.length === 2) {
      // allow passing of single key/value...
      values[arguments[0]] = arguments[1];
    } else {
      // ... and as an object too
      values = arguments[0];
    }

    $.extend(defaults, values);
  };

  exports.hideAll = function() {
    $(".bootbox").modal("hide");

    return exports;
  };


  /**
   * standard locales. Please add more according to ISO 639-1 standard. Multiple language variants are
   * unlikely to be required. If this gets too large it can be split out into separate JS files.
   */
  var locales = {
    bg_BG : {
      OK      : "Ок",
      CANCEL  : "Отказ",
      CONFIRM : "Потвърждавам"
    },
    br : {
      OK      : "OK",
      CANCEL  : "Cancelar",
      CONFIRM : "Sim"
    },
    cs : {
      OK      : "OK",
      CANCEL  : "Zrušit",
      CONFIRM : "Potvrdit"
    },
    da : {
      OK      : "OK",
      CANCEL  : "Annuller",
      CONFIRM : "Accepter"
    },
    de : {
      OK      : "OK",
      CANCEL  : "Abbrechen",
      CONFIRM : "Akzeptieren"
    },
    el : {
      OK      : "Εντάξει",
      CANCEL  : "Ακύρωση",
      CONFIRM : "Επιβεβαίωση"
    },
    en : {
      OK      : "OK",
      CANCEL  : "Cancel",
      CONFIRM : "OK"
    },
    es : {
      OK      : "OK",
      CANCEL  : "Cancelar",
      CONFIRM : "Aceptar"
    },
    et : {
      OK      : "OK",
      CANCEL  : "Katkesta",
      CONFIRM : "OK"
    },
    fa : {
      OK      : "قبول",
      CANCEL  : "لغو",
      CONFIRM : "تایید"
    },
    fi : {
      OK      : "OK",
      CANCEL  : "Peruuta",
      CONFIRM : "OK"
    },
    fr : {
      OK      : "OK",
      CANCEL  : "Annuler",
      CONFIRM : "D'accord"
    },
    he : {
      OK      : "אישור",
      CANCEL  : "ביטול",
      CONFIRM : "אישור"
    },
    hu : {
      OK      : "OK",
      CANCEL  : "Mégsem",
      CONFIRM : "Megerősít"
    },
    hr : {
      OK      : "OK",
      CANCEL  : "Odustani",
      CONFIRM : "Potvrdi"
    },
    id : {
      OK      : "OK",
      CANCEL  : "Batal",
      CONFIRM : "OK"
    },
    it : {
      OK      : "OK",
      CANCEL  : "Annulla",
      CONFIRM : "Conferma"
    },
    ja : {
      OK      : "OK",
      CANCEL  : "キャンセル",
      CONFIRM : "確認"
    },
    lt : {
      OK      : "Gerai",
      CANCEL  : "Atšaukti",
      CONFIRM : "Patvirtinti"
    },
    lv : {
      OK      : "Labi",
      CANCEL  : "Atcelt",
      CONFIRM : "Apstiprināt"
    },
    nl : {
      OK      : "OK",
      CANCEL  : "Annuleren",
      CONFIRM : "Accepteren"
    },
    no : {
      OK      : "OK",
      CANCEL  : "Avbryt",
      CONFIRM : "OK"
    },
    pl : {
      OK      : "OK",
      CANCEL  : "Anuluj",
      CONFIRM : "Potwierdź"
    },
    pt : {
      OK      : "OK",
      CANCEL  : "Cancelar",
      CONFIRM : "Confirmar"
    },
    ru : {
      OK      : "OK",
      CANCEL  : "Отмена",
      CONFIRM : "Применить"
    },
    sq : {
      OK : "OK",
      CANCEL : "Anulo",
      CONFIRM : "Prano"
    },
    sv : {
      OK      : "OK",
      CANCEL  : "Avbryt",
      CONFIRM : "OK"
    },
    th : {
      OK      : "ตกลง",
      CANCEL  : "ยกเลิก",
      CONFIRM : "ยืนยัน"
    },
    tr : {
      OK      : "Tamam",
      CANCEL  : "İptal",
      CONFIRM : "Onayla"
    },
    zh_CN : {
      OK      : "OK",
      CANCEL  : "取消",
      CONFIRM : "确认"
    },
    zh_TW : {
      OK      : "OK",
      CANCEL  : "取消",
      CONFIRM : "確認"
    }
  };

  exports.addLocale = function(name, values) {
    $.each(["OK", "CANCEL", "CONFIRM"], function(_, v) {
      if (!values[v]) {
        throw new Error("Please supply a translation for '" + v + "'");
      }
    });

    locales[name] = {
      OK: values.OK,
      CANCEL: values.CANCEL,
      CONFIRM: values.CONFIRM
    };

    return exports;
  };

  exports.removeLocale = function(name) {
    delete locales[name];

    return exports;
  };

  exports.setLocale = function(name) {
    return exports.setDefaults("locale", name);
  };

  exports.init = function(_$) {
    return init(_$ || $);
  };

  return exports;
}));


/* **********************************************
     Begin app.js
********************************************** */

Parse.initialize("wXFnX7DZNHreJtbaVTy6FBfZxp0cphmqwlDmQZDQ", "j45FTEIeVh3AUG1WaI1MIyc1UaCXUSXa2WPwu8jE");
var app = angular.module("Code", ['ui.router', 'ui.ace', 'shagstrom.angular-split-pane']);

app.config(function ($stateProvider, $urlRouterProvider) {

    //$urlRouterProvider.otherwise("/state1");


    $stateProvider
        .state('main', {
            url: "/main",
            templateUrl: "main.html",
            controller: "MainCtrl"
        })
        .state('login', {
            url: "/login",
            templateUrl: "login.html",
            controller: "LoginCtrl"
        });

});

app.run(["User", "$state", function (User, $state) {

    if (!User.getCurrent()) {
        $state.go("login");
    } else {
        $state.go("main");
    }

}]);






/* **********************************************
     Begin bridge.js
********************************************** */

app.factory('Bridge',[function(){

    var self = {};

    self.quit = function()
    {
        if(typeof MacGap !== 'undefined')
        {
            MacGap.terminate();
        }
    }

    self.minimize = function()
    {
        if(typeof MacGap !== 'undefined')
        {
            MacGap.Window.minimize();
        }
    }

    self.maximize = function()
    {
        if(typeof MacGap !== 'undefined')
        {
            MacGap.Window.maximize();
        }
    }

    return self;

}]);


/* **********************************************
     Begin editor.js
********************************************** */

app.factory("Editor", ["$rootScope", function($rootScope){

    var prefs = null;
    var ace = null;

    var self = {
        onLoad: function (_ace) {
            ace = _ace;

            if(prefs){
                self.setSettings(prefs);
                prefs = null;
            }
        },
        modes: [{mode: "abap", language: "Abap"}, {mode: "abc", language: "Abc"}, {mode: "actionscript", language: "ActionScript"}, {mode: "ada", language: "Ada"}, {mode: "apache_conf", language: "Apache Conf"}, {mode: "applescript", language: "Applescript"}, {mode: "asciidoc", language: "Ascii Doc"}, {mode: "assembly_x86", language: "Assembly x86"}, {mode: "autohotkey", language: "Autohotkey"}, {mode: "batchfile", language: "Batchfile"}, {mode: "c_cpp", language: "C/C++"}, {mode: "c9search", language: "C9 Search"}, {mode: "cirru", language: "Cirru"}, {mode: "clojure", language: "Clojure"}, {mode: "cobol", language: "Cobol"}, {mode: "coffee", language: "Coffee"}, {mode: "coldfusion", language: "Coldfusion"}, {mode: "csharp", language: "C#"}, {mode: "css", language: "CSS"}, {mode: "curly", language: "Curly"}, {mode: "d", language: "D"}, {mode: "dart", language: "Dart"}, {mode: "diff", language: "Diff"}, {mode: "django", language: "Django"}, {mode: "dockerfile", language: "Dockerfile"}, {mode: "dot", language: "Dot"}, {mode: "eiffel", language: "Eiffel"}, {mode: "ejs", language: "Ejs"}, {mode: "elixir", language: "Elixir"}, {mode: "elm", language: "Elm"}, {mode: "erlang", language: "Erlang"}, {mode: "forth", language: "Forth"}, {mode: "ftl", language: "Ftl"}, {mode: "gcode", language: "Gcode"}, {mode: "gherkin", language: "Gherkin"}, {mode: "gitignore", language: "Gitignore"}, {mode: "glsl", language: "Glsl"}, {mode: "golang", language: "Go lang"}, {mode: "groovy", language: "Groovy"}, {mode: "haml", language: "Haml"}, {mode: "handlebars", language: "Handlebars"}, {mode: "haskell", language: "Haskell"}, {mode: "haxe", language: "Haxe"}, {mode: "html_ruby", language: "HTML Ruby"}, {mode: "html", language: "HTML"}, {mode: "ini", language: "Ini"}, {mode: "io", language: "Io"}, {mode: "jack", language: "Jack"}, {mode: "jade", language: "Jade"}, {mode: "java", language: "Java"}, {mode: "javascript", language: "JavaScript"}, {mode: "json", language: "Json"}, {mode: "jsoniq", language: "Jsoniq"}, {mode: "jsp", language: "Jsp"}, {mode: "jsx", language: "Jsx"}, {mode: "julia", language: "Julia"}, {mode: "latex", language: "Latex"}, {mode: "lean", language: "Lean"}, {mode: "less", language: "Less"}, {mode: "liquid", language: "Liquid"}, {mode: "lisp", language: "Lisp"}, {mode: "live_script", language: "Live Script"}, {mode: "livescript", language: "Livescript"}, {mode: "logiql", language: "Logiql"}, {mode: "lsl", language: "Lsl"}, {mode: "lua", language: "Lua"}, {mode: "luapage", language: "Luapage"}, {mode: "lucene", language: "Lucene"}, {mode: "makefile", language: "Makefile"}, {mode: "markdown", language: "Markdown"}, {mode: "mask", language: "Mask"}, {mode: "matlab", language: "Matlab"}, {mode: "mel", language: "Mel"}, {mode: "mips_assembler", language: "Mips Assembler"}, {mode: "mipsassembler", language: "Mipsassembler"}, {mode: "mushcode", language: "Mushcode"}, {mode: "mysql", language: "Mysql"}, {mode: "nix", language: "Nix"}, {mode: "objectivec", language: "Objective-C"}, {mode: "ocaml", language: "Ocaml"}, {mode: "pascal", language: "Pascal"}, {mode: "perl", language: "Perl"}, {mode: "pgsql", language: "Pgsql"}, {mode: "php", language: "PHP"}, {mode: "plain_text", language: "Plain Text"}, {mode: "powershell", language: "Powershell"}, {mode: "praat", language: "Praat"}, {mode: "prolog", language: "Prolog"}, {mode: "properties", language: "Properties"}, {mode: "protobuf", language: "Protobuf"}, {mode: "python", language: "Python"}, {mode: "r", language: "R"}, {mode: "rdoc", language: "Rdoc"}, {mode: "rhtml", language: "Rhtml"}, {mode: "ruby", language: "Ruby"}, {mode: "rust", language: "Rust"}, {mode: "sass", language: "Sass"}, {mode: "scad", language: "Scad"}, {mode: "scala", language: "Scala"}, {mode: "scheme", language: "Scheme"}, {mode: "scss", language: "Scss"}, {mode: "sh", language: "Sh"}, {mode: "sjs", language: "Sjs"}, {mode: "smarty", language: "Smarty"}, {mode: "snippets", language: "Snippets"}, {mode: "soy_template", language: "Soy Template"}, {mode: "space", language: "Space"}, {mode: "sql", language: "SQL"}, {mode: "stylus", language: "Stylus"}, {mode: "svg", language: "Svg"}, {mode: "tcl", language: "Tcl"}, {mode: "tex", language: "Tex"}, {mode: "text", language: "Text"}, {mode: "textile", language: "Textile"}, {mode: "toml", language: "Toml"}, {mode: "twig", language: "Twig"}, {mode: "typescript", language: "TypeScript"}, {mode: "vala", language: "Vala"}, {mode: "vbscript", language: "Vb Script"}, {mode: "velocity", language: "Velocity"}, {mode: "verilog", language: "Verilog"}, {mode: "vhdl", language: "Vhdl"}, {mode: "xml", language: "Xml"}, {mode: "xquery", language: "Xquery"}, {mode: "yaml", language: "Yaml"},]
    };

    self.setSettings = function(settings)
    {
        if(!ace){
            prefs = settings;
            return;
        }

        if(!settings) return;

        $rootScope.$applyAsync(function(){
            angular.forEach(Object.keys(settings), function(key){

                //console.log("Setting", key, settings[key]);

                if(key == 'tabSize') ace.getSession().setTabSize(parseInt(settings[key]));
                if(key == 'fontSize') ace.container.style.fontSize = settings[key];
                if(key == 'softWraps') ace.setOption("wrap", settings[key]);
                if(key == 'selectionStyle') ace.setOption("selectionStyle", settings[key]);
                if(key == 'highlightActiveLine') ace.setOption("highlightActiveLine", settings[key]);
                if(key == 'displayIndentGuides') ace.setDisplayIndentGuides(settings[key]);
                if(key == 'useSoftTab') ace.getSession().setUseSoftTabs(settings[key]);
                if(key == 'highlightSelectedWord') ace.setHighlightSelectedWord(settings[key]);

                self[key] = settings[key];
            });
        });
    }

    return self;

}]);


/* **********************************************
     Begin snippets.js
********************************************** */

var snippetsModel = Parse.Object.extend("Snippets");
var snippetsQuery = new Parse.Query(snippetsModel);
snippetsQuery.limit(1000);
snippetsQuery.include("snippetGroup");

var groupsModel = Parse.Object.extend("Groups");
var groupsQuery = new Parse.Query(groupsModel);
groupsQuery.limit(1000);

app.factory("Snippets", ["$rootScope", "User", "Snippet", "Group", "Editor",
    function($rootScope, User, Snippet, Group, Editor){

    var self = {
        snippets: [],
        groups: [],
        selected: null,
        selectedName: null,
        selectedType: null,
        selectedCode: null,
        selectedGroup: null,
        counter: {
            total: 0
        },
        filters: {
            queryQ: null,
            queryG: null
        },
        loadingSnippets: false,
        loadingGroups: false
    };

    self.loadSnippets = function()
    {
        self.loadingSnippets = true;
        self.snippets = [];

        snippetsQuery.find({
            success: function(results) {

                var snippets = [];

                angular.forEach(results, function(result){

                    angular.forEach(self.groups, function(group){
                        if(group.id == result.get('snippetGroup').id){
                            self.increaseCounter(group.id);
                        }
                    });

                    var snippet = new Snippet(result);
                    snippets.push(snippet);
                });

                $rootScope.$applyAsync(function(){
                    self.snippets = snippets;
                    self.loadingSnippets = false;
                });
            },
            error: function (error) {
                console.log("Error", error);

                $rootScope.$applyAsync(function(){
                    self.loadingSnippets = false;
                });
            }
        });
    };

    self.loadGroups = function()
    {
        self.loadingGroups = true;

        groupsQuery.find({
            success: function(results) {

                var groups = [];

                angular.forEach(results, function(result){
                    var group = new Group(result);
                    groups.push(group);
                });

                $rootScope.$applyAsync(function(){
                    self.groups = groups;
                    self.loadingGroups = false;
                });

                self.loadSnippets();
            },
            error: function (error) {
                console.log("Error", error);
                $rootScope.$applyAsync(function(){
                    self.loadingGroups = false;
                });
            }
        });
    };

    self.newGroup = function()
    {
        bootbox.prompt({
            title: "Enter a group name",
            value: "Untitled group",
            callback: function(group) {
                if(group && typeof group === 'string' && group.length > 0){
                    var newGroup = new groupsModel();
                    newGroup.set('groupName', group);
                    newGroup.set('owner', User.getCurrent());
                    newGroup.setACL(new Parse.ACL(User.getCurrent()));

                    newGroup.save(null, {
                        success: function (result) {
                            var group = new Group(result);

                            $rootScope.$applyAsync(function() {
                                self.groups.push(group);
                            });
                        },
                        error: function (result, error) {
                            console.log(error);
                        }
                    });
                }
            }
        });
    };

    self.editGroup = function(group)
    {
        bootbox.prompt({
            title: "Enter a group name",
            value: group.name,
            callback: function(name) {
                if(name && typeof name === 'string' && name.length > 0){

                    $rootScope.$applyAsync(function() {
                        self.groups[self.groups.indexOf(group)].name = name;
                    });

                    group.group.set("groupName", name);
                    group.group.save(null, {
                        success: function (result) {
                            console.log("Group save successfully", result);
                        },
                        error: function (result, error) {
                            console.log(error);
                        }
                    });
                }
            }
        });
    };

    self.deleteGroup = function(group)
    {
        bootbox.confirm({
            title: "Delete group",
            message: "<div class='warning'></div><span class='weight400'>Are you sure you want to delete this group? All snippets inside this group will also be deleted!</span>",
            buttons: {
                confirm: {
                    label: "&nbsp; Yes &nbsp;",
                    className: "btn-primary"
                },
                cancel: {
                    label: "No",
                    className: "btn-default"
                }
            },
            callback: function(result) {
                if(result){
                    group.group.destroy({
                            success: function(result) {
                                var index = self.groups.indexOf(group);
                                $rootScope.$applyAsync(function() {
                                    self.groups.splice(index, 1);
                                });

                                self.decreaseCounter(group.id);
                                delete self.counter[group.id];

                                if(self.filters.queryG == group.id){
                                    self.filters.queryG = null;
                                }

                                var snippets = [];
                                var snippetsDelete = [];
                                angular.forEach(self.snippets, function (snippet) {
                                    if (snippet.group.id == group.group.id) {
                                        snippets.push(snippet.snippet);
                                        snippetsDelete.push(snippet);
                                    }
                                });

                                angular.forEach(snippetsDelete, function (snippet) {
                                    var index = self.snippets.indexOf(snippet);
                                    self.snippets.splice(index, 1);

                                    if (self.selected == snippet) {
                                        $rootScope.$applyAsync(function () {
                                            self.selected = null;
                                        });
                                    }
                                });

                                Parse.Object.destroyAll(snippets).then(function(success) {
                                    console.log("Snippets deleted");
                                }, function(error) {
                                    console.error("Oops! Something went wrong: " + error.message + " (" + error.code + ")");
                                });
                            },
                            error: function (myObject, error) {
                                console.log(error);
                            }
                        });
                }
            }
        });
    }

    self.newSnippet = function(group)
    {
        Editor.setSettings({
            mode: 'plain_text'
        });

        var newSnippet = new snippetsModel();
        newSnippet.set('snippetName', 'Untitled snippet');
        newSnippet.set('snippetType', 'plain_text');
        newSnippet.set('snippetCode', '');
        newSnippet.set('owner', User.getCurrent());

        if(group){
            angular.forEach(self.groups, function(grp){
                if(grp.id == group) {
                    newSnippet.set('snippetGroup', grp.group);
                    self.increaseCounter(grp.id);
                }
            });
        }

        newSnippet.setACL(new Parse.ACL(User.getCurrent()));

        var snippet = new Snippet(newSnippet);

        self.snippets.push(snippet);
        self.selected = snippet;
    };

    self.deleteSnippet = function(snippet)
    {
        bootbox.confirm({
            title: "Delete snippet",
            message: "<div class='warning'></div><span class='weight400'>Are you sure you want to delete this snippet?</span>",
            buttons: {
                confirm: {
                    label: "&nbsp; Yes &nbsp;",
                    className: "btn-primary"
                },
                cancel: {
                    label: "No",
                    className: "btn-default"
                }
            },
            callback: function(result) {
                if(result){
                    // if the snippet is already saved in the db
                    if(typeof snippet.snippet.id !== 'undefined') {
                        snippet.snippet.destroy({
                            success: function (result) {
                                var index = self.snippets.indexOf(snippet);
                                $rootScope.$applyAsync(function() {
                                    self.snippets.splice(index, 1);
                                });
                                self.decreaseCounter(snippet.group.id);

                                if(self.selected == snippet){
                                    $rootScope.$applyAsync(function(){
                                        self.selected = null;
                                    });
                                }
                            },
                            error: function (myObject, error) {
                                console.log(error);
                            }
                        });

                    // else if it's a newly created snippet
                    } else {
                        var index = self.snippets.indexOf(snippet);
                        self.snippets.splice(index, 1);

                        if(typeof snippet.group !== 'undefined') {
                            self.decreaseCounter(snippet.group.id);
                        }

                        if(self.selected == snippet){
                            $rootScope.$applyAsync(function(){
                                self.selected = null;
                            });
                        }
                    }
                }
            }
        });
    };

    self.increaseCounter = function(group)
    {
        if(!self.counter[group]) self.counter[group] = 0;

        self.counter[group]++;
        self.counter.total++;
    };

    self.decreaseCounter = function(group)
    {
        self.counter[group]--;
        self.counter.total--;
    };

    // events
    $rootScope.$on('groupChanged', function(ev, n, o){
       if(typeof n !== 'undefined') self.increaseCounter(n.id);
       if(typeof o !== 'undefined') self.decreaseCounter(o.id);
    });

    $rootScope.$on('resetData', function(ev){
        console.log("Reseting the data");
        self.snippets = [];
        self.groups = [];
        self.selected = null;
        self.selectedName = null;
        self.selectedType = null;
        self.selectedCode = null;
        self.selectedGroup = null;
        self.counter = {
            total: 0
        };
        self.filters = {
            queryQ: null,
            queryG: null
        };
        self.loadingSnippets = false;
        self.loadingGroups = false;
    });

    return self;

}]);

app.service("Group", ["User", function(User){

    var Group = function(group)
    {
        this.group = group;
        this.name = group.get("groupName");
        this.id = group.id;
    }

    return Group;

}]);

app.service("Snippet", ["User", "$rootScope", function(User, $rootScope){

    var Snippet = function(snippet)
    {
        this.snippet = snippet;
        this.name = snippet.get('snippetName');
        this.code = snippet.get('snippetCode');
        this.type = snippet.get('snippetType');
        if(typeof snippet.get('snippetGroup') !== 'undefined') {
            this.group = snippet.get('snippetGroup');
            this.groupName = this.group.get('groupName');
            this.oldGroup = this.group;
        }
    }

    Snippet.prototype.save = function()
    {
        if(!this.group){
            bootbox.alert({
                title: "Missing category",
                message: "<div class='info'></div><span class='weight400'>Please make sure you have assigned this snippet to a category before saving.</span>"
            });
            return;
        }

        var self = this;
        this.saving = true;

        this.snippet.set('snippetName', this.name);
        this.snippet.set('snippetCode', this.code);
        this.snippet.set('snippetType', this.type);
        this.snippet.set('snippetGroup', this.group);

        this.snippet.save(null, {
            success: function (result) {
                self.snippet = result;
                console.log('Snippet saved');

                $rootScope.$applyAsync(function(){
                    self.saving = false;
                });
            },
            error: function (gameScore, error) {
                //alert('Failed to create new object, with error code: ' + error.message);
                console.log(error);
                $rootScope.$applyAsync(function(){
                    self.saving = false;
                });
            }
        });
    }

    Snippet.prototype.groupChanged = function()
    {
        this.groupName = this.group.name;
        this.group = this.group.group;

        $rootScope.$broadcast('groupChanged', this.group, this.oldGroup);
        this.oldGroup = this.group;
    }

    return Snippet;
}]);


/* **********************************************
     Begin user.js
********************************************** */

app.factory("User", ["$rootScope", "Editor", function($rootScope, Editor){

    var self = {
        username: null,
        password: null,
        loggingIn: false,
        registering: false,
        preferences: {}
    };

    var ace = {
        showGutter: true,
        theme: 'monokai',
        fontSize: '12px',
        tabSize: 4,
        softWraps: "free",
        showIndentGuides: true,
        highlightActiveLine: false,
        showInvisibles: false,
        displayIndentGuides: true
    };

    var errors = {
        200: "The username is missing or empty.",
        201: "The password is missing or empty.",
        202: "This username has already been taken.",
        203: "This email has already been taken.",
        204: "Missing email address",
        205: "A user with the specified email was not found."
    };

    if(Parse.User.current()){
        self.preferences = Parse.User.current().get('preferences');
        Editor.setSettings(self.preferences.ace);
    }


    self.login = function(callback)
    {
        self.loggingIn = true;

        Parse.User.logIn(self.username, self.password, {
            success: function(user) {

                $rootScope.$applyAsync(function() {
                    self.loggingIn = false;
                });

                self.preferences = user.get('preferences');
                if(self.preferences){
                    Editor.setSettings(self.preferences.ace);
                } else {
                    self.preferences.ace = ace;
                    self.savePrefs();
                }



                if(typeof callback === 'function')
                {
                    callback();
                }
            },
            error: function (user, error) {

                $rootScope.$applyAsync(function() {
                    self.loggingIn = false;
                });

                console.log(error);
                //alert(error.message);

                $('#loginModal').modal('show');
            }
        });
    }

    self.logout = function(callback)
    {
        Parse.User.logOut();

        if(typeof callback === 'function')
        {
            callback();
        }

        $rootScope.$broadcast("resetData");

        self.username = null;
        self.password = null;
        self.loggingIn = false;
        self.registering = false;
        self.preferences = {};
    }

    self.register = function(callback)
    {
        // check name
        if(typeof self.name !== 'string' || (typeof self.name === 'string' && self.name.length == 0))
        {
            bootbox.alert({
                title: "Missing name",
                message: "<div class='info'></div><span class='weight400'>Please make sure you have entered your name.</span>"
            });
            return;
        }

        // check valid email
        var re = /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
        if(!re.test(self.username))
        {
            bootbox.alert({
                title: "Invalid email",
                message: "<div class='info'></div><span class='weight400'>Please make sure you have entered a valid email address.</span>"
            });
            return;
        }

        // check password
        if(typeof self.password !== 'string' || (typeof self.password === 'string' && self.password.length == 0))
        {
            bootbox.alert({
                title: "Password missing",
                message: "<div class='info'></div><span class='weight400'>Please make sure that you have entered a valid password.</span>"
            });
            return;
        }

        if(self.password != self.repassword)
        {
            bootbox.alert({
                title: "Password not match",
                message: "<div class='info'></div><span class='weight400'>Please make sure that the password and the confirm password match.</span>"
            });
            return;
        }

        var user = new Parse.User();
        user.set("name", self.name);
        user.set("username", self.username);
        user.set("password", self.password);
        user.set("email", self.username);

        user.signUp(null, {
            success: function (user) {

                self.preferences.ace = ace;
                self.savePrefs();

                if(typeof callback === 'function')
                {
                    callback();
                }
            },
            error: function (user, error) {
                //alert("Error: " + error.code + " " + error.message);
                bootbox.alert({
                    title: "Password not match",
                    message: "<div class='warning'></div><span class='weight400'>" + errors[error.code] + "</span>"
                });
            }
        });
    }

    self.recover = function(callback)
    {
        // check valid email
        var re = /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
        if(!re.test(self.username))
        {
            bootbox.alert({
                title: "Invalid email",
                message: "<div class='info'></div><span class='weight400'>Please make sure you have entered a valid email address.</span>"
            });
            return;
        }

        Parse.User.requestPasswordReset(self.username, {
            success: function () {
                if(typeof callback === 'function')
                {
                    callback();
                }

                bootbox.alert({
                    title: "Password reset",
                    message: "<div class='info'></div><span class='weight400'>Please check your email to reset your password.</span>"
                });
            },
            error: function (error) {
                bootbox.alert({
                    title: "Recover error",
                    message: "<div class='warning'></div><span class='weight400'>" + errors[error.code] + "</span>"
                });
            }
        });


    }

    self.getCurrent = function()
    {
        return Parse.User.current();
    }

    self.openPrefs = function()
    {
        self.preferencesBackup = self.preferences;
        $('#settingsModal').modal('show')
    }

    self.cancelPrefs = function()
    {
        self.preferencesBackup = self.preferences;
        delete self.preferencesBackup;
    }

    self.savePrefs = function()
    {
        var user = self.getCurrent();
        user.set('preferences', self.preferences);
        user.save(null, {
            success: function (result) {
                Editor.setSettings(self.preferences.ace);
            },
            error: function (gameScore, error) {
                // Execute any logic that should take place if the save fails.
                // error is a Parse.Error with an error code and message.
                alert('Failed to create new object, with error code: ' + error.message);

                Editor.setSettings(self.preferencesBackup.ace);
                delete self.preferencesBackup;
            }
        });
    }

    return self;

}]);


/* **********************************************
     Begin login.js
********************************************** */

app.controller("LoginCtrl", ["$scope", "User", "Bridge", "$state", function($scope, User, Bridge, $state){

    $scope.user = User;
    $scope.Bridge = Bridge;
    $scope.step = 1;


    if($scope.user.getCurrent()) $state.go("main");

    $scope.redirect = function()
    {
        console.log("Logging in");
        $state.go("main");
    }

    $scope.login = function()
    {
        $scope.step = 1;
    }

}]);


/* **********************************************
     Begin main.js
********************************************** */

app.controller("MainCtrl", ["$scope", "User", "Snippets", "Editor", "Bridge", "$state",
    function($scope, User, Snippets, Editor, Bridge, $state){


    $scope.user = User;
    if(!$scope.user.getCurrent()) $state.go("login");

    $scope.Editor = Editor;
    $scope.Snippets = Snippets;
    $scope.Bridge = Bridge;

    $scope.goToLogin = function()
    {
        $state.go("login");
    }

    $scope.Snippets.loadGroups();


    $scope.modeChanged = function()
    {
        $scope.Snippets.selected.type = $scope.Editor.mode;
    }

    $scope.showInGroup = function(id)
    {
        $scope.Snippets.filters.queryG = id;
    }

    $scope.setSelected = function(selected)
    {
        $scope.Snippets.selected = selected;
        $scope.Editor.setSettings({
            mode: selected.type
        });
    }

    $scope.toggleSearch = function()
    {
        $('.searchbox-wrapper').toggleClass('visible');

        if(typeof $scope.Snippets.filters.queryQ === 'string' && $scope.Snippets.filters.queryQ.length > 0){
            $scope.Snippets.filters.queryQ = null;
        }
    }

}]);


app.filter('search', function () {
    return function (items, query) {
        var filtered = [];

        if (typeof query === 'undefined' ||
            query == null ||
            (typeof query === 'string' && query.length == 0)
        ) return items;

        angular.forEach(items, function (item) {
            if (item.name.toLowerCase().indexOf(query.toLowerCase()) > -1) {
                filtered.push(item);
            }
        });
        return filtered;
    };
});

app.filter('group', function () {
    return function (items, query) {
        var filtered = [];

        if (typeof query === 'undefined' ||
            query == null ||
            (typeof query === 'string' && query.length == 0)
        ) return items;

        angular.forEach(items, function (item) {
            if (item.group.id == query) {
                filtered.push(item);
            }
        });
        return filtered;
    };
});


/* **********************************************
     Begin angular-split-pane.js
********************************************** */

/*!

AngularJS Split Pane directive v0.1.1

Copyright (c) 2014 Simon Hagström

Released under the MIT license
https://raw.github.com/shagstrom/split-pane/master/LICENSE

*/
angular.module('shagstrom.angular-split-pane', [])
.directive('splitPane', function() {
	return {
		restrict: 'E',
		replace: true,
		transclude: true,
		controller: function($scope) {
			$scope.components = [];
			this.addComponent = function(attributes) {
				$scope.components.push(attributes);
			};
			this.addDivider = function(attributes) {
				$scope.divider = attributes;
			};
		},
		link: function($scope, element, attrs) {
			var $firstComponent = element.children('.split-pane-component:first'),
				$divider = element.children('.split-pane-divider'),
				$lastComponent = element.children('.split-pane-component:last');
			if ($scope.components[0].width && $scope.components[0].width.match(/%$/)) {
				element.addClass('vertical-percent');
				var rightPercent = (100 - parseFloat($scope.components[0].width.match(/(\d+)%$/)[1])) + "%" ;
				$firstComponent.css({ right: rightPercent, marginRight: $scope.divider.width });
				$divider.css({ right: rightPercent, width: $scope.divider.width });
				$lastComponent.css({ width: rightPercent });
			} else if ($scope.components[0].width) {
				element.addClass('fixed-left');
				$firstComponent.css({ width: $scope.components[0].width });
				$divider.css({ left: $scope.components[0].width, width: $scope.divider.width });
				$lastComponent.css({ left: $scope.components[0].width, marginLeft: $scope.divider.width });
			} else if ($scope.components[1].width && $scope.components[1].width.match(/%$/)) {
				element.addClass('vertical-percent');
				$firstComponent.css({ right: $scope.components[1].width, marginRight: $scope.divider.width });
				$divider.css({ right: $scope.components[1].width, width: $scope.divider.width });
				$lastComponent.css({ width: $scope.components[1].width });
			} else if ($scope.components[1].width) {
				element.addClass('fixed-right');
				$firstComponent.css({ right: $scope.components[1].width, marginRight: $scope.divider.width });
				$divider.css({ right: $scope.components[1].width, width: $scope.divider.width });
				$lastComponent.css({ width: $scope.components[1].width });
			} else if ($scope.components[0].height && $scope.components[0].height.match(/%$/)) {
				element.addClass('horizontal-percent');
				var bottomPercent = (100 - parseFloat($scope.components[0].height.match(/(\d+)%$/)[1])) + "%" ;
				$firstComponent.css({ bottom: bottomPercent, marginBottom: $scope.divider.height });
				$divider.css({ bottom: bottomPercent, height: $scope.divider.height });
				$lastComponent.css({ height: bottomPercent });
			} else if ($scope.components[0].height) {
				element.addClass('fixed-top');
				$firstComponent.css({ height: $scope.components[0].height });
				$divider.css({ top: $scope.components[0].height, height: $scope.divider.height });
				$lastComponent.css({ top: $scope.components[0].height, marginLeft: $scope.divider.height });
			} if ($scope.components[1].height && $scope.components[1].height.match(/%$/)) {
				element.addClass('horizontal-percent');
				$firstComponent.css({ bottom: $scope.components[1].height, marginBottom: $scope.divider.height });
				$divider.css({ bottom: $scope.components[1].height, height: $scope.divider.height });
				$lastComponent.css({ height: $scope.components[1].height });
			} else if ($scope.components[1].height) {
				element.addClass('fixed-bottom');
				$firstComponent.css({ bottom: $scope.components[1].height, marginBottom: $scope.divider.height });
				$divider.css({ bottom: $scope.components[1].height, height: $scope.divider.height });
				$lastComponent.css({ height: $scope.components[1].height });
			}
			element.splitPane();
		},
		template: '<div class="split-pane" ng-transclude></div>'
	};
})
.directive('splitPaneComponent', function() {
	return {
		restrict: 'E',
		replace: true,
		transclude: true,
		require: '^splitPane',
		link: function($scope, element, attrs, paneCtrl) {

			if(typeof attrs.minWidth !== 'undefined' || attrs.minWidth != null) {
				element.css('min-width', attrs.minWidth);
			}

			if(typeof attrs.maxWidth !== 'undefined' || attrs.maxWidth != null) {
				element.css('max-width', attrs.maxWidth);
			}

			paneCtrl.addComponent({ width: attrs.width, height: attrs.height });
		},
		template: '<div class="split-pane-component" ng-transclude></div>'
	};
})
.directive('splitPaneDivider', function() {
	return {
		restrict: 'E',
		replace: true,
		transclude: true,
		require: '^splitPane',
		link: function($scope, element, attrs, paneCtrl) {
			paneCtrl.addDivider({ width: attrs.width, height: attrs.height });
		},
		template: '<div class="split-pane-divider" ng-transclude></div>'
	};
});


/* **********************************************
     Begin angular-ui-router.min.js
********************************************** */

/**
 * State-based routing for AngularJS
 * @version v0.2.13
 * @link http://angular-ui.github.com/
 * @license MIT License, http://www.opensource.org/licenses/MIT
 */
"undefined"!=typeof module&&"undefined"!=typeof exports&&module.exports===exports&&(module.exports="ui.router"),function(a,b,c){"use strict";function d(a,b){return M(new(M(function(){},{prototype:a})),b)}function e(a){return L(arguments,function(b){b!==a&&L(b,function(b,c){a.hasOwnProperty(c)||(a[c]=b)})}),a}function f(a,b){var c=[];for(var d in a.path){if(a.path[d]!==b.path[d])break;c.push(a.path[d])}return c}function g(a){if(Object.keys)return Object.keys(a);var c=[];return b.forEach(a,function(a,b){c.push(b)}),c}function h(a,b){if(Array.prototype.indexOf)return a.indexOf(b,Number(arguments[2])||0);var c=a.length>>>0,d=Number(arguments[2])||0;for(d=0>d?Math.ceil(d):Math.floor(d),0>d&&(d+=c);c>d;d++)if(d in a&&a[d]===b)return d;return-1}function i(a,b,c,d){var e,i=f(c,d),j={},k=[];for(var l in i)if(i[l].params&&(e=g(i[l].params),e.length))for(var m in e)h(k,e[m])>=0||(k.push(e[m]),j[e[m]]=a[e[m]]);return M({},j,b)}function j(a,b,c){if(!c){c=[];for(var d in a)c.push(d)}for(var e=0;e<c.length;e++){var f=c[e];if(a[f]!=b[f])return!1}return!0}function k(a,b){var c={};return L(a,function(a){c[a]=b[a]}),c}function l(a){var b={},c=Array.prototype.concat.apply(Array.prototype,Array.prototype.slice.call(arguments,1));for(var d in a)-1==h(c,d)&&(b[d]=a[d]);return b}function m(a,b){var c=K(a),d=c?[]:{};return L(a,function(a,e){b(a,e)&&(d[c?d.length:e]=a)}),d}function n(a,b){var c=K(a)?[]:{};return L(a,function(a,d){c[d]=b(a,d)}),c}function o(a,b){var d=1,f=2,i={},j=[],k=i,m=M(a.when(i),{$$promises:i,$$values:i});this.study=function(i){function n(a,c){if(s[c]!==f){if(r.push(c),s[c]===d)throw r.splice(0,h(r,c)),new Error("Cyclic dependency: "+r.join(" -> "));if(s[c]=d,I(a))q.push(c,[function(){return b.get(a)}],j);else{var e=b.annotate(a);L(e,function(a){a!==c&&i.hasOwnProperty(a)&&n(i[a],a)}),q.push(c,a,e)}r.pop(),s[c]=f}}function o(a){return J(a)&&a.then&&a.$$promises}if(!J(i))throw new Error("'invocables' must be an object");var p=g(i||{}),q=[],r=[],s={};return L(i,n),i=r=s=null,function(d,f,g){function h(){--u||(v||e(t,f.$$values),r.$$values=t,r.$$promises=r.$$promises||!0,delete r.$$inheritedValues,n.resolve(t))}function i(a){r.$$failure=a,n.reject(a)}function j(c,e,f){function j(a){l.reject(a),i(a)}function k(){if(!G(r.$$failure))try{l.resolve(b.invoke(e,g,t)),l.promise.then(function(a){t[c]=a,h()},j)}catch(a){j(a)}}var l=a.defer(),m=0;L(f,function(a){s.hasOwnProperty(a)&&!d.hasOwnProperty(a)&&(m++,s[a].then(function(b){t[a]=b,--m||k()},j))}),m||k(),s[c]=l.promise}if(o(d)&&g===c&&(g=f,f=d,d=null),d){if(!J(d))throw new Error("'locals' must be an object")}else d=k;if(f){if(!o(f))throw new Error("'parent' must be a promise returned by $resolve.resolve()")}else f=m;var n=a.defer(),r=n.promise,s=r.$$promises={},t=M({},d),u=1+q.length/3,v=!1;if(G(f.$$failure))return i(f.$$failure),r;f.$$inheritedValues&&e(t,l(f.$$inheritedValues,p)),M(s,f.$$promises),f.$$values?(v=e(t,l(f.$$values,p)),r.$$inheritedValues=l(f.$$values,p),h()):(f.$$inheritedValues&&(r.$$inheritedValues=l(f.$$inheritedValues,p)),f.then(h,i));for(var w=0,x=q.length;x>w;w+=3)d.hasOwnProperty(q[w])?h():j(q[w],q[w+1],q[w+2]);return r}},this.resolve=function(a,b,c,d){return this.study(a)(b,c,d)}}function p(a,b,c){this.fromConfig=function(a,b,c){return G(a.template)?this.fromString(a.template,b):G(a.templateUrl)?this.fromUrl(a.templateUrl,b):G(a.templateProvider)?this.fromProvider(a.templateProvider,b,c):null},this.fromString=function(a,b){return H(a)?a(b):a},this.fromUrl=function(c,d){return H(c)&&(c=c(d)),null==c?null:a.get(c,{cache:b,headers:{Accept:"text/html"}}).then(function(a){return a.data})},this.fromProvider=function(a,b,d){return c.invoke(a,null,d||{params:b})}}function q(a,b,e){function f(b,c,d,e){if(q.push(b),o[b])return o[b];if(!/^\w+(-+\w+)*(?:\[\])?$/.test(b))throw new Error("Invalid parameter name '"+b+"' in pattern '"+a+"'");if(p[b])throw new Error("Duplicate parameter name '"+b+"' in pattern '"+a+"'");return p[b]=new O.Param(b,c,d,e),p[b]}function g(a,b,c){var d=["",""],e=a.replace(/[\\\[\]\^$*+?.()|{}]/g,"\\$&");if(!b)return e;switch(c){case!1:d=["(",")"];break;case!0:d=["?(",")?"];break;default:d=["("+c+"|",")?"]}return e+d[0]+b+d[1]}function h(c,e){var f,g,h,i,j;return f=c[2]||c[3],j=b.params[f],h=a.substring(m,c.index),g=e?c[4]:c[4]||("*"==c[1]?".*":null),i=O.type(g||"string")||d(O.type("string"),{pattern:new RegExp(g)}),{id:f,regexp:g,segment:h,type:i,cfg:j}}b=M({params:{}},J(b)?b:{});var i,j=/([:*])([\w\[\]]+)|\{([\w\[\]]+)(?:\:((?:[^{}\\]+|\\.|\{(?:[^{}\\]+|\\.)*\})+))?\}/g,k=/([:]?)([\w\[\]-]+)|\{([\w\[\]-]+)(?:\:((?:[^{}\\]+|\\.|\{(?:[^{}\\]+|\\.)*\})+))?\}/g,l="^",m=0,n=this.segments=[],o=e?e.params:{},p=this.params=e?e.params.$$new():new O.ParamSet,q=[];this.source=a;for(var r,s,t;(i=j.exec(a))&&(r=h(i,!1),!(r.segment.indexOf("?")>=0));)s=f(r.id,r.type,r.cfg,"path"),l+=g(r.segment,s.type.pattern.source,s.squash),n.push(r.segment),m=j.lastIndex;t=a.substring(m);var u=t.indexOf("?");if(u>=0){var v=this.sourceSearch=t.substring(u);if(t=t.substring(0,u),this.sourcePath=a.substring(0,m+u),v.length>0)for(m=0;i=k.exec(v);)r=h(i,!0),s=f(r.id,r.type,r.cfg,"search"),m=j.lastIndex}else this.sourcePath=a,this.sourceSearch="";l+=g(t)+(b.strict===!1?"/?":"")+"$",n.push(t),this.regexp=new RegExp(l,b.caseInsensitive?"i":c),this.prefix=n[0],this.$$paramNames=q}function r(a){M(this,a)}function s(){function a(a){return null!=a?a.toString().replace(/\//g,"%2F"):a}function e(a){return null!=a?a.toString().replace(/%2F/g,"/"):a}function f(a){return this.pattern.test(a)}function i(){return{strict:t,caseInsensitive:p}}function j(a){return H(a)||K(a)&&H(a[a.length-1])}function k(){for(;x.length;){var a=x.shift();if(a.pattern)throw new Error("You cannot override a type's .pattern at runtime.");b.extend(v[a.name],o.invoke(a.def))}}function l(a){M(this,a||{})}O=this;var o,p=!1,t=!0,u=!1,v={},w=!0,x=[],y={string:{encode:a,decode:e,is:f,pattern:/[^/]*/},"int":{encode:a,decode:function(a){return parseInt(a,10)},is:function(a){return G(a)&&this.decode(a.toString())===a},pattern:/\d+/},bool:{encode:function(a){return a?1:0},decode:function(a){return 0!==parseInt(a,10)},is:function(a){return a===!0||a===!1},pattern:/0|1/},date:{encode:function(a){return this.is(a)?[a.getFullYear(),("0"+(a.getMonth()+1)).slice(-2),("0"+a.getDate()).slice(-2)].join("-"):c},decode:function(a){if(this.is(a))return a;var b=this.capture.exec(a);return b?new Date(b[1],b[2]-1,b[3]):c},is:function(a){return a instanceof Date&&!isNaN(a.valueOf())},equals:function(a,b){return this.is(a)&&this.is(b)&&a.toISOString()===b.toISOString()},pattern:/[0-9]{4}-(?:0[1-9]|1[0-2])-(?:0[1-9]|[1-2][0-9]|3[0-1])/,capture:/([0-9]{4})-(0[1-9]|1[0-2])-(0[1-9]|[1-2][0-9]|3[0-1])/},json:{encode:b.toJson,decode:b.fromJson,is:b.isObject,equals:b.equals,pattern:/[^/]*/},any:{encode:b.identity,decode:b.identity,is:b.identity,equals:b.equals,pattern:/.*/}};s.$$getDefaultValue=function(a){if(!j(a.value))return a.value;if(!o)throw new Error("Injectable functions cannot be called at configuration time");return o.invoke(a.value)},this.caseInsensitive=function(a){return G(a)&&(p=a),p},this.strictMode=function(a){return G(a)&&(t=a),t},this.defaultSquashPolicy=function(a){if(!G(a))return u;if(a!==!0&&a!==!1&&!I(a))throw new Error("Invalid squash policy: "+a+". Valid policies: false, true, arbitrary-string");return u=a,a},this.compile=function(a,b){return new q(a,M(i(),b))},this.isMatcher=function(a){if(!J(a))return!1;var b=!0;return L(q.prototype,function(c,d){H(c)&&(b=b&&G(a[d])&&H(a[d]))}),b},this.type=function(a,b,c){if(!G(b))return v[a];if(v.hasOwnProperty(a))throw new Error("A type named '"+a+"' has already been defined.");return v[a]=new r(M({name:a},b)),c&&(x.push({name:a,def:c}),w||k()),this},L(y,function(a,b){v[b]=new r(M({name:b},a))}),v=d(v,{}),this.$get=["$injector",function(a){return o=a,w=!1,k(),L(y,function(a,b){v[b]||(v[b]=new r(a))}),this}],this.Param=function(a,b,d,e){function f(a){var b=J(a)?g(a):[],c=-1===h(b,"value")&&-1===h(b,"type")&&-1===h(b,"squash")&&-1===h(b,"array");return c&&(a={value:a}),a.$$fn=j(a.value)?a.value:function(){return a.value},a}function i(b,c,d){if(b.type&&c)throw new Error("Param '"+a+"' has two type configurations.");return c?c:b.type?b.type instanceof r?b.type:new r(b.type):"config"===d?v.any:v.string}function k(){var b={array:"search"===e?"auto":!1},c=a.match(/\[\]$/)?{array:!0}:{};return M(b,c,d).array}function l(a,b){var c=a.squash;if(!b||c===!1)return!1;if(!G(c)||null==c)return u;if(c===!0||I(c))return c;throw new Error("Invalid squash policy: '"+c+"'. Valid policies: false, true, or arbitrary string")}function p(a,b,d,e){var f,g,i=[{from:"",to:d||b?c:""},{from:null,to:d||b?c:""}];return f=K(a.replace)?a.replace:[],I(e)&&f.push({from:e,to:c}),g=n(f,function(a){return a.from}),m(i,function(a){return-1===h(g,a.from)}).concat(f)}function q(){if(!o)throw new Error("Injectable functions cannot be called at configuration time");return o.invoke(d.$$fn)}function s(a){function b(a){return function(b){return b.from===a}}function c(a){var c=n(m(w.replace,b(a)),function(a){return a.to});return c.length?c[0]:a}return a=c(a),G(a)?w.type.decode(a):q()}function t(){return"{Param:"+a+" "+b+" squash: '"+z+"' optional: "+y+"}"}var w=this;d=f(d),b=i(d,b,e);var x=k();b=x?b.$asArray(x,"search"===e):b,"string"!==b.name||x||"path"!==e||d.value!==c||(d.value="");var y=d.value!==c,z=l(d,y),A=p(d,x,y,z);M(this,{id:a,type:b,location:e,array:x,squash:z,replace:A,isOptional:y,value:s,dynamic:c,config:d,toString:t})},l.prototype={$$new:function(){return d(this,M(new l,{$$parent:this}))},$$keys:function(){for(var a=[],b=[],c=this,d=g(l.prototype);c;)b.push(c),c=c.$$parent;return b.reverse(),L(b,function(b){L(g(b),function(b){-1===h(a,b)&&-1===h(d,b)&&a.push(b)})}),a},$$values:function(a){var b={},c=this;return L(c.$$keys(),function(d){b[d]=c[d].value(a&&a[d])}),b},$$equals:function(a,b){var c=!0,d=this;return L(d.$$keys(),function(e){var f=a&&a[e],g=b&&b[e];d[e].type.equals(f,g)||(c=!1)}),c},$$validates:function(a){var b,c,d,e=!0,f=this;return L(this.$$keys(),function(g){d=f[g],c=a[g],b=!c&&d.isOptional,e=e&&(b||!!d.type.is(c))}),e},$$parent:c},this.ParamSet=l}function t(a,d){function e(a){var b=/^\^((?:\\[^a-zA-Z0-9]|[^\\\[\]\^$*+?.()|{}]+)*)/.exec(a.source);return null!=b?b[1].replace(/\\(.)/g,"$1"):""}function f(a,b){return a.replace(/\$(\$|\d{1,2})/,function(a,c){return b["$"===c?0:Number(c)]})}function g(a,b,c){if(!c)return!1;var d=a.invoke(b,b,{$match:c});return G(d)?d:!0}function h(d,e,f,g){function h(a,b,c){return"/"===p?a:b?p.slice(0,-1)+a:c?p.slice(1)+a:a}function m(a){function b(a){var b=a(f,d);return b?(I(b)&&d.replace().url(b),!0):!1}if(!a||!a.defaultPrevented){var e=o&&d.url()===o;if(o=c,e)return!0;var g,h=j.length;for(g=0;h>g;g++)if(b(j[g]))return;k&&b(k)}}function n(){return i=i||e.$on("$locationChangeSuccess",m)}var o,p=g.baseHref(),q=d.url();return l||n(),{sync:function(){m()},listen:function(){return n()},update:function(a){return a?void(q=d.url()):void(d.url()!==q&&(d.url(q),d.replace()))},push:function(a,b,e){d.url(a.format(b||{})),o=e&&e.$$avoidResync?d.url():c,e&&e.replace&&d.replace()},href:function(c,e,f){if(!c.validates(e))return null;var g=a.html5Mode();b.isObject(g)&&(g=g.enabled);var i=c.format(e);if(f=f||{},g||null===i||(i="#"+a.hashPrefix()+i),i=h(i,g,f.absolute),!f.absolute||!i)return i;var j=!g&&i?"/":"",k=d.port();return k=80===k||443===k?"":":"+k,[d.protocol(),"://",d.host(),k,j,i].join("")}}}var i,j=[],k=null,l=!1;this.rule=function(a){if(!H(a))throw new Error("'rule' must be a function");return j.push(a),this},this.otherwise=function(a){if(I(a)){var b=a;a=function(){return b}}else if(!H(a))throw new Error("'rule' must be a function");return k=a,this},this.when=function(a,b){var c,h=I(b);if(I(a)&&(a=d.compile(a)),!h&&!H(b)&&!K(b))throw new Error("invalid 'handler' in when()");var i={matcher:function(a,b){return h&&(c=d.compile(b),b=["$match",function(a){return c.format(a)}]),M(function(c,d){return g(c,b,a.exec(d.path(),d.search()))},{prefix:I(a.prefix)?a.prefix:""})},regex:function(a,b){if(a.global||a.sticky)throw new Error("when() RegExp must not be global or sticky");return h&&(c=b,b=["$match",function(a){return f(c,a)}]),M(function(c,d){return g(c,b,a.exec(d.path()))},{prefix:e(a)})}},j={matcher:d.isMatcher(a),regex:a instanceof RegExp};for(var k in j)if(j[k])return this.rule(i[k](a,b));throw new Error("invalid 'what' in when()")},this.deferIntercept=function(a){a===c&&(a=!0),l=a},this.$get=h,h.$inject=["$location","$rootScope","$injector","$browser"]}function u(a,e){function f(a){return 0===a.indexOf(".")||0===a.indexOf("^")}function l(a,b){if(!a)return c;var d=I(a),e=d?a:a.name,g=f(e);if(g){if(!b)throw new Error("No reference point given for path '"+e+"'");b=l(b);for(var h=e.split("."),i=0,j=h.length,k=b;j>i;i++)if(""!==h[i]||0!==i){if("^"!==h[i])break;if(!k.parent)throw new Error("Path '"+e+"' not valid for state '"+b.name+"'");k=k.parent}else k=b;h=h.slice(i).join("."),e=k.name+(k.name&&h?".":"")+h}var m=y[e];return!m||!d&&(d||m!==a&&m.self!==a)?c:m}function m(a,b){z[a]||(z[a]=[]),z[a].push(b)}function o(a){for(var b=z[a]||[];b.length;)p(b.shift())}function p(b){b=d(b,{self:b,resolve:b.resolve||{},toString:function(){return this.name}});var c=b.name;if(!I(c)||c.indexOf("@")>=0)throw new Error("State must have a valid name");if(y.hasOwnProperty(c))throw new Error("State '"+c+"'' is already defined");var e=-1!==c.indexOf(".")?c.substring(0,c.lastIndexOf(".")):I(b.parent)?b.parent:J(b.parent)&&I(b.parent.name)?b.parent.name:"";if(e&&!y[e])return m(e,b.self);for(var f in B)H(B[f])&&(b[f]=B[f](b,B.$delegates[f]));return y[c]=b,!b[A]&&b.url&&a.when(b.url,["$match","$stateParams",function(a,c){x.$current.navigable==b&&j(a,c)||x.transitionTo(b,a,{inherit:!0,location:!1})}]),o(c),b}function q(a){return a.indexOf("*")>-1}function r(a){var b=a.split("."),c=x.$current.name.split(".");if("**"===b[0]&&(c=c.slice(h(c,b[1])),c.unshift("**")),"**"===b[b.length-1]&&(c.splice(h(c,b[b.length-2])+1,Number.MAX_VALUE),c.push("**")),b.length!=c.length)return!1;for(var d=0,e=b.length;e>d;d++)"*"===b[d]&&(c[d]="*");return c.join("")===b.join("")}function s(a,b){return I(a)&&!G(b)?B[a]:H(b)&&I(a)?(B[a]&&!B.$delegates[a]&&(B.$delegates[a]=B[a]),B[a]=b,this):this}function t(a,b){return J(a)?b=a:b.name=a,p(b),this}function u(a,e,f,h,m,o,p){function s(b,c,d,f){var g=a.$broadcast("$stateNotFound",b,c,d);if(g.defaultPrevented)return p.update(),B;if(!g.retry)return null;if(f.$retry)return p.update(),C;var h=x.transition=e.when(g.retry);return h.then(function(){return h!==x.transition?u:(b.options.$retry=!0,x.transitionTo(b.to,b.toParams,b.options))},function(){return B}),p.update(),h}function t(a,c,d,g,i,j){var l=d?c:k(a.params.$$keys(),c),n={$stateParams:l};i.resolve=m.resolve(a.resolve,n,i.resolve,a);var o=[i.resolve.then(function(a){i.globals=a})];return g&&o.push(g),L(a.views,function(c,d){var e=c.resolve&&c.resolve!==a.resolve?c.resolve:{};e.$template=[function(){return f.load(d,{view:c,locals:n,params:l,notify:j.notify})||""}],o.push(m.resolve(e,n,i.resolve,a).then(function(f){if(H(c.controllerProvider)||K(c.controllerProvider)){var g=b.extend({},e,n);f.$$controller=h.invoke(c.controllerProvider,null,g)}else f.$$controller=c.controller;f.$$state=a,f.$$controllerAs=c.controllerAs,i[d]=f}))}),e.all(o).then(function(){return i})}var u=e.reject(new Error("transition superseded")),z=e.reject(new Error("transition prevented")),B=e.reject(new Error("transition aborted")),C=e.reject(new Error("transition failed"));return w.locals={resolve:null,globals:{$stateParams:{}}},x={params:{},current:w.self,$current:w,transition:null},x.reload=function(){return x.transitionTo(x.current,o,{reload:!0,inherit:!1,notify:!0})},x.go=function(a,b,c){return x.transitionTo(a,b,M({inherit:!0,relative:x.$current},c))},x.transitionTo=function(b,c,f){c=c||{},f=M({location:!0,inherit:!1,relative:null,notify:!0,reload:!1,$retry:!1},f||{});var g,j=x.$current,m=x.params,n=j.path,q=l(b,f.relative);if(!G(q)){var r={to:b,toParams:c,options:f},y=s(r,j.self,m,f);if(y)return y;if(b=r.to,c=r.toParams,f=r.options,q=l(b,f.relative),!G(q)){if(!f.relative)throw new Error("No such state '"+b+"'");throw new Error("Could not resolve '"+b+"' from state '"+f.relative+"'")}}if(q[A])throw new Error("Cannot transition to abstract state '"+b+"'");if(f.inherit&&(c=i(o,c||{},x.$current,q)),!q.params.$$validates(c))return C;c=q.params.$$values(c),b=q;var B=b.path,D=0,E=B[D],F=w.locals,H=[];if(!f.reload)for(;E&&E===n[D]&&E.ownParams.$$equals(c,m);)F=H[D]=E.locals,D++,E=B[D];if(v(b,j,F,f))return b.self.reloadOnSearch!==!1&&p.update(),x.transition=null,e.when(x.current);if(c=k(b.params.$$keys(),c||{}),f.notify&&a.$broadcast("$stateChangeStart",b.self,c,j.self,m).defaultPrevented)return p.update(),z;for(var I=e.when(F),J=D;J<B.length;J++,E=B[J])F=H[J]=d(F),I=t(E,c,E===b,I,F,f);var K=x.transition=I.then(function(){var d,e,g;if(x.transition!==K)return u;for(d=n.length-1;d>=D;d--)g=n[d],g.self.onExit&&h.invoke(g.self.onExit,g.self,g.locals.globals),g.locals=null;for(d=D;d<B.length;d++)e=B[d],e.locals=H[d],e.self.onEnter&&h.invoke(e.self.onEnter,e.self,e.locals.globals);return x.transition!==K?u:(x.$current=b,x.current=b.self,x.params=c,N(x.params,o),x.transition=null,f.location&&b.navigable&&p.push(b.navigable.url,b.navigable.locals.globals.$stateParams,{$$avoidResync:!0,replace:"replace"===f.location}),f.notify&&a.$broadcast("$stateChangeSuccess",b.self,c,j.self,m),p.update(!0),x.current)},function(d){return x.transition!==K?u:(x.transition=null,g=a.$broadcast("$stateChangeError",b.self,c,j.self,m,d),g.defaultPrevented||p.update(),e.reject(d))});return K},x.is=function(a,b,d){d=M({relative:x.$current},d||{});var e=l(a,d.relative);return G(e)?x.$current!==e?!1:b?j(e.params.$$values(b),o):!0:c},x.includes=function(a,b,d){if(d=M({relative:x.$current},d||{}),I(a)&&q(a)){if(!r(a))return!1;a=x.$current.name}var e=l(a,d.relative);return G(e)?G(x.$current.includes[e.name])?b?j(e.params.$$values(b),o,g(b)):!0:!1:c},x.href=function(a,b,d){d=M({lossy:!0,inherit:!0,absolute:!1,relative:x.$current},d||{});var e=l(a,d.relative);if(!G(e))return null;d.inherit&&(b=i(o,b||{},x.$current,e));var f=e&&d.lossy?e.navigable:e;return f&&f.url!==c&&null!==f.url?p.href(f.url,k(e.params.$$keys(),b||{}),{absolute:d.absolute}):null},x.get=function(a,b){if(0===arguments.length)return n(g(y),function(a){return y[a].self});var c=l(a,b||x.$current);return c&&c.self?c.self:null},x}function v(a,b,c,d){return a!==b||(c!==b.locals||d.reload)&&a.self.reloadOnSearch!==!1?void 0:!0}var w,x,y={},z={},A="abstract",B={parent:function(a){if(G(a.parent)&&a.parent)return l(a.parent);var b=/^(.+)\.[^.]+$/.exec(a.name);return b?l(b[1]):w},data:function(a){return a.parent&&a.parent.data&&(a.data=a.self.data=M({},a.parent.data,a.data)),a.data},url:function(a){var b=a.url,c={params:a.params||{}};if(I(b))return"^"==b.charAt(0)?e.compile(b.substring(1),c):(a.parent.navigable||w).url.concat(b,c);if(!b||e.isMatcher(b))return b;throw new Error("Invalid url '"+b+"' in state '"+a+"'")},navigable:function(a){return a.url?a:a.parent?a.parent.navigable:null},ownParams:function(a){var b=a.url&&a.url.params||new O.ParamSet;return L(a.params||{},function(a,c){b[c]||(b[c]=new O.Param(c,null,a,"config"))}),b},params:function(a){return a.parent&&a.parent.params?M(a.parent.params.$$new(),a.ownParams):new O.ParamSet},views:function(a){var b={};return L(G(a.views)?a.views:{"":a},function(c,d){d.indexOf("@")<0&&(d+="@"+a.parent.name),b[d]=c}),b},path:function(a){return a.parent?a.parent.path.concat(a):[]},includes:function(a){var b=a.parent?M({},a.parent.includes):{};return b[a.name]=!0,b},$delegates:{}};w=p({name:"",url:"^",views:null,"abstract":!0}),w.navigable=null,this.decorator=s,this.state=t,this.$get=u,u.$inject=["$rootScope","$q","$view","$injector","$resolve","$stateParams","$urlRouter","$location","$urlMatcherFactory"]}function v(){function a(a,b){return{load:function(c,d){var e,f={template:null,controller:null,view:null,locals:null,notify:!0,async:!0,params:{}};return d=M(f,d),d.view&&(e=b.fromConfig(d.view,d.params,d.locals)),e&&d.notify&&a.$broadcast("$viewContentLoading",d),e}}}this.$get=a,a.$inject=["$rootScope","$templateFactory"]}function w(){var a=!1;this.useAnchorScroll=function(){a=!0},this.$get=["$anchorScroll","$timeout",function(b,c){return a?b:function(a){c(function(){a[0].scrollIntoView()},0,!1)}}]}function x(a,c,d,e){function f(){return c.has?function(a){return c.has(a)?c.get(a):null}:function(a){try{return c.get(a)}catch(b){return null}}}function g(a,b){var c=function(){return{enter:function(a,b,c){b.after(a),c()},leave:function(a,b){a.remove(),b()}}};if(j)return{enter:function(a,b,c){var d=j.enter(a,null,b,c);d&&d.then&&d.then(c)},leave:function(a,b){var c=j.leave(a,b);c&&c.then&&c.then(b)}};if(i){var d=i&&i(b,a);return{enter:function(a,b,c){d.enter(a,null,b),c()},leave:function(a,b){d.leave(a),b()}}}return c()}var h=f(),i=h("$animator"),j=h("$animate"),k={restrict:"ECA",terminal:!0,priority:400,transclude:"element",compile:function(c,f,h){return function(c,f,i){function j(){l&&(l.remove(),l=null),n&&(n.$destroy(),n=null),m&&(r.leave(m,function(){l=null}),l=m,m=null)}function k(g){var k,l=z(c,i,f,e),s=l&&a.$current&&a.$current.locals[l];if(g||s!==o){k=c.$new(),o=a.$current.locals[l];var t=h(k,function(a){r.enter(a,f,function(){n&&n.$emit("$viewContentAnimationEnded"),(b.isDefined(q)&&!q||c.$eval(q))&&d(a)}),j()});m=t,n=k,n.$emit("$viewContentLoaded"),n.$eval(p)}}var l,m,n,o,p=i.onload||"",q=i.autoscroll,r=g(i,c);c.$on("$stateChangeSuccess",function(){k(!1)}),c.$on("$viewContentLoading",function(){k(!1)}),k(!0)}}};return k}function y(a,b,c,d){return{restrict:"ECA",priority:-400,compile:function(e){var f=e.html();return function(e,g,h){var i=c.$current,j=z(e,h,g,d),k=i&&i.locals[j];if(k){g.data("$uiView",{name:j,state:k.$$state}),g.html(k.$template?k.$template:f);var l=a(g.contents());if(k.$$controller){k.$scope=e;var m=b(k.$$controller,k);k.$$controllerAs&&(e[k.$$controllerAs]=m),g.data("$ngControllerController",m),g.children().data("$ngControllerController",m)}l(e)}}}}}function z(a,b,c,d){var e=d(b.uiView||b.name||"")(a),f=c.inheritedData("$uiView");return e.indexOf("@")>=0?e:e+"@"+(f?f.state.name:"")}function A(a,b){var c,d=a.match(/^\s*({[^}]*})\s*$/);if(d&&(a=b+"("+d[1]+")"),c=a.replace(/\n/g," ").match(/^([^(]+?)\s*(\((.*)\))?$/),!c||4!==c.length)throw new Error("Invalid state ref '"+a+"'");return{state:c[1],paramExpr:c[3]||null}}function B(a){var b=a.parent().inheritedData("$uiView");return b&&b.state&&b.state.name?b.state:void 0}function C(a,c){var d=["location","inherit","reload"];return{restrict:"A",require:["?^uiSrefActive","?^uiSrefActiveEq"],link:function(e,f,g,h){var i=A(g.uiSref,a.current.name),j=null,k=B(f)||a.$current,l=null,m="A"===f.prop("tagName"),n="FORM"===f[0].nodeName,o=n?"action":"href",p=!0,q={relative:k,inherit:!0},r=e.$eval(g.uiSrefOpts)||{};b.forEach(d,function(a){a in r&&(q[a]=r[a])});var s=function(c){if(c&&(j=b.copy(c)),p){l=a.href(i.state,j,q);var d=h[1]||h[0];return d&&d.$$setStateInfo(i.state,j),null===l?(p=!1,!1):void g.$set(o,l)}};i.paramExpr&&(e.$watch(i.paramExpr,function(a){a!==j&&s(a)},!0),j=b.copy(e.$eval(i.paramExpr))),s(),n||f.bind("click",function(b){var d=b.which||b.button;if(!(d>1||b.ctrlKey||b.metaKey||b.shiftKey||f.attr("target"))){var e=c(function(){a.go(i.state,j,q)});b.preventDefault();var g=m&&!l?1:0;b.preventDefault=function(){g--<=0&&c.cancel(e)}}})}}}function D(a,b,c){return{restrict:"A",controller:["$scope","$element","$attrs",function(b,d,e){function f(){g()?d.addClass(j):d.removeClass(j)}function g(){return"undefined"!=typeof e.uiSrefActiveEq?h&&a.is(h.name,i):h&&a.includes(h.name,i)}var h,i,j;j=c(e.uiSrefActiveEq||e.uiSrefActive||"",!1)(b),this.$$setStateInfo=function(b,c){h=a.get(b,B(d)),i=c,f()},b.$on("$stateChangeSuccess",f)}]}}function E(a){var b=function(b){return a.is(b)};return b.$stateful=!0,b}function F(a){var b=function(b){return a.includes(b)};return b.$stateful=!0,b}var G=b.isDefined,H=b.isFunction,I=b.isString,J=b.isObject,K=b.isArray,L=b.forEach,M=b.extend,N=b.copy;b.module("ui.router.util",["ng"]),b.module("ui.router.router",["ui.router.util"]),b.module("ui.router.state",["ui.router.router","ui.router.util"]),b.module("ui.router",["ui.router.state"]),b.module("ui.router.compat",["ui.router"]),o.$inject=["$q","$injector"],b.module("ui.router.util").service("$resolve",o),p.$inject=["$http","$templateCache","$injector"],b.module("ui.router.util").service("$templateFactory",p);var O;q.prototype.concat=function(a,b){var c={caseInsensitive:O.caseInsensitive(),strict:O.strictMode(),squash:O.defaultSquashPolicy()};return new q(this.sourcePath+a+this.sourceSearch,M(c,b),this)},q.prototype.toString=function(){return this.source},q.prototype.exec=function(a,b){function c(a){function b(a){return a.split("").reverse().join("")}function c(a){return a.replace(/\\-/,"-")}var d=b(a).split(/-(?!\\)/),e=n(d,b);return n(e,c).reverse()}var d=this.regexp.exec(a);if(!d)return null;b=b||{};var e,f,g,h=this.parameters(),i=h.length,j=this.segments.length-1,k={};if(j!==d.length-1)throw new Error("Unbalanced capture group in route '"+this.source+"'");for(e=0;j>e;e++){g=h[e];var l=this.params[g],m=d[e+1];for(f=0;f<l.replace;f++)l.replace[f].from===m&&(m=l.replace[f].to);m&&l.array===!0&&(m=c(m)),k[g]=l.value(m)}for(;i>e;e++)g=h[e],k[g]=this.params[g].value(b[g]);return k},q.prototype.parameters=function(a){return G(a)?this.params[a]||null:this.$$paramNames},q.prototype.validates=function(a){return this.params.$$validates(a)},q.prototype.format=function(a){function b(a){return encodeURIComponent(a).replace(/-/g,function(a){return"%5C%"+a.charCodeAt(0).toString(16).toUpperCase()})}a=a||{};var c=this.segments,d=this.parameters(),e=this.params;if(!this.validates(a))return null;var f,g=!1,h=c.length-1,i=d.length,j=c[0];for(f=0;i>f;f++){var k=h>f,l=d[f],m=e[l],o=m.value(a[l]),p=m.isOptional&&m.type.equals(m.value(),o),q=p?m.squash:!1,r=m.type.encode(o);if(k){var s=c[f+1];if(q===!1)null!=r&&(j+=K(r)?n(r,b).join("-"):encodeURIComponent(r)),j+=s;else if(q===!0){var t=j.match(/\/$/)?/\/?(.*)/:/(.*)/;j+=s.match(t)[1]}else I(q)&&(j+=q+s)}else{if(null==r||p&&q!==!1)continue;K(r)||(r=[r]),r=n(r,encodeURIComponent).join("&"+l+"="),j+=(g?"&":"?")+(l+"="+r),g=!0}}return j},r.prototype.is=function(){return!0},r.prototype.encode=function(a){return a},r.prototype.decode=function(a){return a},r.prototype.equals=function(a,b){return a==b},r.prototype.$subPattern=function(){var a=this.pattern.toString();return a.substr(1,a.length-2)},r.prototype.pattern=/.*/,r.prototype.toString=function(){return"{Type:"+this.name+"}"},r.prototype.$asArray=function(a,b){function d(a,b){function d(a,b){return function(){return a[b].apply(a,arguments)}}function e(a){return K(a)?a:G(a)?[a]:[]}function f(a){switch(a.length){case 0:return c;case 1:return"auto"===b?a[0]:a;default:return a}}function g(a){return!a}function h(a,b){return function(c){c=e(c);var d=n(c,a);return b===!0?0===m(d,g).length:f(d)}}function i(a){return function(b,c){var d=e(b),f=e(c);if(d.length!==f.length)return!1;for(var g=0;g<d.length;g++)if(!a(d[g],f[g]))return!1;return!0}}this.encode=h(d(a,"encode")),this.decode=h(d(a,"decode")),this.is=h(d(a,"is"),!0),this.equals=i(d(a,"equals")),this.pattern=a.pattern,this.$arrayMode=b}if(!a)return this;if("auto"===a&&!b)throw new Error("'auto' array mode is for query parameters only");return new d(this,a)},b.module("ui.router.util").provider("$urlMatcherFactory",s),b.module("ui.router.util").run(["$urlMatcherFactory",function(){}]),t.$inject=["$locationProvider","$urlMatcherFactoryProvider"],b.module("ui.router.router").provider("$urlRouter",t),u.$inject=["$urlRouterProvider","$urlMatcherFactoryProvider"],b.module("ui.router.state").value("$stateParams",{}).provider("$state",u),v.$inject=[],b.module("ui.router.state").provider("$view",v),b.module("ui.router.state").provider("$uiViewScroll",w),x.$inject=["$state","$injector","$uiViewScroll","$interpolate"],y.$inject=["$compile","$controller","$state","$interpolate"],b.module("ui.router.state").directive("uiView",x),b.module("ui.router.state").directive("uiView",y),C.$inject=["$state","$timeout"],D.$inject=["$state","$stateParams","$interpolate"],b.module("ui.router.state").directive("uiSref",C).directive("uiSrefActive",D).directive("uiSrefActiveEq",D),E.$inject=["$state"],F.$inject=["$state"],b.module("ui.router.state").filter("isState",E).filter("includedByState",F)}(window,window.angular);

/* **********************************************
     Begin ui-ace.min.js
********************************************** */

/**
 * angular-ui-ace - This directive allows you to add ACE editor elements.
 * @version v0.2.3 - 2015-01-29
 * @link http://angular-ui.github.com
 * @license MIT
 */
"use strict";angular.module("ui.ace",[]).constant("uiAceConfig",{}).directive("uiAce",["uiAceConfig",function(a){if(angular.isUndefined(window.ace))throw new Error("ui-ace need ace to work... (o rly?)");var b=function(a,b,c){if(angular.isDefined(c.workerPath)){var d=window.ace.require("ace/config");d.set("workerPath",c.workerPath)}angular.isDefined(c.require)&&c.require.forEach(function(a){window.ace.require(a)}),angular.isDefined(c.showGutter)&&a.renderer.setShowGutter(c.showGutter),angular.isDefined(c.useWrapMode)&&b.setUseWrapMode(c.useWrapMode),angular.isDefined(c.showInvisibles)&&a.renderer.setShowInvisibles(c.showInvisibles),angular.isDefined(c.showIndentGuides)&&a.renderer.setDisplayIndentGuides(c.showIndentGuides),angular.isDefined(c.useSoftTabs)&&b.setUseSoftTabs(c.useSoftTabs),angular.isDefined(c.showPrintMargin)&&a.setShowPrintMargin(c.showPrintMargin),angular.isDefined(c.disableSearch)&&c.disableSearch&&a.commands.addCommands([{name:"unfind",bindKey:{win:"Ctrl-F",mac:"Command-F"},exec:function(){return!1},readOnly:!0}]),angular.isString(c.theme)&&a.setTheme("ace/theme/"+c.theme),angular.isString(c.mode)&&b.setMode("ace/mode/"+c.mode),angular.isDefined(c.firstLineNumber)&&(angular.isNumber(c.firstLineNumber)?b.setOption("firstLineNumber",c.firstLineNumber):angular.isFunction(c.firstLineNumber)&&b.setOption("firstLineNumber",c.firstLineNumber()));var e,f;if(angular.isDefined(c.advanced))for(e in c.advanced)f={name:e,value:c.advanced[e]},a.setOption(f.name,f.value);if(angular.isDefined(c.rendererOptions))for(e in c.rendererOptions)f={name:e,value:c.rendererOptions[e]},a.renderer.setOption(f.name,f.value);angular.forEach(c.callbacks,function(b){angular.isFunction(b)&&b(a)})};return{restrict:"EA",require:"?ngModel",link:function(c,d,e,f){var g,h,i=a.ace||{},j=angular.extend({},i,c.$eval(e.uiAce)),k=window.ace.edit(d[0]),l=k.getSession(),m=function(){var a=arguments[0],b=Array.prototype.slice.call(arguments,1);angular.isDefined(a)&&c.$evalAsync(function(){if(!angular.isFunction(a))throw new Error("ui-ace use a function as callback.");a(b)})},n={onChange:function(a){return function(b){var d=l.getValue();!f||d===f.$viewValue||c.$$phase||c.$root.$$phase||c.$evalAsync(function(){f.$setViewValue(d)}),m(a,b,k)}},onBlur:function(a){return function(){m(a,k)}}};e.$observe("readonly",function(a){k.setReadOnly(!!a||""===a)}),f&&(f.$formatters.push(function(a){if(angular.isUndefined(a)||null===a)return"";if(angular.isObject(a)||angular.isArray(a))throw new Error("ui-ace cannot use an object or an array as a model");return a}),f.$render=function(){l.setValue(f.$viewValue)});var o=function(a,d){a!==d&&(j=angular.extend({},i,c.$eval(e.uiAce)),j.callbacks=[j.onLoad],j.onLoad!==i.onLoad&&j.callbacks.unshift(i.onLoad),l.removeListener("change",g),g=n.onChange(j.onChange),l.on("change",g),k.removeListener("blur",h),h=n.onBlur(j.onBlur),k.on("blur",h),b(k,l,j))};c.$watch(e.uiAce,o,!0),o(i),d.on("$destroy",function(){k.session.$stopWorker(),k.destroy()}),c.$watch(function(){return[d[0].offsetWidth,d[0].offsetHeight]},function(){k.resize(),k.renderer.updateFull()},!0)}}}]);