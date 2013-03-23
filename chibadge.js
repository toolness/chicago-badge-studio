var Chibadge = (function() {
  var Chibadge = {
    // ## Chibadge.build()
    //
    // Builds a Chicago badge in a <canvas> element and returns it.
    // 
    // Options:
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
    //   hexMask:
    //     Canvas image source representing the mask to use for the badge.
    //     If not provided, the element with ID chibadge-hex-mask will be
    //     used.
    //
    //   ribbon:
    //     Canvas image source representing the ribbon to use for the badge.
    //     If not provided, the element with ID chibadge-ribbon will be
    //     used.
    //
    // Note that all canvas image sources must already be loaded prior to
    // calling this function, as this function is synchronous.
    build: function(options) {
      var RIBBON_PADDING = 21;
      var EXTRA_PADDING = 6;
      var RIBBON_Y = 600;
      var BASE_SIDE_LENGTH = 1029;
      var FULL_WIDTH = BASE_SIDE_LENGTH + RIBBON_PADDING*2 + EXTRA_PADDING;
      var FULL_HEIGHT = FULL_WIDTH;

      var canvas = document.createElement('canvas');
      var hexMask = options.hexMask || elementWithId('chibadge-hex-mask');
      var ribbon = options.ribbon || elementWithId('chibadge-ribbon');

      options.background = options.background || 'gray';
      options.glyphScale = options.glyphScale || 1;
      if (typeof(options.gloss) == 'undefined') options.gloss = true;

      canvas.width = FULL_WIDTH;
      canvas.height = FULL_HEIGHT;

      var ctx = canvas.getContext('2d');

      ctx.drawImage(hexMask, RIBBON_PADDING, RIBBON_PADDING);
      ctx.globalCompositeOperation = "source-in";

      if (typeof(options.background) == 'string')
        options.background = solidCanvas(16, 16, options.background);

      var bgPattern = ctx.createPattern(options.background, 'repeat');
      ctx.fillStyle = bgPattern;
      ctx.fillRect(0, 0, FULL_WIDTH, FULL_HEIGHT);

      ctx.globalCompositeOperation = "source-atop";

      if (options.glyph) {
        var glyphSize = {
          width: options.glyph.width * options.glyphScale,
          height: options.glyph.height * options.glyphScale
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
      ctx.drawImage(ribbon, 0, RIBBON_Y);

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

  var elementWithId = function elementWithId(id) {
    var element = document.getElementById(id);

    if (!element) throw new Error("element with id '" + id + "' not found");
    return element;
  };

  return Chibadge;
})();
