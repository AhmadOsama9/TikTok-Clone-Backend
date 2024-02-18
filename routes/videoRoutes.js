const express = require("express");
const router = express.Router();

const multer = require('multer');
const path = require('path');

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/')
  },
  filename: function (req, file, cb) {
    cb(null, file.fieldname + '-' + Date.now() + path.extname(file.originalname))
  }
})

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 50 * 1024 * 1024, // no larger than 50mb
  }
});
const {
    uploadVideo,
    getVideoThumbnail,
    getVideo, 
    getCommentsUsingPagination,
    updateVideoDescription,
} = require("../controllers/videoController");

/**
 * @swagger
 * /api/video/upload:
 *   post:
 *     tags:
 *      - Videos
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
 *               image:
 *                 type: string
 *                 format: binary
 *                 description: The image file
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
 *         description: Please upload a video and an image, File size too large. Please upload a video less than 10MB, or Invalid file type. Please upload a video file
 *       404:
 *         description: User not found
 *       500:
 *         description: Failed to read video or image, Internal Server Error
 */
router.post("/upload-video", upload.fields([{ name: 'video', maxCount: 1 }, { name: 'image', maxCount: 1 }]), uploadVideo);

/**
 * @swagger
 * /api/video/thumbnail/{videoId}:
 *   get:
 *     tags:
 *      - Videos
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
 *     tags:
 *      - Videos
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
 * /api/video/{id}/comments?offset=0:
 *   get:
 *     tags:
 *      - Videos
 *     summary: Fetch comments for a specific video
 *     description: This API is used to fetch comments for a specific video, with optional limit and offset parameters for pagination. It requires a valid JWT token in the Authorization header and an API key in the X-API-KEY header. The response now includes replies to comments and user profile image URLs.
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
 *         description: A list of comments, each with its replies and user profile image URL.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 comments:
 *                   type: array
 *                   items:
 *                     $ref: '#/definitions/Comment'
 *       500:
 *         description: An error occurred.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/definitions/Error'
 */
router.get("/:id/comments", async (req, res) => { 
  try {
      const videoId = req.params.id;
      const { offset } = req.query;

      const comments = await getCommentsUsingPagination(videoId, offset);

      res.status(200).json(comments);
  } catch (error) {
      res.status(500).json({ error: error.message });
  }
});

/**
 * @swagger
 * /api/video/{id}/update-description:
 *   put:
 *     tags:
 *       - Videos
 *     summary: Update the description of a specific video
 *     operationId: updateVideoDescription
 *     security:
 *      - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: videoId
 *         schema:
 *           type: integer
 *         required: true
 *         description: The ID of the video.
 *       - in: header
 *         name: Authorization
 *         schema:
 *           type: string
 *         required: true
 *         description: The JWT token of the user.
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               description:
 *                 type: string
 *     responses:
 *       '200':
 *         description: Video description updated successfully
 *       '400':
 *         description: Bad request
 *       '403':
 *         description: You are not authorized to update this video
 *       '404':
 *         description: Video not found
 *       '500':
 *         description: Internal server error
 */
router.put("/:id/update-description", updateVideoDescription);

module.exports = router;