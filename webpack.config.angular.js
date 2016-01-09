var path = require('path');

module.exports = {
    resolve: {
        modulesDirectories: ['.', 'public/modules'],
        alias : {
            'angular' : 'bower_components/angular/angular.js',
            'angular-route' : 'bower_components/angular-route/angular-route.js',
            'angular-ui-router' : 'bower_components/angular-ui-router/release/angular-ui-router.js',
            'angular-sanitize' : 'bower_components/angular-sanitize/angular-sanitize.js',
            'angular-bootstrap' : 'bower_components/angular-bootstrap/ui-bootstrap-tpls.js',
            'angular-dialog-service' : 'bower_components/angular-dialog-service/dist/dialogs.js',
            'angular-simple-logger' : 'bower_components/angular-simple-logger/dist/angular-simple-logger.js',
            'angular-google-maps' : 'bower_components/angular-google-maps/dist/angular-google-maps.js',
            'domReady' : 'bower_components/requirejs-domready/domReady.js',
            'marked' : 'bower_components/marked/lib/marked.js',
            'MathJax' : 'bower_components/MathJax/MathJax.js',
            'braintree-web' : 'bower_components/braintree-web/dist/braintree.js',
            'lodash' : 'bower_components/lodash/lodash.js'
        }
    },
    module: {
        loaders: [
            // import style sheets
            { test: /\.css$/, loader: "style!css" },
            // loads all html as angular templates into the angular template cache
            { test: /\.html$/, loader: 'ngtemplate?relativeTo=' + (path.resolve(__dirname, './app')) + '/!html'},
            { test: /angular\.js/, loader: "exports?angular" },
            { test: /angular-route\.js/, loader: "imports?angular" },
            { test: /angular-ui-router\.js/, loader: "imports?angular" },
            { test: /angular-sanitize\.js/, loader: "imports?angular" },
            { test: /ui-bootstrap-tpls\.js/, loader: "imports?angular" },
            { test: /dialogs\.js/, loader: "imports?angular" },
            { test: /angular-simple-logger\.js/, loader: "imports?angular" },
            { test: /angular-google-maps\.js/, loader: "imports?angular" },
            { test: /lodash\.js/, loader: "exports?_" },
            // expose MathJax as a global, which is actually the configuration only at this point
            { test: /MathJaxConfig\.js/, loader: "expose?MathJax" },
            // the import is just to get MathJaxConfig to go into the global
            { test: /MathJax\.js/, loader: "imports?MathJaxConfig!exports?MathJax" },
        ]
    },
    entry: "./public/index.js",
    output: {
        path: __dirname + "/dist",
        filename: "index.js"
    }
};
