const rateLimit = require("express-rate-limit");

// Define rate limiters
const getUserProfileLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each user to 100 requests per windowMs
  keyGenerator: function(req, res) {
    return req.user.userId;
  },
  message: "طلبات استرجاع الصفحة الشخصية كثيرة جدا، الرجاء المحاولة بعد 15 دقيقة"
});

const getOtherUserProfileLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 300, // limit each user to 300 requests per windowMs
  keyGenerator: function(req, res) {
    return req.user.userId;
  },
  message: "طلبات استرجاع الصفحة الشخصية كثيرة جدا، الرجاء المحاولة بعد 15 دقيقة"
});

const changeProfileImageLimiter = rateLimit({
  windowMs: 24 * 60 * 60 * 1000, // 24 hours (1 day)
  max: 3, // limit each user to 3 requests per windowMs (day)
  keyGenerator: function(req, res) {
    return req.user.userId;
  },
  message: "طلبات تغيير الصورة الشخصية كثيرة جدا، الرجاء المحاولة بعد 24 ساعة"
});


const changeProfilePasswordLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 15 minutes
  max: 5, // limit each user to 5 requests per windowMs
  keyGenerator: function(req, res) {
    return req.user.userId;
  },
  message: "طلبات تغيير كلمة المرور كثيرة جدا، الرجاء المحاولة بعد 15 دقيقة"
});

const changeProfileNameLimiter = rateLimit({
  windowMs: 24 * 60 * 60 * 1000, // 24 hours
  max: 30, // limit each user to 30 requests per windowMs
  keyGenerator: function(req, res) {
    return req.user.userId;
  },
  message: "طلبات تغيير الاسم كثيرة جدا، الرجاء المحاولة بعد 24 ساعة"
});

const changeProfilePhoneLimiter = rateLimit({
  windowMs: 24 * 60 * 60 * 1000, // 1 hour
  max: 2, // limit each user to 2 requests per windowMs
  keyGenerator: function(req, res) {
    return req.user.userId;
  },
  message: "طلبات تغيير رقم الهاتف كثيرة جدا، الرجاء المحاولة بعد 24 ساعة"
});

const changeProfileUsernameLimiter = rateLimit({
  windowMs: 3 * 24 * 60 * 60 * 1000, // 3 days
  max: 1, // limit each user to 1 requests per windowMs
  keyGenerator: function(req, res) {
    return req.user.userId;
  },
  message: "طلبات تغيير اسم المستخدم كثيرة جدا، الرجاء المحاولة بعد 3 أيام"
});

const changeProfileBioLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10, // limit each user to 10 requests per windowMs
  keyGenerator: function(req, res) {
    return req.user.userId;
  },
  message: "طلبات تغيير السيرة الذاتية كثيرة جدا، الرجاء المحاولة بعد 1 ساعة"
});

const sendVerificationToNewEmailLimiter = rateLimit({
  windowMs: 3 * 24 * 60 * 60 * 1000, // 3 days
  max: 1, // limit each user to 1 requests per windowMs
  keyGenerator: function(req, res) {
    return req.user.userId;
  },
  message: "طلبات تغيير البريد الإلكتروني كثيرة جدا، الرجاء المحاولة بعد 3 أيام"
});

const verificationAndSetNewEmailLimiter = rateLimit({
  windowMs: 3 * 24 * 60 * 60 * 1000, // 3 days
  max: 1, // limit each user to 1 requests per windowMs
  keyGenerator: function(req, res) {
    return req.user.userId;
  },
  message: "طلبات تأكيد البريد الإلكتروني كثيرة جدا، الرجاء المحاولة بعد 3 أيام"
});

const getUserVideosLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each user to 100 requests per windowMs
  keyGenerator: function(req, res) {
    return req.user.userId;
  },
  message: "طلبات استرجاع الفيديوهات كثيرة جدا، الرجاء المحاولة بعد 15 دقيقة"
});

const getOtherUserVideosLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 300, // limit each user to 100 requests per windowMs
  keyGenerator: function(req, res) {
    return req.user.userId;
  },
  message: "طلبات استرجاع الفيديوهات كثيرة جدا، الرجاء المحاولة بعد 15 دقيقة"
});

const getFollowersLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each user to 100 requests per windowMs
  keyGenerator: function(req, res) {
    return req.user.userId;
  },
  message: "طلبات استرجاع المتابعين كثيرة جدا، الرجاء المحاولة بعد 15 دقيقة"
});

const getOtherUserFollowersLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each user to 100 requests per windowMs
  keyGenerator: function(req, res) {
    return req.user.userId;
  },
  message: "طلبات استرجاع المتابعين كثيرة جدا، الرجاء المحاولة بعد 15 دقيقة"
});

const getFollowingsLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each user to 100 requests per windowMs
  keyGenerator: function(req, res) {
    return req.user.userId;
  },
  message: "طلبات استرجاع المتابعون كثيرة جدا، الرجاء المحاولة بعد 15 دقيقة"
});



module.exports = {
    getUserProfileLimiter,
    getOtherUserProfileLimiter,
    changeProfileImageLimiter,
    changeProfilePasswordLimiter,
    changeProfileNameLimiter,
    changeProfilePhoneLimiter,
    changeProfileUsernameLimiter,
    changeProfileBioLimiter,
    sendVerificationToNewEmailLimiter,
    verificationAndSetNewEmailLimiter,
    getUserVideosLimiter,
    getOtherUserVideosLimiter,
    getFollowersLimiter,
    getOtherUserFollowersLimiter,
    getFollowingsLimiter
}



