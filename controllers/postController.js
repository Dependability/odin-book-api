const User = require('../models/user');
const Post = require('../models/post');
const Comment = require('../models/comment');


exports.getAllPosts = function(req, res, next) {
    Post.find().populate('author', 'username').populate({path: 'comments', populate: {path: 'author', select: 'username'}}).exec((err, posts)=> {
        if (err) {
            return next(err);
        }
        res.json({success: true, posts});
    });
}

exports.getUserPosts = function(req, res, next) {
    Post.find({'author': req.params.userId}).populate('author', 'username').populate({path: 'comments', populate: {path: 'author', select: 'username'}}).exec((err, posts)=> {
        if (err) {
            return next(err);
        }
        res.json({success: true, posts});
    });
}

exports.getPost = function(req, res, next) {
    res.send('Not implemented')
}
exports.createPost = function(req, res, next) {
    
    if (!req.body.text) {
        const err = new Error("No Text!");
        return next(err);
    }
    const newPost = {
        author: req.auth._id,
        text: req.body.text,
        likes: [],
        comments: []
    }
    
    const post = new Post(newPost)
    post.save((err)=>{
        if (err) return next(err);
        res.json({message: "post created"});
    })
}

exports.likePost = function(req, res, next) {
    Post.findById(req.params.postId).exec((err, post) => {
        if (err) return next(err);
        if (post.likes.includes(req.auth._id)) {
            post.update({$pull: {likes: req.auth._id}}, {}, (err) => {
                if (err) return next(err);
                res.json({message: 'Unliked'})
            })
            return;
        } else {
            post.update({$push: {likes: req.auth._id}}, {}, (err) => {
                if (err) return next(err);
                res.json({message: "Liked"});
            })
        }

    })
}

exports.commentPost = function(req, res, next) {
    Post.findById(req.params.postId).exec((err, post) => {
        if (err) return next(err);
        if (!req.body.text) {
            const err = new Error("No Text!");
        return next(err);
        }
        const newComment = {
            author: req.auth._id,
            text: req.body.text,
            post: req.params.postId
        }

        const comment = new Comment(newComment);
        comment.save((err, result)=> {
            if (err) return next(err);
            post.update({$push: {comments: result._id}}, {}, (err) => {
                if (err) return next(err);
                comment.populate('author', 'username').then((data)=> {
                    res.json({message: "Comment created successful!", comment: data})
                })
                
            })
        })
    })
}
