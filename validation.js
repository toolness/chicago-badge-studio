var Validation = (function() {
  var Validation = {
    getState: function Validation_getState(form) {
      var values = {};
      eachValidator(form, function(validator) {
        values[validator.el.id] = validator.get();
      });
      return values;
    },
    setState: function Validation_setState(form, values) {
      if (!values) {
        values = form;
        form = null;
      }
      eachValidator(form, function(validator) {
        if (validator.el.id in values)
          validator.set(values[validator.el.id]);
      });
    },
    isSafeUrl: function Validation_isSafeUrl(str) {
      return /^https?:\/\//.test(str);
    },
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
    function Validator(element) {
      this.el = element;
    };
    Validator.prototype = methods;
    return Validator;
  };

  Validation.types.boolean = validator({
    get: function() { return this.el.checked.toString(); },
    set: function(value) {
      if (value == 'true') this.el.checked = true;
      if (value == 'false') this.el.checked = false;
    }
  });

  Validation.types.url = validator({
    get: function() { return this.el.value; },
    set: function(value) {
      if (Validation.isSafeUrl(value)) this.el.value = value;
    }
  });

  Validation.types.float = validator({
    get: function() { return this.el.value; },
    set: function(value) {
      if (!isNaN(parseFloat(value))) this.el.value = value;
    }
  });

  Validation.types.color = validator({
    get: function() { return this.el.value; },
    set: function(value) {
      if (/^[A-F0-9]+$/.test(value)) this.el.color.fromString(value);
    }
  });

  Validation.types.select = validator({
    get: function() { return this.el.value; },
    set: function(value) {
      each(this.el, "option", function(option) {
        if (option.value == value) option.selected = true;
      });
    }
  });

  return Validation;
})();
