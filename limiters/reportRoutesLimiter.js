const rateLimit = require("express-rate-limit");

// Define rate limiters
const createReportLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 50, // limit each user to 50 requests per windowMs
  keyGenerator: function(req, res) {
    return req.user.userId;
  },
  message: "Too many report creation requests, please try again after an hour"
});

const updateReportLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 50, // limit each user to 50 requests per windowMs
  keyGenerator: function(req, res) {
    return req.user.userId;
  },
  message: "Too many report update requests, please try again after an hour"
});

const getReportByIdLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each user to 100 requests per windowMs
  keyGenerator: function(req, res) {
    return req.user.userId;
  },
  message: "Too many report retrieval requests, please try again after 15 minutes"
});

const getAllReportsLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each user to 100 requests per windowMs
  keyGenerator: function(req, res) {
    return req.user.userId;
  },
  message: "Too many report retrieval requests, please try again after 15 minutes"
});

const getUnviewedReportsLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each user to 100 requests per windowMs
  keyGenerator: function(req, res) {
    return req.user.userId;
  },
  message: "Too many unviewed report retrieval requests, please try again after 15 minutes"
});

const setReportIsViewedLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 50, // limit each user to 50 requests per windowMs
  keyGenerator: function(req, res) {
    return req.user.userId;
  },
  message: "Too many report view requests, please try again after an hour"
});

const deleteReportLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 50, // limit each user to 50 requests per windowMs
  keyGenerator: function(req, res) {
    return req.user.userId;
  },
  message: "Too many report deletion requests, please try again after an hour"
});

module.exports = {
    createReportLimiter,
    updateReportLimiter,
    getReportByIdLimiter,
    getAllReportsLimiter,
    getUnviewedReportsLimiter,
    setReportIsViewedLimiter,
    deleteReportLimiter
}
