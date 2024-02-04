const express = require("express");
const router = express.Router();

const { 
    getBalanceAndTransactions, 
    addBalance, 
    sendGift 
} = require("../controllers/transactionController");
/**
 * @swagger
 * /api/user/get-balance-and-transactions:
 *   get:
 *     summary: Get user balance and transactions
 *     description: |
 *       This API is used to get the balance and transaction list of the user. It requires a valid JWT token in the Authorization header
 *       and an API key in the X-API-KEY header. It will return the user's current balance and a list of transactions,
 *       including both sent and received transactions. The amount is positive for received transactions and negative for sent transactions.
 *     parameters:
 *       - in: header
 *         name: Authorization
 *         required: true
 *         description: JWT token
 *         schema:
 *           type: string
 *           format: Bearer <token>
 *       - in: header
 *         name: X-API-KEY
 *         required: true
 *         schema:
 *           type: string
 *         description: API key
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Successful response
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 balance:
 *                   type: number
 *                   description: User's current balance
 *                 transactions:
 *                   type: array
 *                   items:
 *                     $ref: '#/definitions/Transaction'
 *       404:
 *         description: User not found
 *       401:
 *         description: Invalid token or Invalid API key
 *       500:
 *         description: Internal Server Error
 */

/**
 * @swagger
 * definitions:
 *   Transaction:
 *     type: object
 *     properties:
 *       transactionId:
 *         type: integer
 *       amount:
 *         type: number
 *         description: Positive for received transactions, negative for sent transactions
 *       senderId:
 *         type: integer
 *       receiverId:
 *         type: integer
 *       senderUsername:
 *         type: string
 *       receiverUsername:
 *         type: string
 */
router.get("/get-balance-and-transactions", getBalanceAndTransactions);


/**
 * @swagger
 * /api/user/add-balance:
 *   post:
 *     summary: Add balance to the user
 *     description: |
 *       This API is used to add balance to the user. It requires a valid JWT token in the Authorization header
 *       and an API key in the X-API-KEY header. The user must send the code of the card along with the balance to add.
 *     parameters:
 *       - in: header
 *         name: Authorization
 *         required: true
 *         description: JWT token
 *         schema:
 *           type: string
 *           format: Bearer <token>
 *       - in: header
 *         name: X-API-KEY
 *         required: true
 *         schema:
 *           type: string
 *         description: API key
 *       - in: body
 *         name: body
 *         required: true
 *         description: Request body
 *         schema:
 *           type: object
 *           properties:
 *             cardCode:
 *               type: string
 *               description: Code of the card we didn't include that yet
 *             balance:
 *               type: number
 *               description: Amount of balance to add
 *     responses:
 *       200:
 *         description: Balance added successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *       400:
 *         description: Invalid balance or missing card code
 *       404:
 *         description: User not found
 *       500:
 *         description: Internal Server Error
 */
router.post("/add-balance", addBalance);

/**
 * @swagger
 * /api/user/send-gift:
 *   post:
 *     summary: Send a gift to another user
 *     description: |
 *       This API is used to send a gift to another user. It requires a valid JWT token in the Authorization header
 *       and an API key in the X-API-KEY header. The user must send the receiver id and the gift value.
 *       The receiver will receive the money in their balance, and the sender will lose the money from their balance.
 *       A transaction will be added to both the sender and the receiver.
 *     parameters:
 *       - in: header
 *         name: Authorization
 *         required: true
 *         description: JWT token
 *         schema:
 *           type: string
 *           format: Bearer <token>
 *       - in: header
 *         name: X-API-KEY
 *         required: true
 *         schema:
 *           type: string
 *         description: API key
 *       - in: body
 *         name: body
 *         required: true
 *         description: Request body
 *         schema:
 *           type: object
 *           properties:
 *             receiverId:
 *               type: integer
 *               description: ID of the receiver user
 *             amount:
 *               type: number
 *               description: Gift amount
 *     responses:
 *       200:
 *         description: Gift sent successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *       400:
 *         description: Invalid balance, missing receiver ID, or invalid API key
 *       401:
 *         description: Invalid token
 *       404:
 *         description: User not found or Receiver not found
 *       500:
 *         description: Insufficient balance or Internal Server Error
 */
router.post("/send-gift", sendGift);


module.exports = router;