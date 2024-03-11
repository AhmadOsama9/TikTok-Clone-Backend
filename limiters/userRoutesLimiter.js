const rateLimit = require("express-rate-limit");

// Define rate limiters
const signupLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 
  max: 10, // limit each IP to 10 requests per windowMs
  message: "طلب تسجيل مرفوض , يرجى المحاولة بعد ساعة"
});

const verifyEmailCodeLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10, // limit each IP to 10 requests per windowMs
  message: "طلب تحقق البريد الالكتروني مرفوض , يرجى المحاولة بعد ساعة"
});

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // limit each IP to 10 requests per windowMs
  message: "طلب تسجيل الدخول مرفوض , يرجى المحاولة بعد 15 دقيقة"
});

const sendOtpLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 15 minutes
  max: 5, // limit each user to 5 requests per windowMs
  message: "طلب ارسال رمز التحقق مرفوض , يرجى المحاولة بعد 15 دقيقة"
});


const verifyOtpAndSetNewPasswordLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // limit each IP to 5 requests per windowMs
  message: "طلب التحقق من رمز التحقق وتعيين كلمة المرور مرفوض , يرجى المحاولة بعد 15 دقيقة"
});

const sendVerificationCodeLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 5, // limit each IP to 5 requests per windowMs
  message: "طلب ارسال رمز التحقق مرفوض , يرجى المحاولة بعد ساعة"
});


const checkBanStatusLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 150, // limit each user to 100 requests per windowMs
  keyGenerator: function (req, res) {
    return req.user.userId;
  },
  message: "طلب التحقق من حالة الحظر مرفوض , يرجى المحاولة بعد 15 دقيقة"
});





//that means I'm also limiting the admin
//lol whatever he should be doing his job
//and not accumulating requests
// don't worry bro, I am handling the Limiters for the admin routes


const referredUserLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 1 hour
  max: 10, // limit each IP to 10 requests per windowMs
  keyGenerator: function (req, res) {
    return req.user.userId;
  },
  message: "طلب المستخدم المحول مرفوض , يرجى المحاولة بعد 15 دقيقة"
});

const searchUsersUsingPaginationLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  keyGenerator: function (req, res) {
    return req.user.userId;
  },
  message: "طلب البحث عن المستخدمين مرفوض , يرجى المحاولة بعد 15 دقيقة"
});


const autocompleteLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each user to 100 requests per windowMs
  keyGenerator: function (req, res) {
    // Extract the user ID from the JWT. This assumes that you have middleware in place to decode the JWT and add the user object to the request.
    return req.user.userId;
  },
  message: "طلب الاكمال التلقائي مرفوض , يرجى المحاولة بعد 15 دقيقة"
});

module.exports = {
  signupLimiter,
  verifyEmailCodeLimiter,
  loginLimiter,
  sendOtpLimiter,
  verifyOtpAndSetNewPasswordLimiter,
  sendVerificationCodeLimiter,
  checkBanStatusLimiter,
  referredUserLimiter,
  searchUsersUsingPaginationLimiter,
  autocompleteLimiter
};




