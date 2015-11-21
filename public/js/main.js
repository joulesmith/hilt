
"use strict";

require.config({
    paths : {
        'angular' : './lib/angular.min',
        'domReady': './lib/domReady',
        'ui-bootstrap' : './lib/ui-bootstrap.min',
        'dnd' : './lib/angular-drag-and-drop-lists'

    },
    shim: {
        'angular' : {
            exports : 'angular'
        },
        'ui-bootstrap' : {
            deps : ['angular']
        },
        'dnd' : {
            deps : ['angular']
        }
    }
});

require([
    'domReady',
], function(domReady) {

    domReady(function () {

        require(['angular', "boxin"], function(){
            angular.bootstrap(document, ['boxin']);
        });
    });
});
