define(['express', 'mongoose'], function(express, mongoose) {
    var router = express.Router();
    // use mongoose database objects
    var Profile = mongoose.model("profile");

    var prepare = function(content) {
        return content;
    };

    // creates a new profile
    router.post('/', function(req, res, next) {
        if (!req.user) {
            return res.status(401).json({
                error : {
                    message : 'Must be logged in.'
                }
            });
        }

        Profile.create({
            user : req.user,
            name : '' + req.body.name,
            content : prepare(req.body.content)
        })
            .save()
            .then(function(user){
                res.json({});
            }, function(error){
                next(error);
            });
    });

    // edit
    router.post('/:profile_id', function(req, res, next) {
        if (!req.user) {
            return res.status(401).json({
                error : {
                    message : 'Must be logged in.'
                }
            });
        }

        Profile.findById(req.params.profile_id)
            .exec()
            .then(function(profile){
                if (profile.user !== req.user) {
                    throw new Error('Cannot edit this profile.');
                }

                profile.name = '' + req.body.name,
                profile.content = prepare(req.body.content);

                return profile.save();
            })
            .then(function(profile){
                res.json({});
            }, function(error){
                next(error);
            });
    });

    router.get('/:profile_id', function(req, res, next) {
        Profile.findById(req.params.profile_id)
            .exec()
            .then(function(profile){
                res.json(profile);
            }, function(error){
                next(error);
            });
    });

    return router;
});
