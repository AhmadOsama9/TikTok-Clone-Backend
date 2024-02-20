const express = require("express");
const router = express.Router();

const {
    signup,
    verifyEmailCode,
    login,
    sendOtp,
    verifyOtpAndSetNewPassword,
    sendVerificationCode,
    checkBanStatus,
    referredUser,
    searchUsersUsingPagination,
    autocompleteUsers,
} = require("../controllers/userController");

/**
 * @swagger
 * /api/user/signup:
 *   post:
 *     tags:
 *      - Users
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
 *               username:
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
 *     tags:
 *      - Users
 *     summary: Verify the email code for a user
 *     description: Verify the email code for a user and mark the user's email as verified. Returns a JWT token and user data. Requires email and code in the request body.
 *     parameters:
 *     - in: header
 *       name: X-API-KEY
 *       required: true
 *       schema:
 *        type: string
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
 *                 uid:
 *                   type: string
 *                 name:
 *                   type: string
 *                 email:
 *                   type: string
 *                 token:
 *                   type: string
 *                 phone:
 *                   type: string
 *                 isverified:
 *                   type: boolean
 *                 referralCode:
 *                   type: string
 *                 userName:
 *                   type: string
 *       400:
 *         description: Verification failed
 *       500:
 *         description: Server error
 */
router.post("/verify-email-code", verifyEmailCode);

/**
 * @swagger
 * /api/user/login:
 *   post:
 *     tags:
 *      - Users
 *     summary: Log in a user
 *     description: Log in a user and return a JWT token and user data. If the user is banned or email is not verified, a status of 403 or 400 is returned respectively. Requires email and password in the request body.
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
 *                 uid:
 *                   type: string
 *                 name:
 *                   type: string
 *                 email:
 *                   type: string
 *                 token:
 *                   type: string
 *                 phone:
 *                   type: string
 *                 isverified:
 *                   type: boolean
 *                 referralCode:
 *                   type: string
 *                 userName:
 *                   type: string
 *       400:
 *         description: Login failed or Email not verified
 *       403:
 *         description: User is banned
 *       500:
 *         description: Server error
 */
router.post("/login", login);

/**
 * @swagger
 * /api/user/forgot-password/send-otp:
 *   post:
 *     tags:
 *      - Users
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
 *     tags:
 *      - Users
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
 *     tags:
 *      - Users
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

/**
 * @swagger
 * /api/user/check-ban-status:
 *   get:
 *     tags:
 *      - Users
 *     security:
 *       - bearerAuth: []
 *     summary: Check if a user is banned
 *     description: Check if the authenticated user is banned. Requires a Bearer token in the Authorization header.
 *     parameters:
 *      - in: header
 *        name: X-API-KEY
 *        required: true
 *        schema:
 *          type: string
 *        description: API key
 *     responses:
 *       200:
 *         description: User is not banned
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *       400:
 *         description: User with this id does not exist
 *       403:
 *         description: User is banned
 *       500:
 *         description: Server error
 */
router.get("/check-ban-status", checkBanStatus);

/**
 * @swagger
 * /api/user/refer-user:
 *   post:
 *     tags:
 *       - Users
 *     security:
 *       - bearerAuth: []
 *     summary: Refer a user
 *     description: Refer a user using their referral code. Requires a Bearer token in the Authorization header.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               referralCode:
 *                 type: string
 *             required:
 *               - referralCode
 *     responses:
 *       200:
 *         description: User referred successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "You have been referred successfully"
 *       400:
 *         description: Bad request, e.g., missing referral code or referring oneself
 *       500:
 *         description: Server error
 */
router.post("/refer-user", referredUser);

/**
 * @swagger
 * /api/user/search?username=ahmed&offset=10:
 *   get:
 *     tags:
 *      - Users
 *     security:
 *       - bearerAuth: []
 *     summary: Search users with pagination
 *     description: Search for users whose username contains the specified term. Returns the top 5 matches from the specified page. Requires a Bearer token in the Authorization header.
 *     parameters:
 *      - in: query
 *        name: username
 *        required: true
 *        schema:
 *          type: string
 *        description: The search term
 *      - in: query
 *        name: offset
 *        schema:
 *          type: integer
 *        description: The number of users to skip before starting to return the matches
 *     responses:
 *       200:
 *         description: The search results
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
 *                       id:
 *                         type: integer
 *                       username:
 *                         type: string
 *                       Profile:
 *                         type: object
 *                         properties:
 *                           imageFileName:
 *                             type: string
 *                           imageURL:
 *                             type: string
 *       400:
 *         description: Username is required
 *       500:
 *         description: Server error
 */
router.get("/search", searchUsersUsingPagination);

/**
 * @swagger
 * /api/user/autocomplete?username=ahmed:
 *   get:
 *     tags:
 *      - Users
 *     security:
 *       - bearerAuth: []
 *     summary: Autocomplete user search
 *     description: Search for users whose username starts with the specified term. Returns the top 5 matches. Requires a Bearer token in the Authorization header.
 *     parameters:
 *      - in: query
 *        name: username
 *        required: true
 *        schema:
 *          type: string
 *        description: The search term
 *     responses:
 *       200:
 *         description: The search results
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
 *                       id:
 *                         type: integer
 *                       username:
 *                         type: string
 *                       Profile:
 *                         type: object
 *                         properties:
 *                           imageFileName:
 *                             type: string
 *                           imageURL:
 *                             type: string
 *       400:
 *         description: Username is required
 *       500:
 *         description: Server error
 */
router.get("/autocomplete", autocompleteUsers);

module.exports = router;