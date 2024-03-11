const rateLimit = require("express-rate-limit");

// Define rate limiters
const followUserLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 50, // limit each user to 50 requests per windowMs
  keyGenerator: function(req, res) {
    return req.user.userId;
  },
  message: "Too many follow requests, please try again after an hour"
});

const unFollowUserLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 50, // limit each user to 50 requests per windowMs
  keyGenerator: function(req, res) {
    return req.user.userId;
  },
  message: "Too many unfollow requests, please try again after an hour"
});

module.exports = {
  followUserLimiter,
  unFollowUserLimiter,
};
