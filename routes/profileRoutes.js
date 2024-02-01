const express = require("express");
const router = express.Router();

const {
    getUserProfile,
    getOtherUserProfile,
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

module.exports = router;