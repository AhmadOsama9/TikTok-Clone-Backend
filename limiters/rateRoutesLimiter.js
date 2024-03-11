const rateLimit = require("express-rate-limit");

// Define rate limiter
const addRateLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 50, // limit each user to 50 requests per windowMs
  keyGenerator: function(req, res) {
    return req.user.userId;
  },
  message: "Too many rating addition requests, please try again after an hour"
});

const updateRateLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 50, // limit each user to 50 requests per windowMs
  keyGenerator: function(req, res) {
    return req.user.userId;
  },
  message: "Too many rating addition requests, please try again after an hour"
});

const removeRateLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 50, // limit each user to 50 requests per windowMs
  keyGenerator: function(req, res) {
    return req.user.userId;
  },
  message: "Too many rating addition requests, please try again after an hour"
});


module.exports = {
  addRateLimiter,
  updateRateLimiter,
  removeRateLimiter
};
