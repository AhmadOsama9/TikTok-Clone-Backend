const rateLimit = require("express-rate-limit");

// Define rate limiters
const addCommentLimiter = rateLimit({
  windowMs: 30 * 60 * 1000, // 30 minutes
  max: 300, // limit each user to 300 requests per windowMs
  keyGenerator: function (req, res) {
    return req.user.userId;
  },
  message: "طلب اضافة تعليق مرفوض , يرجى المحاولة بعد 30 دقيقة"
});

const deleteCommentLimiter = rateLimit({
  windowMs: 30 * 60 * 1000, // 30 minutes
  max: 100, // limit each user to 100 requests per windowMs
  keyGenerator: function (req, res) {
    return req.user.userId;
  },
  message: "طلب حذف التعليق مرفوض , يرجى المحاولة بعد 30 دقيقة"
});

const replyToCommentLimiter = rateLimit({
  windowMs: 30 * 60 * 1000, // 30 minutes
  max: 100, // limit each user to 100 requests per windowMs
  keyGenerator: function (req, res) {
    return req.user.userId;
  },
  message: "طلب الرد على التعليق مرفوض , يرجى المحاولة بعد 30 دقيقة"
});



const updateCommentLimiter = rateLimit({
  windowMs: 30 * 60 * 1000, // 30 minutes
  max: 50, // limit each user to 50 requests per windowMs
  keyGenerator: function (req, res) {
    return req.user.userId;
  },
  message: "طلب تحديث التعليق مرفوض , يرجى المحاولة بعد 30 دقيقة"
});

const getCommentUsingIdLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each user to 100 requests per windowMs
  keyGenerator: function (req, res) {
    return req.user.userId;
  },
  message: "طلب الحصول على التعليق مرفوض , يرجى المحاولة بعد 15 دقيقة"
});

const likeAndUnlikeCommentLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 1 hour
  max: 100, // limit each user to 100 requests per windowMs
  keyGenerator: function (req, res) {
    return req.user.userId;
  },
  message: "طلب الاعجاب بالتعليق مرفوض , يرجى المحاولة بعد 15 دقيقة"
});


module.exports = {
  addCommentLimiter,
  deleteCommentLimiter,
  replyToCommentLimiter,
  updateCommentLimiter,
  getCommentUsingIdLimiter,
  likeAndUnlikeCommentLimiter
}


