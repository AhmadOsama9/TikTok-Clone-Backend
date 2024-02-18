const Report = require("../config/db").Report;


const createReport = async (req, res) => {
    try {
        const { title, description, referenceId, referenceType } = req.body;
        const { userId } = req.user;

        const report = await Report.create({
            title,
            description,
            referenceId,
            referenceType,
            userId
        });

        res.status(201).json(report);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};


const getReportById = async (req, res) => {
    try {
        const report = await Report.findByPk(req.params.id);
        if (report) {
            res.status(200).json(report);
        } else {
            res.status(404).json({ message: 'Report not found' });
        }
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};


const getAllReports = async (req, res) => {
    try {
        const reports = await Report.findAll();
        res.status(200).json(reports);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};


const updateReport = async (req, res) => {
    try {
        const { title, description } = req.body;

        const report = await Report.findByPk(req.params.id);
        if (report) {
            await report.update({ title, description });
            res.status(200).json({ message: 'Report updated' });
        } else {
            res.status(404).json({ message: 'Report not found' });
        }
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};


const deleteReport = async (req, res) => {
    try {
        const report = await Report.findByPk(req.params.id);
        if (report) {
            await report.destroy();
            res.status(200).json({ message: 'Report deleted' });
        } else {
            res.status(404).json({ message: 'Report not found' });
        }
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

module.exports = {
    createReport,
    getReportById,
    getAllReports,
    updateReport,
    deleteReport
}