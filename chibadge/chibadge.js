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
    //     The length of each side of the canvas, in pixels.
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
    // Note that a canvas image source is either an <img> element, a
    // <canvas> element, or an opaque object type specific to this library
    // that is returned by some of its functions, such as
    // Chibadge.coloredMask().
    //
    // This function returns the canvas element, but it may not have anything
    // in it until canvas image sources are loaded. Provide a callback
    // function taking (err, canvas) arguments if you need to know
    // when the canvas is rendered, or if an error occurred.

    build: function(options, cb) {
      var canvas = document.createElement('canvas');
      var template = document.getElementById('chibadge-template') ||
                     defaultTemplate();
      var hexMask = template.querySelector('.chibadge-mask');
      var ribbon = template.querySelector('.chibadge-ribbon');

      hexMask = createCanvasSource(hexMask);
      ribbon = createCanvasSource(ribbon);
      cb = cb || function defaultCallback(err) {
        if (err && window.console) window.console.error(err);
      };
      options.background = options.background || 'gray';
      if (typeof(options.background) == 'string')
        options.background = solidCanvas(16, 16, options.background);
      options.background = createCanvasSource(options.background);
      if (options.glyph) options.glyph = createCanvasSource(options.glyph);
      options.glyphScale = options.glyphScale || 1;
      if (typeof(options.gloss) == 'undefined') options.gloss = true;

      loadCanvasSources([
        hexMask,
        ribbon,
        options.background,
        options.glyph
      ], function(err) {
        if (err) return cb(err);

        template.style.display = "block";

        var NATIVE_BADGE_SIZE = hexMask.height();
        var FULL_WIDTH = options.size || NATIVE_BADGE_SIZE;
        var FULL_HEIGHT = FULL_WIDTH;
        var SCALE_FACTOR = FULL_WIDTH / NATIVE_BADGE_SIZE;

        template.style.display = "none";
        canvas.width = FULL_WIDTH;
        canvas.height = FULL_HEIGHT;

        var ctx = canvas.getContext('2d');

        ctx.drawImage(hexMask.source, 0, 0,
                      hexMask.width() * SCALE_FACTOR,
                      hexMask.height() * SCALE_FACTOR);
        ctx.globalCompositeOperation = "source-in";

        var bgPattern = ctx.createPattern(options.background.source, 'repeat');
        ctx.fillStyle = bgPattern;
        ctx.fillRect(0, 0, FULL_WIDTH, FULL_HEIGHT);

        ctx.globalCompositeOperation = "source-atop";

        if (options.glyph) {
          var glyphSize = {
            width: options.glyph.width() * options.glyphScale,
            height: options.glyph.height() * options.glyphScale
          };
          ctx.drawImage(options.glyph.source,
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
        ctx.drawImage(ribbon.source, 0, 0,
                      ribbon.width() * SCALE_FACTOR,
                      ribbon.height() * SCALE_FACTOR);

        cb(null, canvas);
      }, this);

      return canvas;
    },

    // ## Chibadge.coloredMask(canvasSource, maskColor)
    //
    // This canvas image source returns a canvas image source (usually an
    // <img> element) masked with the given canvas fill style (e.g., 'pink').
    // It can be passed to any function calls that accept a canvas image
    // source.

    coloredMask: function coloredMask(originalCanvasSource, maskColor) {
      originalCanvasSource = createCanvasSource(originalCanvasSource);

      var canvas = document.createElement('canvas');
      var maskedCanvasSource = new CanvasCanvasSource(canvas);

      maskedCanvasSource.load = function(cb) {
        originalCanvasSource.load(function(err) {
          if (err) return cb(err);

          canvas.width = originalCanvasSource.width();
          canvas.height = originalCanvasSource.height();

          var ctx = canvas.getContext('2d');

          ctx.drawImage(originalCanvasSource.source, 0, 0);
          ctx.fillStyle = maskColor;
          ctx.globalCompositeOperation = 'source-in';
          ctx.fillRect(0, 0, canvas.width, canvas.height);

          cb(null, maskedCanvasSource);
        });
      };

      return maskedCanvasSource;
    }
  };

  var defaultTemplate = function defaultTemplate() {
    var div = document.createElement('div');
    var base = Chibadge.baseUrl;

    div.style.display = "none";
    div.innerHTML = [
      '<img class="chibadge-ribbon" src="' + base + 'ribbon.png">',
      '<img class="chibadge-mask" src="' + base + 'hex-mask.png">'
    ].join('');

    return div;
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
    return new ImageCanvasSource(img);
  };

  var loadCanvasSources = function loadCanvasSources(sources, cb, thisObj) {
    sources = sources.filter(function isSourceTruthy(s) { return !!s; });

    var sourcesDone = 0;
    var errors = [];
    var sourceDone = function sourceDone(err, source) {
      if (err) errors.push(err);
      if (++sourcesDone == sources.length) {
        if (errors.length) return cb.call(thisObj, {
          message: "errors loading image sources",
          errors: errors
        }, sources);
        return cb.call(thisObj, null, sources);
      }
    };

    sources.forEach(function(s) { s.load(sourceDone); });
  };

  var ImageCanvasSource = function ImageCanvasSource(img) {
    this.source = img;
  };

  ImageCanvasSource.prototype = {
    height: function() { return this.source.naturalHeight; },
    width: function() { return this.source.naturalWidth; },
    load: function(cb) {
      var img = this.source;
      var self = this;
      var interval;

      // http://stackoverflow.com/a/1977898      
      var isImageOk = function IsImageOk() {
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

      var onDone = function(event) {
        img.removeEventListener("load", onDone, false);
        img.removeEventListener("error", onDone, false);
        clearInterval(interval);
        if (event.type == "error") return cb({
          error: event,
          source: self.source
        });
        cb(null, self);
      };

      if (isImageOk()) return cb(null, self);
      img.addEventListener("load", onDone, false);
      img.addEventListener("error", onDone, false);
      interval = setInterval(function() {
        // IE9 is odd and sometimes doesn't fire load events, so we'll
        // manually poll.
        if (isImageOk()) onDone({type: "load"});
      }, 100);
    }
  };

  var CanvasCanvasSource = function CanvasCanvasSource(canvas) {
    this.source = canvas;
  };

  CanvasCanvasSource.prototype = {
    height: function() { return this.source.height; },
    width: function() { return this.source.width; },
    load: function(cb) { cb(null, this); }
  };

  var createCanvasSource = function createCanvasSource(source) {
    if (!(source instanceof Element)) {
      if (source && typeof(source.load) == "function")
        return source;
      throw new Error("invalid canvas image source: " + source);
    }

    if (source.nodeName == "IMG") {
      return new ImageCanvasSource(source);
    } else if (source.nodeName == "CANVAS") {
      return new CanvasCanvasSource(source);
    } else
      throw new Error("unsupported canvas image source element: <" +
                      source.nodeName.toLowerCase() + ">");
  };

  return Chibadge;
})();
