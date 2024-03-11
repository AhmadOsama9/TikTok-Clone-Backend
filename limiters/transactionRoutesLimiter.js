const rateLimit = require("express-rate-limit");

// Define rate limiters
const getBalanceAndTransactionsLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each user to 100 requests per windowMs
  keyGenerator: function(req, res) {
    return req.user.userId;
  },
  message: "Too many balance and transactions retrieval requests, please try again after 15 minutes"
});

const addBalanceLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 50, // limit each user to 50 requests per windowMs
  keyGenerator: function(req, res) {
    return req.user.userId;
  },
  message: "Too many balance addition requests, please try again after an hour"
});

const sendGiftLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 50, // limit each user to 50 requests per windowMs
  keyGenerator: function(req, res) {
    return req.user.userId;
  },
  message: "Too many gift sending requests, please try again after an hour"
});


module.exports = {
    getBalanceAndTransactionsLimiter,
    addBalanceLimiter,
    sendGiftLimiter
}