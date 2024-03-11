const rateLimit = require("express-rate-limit");

// Define rate limiters
const createUserPersonalizationLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 50, // limit each user to 50 requests per windowMs
  keyGenerator: function(req, res) {
    return req.user.userId;
  },
  message: "Too many personalization creation requests, please try again after an hour"
});

const getRecommendedVideosLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each user to 100 requests per windowMs
  keyGenerator: function(req, res) {
    return req.user.userId;
  },
  message: "Too many recommended videos requests, please try again after 15 minutes"
});


module.exports = {
    createUserPersonalizationLimiter,
    getRecommendedVideosLimiter
}
