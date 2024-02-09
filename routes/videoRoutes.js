const express = require("express");
const router = express.Router();

const multer = require("multer");
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, "./uploads/");
    },
    filename: (req, file, cb) => {
        cb(null, file.fieldname + "-" + Date.now());
    }
})
const upload = multer({ storage: storage });

const {
    uploadVideo,
} = require("../controllers/videoController");


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
router.post("/upload-video", upload.fields([{ name: 'video', maxCount: 1 }, { name: 'image', maxCount: 1 }]), uploadVideo);


module.exports = router;