const rateLimit = require('express-rate-limit');

const generalLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100,
    keyGenerator: function (req) {
        return req.user ? req.user.userId : req.ip;
    }
});

const videoUploadLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 3,
    keyGenerator: function (req) {
        return req.user ? req.user.userId : req.ip;
    }
});

const imageUploadLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 mintues
    max: 5,
    keyGenerator: function (req) {
        return req.user ? req.user.userId : req.ip;
    }
});

module.exports = {
    generalLimiter,
    videoUploadLimiter,
    imageUploadLimiter
}