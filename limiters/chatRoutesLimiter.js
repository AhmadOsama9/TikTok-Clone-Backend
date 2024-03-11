const rateLimit = require("express-rate-limit");

// Define rate limiters
const sendMessageUsingChatIdLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 500, // limit each user to 500 requests per windowMs
  keyGenerator: function(req, res) {
    return req.user.userId;
  },
  message: "Too many message send requests, please try again after an hour"
});

const sendMessageUsingReceiverIdLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 500, // limit each user to 500 requests per windowMs
  keyGenerator: function(req, res) {
    return req.user.userId;
  },
  message: "Too many message send requests, please try again after an hour"
});

const getMessagesUsingPaginationLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 600, // limit each user to 100 requests per windowMs
  keyGenerator: function(req, res) {
    return req.user.userId;
  },
  message: "Too many message retrieval requests, please try again after 15 minutes"
});

const getMessageUsingIdLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 500, // limit each user to 100 requests per windowMs
  keyGenerator: function(req, res) {
    return req.user.userId;
  },
  message: "Too many message retrieval requests, please try again after 15 minutes"
});

const getMessagesBetweenUsersUsingPaginationLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 500, // limit each user to 100 requests per windowMs
  keyGenerator: function(req, res) {
    return req.user.userId;
  },
  message: "Too many message retrieval requests, please try again after 15 minutes"
});

const getUserChatsLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 500, // limit each user to 100 requests per windowMs
  keyGenerator: function(req, res) {
    return req.user.userId;
  },
  message: "Too many chat retrieval requests, please try again after 15 minutes"
});

const addReactionToMessageLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 1 hour
  max: 600, // limit each user to 500 requests per windowMs
  keyGenerator: function(req, res) {
    return req.user.userId;
  },
  message: "Too many reaction addition requests, please try again after an hour"
});

const deleteMessageLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 1 hour
  max: 500, // limit each user to 100 requests per windowMs
  keyGenerator: function(req, res) {
    return req.user.userId;
  },
  message: "Too many message deletion requests, please try again after an hour"
});

const deleteReactionLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 1 hour
  max: 500, // limit each user to 100 requests per windowMs
  keyGenerator: function(req, res) {
    return req.user.userId;
  },
  message: "Too many reaction deletion requests, please try again after an hour"
});

module.exports = {
    sendMessageUsingChatIdLimiter,
    sendMessageUsingReceiverIdLimiter,
    getMessagesUsingPaginationLimiter,
    getMessageUsingIdLimiter,
    getMessagesBetweenUsersUsingPaginationLimiter,
    getUserChatsLimiter,
    addReactionToMessageLimiter,
    deleteMessageLimiter,
    deleteReactionLimiter
}

