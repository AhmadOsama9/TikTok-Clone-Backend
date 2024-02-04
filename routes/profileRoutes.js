const express = require("express");
const router = express.Router();

const {
    getUserProfile,
    getOtherUserProfile,
    changeProfilePhoto,
    changeProfilePassword,
    changeProfileName,
    sendVerificationToNewEmail,
    verificationAndSetNewEmail,
    changeProfilePhone,
    changeProfileUsername,
    changeProfileBio
    
} = require("../controllers/profileController");

/**
 * @swagger
 * /api/profile:
 *   get:
 *     summary: Retrieve the user's profile
 *     description: Retrieve the user's profile. Only authenticated users can access this route.
 *     security:
 *      - bearerAuth: []
 *     parameters:
 *             - in: header
 *         name: X-API-KEY
 *         required: true
 *         schema:
 *           type: string
 *         description: API key
 *     responses:
 *       200:
 *         description: The user's profile
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 bio:
 *                   type: string
 *                 followersCount:
 *                   type: integer
 *                 followingCount:
 *                   type: integer
 *                 followersIds:
 *                   type: array
 *                   items:
 *                     type: integer
 *                 followingIds:
 *                   type: array
 *                   items:
 *                     type: integer
 *                 videos:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: integer
 *                       thumbnailUrl:
 *                         type: string
 *                       likesOnTheVideo:
 *                         type: integer
 *                       commentsOnTheVideo:
 *                         type: integer
 *                       sharesCountOfVideo:
 *                         type: integer
 *                       viewsOnTheVideo:
 *                         type: integer
 *                 profilePicture:
 *                   type: string
 *                 numberOfVideos:
 *                   type: integer
 *                 isPopular:
 *                   type: boolean
 *                 balance:
 *                   type: integer
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal Server Error
 */
router.get("/profile", getUserProfile);

/**
 * @swagger
 * /api/profile/{userId}:
 *   get:
 *     summary: Retrieve another user's profile
 *     description: Retrieve another user's profile. Only authenticated users can access this route.
 *     security:
 *      - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         description: Numeric ID of the user to retrieve
 *         schema:
 *           type: string
 *             - in: header
 *         name: X-API-KEY
 *         required: true
 *         schema:
 *           type: string
 *         description: API key
 *     responses:
 *       200:
 *         description: The user's profile
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 bio:
 *                   type: string
 *                 followersCount:
 *                   type: integer
 *                 followingCount:
 *                   type: integer
 *                 followersIds:
 *                   type: array
 *                   items:
 *                     type: integer
 *                 followingIds:
 *                   type: array
 *                   items:
 *                     type: integer
 *                 videos:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: integer
 *                       thumbnailUrl:
 *                         type: string
 *                       likesOnTheVideo:
 *                         type: integer
 *                       commentsOnTheVideo:
 *                         type: integer
 *                       sharesCountOfVideo:
 *                         type: integer
 *                       viewsOnTheVideo:
 *                         type: integer
 *                 profilePicture:
 *                   type: string
 *                 numberOfVideos:
 *                   type: integer
 *                 isPopular:
 *                   type: boolean
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: User not found
 *       500:
 *         description: Internal Server Error
 */
router.get("/profile/:userId", getOtherUserProfile);


router.post("/change-profile-photo", changeProfilePhoto);
/**
 * @swagger
 * /api/user/change-profile-password:
 *   post:
 *     summary: Change profile password
 *     description: |
 *       This API is used to change the profile password of the user. It requires a valid JWT token in the Authorization header.
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
 *             oldPassword:
 *               type: string
 *               description: The old password
 *             newPassword:
 *               type: string
 *               description: The new password
 *     responses:
 *       200:
 *         description: Password changed successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *       400:
 *         description: User not found or Invalid password
 *       500:
 *         description: Internal Server Error

 * /api/user/change-profile-name:
 *   post:
 *     summary: Change profile name
 *     description: |
 *       This API is used to change the profile name of the user. It requires a valid JWT token in the Authorization header.
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
 *             newName:
 *               type: string
 *               description: The new name
 *     responses:
 *       200:
 *         description: Profile name changed successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *       400:
 *         description: User not found
 *       500:
 *         description: Internal Server Error
 */
router.post("/change-profile-password", changeProfilePassword);
router.post("/change-profile-name", changeProfileName);

/**
 * @swagger
 * /api/user/change-profile-phone:
 *   post:
 *     summary: Change profile phone
 *     description: |
 *       This API is used to change the profile phone of the user. It requires a valid JWT token in the Authorization header.
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
 *             newPhone:
 *               type: string
 *               description: The new phone number
 *     responses:
 *       200:
 *         description: Phone changed successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *       400:
 *         description: User not found or Phone already exists
 *       500:
 *         description: Internal Server Error

 * /api/user/change-profile-username:
 *   post:
 *     summary: Change profile username
 *     description: |
 *       This API is used to change the profile username of the user. It requires a valid JWT token in the Authorization header.
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
 *             newUsername:
 *               type: string
 *               description: The new username
 *     responses:
 *       200:
 *         description: Username changed successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *       400:
 *         description: User not found or Username already exists
 *       500:
 *         description: Internal Server Error

 * /api/user/change-profile-bio:
 *   post:
 *     summary: Change profile bio
 *     description: |
 *       This API is used to change the profile bio of the user. It requires a valid JWT token in the Authorization header.
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
 *             newBio:
 *               type: string
 *               description: The new bio
 *     responses:
 *       200:
 *         description: Profile bio changed successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *       400:
 *         description: Profile not found
 *       500:
 *         description: Internal Server Error
 */
router.post("/change-profile-phone", changeProfilePhone);
router.post("/change-profile-username", changeProfileUsername);
router.post("/change-profile-bio", changeProfileBio);

/**
 * @swagger
 * /api/user/change-profile-email/send-verification:
 *   post:
 *     summary: Send verification code to new email
 *     description: |
 *       This API is used to send a verification code to the new email for changing the user's profile email.
 *       It requires a valid JWT token in the Authorization header.
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
 *             newEmail:
 *               type: string
 *               description: The new email address to be verified
 *     responses:
 *       200:
 *         description: Verification code sent successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *       400:
 *         description: User not found, Email already exists, or Invalid email format
 *       500:
 *         description: Internal Server Error

 * /api/user/change-profile-email/verify-and-set-new-email:
 *   post:
 *     summary: Verify code and set new email
 *     description: |
 *       This API is used to verify the code and set the new email for changing the user's profile email.
 *       It requires a valid JWT token in the Authorization header.
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
 *             verificationCode:
 *               type: string
 *               description: The verification code sent to the new email
 *             newEmail:
 *               type: string
 *               description: The new email address to be set after verification
 *     responses:
 *       200:
 *         description: Email changed successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *       400:
 *         description: User not found, Invalid verification code, Verification code expired, or Internal Server Error
 *       500:
 *         description: Internal Server Error
 */
router.post("/change-profile-email/send-verification", sendVerificationToNewEmail);
router.post("/change-profile-email/verify-and-set-new-email", verificationAndSetNewEmail);

module.exports = router;