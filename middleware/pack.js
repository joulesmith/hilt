var webpack = require('webpack');
var MemoryFileSystem = require("memory-fs");
var mime = require("mime");
var path = require('path');

// significant inspiration from https://github.com/webpack/webpack-dev-middleware

// except I want to compile only when server starts, and then serve it as a static
// asset to whatever route it is used in

module.exports = function(options) {
  var compiler = webpack(options);

  var bundle_fs = compiler.outputFileSystem = new MemoryFileSystem();

  compiler.run(function(err, stats) {
    if(err) throw err;

    if (stats.hasErrors()) {
      var jsonStats = stats.toJson();

      console.warn(jsonStats.errors);
    }

    console.log(bundle_fs.readdirSync('/'));
  });

  return function(req, res, next) {
    var result = path.parse(req.url);

    if (result.base === '' || !bundle_fs.existsSync(req.url)) {
      // only try to serve the file if it is in the bundle
      return next();
    }

    // extract the files contents to be served to the request
    var content = bundle_fs.readFileSync(req.url);

    res.setHeader("Access-Control-Allow-Origin", "*"); // To support XHR, etc.
    res.setHeader("Content-Type", mime.lookup(result.base));
    res.setHeader("Content-Length", content.length);
    res.send(content);
  };
}
