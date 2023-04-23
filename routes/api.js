const express = require('express');
const api = express.Router();
const userController = require('../controllers/userController');
const postController = require('../controllers/postController')
const jwt = require('jsonwebtoken');
const passport = require('passport')

function verifyToken(req, res, next) {
    //GET TOKEN
    console.log('called')
    let token = req.headers['authorization'].split(' ')[1];
    console.log(token)
    if (!token) {
        res.json({message: 'You need to log in.'})
        return
    }
    jwt.verify(token, process.env.secretOrKey, (err, user) => {
        if (err) {
            res.json({message: "You may need to log in again."});
        }
        if (!user) {
            res.json({message: "Incorrect token"});
            return
        } else {
        console.log('Verified!', user)
        req.auth = user;
        return next();

        }
        
    })
}

api.post('/login', userController.login);
//Users
api.post('/users', userController.createUser);
api.get('/users', verifyToken, userController.getAllUsers);
api.get('/users/:userId',verifyToken, userController.getUser);
api.get('/users/:userId/posts', postController.getUserPosts);
api.post('/users/:userId/friend', verifyToken, userController.friendRequest);
api.post('/users/:userId/cancel', verifyToken, userController.friendCancel);
api.post('/users/:userId/remove', verifyToken, userController.friendRemove);
api.post('/users/:userId/accept', verifyToken, userController.friendAccept);

api.get('/posts', postController.getAllPosts);
api.get('/posts/:postId', postController.getPost)
api.post('/posts', verifyToken, postController.createPost);
api.post('/posts/:postId/like',verifyToken, postController.likePost);
api.post('/posts/:postId/comment',verifyToken, postController.commentPost);

module.exports = api;