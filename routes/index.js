var express = require('express');
var router = express.Router();

var mongoose = require('mongoose');




module.exports = function(server){
    /* GET home page. */
    return router.get('/', function(req, res, next) {
        // TODO: set this from database value
        res.render('index', { title: server.config.name });
    });
};
