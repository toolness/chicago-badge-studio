var require = {
  shim: {
    'jscolor': {
      exports: 'jscolor'
    },
    'jquery-bootstrap': {
      deps: ['jquery'],
      exports: 'jQuery'
    },
    'validation': {
      exports: 'Validation'
    },
    'chibadge': {
      exports: 'Chibadge'
    }
  },
  paths: {
    'text': 'vendor/text.require',
    'jquery': 'vendor/jquery',
    'jscolor': 'vendor/jscolor/jscolor',
    'jquery-bootstrap': 'vendor/bootstrap/js/bootstrap',
    'chibadge': 'chibadge/chibadge'
  }
};
