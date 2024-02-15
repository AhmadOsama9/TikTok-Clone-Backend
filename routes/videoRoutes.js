const express = require("express");
const router = express.Router();

const multer = require("multer");
const upload = multer({
    storage: multer.memoryStorage(),
    limits: {
        fileSize: 50 * 1024 * 1024, // no larger than 10mb
    }
})

const {
    uploadVideo,
    getVideoThumbnail,
    getVideo, 
    getCommentsUsingPagination,
} = require("../controllers/videoController");

router.post("/upload-video", upload.fields([{ name: 'video', maxCount: 1 }, { name: 'image', maxCount: 1 }]), uploadVideo);

/**
 * @swagger
 * /api/video/upload:
 *   post:
 *     summary: Upload Video
 *     description: This API is used to upload a video and its thumbnail. It requires a valid JWT token in the Authorization header and the video and thumbnail files in the request body.
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
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               video:
 *                 type: string
 *                 format: binary
 *                 description: The video file
 *               thumbnail:
 *                 type: string
 *                 format: binary
 *                 description: The thumbnail image file
 *               description:
 *                 type: string
 *                 description: The video description
 *               category:
 *                 type: string
 *                 description: The video category
 *     responses:
 *       200:
 *         description: Video uploaded successfully
 *       400:
 *         description: Please upload a video and a thumbnail, File size too large. Please upload a video less than 10MB, or Invalid file type. Please upload a video file
 *       404:
 *         description: User not found
 *       500:
 *         description: Failed to read video or image, Internal Server Error
 */

/**
 * @swagger
 * /api/video/thumbnail/{videoId}:
 *   get:
 *     summary: Fetch thumbnail for a specific video
 *     description: This API is used to fetch the thumbnail for a specific video. It requires a valid JWT token in the Authorization header and an API key in the X-API-KEY header.
 *     security:
 *      - bearerAuth: []
 *     parameters:
 *      - in: path
 *        name: videoId
 *        required: true
 *        schema:
 *          type: string
 *        description: The ID of the video for which to fetch the thumbnail.
 *      - in: header
 *        name: X-API-KEY
 *        required: true
 *        schema:
 *          type: string
 *        description: API key
 *     responses:
 *       200:
 *         description: The thumbnail of the video.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/definitions/Thumbnail'
 *       500:
 *         description: An error occurred.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/definitions/Error'
 */
router.get("/thumbnail/:videoId", getVideoThumbnail);

/**
 * @swagger
 * /api/video/{videoId}:
 *   get:
 *     summary: Fetch a specific video
 *     description: This API is used to fetch a specific video. It requires a valid JWT token in the Authorization header and an API key in the X-API-KEY header.
 *     security:
 *      - bearerAuth: []
 *     parameters:
 *      - in: path
 *        name: videoId
 *        required: true
 *        schema:
 *          type: string
 *        description: The ID of the video to fetch.
 *      - in: header
 *        name: X-API-KEY
 *        required: true
 *        schema:
 *          type: string
 *        description: API key
 *     responses:
 *       200:
 *         description: The video.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/definitions/Video'
 *       500:
 *         description: An error occurred.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/definitions/Error'
 */
router.get("/:videoId", getVideo);

/**
 * @swagger
 * /api/video/{videoId}/comments:
 *   get:
 *     summary: Fetch comments for a specific video
 *     description: This API is used to fetch comments for a specific video, with optional limit and offset parameters for pagination. It requires a valid JWT token in the Authorization header and an API key in the X-API-KEY header.
 *     security:
 *      - bearerAuth: []
 *     parameters:
 *      - in: path
 *        name: videoId
 *        required: true
 *        schema:
 *          type: string
 *        description: The ID of the video for which to fetch comments.
 *      - in: query
 *        name: limit
 *        required: false
 *        schema:
 *          type: integer
 *        description: The maximum number of comments to return.
 *      - in: query
 *        name: offset
 *        required: false
 *        schema:
 *          type: integer
 *        description: The number of comments to skip before starting to fetch.
 *      - in: header
 *        name: X-API-KEY
 *        required: true
 *        schema:
 *          type: string
 *        description: API key
 *     responses:
 *       200:
 *         description: A list of comments.
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/definitions/Comment'
 *       500:
 *         description: An error occurred.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/definitions/Error'
 */
router.get("/:videoId/comments", async (req, res) => { 
    try {
        const { videoId } = req.params;
        const { limit , offset } = req.query;

        const comments = await getCommentsUsingPagination(videoId, limit, offset);

        res.status(200).json(comments);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;