const express = require("express");
const router = express.Router();

const {
    signup,
    verifyEmailCode,
    login,
    forgotPassword,
    changePassword,
    getAllUsersAndReturnEmails,
} = require("../controllers/userController");
/**
 * @swagger
 * /api/user/signup:
 *   post:
 *     summary: Create a new user and a profile
 *     description: Create a new user and a profile, and send a verification code to the user's email. Requires API key in the X-API-KEY header.
 *     parameters:
 *       - in: header
 *         name: X-API-KEY
 *         required: true
 *         schema:
 *           type: string
 *         description: API key
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               phone:
 *                 type: string
 *               email:
 *                 type: string
 *               password:
 *                 type: string
 *     responses:
 *       200:
 *         description: Success
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *       400:
 *         description: Bad request
 *       403:
 *         description: Invalid API key
 *       500:
 *         description: Internal server error
 */
router.post("/signup", signup);

/**
 * @swagger
 * /api/user/verify-email-code:
 *   post:
 *     summary: Verify the email code for a user
 *     description: Verify the email code for a user and mark the user's email as verified. Requires API key in the X-API-KEY header.
 *     parameters:
 *       - in: header
 *         name: X-API-KEY
 *         required: true
 *         schema:
 *           type: string
 *         description: API key
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *               code:
 *                 type: string
 *     responses:
 *       200:
 *         description: Verification successful
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 token:
 *                   type: string
 *       400:
 *         description: Verification failed
 *       403:
 *         description: Invalid API key
 *       500:
 *         description: Server error
 */
router.post("/verify-email-code", verifyEmailCode);

/**
 * @swagger
 * /api/user/login:
 *   post:
 *     summary: Log in a user
 *     description: Log in a user and return a JWT token. If the user is banned, a status of 403 is returned. Requires API key in the X-API-KEY header.
 *     parameters:
 *       - in: header
 *         name: X-API-KEY
 *         required: true
 *         schema:
 *           type: string
 *         description: API key
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *               password:
 *                 type: string
 *     responses:
 *       200:
 *         description: Login successful
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 token:
 *                   type: string
 *       400:
 *         description: Login failed
 *       403:
 *         description: User is banned or Invalid API key
 *       500:
 *         description: Server error
 */
router.post("/login", login);

/**
 * @swagger
 * /api/user/forgot-password:
 *   post:
 *     summary: Generate a temporary password for a user
 *     description: Generate a temporary password for a user and send it to the user's email. Requires API key in the X-API-KEY header.
 *     parameters:
 *       - in: header
 *         name: X-API-KEY
 *         required: true
 *         schema:
 *           type: string
 *         description: API key
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *     responses:
 *       200:
 *         description: Temporary password has been sent to your email
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *       400:
 *         description: User with this email does not exist
 *       403:
 *         description: Invalid API key
 *       500:
 *         description: Server error
 */
router.post("/forgot-password", forgotPassword);

/**
 * @swagger
 * /api/user/change-password:
 *   post:
 *     summary: Change a user's password
 *     description: Change a user's password. This operation requires a valid JWT and API key in the X-API-KEY header.
 *     parameters:
 *       - in: header
 *         name: X-API-KEY
 *         required: true
 *         schema:
 *           type: string
 *         description: API key
 *     security:
 *      - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               newPassword:
 *                 type: string
 *     responses:
 *       200:
 *         description: Password has been changed successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *       400:
 *         description: User does not exist
 *       401:
 *         description: Invalid token
 *       403:
 *         description: Invalid API key
 *       500:
 *         description: Server error
 */
router.post("/change-password", changePassword);

/**
 * @swagger
 * /api/user/get-all-emails:
 *   get:
 *     summary: Retrieve all user emails
 *     description: Retrieve and return all user emails from the database. Requires API key in the X-API-KEY header.
 *     parameters:
 *       - in: header
 *         name: X-API-KEY
 *         required: true
 *         schema:
 *           type: string
 *         description: API key
 *     responses:
 *       200:
 *         description: A list of user emails.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 users:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       email:
 *                         type: string
 *       403:
 *         description: Invalid API key
 *       500:
 *         description: Server error
 */
router.get("/get-all-emails", getAllUsersAndReturnEmails);

module.exports = router;