var Chibadge = (function() {
  var Chibadge = {
    // ## Chibadge.baseUrl
    //
    // This is the base URL that points to the chibadge directory, which
    // contains various assets common to all badges. It defaults to being
    // automatically detected, but you can set it manually if needed.

    baseUrl: (function() {
      var RE = /^(.*)\/chibadge\.js$/;
      var me = document.querySelector('script[src$="chibadge.js"]');
      if (me) {
        var parts = me.src.match(RE);
        if (parts) return parts[1] + '/';
      }
      return "";
    })(),

    // ## Chibadge.build(options, [callback])
    //
    // Builds a Chicago badge in a <canvas> element.
    // 
    // Options:
    //
    //   size:
    //     The length of each side of the canvas, in pixels (default is 1077).
    //
    //   background:
    //     The background color or image pattern to repeat. Should be a CSS 
    //     color string or a canvas image source (default is 'gray').
    //
    //   glyph:
    //     The optional image to put in the center of the badge. Should be a
    //     canvas image source.
    //
    //   glyphScale:
    //     Percentage to scale the glyph, from 0.0 to 1.0 (default is 1.0).
    //
    //   gloss:
    //     Whether to apply a gloss effect (default is true).
    //
    // This function returns the canvas element, but it may not have anything
    // in it until canvas image sources are loaded. Provide a callback
    // function taking (err, canvas) arguments if you need to know
    // when the canvas is rendered, or if an error occurred.

    build: function(options, cb) {
      var FULL_WIDTH = options.size || 1077;
      var FULL_HEIGHT = FULL_WIDTH;
      var SCALE_FACTOR = FULL_WIDTH / 1077;
      var RIBBON_PADDING = 21 * SCALE_FACTOR;
      var RIBBON_Y = 600 * SCALE_FACTOR;

      var canvas = document.createElement('canvas');
      var hexMask = imageAsset('hex-mask.png');
      var ribbon = imageAsset('ribbon.png');

      cb = cb || function defaultCallback(err) {
        if (err && window.console) window.console.error(err);
      };
      options.background = options.background || 'gray';
      if (typeof(options.background) == 'string')
        options.background = solidCanvas(16, 16, options.background);
      options.glyphScale = options.glyphScale || 1;
      if (typeof(options.gloss) == 'undefined') options.gloss = true;

      canvas.width = FULL_WIDTH;
      canvas.height = FULL_HEIGHT;

      loadCanvasImageSources([
        hexMask,
        ribbon,
        options.background,
        options.glyph
      ], function(err) {
        if (err) return cb(err);

        var ctx = canvas.getContext('2d');

        ctx.drawImage(hexMask, RIBBON_PADDING, RIBBON_PADDING,
                      hexMask.naturalWidth * SCALE_FACTOR,
                      hexMask.naturalHeight * SCALE_FACTOR);
        ctx.globalCompositeOperation = "source-in";

        var bgPattern = ctx.createPattern(options.background, 'repeat');
        ctx.fillStyle = bgPattern;
        ctx.fillRect(0, 0, FULL_WIDTH, FULL_HEIGHT);

        ctx.globalCompositeOperation = "source-atop";

        if (options.glyph) {
          var glyphSize = {
            width: options.glyph.naturalWidth * options.glyphScale,
            height: options.glyph.naturalHeight * options.glyphScale
          };
          ctx.drawImage(options.glyph,
                        FULL_WIDTH/2 - glyphSize.width/2,
                        FULL_HEIGHT/2 - glyphSize.height/2,
                        glyphSize.width,
                        glyphSize.height);
        }

        if (options.gloss) {
          // Reverse-engineered from the CSS3 in
          // http://webdesignerwall.com/tutorials/css3-image-styles-part-2  
          var gloss = ctx.createLinearGradient(0, 0, 0, FULL_HEIGHT/2);

          gloss.addColorStop(0, 'rgba(255, 255, 255, 0.6)');
          gloss.addColorStop(1, 'rgba(255, 255, 255, 0.15)');
          ctx.fillStyle = gloss;
          ctx.fillRect(0, 0, FULL_WIDTH, FULL_HEIGHT/2);
        }

        ctx.globalCompositeOperation = "source-over";
        ctx.drawImage(ribbon, 0, RIBBON_Y,
                      ribbon.naturalWidth * SCALE_FACTOR,
                      ribbon.naturalHeight * SCALE_FACTOR);

        cb(null, canvas);
      });

      return canvas;
    }
  };

  var solidCanvas = function solidCanvas(width, height, color) {
    var canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;

    var ctx = canvas.getContext('2d');
    ctx.fillStyle = color;
    ctx.fillRect(0, 0, width, height);

    return canvas;
  };

  var imageAsset = function imageAsset(filename) {
    var img = document.createElement("img");
    img.src = Chibadge.baseUrl + filename;
    return img;
  };

  var loadCanvasImageSources = function loadCanvasImageSources(sources, cb) {
    var sourcesDone = 0;
    var errors = [];
    var sourceDone = function sourceDone(err, source) {
      if (err) errors.push({error: err, source: source});
      if (++sourcesDone == sources.length) {
        if (errors.length) return cb({
          message: "errors loading image sources",
          errors: errors
        }, sources);
        return cb(null, sources);
      }
    };

    sources.forEach(function(source) {
      if (!source) {
        return sourceDone(null, source);
      } else if (!(source instanceof Element)) {
        return sourceDone("invalid canvas image source", source);
      }

      if (source.nodeName == "IMG") {
        loadImage(source, sourceDone);
      } else if (source.nodeName == "CANVAS") {
        sourceDone(null, source);
      } else
        return sourceDone("unsupported canvas image source: ", source);
    });
  };

  var loadImage = function loadImage(img, cb) {
    var onDone = function(event) {
      img.removeEventListener("load", onDone, false);
      img.removeEventListener("error", onDone, false);
      clearInterval(interval);
      if (event.type == "error") return cb(event, img);
      cb(null, img);
    };
    if (isImageOk(img)) return cb(null, img);
    img.addEventListener("load", onDone, false);
    img.addEventListener("error", onDone, false);
    var interval = setInterval(function() {
      // IE9 is odd and sometimes doesn't fire load events, so we'll manually
      // poll.
      if (isImageOk(img)) onDone({type: "load"});
    }, 100);
  };

  // http://stackoverflow.com/a/1977898
  var isImageOk = function IsImageOk(img) {
    // During the onload event, IE correctly identifies any images that
    // weren’t downloaded as not complete. Others should too. Gecko-based
    // browsers act like NS4 in that they report this incorrectly.
    if (!img.complete)
      return false;

    // However, they do have two very useful properties: naturalWidth and
    // naturalHeight. These give the true size of the image. If it failed
    // to load, either of these should be zero.
    if (typeof img.naturalWidth != "undefined" && img.naturalWidth == 0)
      return false;

    // No other way of checking: assume it’s ok.
    return true;
  };

  return Chibadge;
})();
