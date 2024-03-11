const rateLimit = require("express-rate-limit");

// Define rate limiters
const saveVideoLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each user to 100 requests per windowMs
  keyGenerator: function(req, res) {
    return req.user.userId;
  },
  message: "طلب حفظ الفيديو مرفوض , يرجى المحاولة بعد 15 دقيقة"
});


const unsaveVideoLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each user to 50 requests per windowMs
  keyGenerator: function(req, res) {
    return req.user.userId;
  },
  message: "طلب الغاء حفظ الفيديو مرفوض , يرجى المحاولة بعد 15 دقيقة"
});

const getSavedVideosUsingPaginationLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each user to 100 requests per windowMs
  keyGenerator: function(req, res) {
    return req.user.userId;
  },
  message: "طلب الحصول على الفيديوهات المحفوظة مرفوض , يرجى المحاولة بعد 15 دقيقة"
});

module.exports = {
    saveVideoLimiter,
    unsaveVideoLimiter,
    getSavedVideosUsingPaginationLimiter
}