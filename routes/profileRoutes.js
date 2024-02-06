const express = require("express");
const router = express.Router();
const multer = require('multer');
const upload = multer({ storage: multer.memoryStorage() });


const {
    getUserProfile,
    getOtherUserProfile,
    changeProfileImage,
    changeProfilePassword,
    changeProfileName,
    sendVerificationToNewEmail,
    verificationAndSetNewEmail,
    changeProfilePhone,
    changeProfileUsername,
    changeProfileBio,
    getProfileImage,
    getOtherUserProfileImage,
    
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
 *       - in: header
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
 *       - in: header
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

/**
 * @swagger
 * /api/profile/change-profile-image:
 *   post:
 *     summary: Change profile image
 *     description: This API is used to change the profile image of the user. It requires a valid JWT token in the Authorization header and an X-API-KEY in the X-API-KEY header. The user must send an image as multipart/form-data. The image will be analyzed for inappropriate content before updating the profile picture.
 *     security:
 *      - bearerAuth: []
 *     consumes:
 *      - multipart/form-data
 *     parameters:
 *      - in: header
 *        name: X-API-KEY
 *        required: true
 *        schema:
 *          type: string
 *        description: API key
 *      - in: formData
 *        name: image
 *        description: The uploaded file data
 *        required: true
 *        schema:
 *          type: file
 *     responses:
 *       200:
 *         description: Profile picture changed successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *       400:
 *         description: Invalid image format, image dimensions too small, or inappropriate content
 *       404:
 *         description: User or Profile not found
 *       500:
 *         description: Internal Server Error
 */
router.post("/change-profile-image", upload.single("image"), (req, res, next) => {
    console.log(req.file);
    console.log(req.body);
    next();
  }, changeProfileImage);


/**
 * @swagger
 * /api/profile/get-profile-image:
 *   get:
 *     summary: Get user's profile image
 *     description: |
 *       This API is used to get the profile image of the authenticated user. It requires a valid JWT token in the Authorization header and an X-API-KEY in the X-API-KEY header.
 *     security:
 *      - bearerAuth: []
 *      parameters:
 *       - in: header
 *         name: X-API-KEY
 *         required: true
 *         schema:
 *           type: string
 *         description: API key
 *     responses:
 *       200:
 *         description: Successful response
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 imageUrl:
 *                   type: string
 *       404:
 *         description: User or Profile not found, or Profile Image not found
 *       500:
 *         description: Internal Server Error
 */
router.get("/get-profile-image", getProfileImage);

/**
 * @swagger
 * /api/profile/get-other-user-profile-image/{otherUserId}:
 *   get:
 *     summary: Get other user's profile image
 *     description: |
 *       This API is used to get the profile image of another user. It requires a valid JWT token in the Authorization header and an X-API-KEY in the X-API-KEY header.
 *     security:
 *      - bearerAuth: []
 *      parameters:
 *       - in: header
 *         name: X-API-KEY
 *         required: true
 *         schema:
 *           type: string
 *         description: API key
 *       - in: path
 *         name: otherUserId
 *         required: true
 *         description: ID of the other user
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Successful response
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 otherUserImageUrl:
 *                   type: string
 *       404:
 *         description: User or other user not found, or Profile Image not found
 *       500:
 *         description: Internal Server Error
 */
router.get("/get-other-user-profile-image/{otherUserId}", getOtherUserProfileImage);


/**
 * @swagger
 * /api/profile/change-profile-password:
 *   post:
 *     summary: Change profile password
 *     description: |
 *       This API is used to change the profile password of the user. It requires a valid JWT token in the Authorization header.
 *     security:
 *      - bearerAuth: []
 *      parameters:
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

 * /api/profile/change-profile-name:
 *   post:
 *     summary: Change profile name
 *     description: |
 *       This API is used to change the profile name of the user. It requires a valid JWT token in the Authorization header.
 *     security:
 *      - bearerAuth: []
 *      parameters:
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
 * /api/profile/change-profile-phone:
 *   post:
 *     summary: Change profile phone
 *     description: |
 *       This API is used to change the profile phone of the user. It requires a valid JWT token in the Authorization header.
 *     security:
 *      - bearerAuth: []
 *      parameters:
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

 * /api/profile/change-profile-username:
 *   post:
 *     summary: Change profile username
 *     description: |
 *       This API is used to change the profile username of the user. It requires a valid JWT token in the Authorization header.
 *     security:
 *      - bearerAuth: []
 *      parameters:
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

 * /api/profile/change-profile-bio:
 *   post:
 *     summary: Change profile bio
 *     description: |
 *       This API is used to change the profile bio of the user. It requires a valid JWT token in the Authorization header.
 *     security:
 *      - bearerAuth: []
 *      parameters:
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
 * /api/profile/change-profile-email/send-verification:
 *   post:
 *     summary: Send verification code to new email
 *     description: |
 *       This API is used to send a verification code to the new email for changing the user's profile email.
 *       It requires a valid JWT token in the Authorization header.
 *     security:
 *      - bearerAuth: []
 *      parameters:
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

 * /api/profile/change-profile-email/verify-and-set-new-email:
 *   post:
 *     summary: Verify code and set new email
 *     description: |
 *       This API is used to verify the code and set the new email for changing the user's profile email.
 *       It requires a valid JWT token in the Authorization header.
 *     security:
 *      - bearerAuth: []
 *      parameters:
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