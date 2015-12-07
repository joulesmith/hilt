
// TODO: Optimize front-end using e.g. requirejs optimizer. Need to figure out how.
module.exports = function(grunt) {

    grunt.initConfig({
      bowerRequirejs: {
        target: {
          rjsConfig: 'public/config.js',
          options: {
            baseUrl: './'
          }
        }
      }
    });

    grunt.loadNpmTasks('grunt-bower-requirejs');

    grunt.registerTask('default', ['bowerRequirejs']);

};
