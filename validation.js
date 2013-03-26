// This simple validation library makes it easy to validate untrusted input
// going into a client-side JavaScript application, e.g. via a querystring.
// This helps ensure that XSS vulnerabilities are minimized. Note that this
// has nothing to do with HTML5 Form Validation.
//
// Each form element that can be set by an untrusted source is whitelisted
// via a data-validator attribute. The value of this attribute specifies
// the name of a validator class, which is responsible for validating
// untrusted input to set the state of a form element, as well as
// getting the current state of the form element as a string.
var Validation = (function() {
  var Validation = {
    // ## Validation.getState([form])
    //
    // Puts the serialized state of all form elements with data-validator
    // attributes into an object mapping form element ids to their states
    // and returns it. This object can then be used by the client to e.g.
    // construct a querystring.
    // 
    // If form is not provided, document.body is used.
    getState: function Validation_getState(form) {
      var values = {};
      eachValidator(form, function(validator) {
        values[validator.el.name || validator.el.id] = validator.get();
      });
      return values;
    },
    // ## Validation.setState([form], values)
    //
    // Sets the state of form elements, given an object mapping form element
    // ids to their states.
    //
    // If form is not provided, document.body is used.
    setState: function Validation_setState(form, values) {
      if (!values) {
        values = form;
        form = null;
      }
      eachValidator(form, function(validator) {
        var id = validator.el.name || validator.el.id;
        if (id in values) validator.set(values[id]);
      });
    },
    // ## Validation.areStatesSame(a, b)
    //
    // Compare two state objects and return true if they represent the
    // same state, false otherwise. Assumes that the state objects 
    // have the same number of keys.
    areStatesSame: function Validation_areStatesSame(a, b) {
      for (var name in a)
        if (a[name] !== b[name]) return false;
      return true;
    },
    // ## Validation.isSafeUrl(str)
    //
    // Returns whether the given string is a "safe" URL, i.e. uses the
    // http or https protocol.
    isSafeUrl: function Validation_isSafeUrl(str) {
      return /^https?:\/\//.test(str);
    },
    // ## Validation.radioValue([form], name)
    //
    // Returns the current value of the given radio button group in the
    // given form.
    //
    // If form is not provided, document is used.
    radioValue: function Validation_radioValue(form, name) {
      if (!name) {
        name = form;
        form = document;
      }
      return form.querySelector('[name="' + name + '"]:checked').value;
    },
    // ## Validation.types
    //
    // This object contains all our validator classes, indexed by name.
    types: {}
  };

  var eachValidator = function(form, fn, thisObj) {
    each(form || document.body, "[data-validator]", function(el) {
      var type = el.getAttribute('data-validator');
      var validator = Validation.types[type];
      if (!validator) throw new Error("unknown validator: " + type);
      fn.call(thisObj, new validator(el));
    });
  };

  var each = function(element, selector, fn, thisObj) {
    var elements = element.querySelectorAll(selector);
    [].slice.call(elements).forEach(fn, thisObj);
  };

  var validator = function(methods) {
    function Validator(element) { this.el = element; };
    Validator.prototype = methods;
    return Validator;
  };

  // ## boolean validator class
  //
  // This validator class should be used for checkboxes.
  Validation.types.boolean = validator({
    get: function() { return this.el.checked.toString(); },
    set: function(value) {
      if (value == 'true') this.el.checked = true;
      if (value == 'false') this.el.checked = false;
    }
  });

  // ## url validator class
  //
  // This validator class should be used for text input fields that expect
  // URL values.
  Validation.types.url = validator({
    get: function() { return this.el.value; },
    set: function(value) {
      if (Validation.isSafeUrl(value)) this.el.value = value;
    }
  });

  // ## float validator class
  //
  // This validator class should be used for text input fields that expect
  // float values.
  Validation.types.float = validator({
    get: function() { return this.el.value; },
    set: function(value) {
      if (!isNaN(parseFloat(value))) this.el.value = value;
    }
  });

  // ## color validator class
  //
  // This validator class should be used for JSColor input fields.
  Validation.types.color = validator({
    get: function() { return this.el.value; },
    set: function(value) {
      if (/^[A-F0-9]+$/.test(value)) this.el.color.fromString(value);
    }
  });

  // ## select validator class
  //
  // This validator class should be used for <select> elements.
  Validation.types.select = validator({
    get: function() { return this.el.value; },
    set: function(value) {
      each(this.el, "option", function(option) {
        if (option.value == value) option.selected = true;
      });
    }
  });

  // ## radio validator class
  //
  // This validator should be applied to only one of the radio buttons
  // per group.
  Validation.types.radio = validator({
    get: function() {
      return Validation.radioValue(this.el.form, this.el.name);
    },
    set: function(value) {
      each(this.el.form, 'input[type="radio"]', function(radio) {
        if (radio.name == this.el.name && radio.value == value)
          radio.checked = true;
      }, this);
    }
  });

  return Validation;
})();
