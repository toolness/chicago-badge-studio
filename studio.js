var BASE_ASSET_URL = "http://labs.toolness.com/temp/";
var BASE_SUBTLEPATTERN_URL = BASE_ASSET_URL + 'subtlepatterns/';
var BASE_NOUN_URL = BASE_ASSET_URL + 'nounproject/';

// List of URL prefixes that we know support CORS. This array can be
// modified by bookmarklets, etc.
var crossOriginImageUrls = [BASE_ASSET_URL];

var deferredRequests = (function() {
  function addFilenamesAsOptions(url, selectElement) {
    return $.get(url, function(textFile) {
      textFile.split('\n').forEach(function(filename) {
        if (!filename) return;
        $('<option></option>')
          .text(filename.split('.')[0].replace(/[_-]/g, ' '))
          .attr("value", filename)
          .appendTo(selectElement);
      });
    });
  }

  return $.when(
    addFilenamesAsOptions("vendor/subtlepatterns.txt", "#bg-subtlepattern"),
    addFilenamesAsOptions("vendor/nounproject.txt", "#glyph-noun")
  );
})();

// Based on http://stackoverflow.com/a/647272.
function queryObj() {
  var result = {}, keyValuePairs = location.search.slice(1).split('&');

  keyValuePairs.forEach(function(kvp) {
    kvp = kvp.split('=');
    result[decodeURIComponent(kvp[0])] = decodeURIComponent(kvp[1] || '');
  });

  return result;
}

function img(src) {
  var img = document.createElement("img");
  crossOriginImageUrls.forEach(function(url) {
    if (src.indexOf(url) == 0) img.crossOrigin = "anonymous";
  });
  img.setAttribute("src", src);
  return img;
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

// We used to only wait for the DOM to be ready, but JSColor widgets don't
// seem to be active until the page is fully loaded.
$(window).load(function() {
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
  var badgeLink = $("#badge-link");
  var badgeSize = badgeHolder.width() - 20;
  var origBadgeHolderTop = badgeHolder.offset().top;
  var renderBadge = function(cb) {
    var renderId = ++renderIdCounter;
    var backgroundRadioHandlers = {
      'color': function() { return '#' + bgColor.val(); },
      'subtlepattern': function() {
        return img(BASE_SUBTLEPATTERN_URL + bgSubtlepattern.val());
      },
      'url': function() {
        if (Validation.isSafeUrl(bgUrl.val())) return img(bgUrl.val());
      }
    };
    var glyphRadioHandlers = {
      'none': function() {},
      'noun': function() { return img(BASE_NOUN_URL + glyphNoun.val()) },
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

  deferredRequests.done(function() {
    // We used to use bootstrap's $.affix() for this, but it appears to be
    // buggy.
    $(window).on("scroll", function() {
      var shouldAffix = $(window).scrollTop() > origBadgeHolderTop
      badgeHolder.toggleClass("affix", shouldAffix);
    });

    badgeLink.closest(".modal").on("shown", function() {
      badgeLink.select().focus();
    });

    startStateManager({
      onChange: function(state) {
        renderBadge();
        badgeLink.val($("<a></a>").attr("href", "?"+$.param(state))[0].href);
      }
    });

    // Export this for bookmarklets, etc.
    window.renderBadge = renderBadge;
  });
});
