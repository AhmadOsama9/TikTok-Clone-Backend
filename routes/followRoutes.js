const express = require("express");
const router = express.Router();

const {
    followUser,
    unFollowUser,
} = require("../controllers/followController");

/**
 * @swagger
 * /api/follow/follow:
 *   post:
 *     tags:
 *       - Follow
 *     summary: Follow a user
 *     operationId: followUser
 *     security:
 *      - bearerAuth: []
 *      - apiKeyAuth: []
 *     parameters:
 *       - in: header
 *         name: Authorization
 *         schema:
 *           type: string
 *         required: true
 *         description: The JWT token of the user.
 *       - in: header
 *         name: X-API-KEY
 *         schema:
 *           type: string
 *         required: true
 *         description: The API key.
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               followId:
 *                 type: integer
 *     responses:
 *       '200':
 *         description: User followed successfully
 *       '400':
 *         description: Bad request
 *       '404':
 *         description: User not found
 *       '500':
 *         description: Internal server error
 */
router.post("/follow", followUser);

/** 
 * @swagger
 * /api/follow/unfollow:
 *   delete:
 *     tags:
 *       - Follow
 *     summary: Unfollow a user
 *     operationId: unFollowUser
 *     security:
 *      - bearerAuth: []
 *      - apiKeyAuth: []
 *     parameters:
 *       - in: header
 *         name: Authorization
 *         schema:
 *           type: string
 *         required: true
 *         description: The JWT token of the user.
 *       - in: header
 *         name: X-API-KEY
 *         schema:
 *           type: string
 *         required: true
 *         description: The API key.
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               followId:
 *                 type: integer
 *     responses:
 *       '200':
 *         description: User unfollowed successfully
 *       '400':
 *         description: Bad request
 *       '404':
 *         description: User not found
 *       '500':
 *         description: Internal server error
 */
router.delete("/unfollow", unFollowUser);

module.exports = router;