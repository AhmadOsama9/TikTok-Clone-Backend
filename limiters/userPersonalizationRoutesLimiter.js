const rateLimit = require("express-rate-limit");

// Define rate limiters
const createUserPersonalizationLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 50, // limit each user to 50 requests per windowMs
  keyGenerator: function(req, res) {
    return req.user.userId;
  },
  message: "طلب الحصول على الفيديوهات الموصى بها مرفوض , يرجى المحاولة بعد 15 دقيقة"
});

const getRecommendedVideosLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each user to 100 requests per windowMs
  keyGenerator: function(req, res) {
    return req.user.userId;
  },
  message: "طلب الحصول على الفيديوهات الموصى بها مرفوض , يرجى المحاولة بعد 15 دقيقة"
});


module.exports = {
    createUserPersonalizationLimiter,
    getRecommendedVideosLimiter
}
