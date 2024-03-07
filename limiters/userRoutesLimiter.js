const rateLimit = require("express-rate-limit");

// Define rate limiters
const signupLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // limit each IP to 5 requests per windowMs
  message: "Too many accounts created from this IP, please try again after 15 minutes"
});

const verifyEmailCodeLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10, // limit each IP to 10 requests per windowMs
  message: "Too many verification attempts from this IP, please try again after an hour"
});

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // limit each IP to 5 requests per windowMs
  message: "Too many login attempts from this IP, please try again after 15 minutes"
});

const sendOtpLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 5, // limit each IP to 5 requests per windowMs
  message: "Too many OTP requests from this IP, please try again after an hour"
});


const verifyOtpAndSetNewPasswordLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // limit each IP to 5 requests per windowMs
  message: "Too many password reset attempts from this IP, please try again after 15 minutes"
});

const sendVerificationCodeLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 5, // limit each IP to 5 requests per windowMs
  message: "Too many verification code requests from this IP, please try again after an hour"
});


const checkBanStatusLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // limit each user to 100 requests per windowMs
    keyGenerator: function(req, res) {
      return req.user.userId;
    },
    message: "Too many ban status check requests, please try again after 15 minutes"
});
  
const banUserLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 10, // limit each user to 10 requests per windowMs
    keyGenerator: function(req, res) {
      return req.user.userId;
    },
    message: "Too many user ban requests, please try again after an hour"
});

const unbanUserLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10, // limit each IP to 10 requests per windowMs
  keyGenerator: function(req, res) {
    return req.user.userId;
  },
  message: "Too many unban requests from this IP, please try again after an hour"
});

//that means I'm also limiting the admin
//lol whatever he should be doing his job
//and not accumulating requests
const setUserIsVerifiedLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10, // limit each IP to 10 requests per windowMs
  keyGenerator: function(req, res) {
    return req.user.userId;
  }, 
  message: "Too many verification requests from this IP, please try again after an hour"
});

const getUserInfoLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  keyGenerator: function(req, res) {
    return req.user.userId;
  },
  message: "Too many user info requests from this IP, please try again after 15 minutes"
});

const referredUserLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10, // limit each IP to 10 requests per windowMs
  keyGenerator: function(req, res) {
    return req.user.userId;
  },
  message: "Too many referral requests from this IP, please try again after an hour"
});

const searchUsersUsingPaginationLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  keyGenerator: function(req, res) {
    return req.user.userId;
  },
  message: "Too many search requests from this IP, please try again after 15 minutes"
});

const autocompleteLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // limit each user to 100 requests per windowMs
    keyGenerator: function(req, res) {
      // Extract the user ID from the JWT. This assumes that you have middleware in place to decode the JWT and add the user object to the request.
      return req.user.userId;
    },
    message: "Too many autocomplete requests, please try again after 15 minutes"
});

module.exports = {
  signupLimiter,
  verifyEmailCodeLimiter,
  loginLimiter,
  sendOtpLimiter,
  verifyOtpAndSetNewPasswordLimiter,
  sendVerificationCodeLimiter,
  checkBanStatusLimiter,
  banUserLimiter,
  unbanUserLimiter,
  setUserIsVerifiedLimiter,
  getUserInfoLimiter,
  referredUserLimiter,
  searchUsersUsingPaginationLimiter,
  autocompleteLimiter
};




