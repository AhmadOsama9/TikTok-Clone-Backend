const rateLimit = require("express-rate-limit");

// Define rate limiters
const uploadVideoLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 5, // limit each user to 5 requests per windowMs
  keyGenerator: function(req, res) {
    return req.user.userId;
  },
  message: "Too many video upload requests, please try again after an hour"
});


const getVideoThumbnailLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each user to 100 requests per windowMs
  keyGenerator: function(req, res) {
    return req.user.userId;
  },
  message: "Too many thumbnail retrieval requests, please try again after 15 minutes"
});

const getVideoLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each user to 100 requests per windowMs
  keyGenerator: function(req, res) {
    return req.user.userId;
  },
  message: "Too many video retrieval requests, please try again after 15 minutes"
});


const getFollowingsVideosLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each user to 100 requests per windowMs
  keyGenerator: function(req, res) {
    return req.user.userId;
  },
  message: "Too many video retrieval requests, please try again after 15 minutes"
});

const getFollowersVideosLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each user to 100 requests per windowMs
  keyGenerator: function(req, res) {
    return req.user.userId;
  },
  message: "Too many video retrieval requests, please try again after 15 minutes"
});

const updateVideoDescriptionLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10, // limit each user to 10 requests per windowMs
  keyGenerator: function(req, res) {
    return req.user.userId;
  },
  message: "Too many description update requests, please try again after an hour"
});

const likeAndUnlikeVideoLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each user to 100 requests per windowMs
  keyGenerator: function(req, res) {
    return req.user.userId;
  },
  message: "Too many like/unlike requests, please try again after 15 minutes"
});

const shareVideoLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each user to 100 requests per windowMs
  keyGenerator: function(req, res) {
    return req.user.userId;
  },
  message: "Too many video share requests, please try again after 15 minutes"
});

const viewVideoLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each user to 100 requests per windowMs
  keyGenerator: function(req, res) {
    return req.user.userId;
  },
  message: "Too many video view requests, please try again after 15 minutes"
});

const searchVideosLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each user to 100 requests per windowMs
  keyGenerator: function(req, res) {
    return req.user.userId;
  },
  message: "Too many video search requests, please try again after 15 minutes"
});

const autocompleteVideosLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each user to 100 requests per windowMs
  keyGenerator: function(req, res) {
    return req.user.userId;
  },
  message: "Too many autocomplete requests, please try again after 15 minutes"
});

const deleteVideoLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10, // limit each user to 10 requests per windowMs
  keyGenerator: function(req, res) {
    return req.user.userId;
  },
  message: "Too many video delete requests, please try again after an hour"
});

const getCreatorCommentsLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each user to 100 requests per windowMs
  keyGenerator: function(req, res) {
    return req.user.userId;
  },
  message: "Too many creator comments retrieval requests, please try again after 15 minutes"
});

const getCommentsUsingPaginationLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each user to 100 requests per windowMs
  keyGenerator: function(req, res) {
    return req.user.userId;
  },
  message: "Too many comments retrieval requests, please try again after 15 minutes"
});



module.exports = {
    uploadVideoLimiter,
    getVideoThumbnailLimiter,
    getVideoLimiter,
    getFollowingsVideosLimiter,
    getFollowersVideosLimiter,
    updateVideoDescriptionLimiter,
    likeAndUnlikeVideoLimiter,
    shareVideoLimiter,
    viewVideoLimiter,
    searchVideosLimiter,
    autocompleteVideosLimiter,
    deleteVideoLimiter,
    getCreatorCommentsLimiter,
    getCommentsUsingPaginationLimiter
}
