const rateLimit = require("express-rate-limit");

// Define rate limiters
const getNotificationsLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each user to 100 requests per windowMs
  keyGenerator: function(req, res) {
    return req.user.userId;
  },
  message: "Too many notification retrieval requests, please try again after 15 minutes"
});

const markNotificationAsReadLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 50, // limit each user to 50 requests per windowMs
  keyGenerator: function(req, res) {
    return req.user.userId;
  },
  message: "Too many notification read requests, please try again after an hour"
});

const markAllNotificationsAsReadLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 50, // limit each user to 50 requests per windowMs
  keyGenerator: function(req, res) {
    return req.user.userId;
  },
  message: "Too many bulk notification read requests, please try again after an hour"
});

const deleteNotificationLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 50, // limit each user to 50 requests per windowMs
  keyGenerator: function(req, res) {
    return req.user.userId;
  },
  message: "Too many notification deletion requests, please try again after an hour"
});


module.exports = {
    getNotificationsLimiter,
    markNotificationAsReadLimiter,
    markAllNotificationsAsReadLimiter,
    deleteNotificationLimiter,
}
