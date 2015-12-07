
var SocketBundle = mongoose.model("dacSocketBundle");
var Channel = mongoose.model("dacChannel");

var permission = require('permission');

var server = require('../server');

var bundle = io.of('/bundle');

bundle.on('connect', function(socket){


    var channel_permissions = {};

    socket.on('request_permission', function(req, res){

        // first look up the bundle which will be streamed.
        SocketBundle.findById(req.bundle_id, function(err, bundle){
            if (err) { res(err); return;}

            var check_channels = function() {

                // fill in the channels array with channel objects
                bundle.populate('channels', function(err, bundle){
                    if (err) { res(err); return;}




                    // verify read/exec permission for each channel, and join the corresponding
                    // io rooms by the channel_id

                    var allowed = true;
                    var required_resources = [];
                    var required_read = [];
                    var required_control = [];

                    // test to see if the channel itself allows
                    for(var i = 0; i < bundle.channels.length; i++) {

                        var channel = bundle.channels[i];
                        var chp = channel_permissions[channel._id] = {channel: channel};

                        // go ahead and link the socket to channel even though
                        // permission has not been granted yet. It will only do
                        // anything in the future if there is permission
                        (function(chp){
                            socket.on('control_' + channel._id, function(req, res){

                                if (chp.execute) {
                                    // relay the control signal to the channel
                                    chp.channel.control(req, res);
                                }else{
                                    res(new Error("Permission Denied."));
                                }
                            });
                        })(chp, channel);



                        if (bundle.variables[i].control && !channel.controllable) {
                            // this is not good because they don't even know what they're
                            // asking for. But I want to be as permissive as possible and
                            // handle this error on the client side. But I don't want to accidentally
                            // give permission to do something undefined. Wherase later permissions trump
                            // this permission, not being controllable trumps everything.

                            chp.read = channel.read;
                            chp.execute = false;

                            if (!channel.read){
                                required_resources.push(channel._id);
                                required_read.push(true);
                                required_control.push(false); // this will suppress overriding permission
                                allowed = false; // only set to false if we really want to look for permission
                                // even though that doesn't make sense the logic will not return early otherwise
                            }

                        }else if (bundle.variables[i].control && !channel.execute || !channel.read) {

                            chp.read = channel.read;
                            chp.execute = channel.execute;

                            required_resources.push(channel._id);
                            required_read.push(true);
                            required_control.push(bundle.variables[i].control);
                            allowed = false;

                        }else{
                            chp.read = channel.read;
                            chp.execute = channel.execute;
                        }



                        if (channel.read) {
                            // if allowed, join the channels data room specified by
                            // the channel id
                            socket.join("data_" + channel._id);
                        }

                    }

                    if (allowed) {
                        return res(null, channel_permissions);
                    }

                    if (!req.token) {
                        return res("Not logged in!", channel_permissions);
                    }

                    // still not all granted. so we need to see if there are user
                    // specific permissions granted.
                    // first verify the session from token and extract the user id
                    permission.io.verify(req.token, function(user_id){
                        if (user_id) {

                            function check_remaining_resources() {

                                var resource = required_resources.pop();
                                var read = required_read.pop();
                                var exec = required_control.pop();

                                Permission.findOne({
                                    'user': user_id,
                                    'resource' : resource,
                                    // try to get as much permission as possible
                                    $or :[{read : {$gte : read}}, {execute :{$gte : exec}}],
                                }, function(err, doc){
                                    if (err) { res(err, channel_permissions); return;}

                                    if (permission) {
                                        var cur = channel_permissions[doc.resource];

                                        if (!cur.read && doc.read){
                                            // have them join the channel's room if they're
                                            // not already
                                            socket.join("data_" + doc.resource);
                                        }

                                        cur.read = cur.read || doc.read;

                                        if (exec) {
                                            // only add permission if it's needed.

                                            cur.execute = cur.execute || doc.execute;
                                        }

                                    }

                                    if (required_resources.length === 0) {
                                        // everything has been looked at
                                        return res(null, channel_permissions);
                                    }

                                    // still more to look at
                                    check_remaining_resources();
                                    // this looks like a recursive call
                                    // but it's called from this callback,
                                    // not from check_remaining_resources, so it doesnt
                                    // create any call chain.

                                }); // Permission.findOne()

                            }// check_remaining_resources

                            // check all permissions
                            check_remaining_resources();
                        }else{
                            res("Login verification failed.", channel_permissions);
                        }
                    });


                });
            }; // check_channels

            // but first, make sure user has permission to read bundle information

            var check_bundle = function() {
                if (bundle.read) {
                    check_channels();
                }else{
                    // need to verify user has Permission
                    if (!req.token) {
                        return res("Not logged in!");
                    }

                    // still not all granted. so we need to see if there are user
                    // specific permissions granted.
                    // first verify the session from token and extract the user id
                    permission.io.verify(req.token, function(user_id){
                        Permission.findOne({
                            'user': user_id,
                            'resource' : bundle._id,
                            'read' : true
                        }, function(err, doc){
                            if (err) { res(err, channel_permissions); return;}

                            if (doc) {
                                check_channels();
                            }else{
                                res("Permission Denied.");
                            }
                        });
                    };
                }
            };

            check_bundle();
        });




    });
});
