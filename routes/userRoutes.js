const express = require("express");
const router = express.Router();

const {
    signup,
    verifyEmailCode,
    login,
    forgotPassword,
    verifyOtpAndSetNewPassword,
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
 *     description: Verify the email code for a user and mark the user's email as verified. Returns a JWT token, user data and profile data. Requires API key in the X-API-KEY header.
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
 *                 uid:
 *                   type: string
 *                 name:
 *                   type: string
 *                 email:
 *                   type: string
 *                 photoUrl:
 *                   type: string
 *                 phone:
 *                   type: string
 *                 isBanned:
 *                   type: boolean
 *                 followers:
 *                   type: integer
 *                 following:
 *                   type: integer
 *                 isverified:
 *                   type: boolean
 *                 referralCode:
 *                   type: string
 *                 referrals:
 *                   type: integer
 *                 totalLikes:
 *                   type: integer
 *                 userName:
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
 *     description: Log in a user and return a JWT token, user data and profile data. If the user is banned or email is not verified, a status of 403 or 400 is returned respectively. Requires API key in the X-API-KEY header.
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
 *                 uid:
 *                   type: string
 *                 name:
 *                   type: string
 *                 email:
 *                   type: string
 *                 photoUrl:
 *                   type: string
 *                 phone:
 *                   type: string
 *                 isBanned:
 *                   type: boolean
 *                 followers:
 *                   type: integer
 *                 following:
 *                   type: integer
 *                 isverified:
 *                   type: boolean
 *                 referralCode:
 *                   type: string
 *                 referrals:
 *                   type: integer
 *                 totalLikes:
 *                   type: integer
 *                 userName:
 *                   type: string
 *       400:
 *         description: Login failed or Email not verified
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
 *     summary: Send OTP to the user's email
 *     description: This endpoint sends an OTP to the user's email for password reset. Requires API key in the X-API-KEY header.
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
 *        200:
 *         description: Temporary password has been sent to your email
 *       400:
 *         description: User with this email does not exist
 *       500:
 *         description: Server error
 */
router.post("/forgot-password", forgotPassword);

/**
 * @swagger
 * /api/user/verify-otp-and-set-new-password:
 *   post:
 *     summary: Verify OTP and set new password
 *     description: This endpoint verifies the OTP and sets a new password for the user.
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
 *               otp:
 *                 type: string
 *               newPassword:
 *                 type: string
 *     responses:
 *       '200':
 *         description: Password has been changed successfully
 *       '400':
 *         description: User with this email does not exist / Invalid OTP / OTP expired
 *       '500':
 *         description: Server error
 */
router.post("/verify-otp-and-set-new-password", verifyOtpAndSetNewPassword);


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
//router.post("/change-password", changePassword);

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