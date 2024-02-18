const express = require("express");
const router = express.Router();

const {
    createReport,
    getReportById,
    getAllReports,
    updateReport,
    deleteReport
} = require("../controllers/reportController");

/**
 * @swagger
 * /api/report/create:
 *   post:
 *     tags:
 *       - Reports
 *     summary: Create a new report
 *     operationId: createReport
 *     security:
 *      - bearerAuth: []
 *     parameters:
 *      - in: header
 *        name: Authorization
 *        required: true
 *        schema:
 *          type: string
 *        description: The JWT token of the user.
 *      - in: header
 *        name: X-API-KEY
 *        required: true
 *        schema:
 *          type: string
 *        description: The API key.
 *     requestBody:
 *       description: Report data
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *                 description: The title of the report.
 *               description:
 *                 type: string
 *                 description: The description of the report.
 *               referenceId:
 *                 type: integer
 *                 description: The reference ID related to the report.
 *               referenceType:
 *                 type: string(user, comment or video)
 *                 description: The type of the reference related to the report
 *     responses:
 *       201:
 *         description: The created report
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Report'
 *       400:
 *         description: Bad request. User ID is required.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       401:
 *         description: Authorization information is missing or invalid.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: An error occurred.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post("/create", createReport);

/**
 * @swagger
 * /api/report/update/{id}:
 *   put:
 *     tags:
 *       - Reports
 *     summary: Update a report by ID
 *     operationId: updateReport
 *     security:
 *      - bearerAuth: []
 *     parameters:
 *      - in: path
 *        name: id
 *        required: true
 *        schema:
 *          type: integer
 *        description: The ID of the report to update.
 *      - in: header
 *        name: Authorization
 *        required: true
 *        schema:
 *          type: string
 *        description: The JWT token of the user.
 *      - in: header
 *        name: X-API-KEY
 *        required: true
 *        schema:
 *          type: string
 *        description: The API key.
 *     requestBody:
 *       description: Report data to update
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *                 description: The new title of the report.
 *               description:
 *                 type: string
 *                 description: The new description of the report.
 *     responses:
 *       200:
 *         description: The report was updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Report updated
 *       404:
 *         description: Report not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: An error occurred.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.put("/update/:id", updateReport);

/**
 * @swagger
 * /api/report/get/{id}:
 *   get:
 *     tags:
 *       - Reports
 *     summary: Get a report by ID
 *     operationId: getReportById
 *     security:
 *      - bearerAuth: []
 *     parameters:
 *      - in: path
 *        name: id
 *        required: true
 *        schema:
 *          type: integer
 *        description: The ID of the report to retrieve.
 *      - in: header
 *        name: Authorization
 *        required: true
 *        schema:
 *          type: string
 *        description: The JWT token of the user.
 *      - in: header
 *        name: X-API-KEY
 *        required: true
 *        schema:
 *          type: string
 *        description: The API key.
 *     responses:
 *       200:
 *         description: The report data
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Report'
 *       404:
 *         description: Report not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: An error occurred.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get("/get/:id", getReportById);

/**
 * @swagger
 * /api/report/get-all/{id}:
 *   put:
 *     tags:
 *       - Reports
 *     summary: Update a report by ID
 *     operationId: updateReport
 *     security:
 *      - bearerAuth: []
 *     parameters:
 *      - in: path
 *        name: id
 *        required: true
 *        schema:
 *          type: integer
 *        description: The ID of the report to update.
 *      - in: header
 *        name: Authorization
 *        required: true
 *        schema:
 *          type: string
 *        description: The JWT token of the user.
 *      - in: header
 *        name: X-API-KEY
 *        required: true
 *        schema:
 *          type: string
 *        description: The API key.
 *     requestBody:
 *       description: Report data to update
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *                 description: The new title of the report.
 *               description:
 *                 type: string
 *                 description: The new description of the report.
 *     responses:
 *       200:
 *         description: The report was updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Report updated
 *       404:
 *         description: Report not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: An error occurred.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get("/get-all", getAllReports);

/**
 * @swagger
 * /api/report/delete/{id}:
 *   delete:
 *     tags:
 *       - Reports
 *     summary: Delete a report by ID
 *     operationId: deleteReport
 *     security:
 *      - bearerAuth: []
 *     parameters:
 *      - in: path
 *        name: id
 *        required: true
 *        schema:
 *          type: integer
 *        description: The ID of the report to delete.
 *      - in: header
 *        name: Authorization
 *        required: true
 *        schema:
 *          type: string
 *        description: The JWT token of the user.
 *      - in: header
 *        name: X-API-KEY
 *        required: true
 *        schema:
 *          type: string
 *        description: The API key.
 *     responses:
 *       200:
 *         description: The report was deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Report deleted
 *       404:
 *         description: Report not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: An error occurred.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.delete("/delete/:id", deleteReport);

module.exports = router;