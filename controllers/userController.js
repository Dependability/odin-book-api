const User = require('../models/user')
const passport = require('passport');
var jwt = require('jsonwebtoken');

exports.login = function(req, res, next) {
    //To add - Sanitization and validation
    User.findOne({username: new RegExp(`^${req.body.username}$`, 'i')}).exec((err, user) => {
        if (err) {
            return next(err);
        }

        if (user) {
            console.log(user)
            //Decrypt
            if (user.password == req.body.password) {
                let jsonUser = {
                    _id: user._id,
                    username: user.username
                }
                jwt.sign(jsonUser, process.env.secretOrKey, function(err, token) {
                    if (err) {
                        return next(err);
                    }
                    res.json({user: jsonUser, token, success: true})
                })              
            } else {
                res.json({success: false, message: 'Incorrect Password'})

            }
        } else {
            res.json({success: false, message: 'User does not exist'})
        }
    })

}
exports.createUser = function(req, res, next) {
    //if user does not exist and thereis no facebook account already
    User.find({username:  new RegExp(`^${req.body.username}$`, 'i')}).exec((err, user)=>{
        if (err) {
            return next(err);
        }
        if (user.length) {
            res.json({success: false, message: "Username taken"})
            return
        }
        if (user.length == 0) {
            if (req.body.confirmPassword !== req.body.password) {
                res.json({success: false, message: 'Passwords do not match!'})
                return
            }
            console.log('we is going')
            const newUser= new User({
                username: req.body.username,
                password: req.body.password,
                // facebook: req.body.facebook,
            })
            console.log('we is going')
            newUser.save((err) => {
                if (err) {
                    return next(err);
                }
                let jsonUser = {
                    _id: newUser._id,
                    username: newUser.username
                }
                let token = jwt.sign(jsonUser, process.env.secretOrKey);
                res.json({success: true, token, user: jsonUser ,message: "User created successfully!"})
            })

            return;
        }
        // else if (user.facebook == req.body.facebook) {
        //     res.json({message: "Facebook already in use, try logging in."})
        // }
    })
}

exports.getAllUsers = function(req, res, next) {

    console.log(req.auth)
    
    User.find({$and : [{friends: {$nin: [{_id: req.auth._id}]}}, {outgoing: {$nin: [{_id: req.auth._id}]}}, {incoming: {$nin: [{_id: req.auth._id}]}}, {_id: {$ne : req.auth._id}}]}, ('username facebook'), (err, users) => {
        if (err) return next(err);
        res.json({users, message: "Request successful"})
    })
}

exports.getUser = function(req, res, next) {
    let userQuery;
    if (req.auth._id === req.params.userId) {
        userQuery = User.findById(req.params.userId, ("username facebook friends outgoing incoming")).populate('friends outgoing incoming', 'username')
        
    } else {
        userQuery = User.findById(req.params.userId, ("username facebook friends")).populate('friends', 'username')

    }
    userQuery.exec((err, user)=>{

        if (err) return next(err);

        if (!user) {
            res.json({user: [], message: "No users"})
            return;
        }
        if (user) {
            res.json({user, message: "Found user"})
        }
    })
    
}

exports.friendRequest = function(req, res, next) {
    //Future me, use the async module to do both.

    //Temporary calling logged in user - req.me.id
    User.findById(req.params.userId).exec((err, user) => {
        if (err) return next(err);
        if (user) {
            if (user.friends.includes(req.auth._id) || user.incoming.includes(req.auth._id)) {
                res.json({message: "Already friends or sending friend request"});
                return;
            }
            user.update({$push: {incoming: req.auth._id}}, {}, (err)=>{
                if (err) return next(err);
            });
            User.updateOne({_id: req.auth._id}, {$push: {outgoing: req.params.userId}}).exec((err, user) => {
                if (err) return next(err);
                res.json({message: "Friend request successful!"})
            })

        }
    })
}
exports.friendRemove = function (req, res, next) {
    User.findById(req.params.userId).exec((err, user) => {
        if (err) return next(err);
        if (user) {
            console.log(user)
            if (user.friends.includes(req.auth._id)) {
                user.update({$pull: {friends: req.auth._id}}, {}, (err) => {
                    if (err) return next(err);
                })
                User.updateOne({_id: req.auth._id}, {$pull: {friends: req.params.userId}}).exec((err, user) => {
                    if (err) return next(err);
                    res.json({message: "Friend removed successful!"})
                })
                
            }
        }
    })
}

exports.friendCancel = function (req, res, next) {
    User.findById(req.params.userId).exec((err, user) => {
        if (err) return next(err);
        if (user) {
            console.log(user)
            if (user.incoming.includes(req.auth._id)) {
                user.update({$pull: {incoming: req.auth._id}}, {}, (err) => {
                    if (err) return next(err);
                })
                User.updateOne({_id: req.auth._id}, {$pull: {outgoing: req.params.userId}}).exec((err, user) => {
                    if (err) return next(err);
                    res.json({message: "Friend request canceled successful!"})
                })
                
            }
        }
    }) 
}

exports.friendAccept = function(req, res, next) {
    User.findById(req.params.userId).exec((err, user) => {
        if (err) return next(err);
        if (user) {
            console.log(user)
            if (user.outgoing.includes(req.auth._id)) {
                user.update({$push: {friends: req.auth._id}}, {}, (err) => {
                    if (err) return next(err);
                })
                user.update({$pull: {outgoing: req.auth._id}}, {}, (err)=> {
                    if (err) return next(err);
                })
                User.updateOne({_id: req.auth._id}, {$push: {friends: req.params.userId}}).exec((err, user) => {
                    if (err) return next(err);
                })
                User.updateOne({_id: req.auth._id}, {$pull: {incoming: req.params.userId}}).exec((err, user) => {
                    if (err) return next(err);
                    res.json({message: "Friend added successful!"})
                })
                
            }
        }
    })

}

