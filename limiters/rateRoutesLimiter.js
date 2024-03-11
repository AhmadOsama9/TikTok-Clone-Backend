const rateLimit = require("express-rate-limit");

// Define rate limiter
const addRateLimiter = rateLimit({
  windowMs: 30 * 60 * 1000, // 30 minutes
  max: 100, // limit each user to 50 requests per windowMs
  keyGenerator: function (req, res) {
    return req.user.userId;
  },
  message: "طلب اضافة تقييم مرفوض , يرجى المحاولة بعد 30 دقيقة"
});

const updateRateLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 100, // limit each user to 50 requests per windowMs
  keyGenerator: function (req, res) {
    return req.user.userId;
  },
  message: "طلب تحديث التقييم مرفوض , يرجى المحاولة بعد ساعة"
});

const removeRateLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 100, // limit each user to 50 requests per windowMs
  keyGenerator: function (req, res) {
    return req.user.userId;
  },
  message: "طلب حذف التقييم مرفوض , يرجى المحاولة بعد ساعة"
});


module.exports = {
  addRateLimiter,
  updateRateLimiter,
  removeRateLimiter
};
