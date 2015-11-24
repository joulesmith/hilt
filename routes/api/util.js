// load dependencies
var express = require('express');
var router = express.Router();
module.exports = router;
var zxcvbn = require('zxcvbn');


// tests the strength of a password using the same algorithm as required for passwords
router.post('/passwordStrength/', function(req, res, next) {
    var result = zxcvbn(req.body.password);

    var warnings = result.feedback.suggestions;

    if (result.feedback.warning && result.feedback.warning !== '') {
        warnings.push(result.feedback.warning);
    }

    res.json({
        strength : result.score,
        warnings : warnings,
        crackTime : result.crack_times_display.offline_slow_hashing_1e4_per_second
    });
});
