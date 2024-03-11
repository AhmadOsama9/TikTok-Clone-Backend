const rateLimit = require("express-rate-limit");

// Define rate limiters
const getNotificationsLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each user to 100 requests per windowMs
  keyGenerator: function(req, res) {
    return req.user.userId;
  },
  message: "طلب الحصول على الاشعارات مرفوض , يرجى المحاولة بعد 15 دقيقة"
});

const markNotificationAsReadLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 100, // limit each user to 100 requests per windowMs
  keyGenerator: function(req, res) {
    return req.user.userId;
  },
  message: "طلب تحديد الاشعار كمقروء مرفوض , يرجى المحاولة بعد ساعة"
});

const markAllNotificationsAsReadLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 100, // limit each user to 100 requests per windowMs
  keyGenerator: function(req, res) {
    return req.user.userId;
  },
  message: "طلب تحديد جميع الاشعارات كمقروءة مرفوض , يرجى المحاولة بعد ساعة"
});

const deleteNotificationLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 100, // limit each user to 100 requests per windowMs
  keyGenerator: function(req, res) {
    return req.user.userId;
  },
  message: "طلب حذف الاشعار مرفوض , يرجى المحاولة بعد ساعة"
});


module.exports = {
    getNotificationsLimiter,
    markNotificationAsReadLimiter,
    markAllNotificationsAsReadLimiter,
    deleteNotificationLimiter,
}
