const express = require("express");
const router = express.Router();
const multer = require('multer');

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: parseFloat(process.env.MAX_IMAGE_SIZE)
  }
});

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
    getVideosUsingPagination,
    getFollowersUsingPagination,
    getFollowingsUsingPagination,
} = require("../controllers/profileController");

const {
    getUserProfileLimiter,
    getOtherUserProfileLimiter,
    changeProfileImageLimiter,
    changeProfilePasswordLimiter,
    changeProfileNameLimiter,
    changeProfilePhoneLimiter,
    changeProfileUsernameLimiter,
    changeProfileBioLimiter,
    sendVerificationToNewEmailLimiter,
    verificationAndSetNewEmailLimiter,
    getUserVideosLimiter,
    getOtherUserVideosLimiter,
    getFollowersLimiter,
    getOtherUserFollowersLimiter,
    getFollowingsLimiter
} = require("../limiters/profileRoutesLimiter")

/**
 * @swagger
 * /api/profile/user:
 *   get:
 *     tags:
 *      - profile
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
 *                 followingsCount:
 *                   type: integer
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
 *                 photoUrl:
 *                   type: string
 *                 numberOfVideos:
 *                   type: integer
 *                 isVerified:
 *                   type: boolean
 *                 referrals:
 *                   type: integer
 *                 totalLikes:
 *                   type: integer
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal Server Error
 */
router.get("/user", getUserProfileLimiter , getUserProfile);

/**
 * @swagger
 * /api/profile/otheruser/{otherUserId}:
 *   get:
 *     tags:
 *      - profile
 *     summary: Retrieve another user's profile
 *     description: Retrieve another user's profile. Only authenticated users can access this route.
 *     security:
 *      - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: otherUserId
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
 *                 followingsCount:
 *                   type: integer
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
 *                 photoUrl:
 *                   type: string
 *                 numberOfVideos:
 *                   type: integer
 *                 isVerified:
 *                   type: boolean
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: User not found
 *       500:
 *         description: Internal Server Error
 */
router.get("/otheruser/:otherUserId", getOtherUserProfileLimiter, getOtherUserProfile);

/**
 * @swagger
 * /api/profile/change-image:
 *   post:
 *     tags:
 *      - profile
 *     summary: Change and compress profile image
 *     description: This API is used to change and compress the profile image of the user. It requires a valid JWT token in the Authorization header and an X-API-KEY in the X-API-KEY header. The user must send an image as multipart/form-data. The image will be analyzed for inappropriate content and compressed before updating the profile picture.
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
 *          description: API key
 *      - in: formData
 *        name: image
 *        description: The uploaded file data
 *        required: true
 *        schema:
 *          type: file
 *     responses:
 *      200:
 *         description: Profile picture changed and compressed successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *      400:
 *         description: Invalid image format, image dimensions too small, or inappropriate content
 *      401:
 *         description: Invalid token
 *      403:
 *         description: Invalid API key
 *      404:
 *         description: User or Profile not found
 *      500:
 *         description: Internal Server Error
 */
router.post("/change-image", upload.single("image"), changeProfileImageLimiter, changeProfileImage);

/**
 * @swagger
 * /api/profile/change-password:
 *   put:
 *     tags:
 *      - profile
 *     summary: Change profile password
 *     description: This API is used to change the profile password of the user. It requires a valid JWT token in the Authorization header.
 *     security:
 *      - bearerAuth: []
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
 *               oldPassword:
 *                 type: string
 *                 description: The old password
 *               newPassword:
 *                 type: string
 *                 description: The new password
 *     responses:
 *      200:
 *         description: Password changed successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *      400:
 *         description: User not found or Invalid password
 *      500:
 *         description: Internal Server Error
 */
router.put("/change-password", changeProfilePasswordLimiter ,changeProfilePassword);
 
/**
 * @swagger
 * /api/profile/change-name:
 *   put:
 *     tags:
 *      - profile
 *     summary: Change profile name
 *     description: This API is used to change the profile name of the user. It requires a valid JWT token in the Authorization header.
 *     security:
 *      - bearerAuth: []
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
 *               newName:
 *                 type: string
 *                 description: The new name
 *     responses:
 *      200:
 *         description: Name changed successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *      400:
 *         description: User not found
 *      500:
 *         description: Internal Server Error
 */
router.put("/change-name", changeProfileNameLimiter ,changeProfileName);

/**
 * @swagger
 * /api/profile/change-phone:
 *   put:
 *     tags:
 *      - profile
 *     summary: Change profile phone
 *     description: This API is used to change the profile phone of the user. It requires a valid JWT token in the Authorization header.
 *     security:
 *      - bearerAuth: []
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
 *               newPhone:
 *                 type: string
 *                 description: The new phone
 *     responses:
 *      200:
 *         description: Phone changed successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *      400:
 *         description: User not found or Phone already exists
 *      500:
 *         description: Internal Server Error
 */
router.put("/change-phone", changeProfilePhoneLimiter  , changeProfilePhone);

/**
 * @swagger
 * /api/profile/change-username:
 *   put:
 *     tags:
 *      - profile
 *     summary: Change Profile Username
 *     description: This API is used to change the username of the user's profile. It requires a valid JWT token in the Authorization header and the new username in the request body.
 *     security:
 *      - bearerAuth: []
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
 *               newUsername:
 *                 type: string
 *                 description: The new username
 *     responses:
 *      200:
 *         description: Username changed successfully
 *      400:
 *         description: Username already exists
 *      404:
 *         description: User not found
 *      500:
 *         description: Internal Server Error
 */
router.put("/change-username", changeProfileUsernameLimiter , changeProfileUsername);

/**
 * @swagger
 * /api/profile/change-bio:
 *   put:
 *     tags:
 *      - profile
 *     summary: Change profile bio
 *     description: This API is used to change the profile bio of the user. It requires a valid JWT token in the Authorization header.
 *     security:
 *      - bearerAuth: []
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
 *               newBio:
 *                 type: string
 *                 description: The new bio
 *     responses:
 *      200:
 *         description: Bio changed successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *      400:
 *         description: Profile not found
 *      500:
 *         description: Internal Server Error
 */
router.put("/change-bio", changeProfileBioLimiter , changeProfileBio);

/**
 * @swagger
 * /api/profile/change-email/send-verification-to-new-email:
 *   post:
 *     tags:
 *      - profile
 *     summary: Send verification to new email
 *     description: This API is used to send a verification code to a new email address. It requires a valid JWT token in the Authorization header.
 *     security:
 *      - bearerAuth: []
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
 *               newEmail:
 *                 type: string
 *                 description: The new email
 *               password:
 *                 type: string
 *                 description: The user's password
 *     responses:
 *      200:
 *         description: Verification code sent successfully
 *      400:
 *         description: Email already exists, Invalid email format or Invalid password
 *      404:
 *         description: User not found
 *      500:
 *         description: Internal Server Error
 */
router.post("/change-email/send-verification-to-new-email", sendVerificationToNewEmailLimiter , sendVerificationToNewEmail);

/**
 * @swagger
 * /api/profile/change-email/verify-and-set-new-email:
 *   put:
 *     tags:
 *      - profile
 *     summary: Verify and set new email
 *     description: This API is used to verify the code sent to the new email and set it as the user's email. It requires a valid JWT token in the Authorization header.
 *     security:
 *      - bearerAuth: []
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
 *               newEmail:
 *                 type: string
 *                 description: The new email
 *               verificationCode:
 *                 type: string
 *                 description: The verification code
 *     responses:
 *      200:
 *         description: Email changed successfully
 *      400:
 *         description: Invalid verification code or Verification code expired
 *      404:
 *         description: User not found
 *      500:
 *         description: Internal Server Error
 */
router.put("/change-email/verify-and-set-new-email", verificationAndSetNewEmailLimiter , verificationAndSetNewEmail);

/**
 * @swagger
 * /api/profile/userVideos?offset=0:
 *   get:
 *     tags:
 *      - profile
 *     summary: Fetch videos for the authenticated user
 *     description: This API is used to fetch videos for the authenticated user, with optional limit and offset parameters for pagination. It requires a valid JWT token in the Authorization header and an x-api-key.
 *     security:
 *      - bearerAuth: []
 *     parameters:
 *      - in: header
 *        name: x-api-key
 *        required: true
 *        schema:
 *          type: string
 *        description: The API key.
 *      - in: query
 *        name: offset
 *        required: false
 *        schema:
 *          type: integer
 *        description: The number of videos to skip before starting to fetch.
 *     responses:
 *      200:
 *         description: A list of videos.
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/definitions/Video'
 *      500:
 *         description: An error occurred.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/definitions/Error'
 */
router.get("/userVideos", getUserVideosLimiter , async (req, res) => {
  try {
    const { userId } = req.user;
    let { offset } = req.query;
    offset = offset !== undefined ? parseInt(offset, 10) : 0;

    const videos = await getVideosUsingPagination(userId, offset);

    res.status(200).json(videos);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

/**
 * @swagger
 * /api/profile/otherUserVideos/{otherUserId}?offset=0:
 *   get:
 *     tags:
 *      - profile
 *     summary: Fetch videos for a specific user
 *     description: This API is used to fetch videos for a specific user, with optional limit and offset parameters for pagination. It requires a valid JWT token in the Authorization header and an x-api-key.
 *     security:
 *      - bearerAuth: []
 *     parameters:
 *      - in: header
 *        name: x-api-key
 *        required: true
 *        schema:
 *          type: string
 *        description: The API key.
 *      - in: path
 *        name: otherUserId
 *        required: true
 *        schema:
 *          type: string
 *        description: The ID of the user for whom to fetch videos.
 *      - in: query
 *        name: offset
 *        required: false
 *        schema:
 *          type: integer
 *        description: The number of videos to skip before starting to fetch.
 *     responses:
 *      200:
 *         description: A list of videos.
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/definitions/Video'
 *      500:
 *         description: An error occurred.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/definitions/Error'
 */
router.get("/otherUserVideos/:otherUserId", getOtherUserVideosLimiter , async (req, res) => {
  try {
    const { otherUserId } = req.params;
    let { offset } = req.query;
    offset = offset !== undefined ? parseInt(offset, 10) : 0;

    const videos = await getVideosUsingPagination(otherUserId, offset);

    res.status(200).json(videos);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

/**
 * @swagger
 * /api/profile/followers?offset=0:
 *   get:
 *     tags:
 *      - profile
 *     summary: Fetch followers for the authenticated user
 *     description: This API is used to fetch followers for the authenticated user, with optional limit and offset parameters for pagination. It requires a valid JWT token in the Authorization header.
 *     security:
 *      - bearerAuth: []
 *     parameters:
 *      - in: header
 *        name: x-api-key
 *        required: true
 *        schema:
 *          type: string
 *        description: The API key.
 *      - in: query
 *        name: offset
 *        required: false
 *        schema:
 *          type: integer
 *        description: The number of followers to skip before starting to fetch.
 *     responses:
 *      200:
 *         description: A list of followers.
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/definitions/Follower'
 *      500:
 *         description: An error occurred.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/definitions/Error'
 */
router.get("/followers", getFollowersLimiter , async (req, res) => { 
  try {
    const { offset } = req.query;
    const { userId }= req.user;
      
    const followers = await getFollowersUsingPagination(userId, offset);

    res.status(200).json(followers);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});


/**
 * @swagger
 * /api/profile/followers/{otherUserId}?offset=0:
 *   get:
 *     tags:
 *      - profile
 *     summary: Fetch followers for a specific user
 *     description: This API is used to fetch followers for a specific user, with optional limit and offset parameters for pagination. It requires a valid JWT token in the Authorization header.
 *     security:
 *      - bearerAuth: []
 *     parameters:
 *      - in: header
 *        name: x-api-key
 *        required: true
 *        schema:
 *          type: string
 *        description: The API key.
 *      - in: path
 *        name: otherUserId
 *        required: true
 *        schema:
 *          type: string
 *        description: The ID of the user for whom to fetch followers.
 *      - in: query
 *        name: offset
 *        required: false
 *        schema:
 *          type: integer
 *        description: The number of followers to skip before starting to fetch.
 *     responses:
 *      200:
 *         description: A list of followers.
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/definitions/Follower'
 *      500:
 *         description: An error occurred.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/definitions/Error'
 */
router.get("/followers/:otherUserId", getOtherUserFollowersLimiter , async (req, res) => { 
  try {
    const { otherUserId } = req.params;
    const { offset } = req.query;
      
    const followers = await getFollowersUsingPagination(otherUserId, offset);

    res.status(200).json(followers);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

/**
 * @swagger
 * /api/profile/followings:
 *   get:
 *     tags:
 *      - profile
 *     summary: Retrieve a list of followings for a user
 *     description: This API is used to retrieve the list of users that the authenticated user is following. It requires a valid JWT token in the Authorization header.
 *     security:
 *      - bearerAuth: []
 *     parameters:
 *      - in: header
 *        name: X-API-KEY
 *        required: true
 *        schema:
 *          type: string
 *        description: API key
 *      - in: query
 *        name: offset
 *        schema:
 *          type: integer
 *        description: The number of items to skip before starting to collect the result set
 *     responses:
 *      200:
 *         description: The list of followings for the user
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: integer
 *                   username:
 *                     type: string
 *                   imageUrl:
 *                     type: string
 *                   isVerified:
 *                     type: boolean
 *      500:
 *         description: Internal Server Error
 */
router.get("/followings", getFollowingsUsingPagination);

module.exports = router;