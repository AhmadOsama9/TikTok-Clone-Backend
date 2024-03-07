const rateLimit = require("express-rate-limit");

// Define rate limiters
const saveVideoLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 50, // limit each user to 50 requests per windowMs
  keyGenerator: function(req, res) {
    return req.user.userId;
  },
  message: "Too many video save requests, please try again after an hour"
});

const unsaveVideoLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 50, // limit each user to 50 requests per windowMs
  keyGenerator: function(req, res) {
    return req.user.userId;
  },
  message: "Too many video unsave requests, please try again after an hour"
});

const getSavedVideosUsingPaginationLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each user to 100 requests per windowMs
  keyGenerator: function(req, res) {
    return req.user.userId;
  },
  message: "Too many saved videos retrieval requests, please try again after 15 minutes"
});

module.exports = {
    saveVideoLimiter,
    unsaveVideoLimiter,
    getSavedVideosUsingPaginationLimiter
}