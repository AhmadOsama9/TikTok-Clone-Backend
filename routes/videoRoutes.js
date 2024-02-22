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
    updateVideoDescription,
    getCommentsUsingPagination,
    getCreatorComments,
    likeAndUnlikeVideo,
    shareVideo,
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
 * /api/video/{videoId}/comments:
 *   get:
 *     tags:
 *      - Videos
 *     summary: Get comments for a video with pagination
 *     security:
 *      - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: videoId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the video to get creator comments for
 *       - in: header
 *         name: X-API-KEY
 *         schema:
 *           type: string
 *         required: true
 *         description: x-api-key
 *       - name: offset
 *         in: query
 *         type: integer
 *         default: 0
 *         description: Number of comments to skip
 *     responses:
 *       200:
 *         description: Successful response
 *         content:
 *          application/json:
 *           schema:
 *            type: object
 *            properties:
 *             comments:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: integer
 *                   videoId:
 *                     type: string
 *                   userId:
 *                     type: string
 *                   content:
 *                     type: string
 *                   gift:
 *                     type: string
 *                   repliesCount:
 *                     type: integer
 *                   replies:
 *                     type: array
 *                     items:
 *                       type: object
 *                       properties:
 *                         id:
 *                           type: integer
 *                         videoId:
 *                           type: string
 *                         userId:
 *                           type: string
 *                         content:
 *                           type: string
 *                         gift:
 *                           type: string
 *                         repliesCount:
 *                           type: integer
 *                         createdAt:
 *                           type: string
 *                         imageUrl:
 *                           type: string
 *                         username:
 *                           type: string
 *                   createdAt:
 *                     type: string
 *                   imageUrl:
 *                     type: string
 *                   username:
 *                     type: string
 *       400:
 *         description: Bad request
 *       404:
 *         description: Video not found
 */
router.get("/:videoId/comments", getCommentsUsingPagination);

/**
 * @swagger
 * /api/video/{videoId}/creator-comments:
 *   get:
 *     tags:
 *      - Videos
 *     summary: Get comments by the video's creator with pagination
 *     security:
 *      - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: videoId
 *         schema:
 *           type: string
 *         required: true
 *         description: ID of the video to get creator comments for
 *       - in: header
 *         name: X-API-KEY
 *         schema:
 *           type: string
 *         required: true
 *         description: x-api-key
 *     responses:
 *       200:
 *         description: Successful response
 *         content:
 *          application/json:
 *           schema:
 *            type: object
 *            properties:
 *             comments:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: integer
 *                   videoId:
 *                     type: string
 *                   userId:
 *                     type: string
 *                   content:
 *                     type: string
 *                   gift:
 *                     type: string
 *                   repliesCount:
 *                     type: integer
 *                   replies:
 *                     type: array
 *                     items:
 *                       type: object
 *                       properties:
 *                         id:
 *                           type: integer
 *                         videoId:
 *                           type: string
 *                         userId:
 *                           type: string
 *                         content:
 *                           type: string
 *                         gift:
 *                           type: string
 *                         repliesCount:
 *                           type: integer
 *                         createdAt:
 *                           type: string
 *                         imageUrl:
 *                           type: string
 *                         username:
 *                           type: string
 *                   createdAt:
 *                     type: string
 *                   imageUrl:
 *                     type: string
 *                   username:
 *                     type: string
 *       400:
 *         description: Bad request
 *       404:
 *         description: Video not found
 */
router.get("/:videoId/creator-comments", getCreatorComments);

/**
 * @swagger
 * /api/video/{videoId}/update-description:
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
 *         name: X-API-KEY
 *         schema:
 *           type: string
 *         required: true
 *         description: x-api-key
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
router.put("/:videoId/update-description", updateVideoDescription);

/**
 * @swagger
 * /api/video/like-and-unlike:
 *   post:
 *     tags:
 *       - Videos
 *     summary: Like or unlike a specific video
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: header
 *         name: X-API-KEY
 *         schema:
 *           type: string
 *         required: true
 *         description: x-api-key
 *     requestBody:
 *       description: Message data
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               videoId:
 *                 type: integer
 *                 description: The ID of the video
 *     responses:
 *       200:
 *         description: Video liked or unliked successfully
 *       400:
 *         description: Bad request
 *       404:
 *         description: Video not found
 *       500:
 *         description: Internal server error
 */
router.post("/like-and-unlike", likeAndUnlikeVideo);

/**
 * @swagger
 * /api/video/share:
 *   post:
 *     tags:
 *      - Videos
 *     summary: Share a specific video
 *     security:
 *      - bearerAuth: []
 *     parameters:
 *      - in: header
 *        name: X-API-KEY
 *        schema:
 *          type: string
 *        required: true
 *        description: x-api-key
 *     requestBody:
 *       description: Message data
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               videoId:
 *                 type: integer
 *                 description: The ID of the video
 *     responses:
 *       200:
 *         description: Video shared successfully
 *       400:
 *         description: Bad request
 *       404:
 *         description: Video not found
 *       500:
 *         description: Internal server error
 */
router.post("/share", shareVideo);

module.exports = router;