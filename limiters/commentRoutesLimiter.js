const rateLimit = require("express-rate-limit");

// Define rate limiters
const addCommentLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 100, // limit each user to 100 requests per windowMs
  keyGenerator: function(req, res) {
    return req.user.userId;
  },
  message: "Too many comment addition requests, please try again after an hour"
});

const deleteCommentLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 50, // limit each user to 50 requests per windowMs
  keyGenerator: function(req, res) {
    return req.user.userId;
  },
  message: "Too many comment deletion requests, please try again after an hour"
});

const replyToCommentLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 100, // limit each user to 100 requests per windowMs
  keyGenerator: function(req, res) {
    return req.user.userId;
  },
  message: "Too many comment reply requests, please try again after an hour"
});

const addGiftCommentLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 50, // limit each user to 50 requests per windowMs
  keyGenerator: function(req, res) {
    return req.user.userId;
  },
  message: "Too many gift comment addition requests, please try again after an hour"
});

const updateCommentLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 50, // limit each user to 50 requests per windowMs
  keyGenerator: function(req, res) {
    return req.user.userId;
  },
  message: "Too many comment update requests, please try again after an hour"
});

const getCommentUsingIdLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each user to 100 requests per windowMs
  keyGenerator: function(req, res) {
    return req.user.userId;
  },
  message: "Too many comment retrieval requests, please try again after 15 minutes"
});

const likeAndUnlikeCommentLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 100, // limit each user to 100 requests per windowMs
  keyGenerator: function(req, res) {
    return req.user.userId;
  },
  message: "Too many comment like/unlike requests, please try again after an hour"
});


module.exports = {
    addCommentLimiter,
    deleteCommentLimiter,
    replyToCommentLimiter,
    addGiftCommentLimiter,
    updateCommentLimiter,
    getCommentUsingIdLimiter,
    likeAndUnlikeCommentLimiter
}


