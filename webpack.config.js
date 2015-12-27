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
            'domReady' : 'bower_components/requirejs-domready/domReady.js',
            'marked' : 'bower_components/marked/lib/marked.js',
            'MathJax' : 'bower_components/MathJax/MathJax.js',
            'braintree-web' : 'bower_components/braintree-web/dist/braintree.js',
            'lodash' : 'bower_components/lodash/lodash.js'
        }
    },
    module: {
        loaders: [
            { test: /\.css$/, loader: "style!css" },
            { test: /angular\.js/, loader: "exports?angular" },
            { test: /angular-route\.js/, loader: "imports?angular" },
            { test: /angular-ui-router\.js/, loader: "imports?angular" },
            { test: /angular-sanitize\.js/, loader: "imports?angular" },
            { test: /ui-bootstrap-tpls\.js/, loader: "imports?angular" },
            { test: /dialogs\.js/, loader: "imports?angular" },
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

/*
    TODO: remove this comments when I know MathJax is working right with webpack

"MathJax" : "../MathJax/MathJax.js?config=TeX-AMS-MML_HTMLorMML&amp;delayStartupUntil=configured",

'MathJax' : {
    exports : 'MathJax',
    init: function () {
        MathJax.Hub.Config({
            skipStartupTypeset: true
        });
        MathJax.Hub.Startup.onload();
        return MathJax;
    }
}
 */
