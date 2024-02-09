const express = require("express");
const router = express.Router();

const {
    signup,
    verifyEmailCode,
    login,
    sendOtp,
    verifyOtpAndSetNewPassword,
    sendVerificationCode,
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
 * /api/user/forgot-password/send-otp:
 *   post:
 *     summary: Send OTP
 *     description: This API is used to send a One-Time Password (OTP) to the user's email. It requires the user's email in the request body.
 *     parameters:
 *      - in: header
 *        name: X-API-KEY
 *        required: true
 *        schema:
 *          type: string
 *        description: API key
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *                 description: The user's email
 *     responses:
 *       200:
 *         description: OTP sent successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *       400:
 *         description: Invalid email address or User with this email does not exist
 *       500:
 *         description: Internal Server Error
 */
router.post("/forgot-password/send-otp", sendOtp);

/**
 * @swagger
 * /api/user/forgot-password/verify-otp-and-set-new-password:
 *   post:
 *     summary: Verify OTP and set new password
 *     description: This API is used to verify the OTP and set a new password for the user. It requires the user's email, OTP, and new password in the request body.
 *     parameters:
 *      - in: header
 *        name: X-API-KEY
 *        required: true
 *        schema:
 *          type: string
 *        description: API key
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *                 description: The user's email
 *               otp:
 *                 type: string
 *                 description: The OTP
 *               newPassword:
 *                 type: string
 *                 description: The new password
 *     responses:
 *       200:
 *         description: Password has been changed successfully
 *       400:
 *         description: User with this email does not exist, Invalid OTP, or OTP expired
 *       500:
 *         description: Internal Server Error
 */
router.post("/forgot-password/verify-otp-and-set-new-password", verifyOtpAndSetNewPassword);

/**
 * @swagger
 * /api/user/send-verification-code:
 *   post:
 *     summary: Send Verification Code
 *     description: This API is used to send a verification code to the user's email. It requires the user's email in the request body.
 *     parameters:
 *      - in: header
 *        name: X-API-KEY
 *        required: true
 *        schema:
 *          type: string
 *        description: API key
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *                 description: The user's email
 *     responses:
 *       200:
 *         description: Verification code sent to your email
 *       400:
 *         description: User with this email does not exist or Email already verified
 *       500:
 *         description: Internal Server Error
 */
router.post("/send-verification-code", sendVerificationCode);

module.exports = router;