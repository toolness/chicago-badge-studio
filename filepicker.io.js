(function($) {
  var API_KEY = window.FILEPICKER_API_KEY ||
                (window.localStorage &&
                 window.localStorage.FILEPICKER_API_KEY);
  var URL = "//api.filepicker.io/v1/filepicker.js";
  var FPFILE_ORIGIN = "https://www.filepicker.io/";
  var DATA_URL_START = "data:image/png;base64,";
  var FP_EXPORT_ERR_USER_CANCELLED = 131;
  var FP_PICK_ERR_USER_CANCELLED = 101;

  if (!('crossOrigin' in document.createElement('img') &&
        API_KEY))
    return;

  var script = document.createElement("script");
  var exportButton = $('a[href="#export-modal"]');
  script.onload = function() {
    filepicker.setKey(API_KEY);
    $('input[data-validator="url"]').each(function() {
      var target = $(this);
      var button = $('<button class="btn btn-small">Upload ' +
                     'image\u2026</button>');
      button.tooltip({
        title: "Images uploaded to our server will be publicly visible and " +
               "removed after one week."
      });
      button.click(function() {
        filepicker.pickAndStore({
          mimetype: "image/*"
        }, {}, function onSuccess(fpfiles) {
          if (fpfiles.length) target.val(fpfiles[0].url).change();
        }, function onError(e) {
          if (e.code == FP_PICK_ERR_USER_CANCELLED) return;
          alert("An error occurred while uploading the file.");
        });
        return false;
      }).insertAfter(this);
    });
    exportButton.attr("data-loading-text", "Exporting...");
    exportButton.click(function() {
      var fpfileToDelete = null;
      var done = function(errorMsg) {
        exportButton.button('reset');
        if (fpfileToDelete) filepicker.remove(fpfileToDelete);
        if (errorMsg) alert(errorMsg);
      };

      exportButton.button('loading');
      window.renderBadge(function(err, canvas) {
        if (err) return done("An error occurred rendering the badge.");
        try {
          var dataURL = canvas.toDataURL('image/png');
        } catch (e) {
          return done("An error occurred accessing the badge image data.");
        }
        if (dataURL.slice(0, DATA_URL_START.length) != DATA_URL_START)
          return done("An error occurred parsing the badge image data.");

        filepicker.store(dataURL.slice(DATA_URL_START.length), {
          filename: 'badge.png',
          mimetype: 'image/png',
          base64decode: true
        }, function onSuccess(fpfile) {
          fpfileToDelete = fpfile;
          filepicker.exportFile(fpfile, function onSuccess(exportedFpfile) {
            done();
          }, function onError(e) {
            if (e.code == FP_EXPORT_ERR_USER_CANCELLED) return done();
            done("An error occurred exporting the image.");
          });
        }, function onError() {
          done("An error occurred saving the image data to the internet.");
        }, function onProgress(percent) {
        });
      });
      return false;
    });
  };
  script.setAttribute("src", URL);
  document.documentElement.appendChild(script);
  window.crossOriginImageUrls.push(FPFILE_ORIGIN);
})(jQuery);
