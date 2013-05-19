define(function(require) {
  var $ = require('jquery-bootstrap');
  var Validation = require('validation');
  var Chibadge = require('chibadge');
  var jscolor = require('jscolor');

  var mainHtml = require('text!template/main.html');
  var modalsHtml = require('text!template/modals.html');
  var footerHtml = require('text!template/footer.html');

  var subtlepatternsTxt = require('text!vendor/subtlepatterns.txt');
  var nounprojectTxt = require('text!vendor/nounproject-for-kids.txt');

  var DEFAULT_BASE_ASSET_URL = "http://labs.toolness.com/temp/";
  var DEFAULT_SUBTLEPATTERN_URL = DEFAULT_BASE_ASSET_URL + 'subtlepatterns/';
  var DEFAULT_NOUN_URL = DEFAULT_BASE_ASSET_URL + 'nounproject/';
  var DEFAULT_CROSS_ORIGIN_IMAGE_URLS = [DEFAULT_BASE_ASSET_URL];

  // Based on http://stackoverflow.com/a/647272.
  function queryObj() {
    var result = {}, keyValuePairs = location.search.slice(1).split('&');

    keyValuePairs.forEach(function(kvp) {
      kvp = kvp.split('=');
      result[decodeURIComponent(kvp[0])] = decodeURIComponent(kvp[1] || '');
    });

    return result;
  }

  function startStateManager(options) {
    var onChange = options.onChange || function() {};
    var latestState = $.extend(Validation.getState(), queryObj());
    var setState = function(newState, noPushState) {
      if (Validation.areStatesSame(newState, latestState)) return;
      latestState = newState;
      Validation.setState(newState);
      if (window.history.pushState && !noPushState)
        window.history.pushState(newState, "", "?" + $.param(newState));
      onChange(newState);
    };

    $(document.body).on("change", "input, select", function() {
      var radioDetails = $(this).closest(".radio-details");
      if (radioDetails.length) {
        // If the user interacts with any widgets in a radio button's details,
        // select the radio button too.
        var radio = radioDetails.prev("label").find('input[type="radio"]');
        if (radio.length) radio[0].checked = true;
      }
      setState(Validation.getState());
    });

    $(window).on("popstate", function(event) {
      setState(event.originalEvent.state, true);
    });

    Validation.setState(latestState);
    if (window.history.replaceState)
      window.history.replaceState(latestState, "", null);
    onChange(latestState);
  }

  function start(options) {
    var renderIdCounter = 0;
    var badgeHolder = $("#badge-holder");
    var bgColor = $("#bg-color");
    var bgSubtlepattern = $("#bg-subtlepattern");
    var bgUrl = $("#bg-url");
    var glyphNoun = $("#glyph-noun");
    var glyphUrl = $("#glyph-url");
    var glyphScale = $("#glyph-scale");
    var glyphMask = $("#glyph-mask");
    var glyphMaskColor = $("#glyph-mask-color");
    var gloss = $("#gloss");
    var exportModal = $("#export-modal");
    var badgeLink = $("#badge-link");
    var badgeForm = $(".badge-maker form");
    var subtlepatternUrl = options.subtlepatternUrl ||
                           DEFAULT_SUBTLEPATTERN_URL;
    var nounUrl = options.nounUrl || DEFAULT_NOUN_URL;
    var crossOriginImageUrls = DEFAULT_CROSS_ORIGIN_IMAGE_URLS.concat(
      options.crossOriginImageUrls || []
    );
    var badgeSize = badgeHolder.width() - 20;
    var origBadgeHolderTop = badgeHolder.offset().top;
    var img = function(src) {
      var img = document.createElement("img");
      crossOriginImageUrls.forEach(function(url) {
        if (src.indexOf(url) == 0) img.crossOrigin = "anonymous";
      });
      img.setAttribute("src", src);
      return img;
    };
    var renderBadge = function(cb) {
      var renderId = ++renderIdCounter;
      var backgroundRadioHandlers = {
        'color': function() { return '#' + bgColor.val(); },
        'subtlepattern': function() {
          return img(subtlepatternUrl + bgSubtlepattern.val());
        },
        'url': function() {
          if (Validation.isSafeUrl(bgUrl.val())) return img(bgUrl.val());
        }
      };
      var glyphRadioHandlers = {
        'none': function() {},
        'noun': function() { return img(nounUrl + glyphNoun.val()) },
        'url': function() {
          if (Validation.isSafeUrl(glyphUrl.val())) return img(glyphUrl.val());
        }
      };
      var background = backgroundRadioHandlers[Validation.radioValue("bg")]();
      var glyph = glyphRadioHandlers[Validation.radioValue("glyph")]();

      if (glyphMask[0].checked && glyph) {
        glyph = Chibadge.coloredMask(glyph, '#' + glyphMaskColor.val());
      }

      badgeHolder.addClass("loading");
      Chibadge.build({
        size: badgeSize,
        background: background,
        glyph: glyph,
        glyphScale: parseFloat(glyphScale.val()),
        gloss: gloss[0].checked
      }, function(err, canvas) {
        if (cb) cb(err, canvas);
        if (renderId != renderIdCounter) return;
        badgeHolder.removeClass("loading");
        badgeHolder.empty();
        if (!err) badgeHolder.append(canvas);
      });
    };

    badgeLink.closest(".modal").on("shown", function() {
      badgeLink.select().focus();
    });

    startStateManager({
      onChange: function(state) {
        renderBadge();
        badgeLink.val($("<a></a>").attr("href", "?"+$.param(state))[0].href);
      }
    });

    // We don't want browsers to automatically click the first
    // button they find when the user presses enter in our form, so we'll
    // put an invisible submit button here to capture and eat them.
    badgeForm
      .prepend($('<input type="submit">').css({position: 'absolute',
                                               left: '-9999px'}))
      .submit(function() { return false; });

    exportModal.on('show', function() {
      $(".result", this).hide();
      try {
        var url = $("canvas", badgeHolder)[0].toDataURL();
      } catch (e) {
        $(".failure.result").show();
        return;
      }
      $("img.export", this).attr("src", url);
      $(".success.result").show();
    });

    return {
      crossOriginImageUrls: crossOriginImageUrls,
      renderBadge: renderBadge,
      el: document.body
    };
  }

  return {
    _instance: null,
    start: function(options) {
      function detectMinifiedRootDir() {
        var RE = /^(.*)\/studio\.min\.js$/;
        var me = document.querySelector('script[src$="studio.min.js"]');
        if (me) {
          var parts = me.src.match(RE);
          if (parts) return parts[1] + '/../';
        }
        return "";
      }

      function addFilenamesAsOptions(textFile, selectElement) {
        textFile.split('\n').forEach(function(filename) {
          if (!filename) return;
          $('<option></option>')
            .text(filename.split('.')[0].replace(/[_-]/g, ' '))
            .attr("value", filename)
            .appendTo(selectElement);
        });
      }

      if (!this._instance) {
        if ($(".main .container").length) {
          $(mainHtml).find(".header").nextAll().appendTo(".main .container");
        } else
          $(mainHtml).appendTo(document.body);

        $(modalsHtml).appendTo(document.body);

        if (!$("footer").length)
          $(footerHtml).appendTo(document.body);

        addFilenamesAsOptions(subtlepatternsTxt, "#bg-subtlepattern");
        addFilenamesAsOptions(nounprojectTxt, "#glyph-noun");

        // For optimized builds, some libraries won't be able to auto-detect
        // where their assets are deployed, so we need to manually configure
        // them.
        if (!Chibadge.baseUrl)
          Chibadge.baseUrl = detectMinifiedRootDir() + 'chibadge/';
        if (!jscolor.detectDir())
          jscolor.dir = detectMinifiedRootDir() + 'vendor/jscolor/';

        jscolor.init();
        this._instance = start(options || {});
      } else
        throw new Error("Studio objects are currently singletons");

      return this._instance;
    }
  };
});
