const express = require("express");
const router = express.Router();

const {
    sendMessageUsingChatId,
    sendMessageUsingReceiverId,
    getMessagesUsingPagination,
    getMessagesBetweenUsers,
    getUserChats,
} = require("../controllers/chatController");

/**
 * @swagger
 * /api/chat/send-message-using-chatId:
 *   post:
 *     tags:
 *       - Chat
 *     summary: Send a message in a specific chat
 *     operationId: sendMessageUsingChatId
 *     security:
 *      - bearerAuth: []
 *     parameters:
 *       - in: header
 *         name: Authorization
 *         schema:
 *           type: string
 *         required: true
 *         description: The JWT token of the user.
 *       - in: header
 *         name: X-API-KEY
 *         schema:
 *           type: string
 *         required: true
 *         description: The API key.
 *     requestBody:
 *       description: Message data
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               chatId:
 *                 type: integer
 *                 description: The ID of the chat
 *               message:
 *                 type: string
 *                 description: The content of the message
 *     responses:
 *       '200':
 *         description: Message sent successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Message sent successfully
 *       '404':
 *         description: Chat not found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Chat not found
 *       '500':
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 */
router.post("/send-message-using-chatId", sendMessageUsingChatId);

/**
 * @swagger
 * /api/chat/send-message-using-receiverId:
 *   post:
 *     tags:
 *       - Chat
 *     summary: Send a message to a specific receiver
 *     operationId: sendMessageUsingReceiverId
 *     security:
 *      - bearerAuth: []
 *     parameters:
 *       - in: header
 *         name: Authorization
 *         schema:
 *           type: string
 *         required: true
 *         description: The JWT token of the user.
 *       - in: header
 *         name: X-API-KEY
 *         schema:
 *           type: string
 *         required: true
 *         description: The API key.
 *     requestBody:
 *       description: Message data
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               receiverId:
 *                 type: integer
 *                 description: The ID of the receiver
 *               message:
 *                 type: string
 *                 description: The content of the message
 *     responses:
 *       '200':
 *         description: Message sent successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Message sent successfully
 *       '500':
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 */
router.post("/send-message-using-receiverId", sendMessageUsingReceiverId);

/**
 * @swagger
 * /api/chat/{chatId}/get-messages?offset=0:
 *   get:
 *     tags:
 *       - Chat
 *     summary: Get messages from a specific chat using pagination
 *     operationId: getMessagesUsingPagination
 *     security:
 *      - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: chatId
 *         schema:
 *           type: integer
 *         required: true
 *         description: Numeric ID of the chat to get messages from
 *       - in: query
 *         name: offset
 *         schema:
 *           type: integer
 *         required: true
 *         description: The offset for pagination
 *       - in: header
 *         name: Authorization
 *         schema:
 *           type: string
 *         required: true
 *         description: The JWT token of the user.
 *       - in: header
 *         name: X-API-KEY
 *         schema:
 *           type: string
 *         required: true
 *         description: The API key.
 *     responses:
 *       '200':
 *         description: Messages retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: integer
 *                   chatId:
 *                     type: integer
 *                   senderId:
 *                     type: integer
 *                   message:
 *                     type: string
 *                   createdAt:
 *                     type: string
 *                   updatedAt:
 *                     type: string
 *       '400':
 *         description: Invalid request
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Invalid request
 *       '404':
 *         description: Chat not found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Chat not found
 *       '500':
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 */
router.get("/:id/get-messages", getMessagesUsingPagination);

/**
 * @swagger
 * /api/chat/{user2Id}/get-messages-between-users?offset=0:
 *   get:
 *     tags:
 *       - Chat
 *     summary: Get messages between two users using pagination
 *     operationId: getMessagesBetweenUsers
 *     security:
 *      - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: user2Id
 *         schema:
 *           type: integer
 *         required: true
 *         description: Numeric ID of the second user
 *       - in: query
 *         name: offset
 *         schema:
 *           type: integer
 *         required: true
 *         description: The offset for pagination
 *       - in: header
 *         name: Authorization
 *         schema:
 *           type: string
 *         required: true
 *         description: The JWT token of the user.
 *       - in: header
 *         name: X-API-KEY
 *         schema:
 *           type: string
 *         required: true
 *         description: The API key.
 *     responses:
 *       '200':
 *         description: Messages retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: integer
 *                   chatId:
 *                     type: integer
 *                   senderId:
 *                     type: integer
 *                   message:
 *                     type: string
 *                   createdAt:
 *                     type: string
 *                   updatedAt:
 *                     type: string
 *       '400':
 *         description: Invalid request
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Invalid request
 *       '404':
 *         description: Chat not found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Chat not found
 *       '500':
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 */
router.get("/:user2Id/get-messages-between-users", getMessagesBetweenUsers);

/**
 * @swagger
 * /api/chat/get:
 *   get:
 *     tags:
 *       - Chat
 *     summary: Get all chats for a user
 *     operationId: getUserChats
 *     security:
 *      - bearerAuth: []
 *     parameters:
 *       - in: header
 *         name: Authorization
 *         schema:
 *           type: string
 *         required: true
 *         description: The JWT token of the user.
 *       - in: header
 *         name: X-API-KEY
 *         schema:
 *           type: string
 *         required: true
 *         description: The API key.
 *     responses:
 *       '200':
 *         description: Chats retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: integer
 *                   user1Id:
 *                     type: integer
 *                   user2Id:
 *                     type: integer
 *                   createdAt:
 *                     type: string
 *                   updatedAt:
 *                     type: string
 *       '500':
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 */
router.get("/get", getUserChats);

module.exports = router;