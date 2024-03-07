const express = require('express');
const router = express.Router();

const { 
    saveVideo,
    unsaveVideo,
    getSavedVideosUsingPagination
} = require("../controllers/profileController");

const {
    saveVideoLimiter,
    unsaveVideoLimiter,
    getSavedVideosUsingPaginationLimiter
} = require("../limiters/savedVideosRoutesLimiter")

/**
 * @swagger
 * /api/profile/videos/{videoId}/save:
 *   post:
 *     tags:
 *       - SavedVideos
 *     summary: Save a video
 *     operationId: saveVideo
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: header
 *         name: x-api-key
 *         required: true
 *         schema:
 *           type: string
 *         description: The API key.
 *       - in: path
 *         name: videoId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       '200':
 *         description: Video saved successfully
 *       '400':
 *         description: Bad request
 *       '404':
 *         description: Video not found
 *       '500':
 *         description: Internal server error
 */
router.post('/videos/:videoId/save', saveVideoLimiter , saveVideo);

/**
 * @swagger
 * /api/profile/videos/{videoId}/unsave:
 *   delete:
 *     tags:
 *       - SavedVideos
 *     summary: Unsave a video
 *     operationId: unsaveVideo
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: header
 *         name: x-api-key
 *         required: true
 *         schema:
 *           type: string
 *         description: The API key.
 *       - in: path
 *         name: videoId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       '200':
 *         description: Video unsaved successfully
 *       '400':
 *         description: Bad request
 *       '404':
 *         description: Video not saved
 *       '500':
 *         description: Internal server error
 */
router.delete('/videos/:videoId/unsave', unsaveVideoLimiter , unsaveVideo);

/**
 * @swagger
 * /api/profile/videos/saved?offset=0:
 *   get:
 *     tags:
 *       - SavedVideos
 *     summary: Get saved videos with pagination
 *     operationId: getSavedVideosUsingPagination
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: header
 *         name: x-api-key
 *         required: true
 *         schema:
 *           type: string
 *         description: The API key.
 *       - in: query
 *         name: offset
 *         schema:
 *           type: integer
 *         required: false
 *         description: The number of videos to skip before starting to fetch.
 *     responses:
 *       '200':
 *         description: List of saved videos
 *       '500':
 *         description: Internal server error
 */
router.get('/videos/saved', getSavedVideosUsingPaginationLimiter , getSavedVideosUsingPagination);

module.exports = router;