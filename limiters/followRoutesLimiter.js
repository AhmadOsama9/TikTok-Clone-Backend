const rateLimit = require("express-rate-limit");

// Define rate limiters
const followUserLimiter = rateLimit({
  windowMs: 30 * 60 * 1000, // .5 hour
  max: 1000, // limit each user to 1000 requests per windowMs
  keyGenerator: function(req, res) {
    return req.user.userId;
  },
  message: "طلبات متابعة كثيرة جدا، الرجاء المحاولة بعد نصف ساعة"
});

const unFollowUserLimiter = rateLimit({
  windowMs: 30 * 60 * 1000, // .5 hour
  max: 1000, // limit each user to 1000 requests per windowMs
  keyGenerator: function(req, res) {
    return req.user.userId;
  },
  message: "طلبات إلغاء المتابعة كثيرة جدا، الرجاء المحاولة بعد نصف ساعة"
});

module.exports = {
  followUserLimiter,
  unFollowUserLimiter,
};
