const rateLimit = require("express-rate-limit");

// Define rate limiters
const getUserProfileLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each user to 100 requests per windowMs
  keyGenerator: function(req, res) {
    return req.user.userId;
  },
  message: "Too many profile retrieval requests, please try again after 15 minutes"
});

const getOtherUserProfileLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each user to 100 requests per windowMs
  keyGenerator: function(req, res) {
    return req.user.userId;
  },
  message: "Too many profile retrieval requests, please try again after 15 minutes"
});

const changeProfileImageLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10, // limit each user to 10 requests per windowMs
  keyGenerator: function(req, res) {
    return req.user.userId;
  },
  message: "Too many image change requests, please try again after an hour"
});

const changeProfilePasswordLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // limit each user to 5 requests per windowMs
  keyGenerator: function(req, res) {
    return req.user.userId;
  },
  message: "Too many password change requests, please try again after 15 minutes"
});

const changeProfileNameLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10, // limit each user to 10 requests per windowMs
  keyGenerator: function(req, res) {
    return req.user.userId;
  },
  message: "Too many name change requests, please try again after an hour"
});

const changeProfilePhoneLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10, // limit each user to 10 requests per windowMs
  keyGenerator: function(req, res) {
    return req.user.userId;
  },
  message: "Too many phone change requests, please try again after an hour"
});

const changeProfileUsernameLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10, // limit each user to 10 requests per windowMs
  keyGenerator: function(req, res) {
    return req.user.userId;
  },
  message: "Too many username change requests, please try again after an hour"
});

const changeProfileBioLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10, // limit each user to 10 requests per windowMs
  keyGenerator: function(req, res) {
    return req.user.userId;
  },
  message: "Too many bio change requests, please try again after an hour"
});

const sendVerificationToNewEmailLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 5, // limit each user to 5 requests per windowMs
  keyGenerator: function(req, res) {
    return req.user.userId;
  },
  message: "Too many verification code requests, please try again after an hour"
});

const verificationAndSetNewEmailLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 5, // limit each user to 5 requests per windowMs
  keyGenerator: function(req, res) {
    return req.user.userId;
  },
  message: "Too many email change requests, please try again after an hour"
});

const getUserVideosLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each user to 100 requests per windowMs
  keyGenerator: function(req, res) {
    return req.user.userId;
  },
  message: "Too many video retrieval requests, please try again after 15 minutes"
});

const getOtherUserVideosLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each user to 100 requests per windowMs
  keyGenerator: function(req, res) {
    return req.user.userId;
  },
  message: "Too many video retrieval requests, please try again after 15 minutes"
});

const getFollowersLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each user to 100 requests per windowMs
  keyGenerator: function(req, res) {
    return req.user.userId;
  },
  message: "Too many follower retrieval requests, please try again after 15 minutes"
});

const getOtherUserFollowersLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each user to 100 requests per windowMs
  keyGenerator: function(req, res) {
    return req.user.userId;
  },
  message: "Too many follower retrieval requests, please try again after 15 minutes"
});

const getFollowingsLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each user to 100 requests per windowMs
  keyGenerator: function(req, res) {
    return req.user.userId;
  },
  message: "Too many following retrieval requests, please try again after 15 minutes"
});



module.exports = {
    getUserProfileLimiter,
    getOtherUserProfileLimiter,
    changeProfileImageLimiter,
    changeProfilePasswordLimiter,
    changeProfileNameLimiter,
    changeProfilePhoneLimiter,
    changeProfileUsernameLimiter,
    changeProfileBioLimiter,
    sendVerificationToNewEmailLimiter,
    verificationAndSetNewEmailLimiter,
    getUserVideosLimiter,
    getOtherUserVideosLimiter,
    getFollowersLimiter,
    getOtherUserFollowersLimiter,
    getFollowingsLimiter
}



