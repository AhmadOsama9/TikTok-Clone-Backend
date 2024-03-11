const rateLimit = require("express-rate-limit");

// Define rate limiters
const uploadVideoLimiter = rateLimit({
  windowMs: 24 * 60 * 60 * 1000, // 24 hours
  max: 1, // limit each user to 1 request per windowMs
  keyGenerator: function(req, res) {
    return req.user.userId;
  },
  message: "طلب رفع الفيديو مرفوض , يرجى المحاولة بعد 24 ساعة"
});


const getVideoLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 50, // limit each user to 300 requests per windowMs
  keyGenerator: function(req, res) {
    return req.user.userId;
  },
  message: "طلب الفيديو مرفوض , يرجى المحاولة بعد 15 دقيقة"
});


const getFollowingsVideosLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 50, // limit each user to 300 requests per windowMs
  keyGenerator: function(req, res) {
    return req.user.userId;
  },
  message: "طلب الفيديو مرفوض , يرجى المحاولة بعد 15 دقيقة"
});

const getFollowersVideosLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 50, // limit each user to 300 requests per windowMs
  keyGenerator: function(req, res) {
    return req.user.userId;
  },
  message: "طلب الفيديو مرفوض , يرجى المحاولة بعد 15 دقيقة"
});

const updateVideoDescriptionLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10, // limit each user to 10 requests per windowMs
  keyGenerator: function(req, res) {
    return req.user.userId;
  },
  message: "طلب تحديث الفيديو مرفوض , يرجى المحاولة بعد ساعة"
});

const likeAndUnlikeVideoLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each user to 100 requests per windowMs
  keyGenerator: function(req, res) {
    return req.user.userId;
  },
  message: "طلب الاعجاب بالفيديو مرفوض , يرجى المحاولة بعد 15 دقيقة"
});

const shareVideoLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 50, // limit each user to 50 requests per windowMs
  keyGenerator: function(req, res) {
    return req.user.userId;
  },
  message: "طلب مشاركة الفيديو مرفوض , يرجى المحاولة بعد 15 دقيقة"
});

const viewVideoLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 50, // limit each user to 50 requests per windowMs
  keyGenerator: function(req, res) {
    return req.user.userId;
  },
  message: "طلب مشاهدة الفيديو مرفوض , يرجى المحاولة بعد 15 دقيقة"
});

const searchVideosLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 200, // limit each user to 100 requests per windowMs
  keyGenerator: function(req, res) {
    return req.user.userId;
  },
  message: "طلب البحث عن الفيديو مرفوض , يرجى المحاولة بعد 15 دقيقة"
});

const autocompleteVideosLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each user to 100 requests per windowMs
  keyGenerator: function(req, res) {
    return req.user.userId;
  },
  message: "طلب البحث عن الفيديو مرفوض , يرجى المحاولة بعد 15 دقيقة"
});

const deleteVideoLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // limit each user to 10 requests per windowMs
  keyGenerator: function(req, res) {
    return req.user.userId;
  },
  message: "طلب حذف الفيديو مرفوض , يرجى المحاولة بعد 15 دقيقة"
});

const getCreatorCommentsLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 200, // limit each user to 200 requests per windowMs
  keyGenerator: function(req, res) {
    return req.user.userId;
  },
  message: "طلب الحصول على التعليقات مرفوض , يرجى المحاولة بعد 15 دقيقة"
});

const getCommentsUsingPaginationLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 200, // limit each user to 200 requests per windowMs
  keyGenerator: function(req, res) {
    return req.user.userId;
  },
  message: "طلب الحصول على التعليقات مرفوض , يرجى المحاولة بعد 15 دقيقة"
});

const getVideoRatesLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each user to 100 requests per windowMs
  keyGenerator: function(req, res) {
    return req.user.userId;
  },
  message: "طلب الحصول على تقييمات الفيديو مرفوض , يرجى المحاولة بعد 15 دقيقة"
});



module.exports = {
    uploadVideoLimiter,
    getVideoLimiter,
    getFollowingsVideosLimiter,
    getFollowersVideosLimiter,
    updateVideoDescriptionLimiter,
    likeAndUnlikeVideoLimiter,
    shareVideoLimiter,
    viewVideoLimiter,
    searchVideosLimiter,
    autocompleteVideosLimiter,
    deleteVideoLimiter,
    getCreatorCommentsLimiter,
    getCommentsUsingPaginationLimiter,
    getVideoRatesLimiter
}
