var path = require('path');

module.exports = {
    resolve: {
        extensions: ['', '.js', '.jsx'],
        modulesDirectories: ['node_modules', 'app'],
        alias : {
        }
    },
    module: {
        loaders: [
            { test: /\.jsx$/, exclude: /(node_modules|bower_components)/, loader: 'babel', query: { presets : ['react', 'es2015']} },
            // import style sheets
            { test: /\.css$/, loader: "style!css" },
            { test: /\.woff\d?(\?v=\d+\.\d+\.\d+)?$/,   loader: "url?limit=10000&mimetype=application/font-woff" },
            { test: /\.ttf(\?v=\d+\.\d+\.\d+)?$/,    loader: "url?limit=10000&mimetype=application/octet-stream" },
            { test: /\.eot(\?v=\d+\.\d+\.\d+)?$/,    loader: "file" },
            { test: /\.svg(\?v=\d+\.\d+\.\d+)?$/,    loader: "url?limit=10000&mimetype=image/svg+xml" },
            { test: /lodash\.js/, loader: "exports?_" },
            // expose MathJax as a global, which is actually the configuration only at this point
            { test: /MathJaxConfig\.js/, loader: "expose?MathJax" },
            // the import is just to get MathJaxConfig to go into the global
            { test: /MathJax\.js/, loader: "imports?MathJaxConfig!exports?MathJax" },
        ]
    },
    entry: "./app/app.jsx",
    output: {
        path: __dirname + "/dist",
        filename: "app.js"
    }
};
