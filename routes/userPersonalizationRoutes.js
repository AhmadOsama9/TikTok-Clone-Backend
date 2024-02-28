const express = require("express");
const router = express.Router();
const { 
    createUserPersonalization,
    getRecommendedVideos,
} = require("../controllers/userPersonalizationController");


/**
 * @swagger
 * /api/user-personalization/create-user-personalization:
 *   post:
 *     tags:
 *      - UserPersonalization
 *     security:
 *       - bearerAuth: []
 *     summary: Create user personalization
 *     description: Create user personalization for the authenticated user. Requires a Bearer token in the Authorization header.
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
 *               videoId:
 *                 type: integer
 *               liked:
 *                 type: boolean
 *               viewed:
 *                 type: boolean
 *               shared:
 *                 type: boolean
 *               commented:
 *                 type: boolean
 *               rated:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: User personalization updated
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *       400:
 *         description: Video ID is required
 *       404:
 *         description: Video not found
 *       500:
 *         description: Server error
 */
router.post("/create-user-personalization", createUserPersonalization);


/**
 * @swagger
 * /api/user-personalization/recommend-videos:
 *   get:
 *     tags:
 *      - UserPersonalization
 *     summary: Fetch recommended videos
 *     description: This API is used to fetch recommended videos for the authenticated user. It requires a valid JWT token in the Authorization header and an API key in the X-API-KEY header.
 *     security:
 *      - bearerAuth: []
 *     parameters:
 *      - in: header
 *        name: X-API-KEY
 *        required: true
 *        schema:
 *          type: string
 *        description: API key
 *     responses:
 *       200:
 *         description: The recommended videos.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 recommendedVideos:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: string
 *                       description:
 *                         type: string
 *                       videoUrl:
 *                         type: string
 *                       thumbnailUrl:
 *                         type: string
 *                       publisherId:
 *                         type: string
 *                       categories:
 *                         type: array
 *                         items:
 *                           type: string
 *                       likes:
 *                         type: integer
 *                       rating:
 *                         type: number
 *                       views:
 *                         type: integer
 *                       commentsCount:
 *                         type: integer
 *                       sharesCount:
 *                         type: integer
 *                       userLike:
 *                         type: boolean
 *                       userRating:
 *                         type: number
 *                       createdAt:
 *                         type: string
 *                         format: date-time
 *       500:
 *         description: An error occurred.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/definitions/Error'
 */
router.get("/recommend-videos", getRecommendedVideos);


module.exports = router;