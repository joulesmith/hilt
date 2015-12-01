/**
 * Credits:
 * Angular for error message formatting
 * Kostas Bariotis for proper custom error stacktrace
 */
var util = require('util');

module.exports = function(namespace){
    var NamespaceError = function(code, template, parameters, status) {
        Error.captureStackTrace(this, this.constructor);

        this.code = namespace + '.'  + code;
        this.message = '';

        if (parameters && parameters.length > 0) {
            this.message += template.replace(/\{\d+\}/g, function(match) {

                // + apparently converts string to number.
              var index = +match.slice(1, -1);

              if (index < parameters.length) {
                return parameters[index];
              }

              return match;
            });
        }else{
            this.message += template;
        }

        if(status) {
            this.status = status;
        }
    };


    util.inherits(NamespaceError, Error);

    return NamespaceError;
};
