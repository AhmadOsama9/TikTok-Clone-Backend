const rateLimit = require("express-rate-limit");

// Define rate limiters
const createReportLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 300, // limit each user to 300 requests per windowMs
  keyGenerator: function (req, res) {
    return req.user.userId;
  },
  message: "طلبات الإبلاغ كثيرة جداً، يرجى المحاولة مرة أخرى بعد ساعة"
});

const updateReportLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 300, // limit each user to 300 requests per windowMs
  keyGenerator: function (req, res) {
    return req.user.userId;
  },
  message: "طلبات تحديث الإبلاغ كثيرة جداً، يرجى المحاولة مرة أخرى بعد ساعة"
});







module.exports = {
  createReportLimiter,
  updateReportLimiter,


}
