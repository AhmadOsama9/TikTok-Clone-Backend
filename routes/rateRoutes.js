const express = require('express');
const router = express.Router();

const {
    addRate,
    updateRate,
    removeRate
} = require("../controllers/rateController");


const {
    addRateLimiter,
    updateRateLimiter,
    removeRateLimiter
} = require("../limiters/rateRoutesLimiter")

/**
 * @swagger
 * /api/rate/add:
 *   post:
 *     tags:
 *       - Rate
 *     summary: Add a rating to a video
 *     operationId: addRate
 *     security:
 *      - bearerAuth: []
 *     parameters:
 *       - in: header
 *         name: X-API-KEY
 *         schema:
 *           type: string
 *         required: true
 *         description: The API key.
 *     requestBody:
 *       description: Rating data
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               videoId:
 *                 type: integer
 *                 description: The ID of the video to rate
 *               rating:
 *                 type: number
 *                 format: double
 *                 description: The rating to give to the video (between 1 and 5)
 *     responses:
 *       '200':
 *         description: Rating added successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Rating added successfully
 *       '400':
 *         description: Bad request. The request is missing required parameters or the rating is not between 1 and 5.
 *       '404':
 *         description: Not found. The video with the specified ID was not found.
 *       '500':
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 */
router.post("/add", addRateLimiter, addRate);

/**
 * @swagger
 * /api/rate/update:
 *   put:
 *     tags:
 *       - Rate
 *     summary: Update a rating for a video
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
 *       description: Rating data
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               videoId:
 *                 type: integer
 *                 description: The ID of the video
 *               rating:
 *                 type: integer
 *                 description: The rating for the video
 *     responses:
 *       200:
 *         description: Rating updated successfully
 *       400:
 *         description: Bad request
 *       404:
 *         description: Rating not found
 *       500:
 *         description: Internal server error
 */
router.put("/update", updateRateLimiter, updateRate);

/**
 * @swagger
 * /api/rate/remove:
 *   delete:
 *     tags:
 *       - Rate
 *     summary: Remove a rating for a video
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
 *         description: Rating removed successfully
 *       400:
 *         description: Bad request
 *       404:
 *         description: Rating not found
 *       500:
 *         description: Internal server error
 */
router.delete("/remove", removeRateLimiter, removeRate);

module.exports = router;