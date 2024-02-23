const Report = require("../config/db").Report;
const User = require("../config/db").User;
const Video = require("../config/db").Video;
const Comment = require("../config/db").Comment;
const Message = require("../config/db").Message;


const createReport = async (req, res) => {
    try {
        const { title, description, referenceId, referenceType } = req.body;
        const { userId } = req.user;

        if (!title || !description || !referenceId || !referenceType)
            return res.status(400).json({ message: "All fields are required" });

        if (![1, 2, 3, 4].includes(referenceType)) {
            return res.status(400).json({ message: "Invalid referenceType" });
        }

        let referencedItem;
        switch (referenceType) {
            case 1:
                referencedItem = await User.findByPk(referenceId);
                break;
            case 2:
                referencedItem = await Comment.findByPk(referenceId);
                break;
            case 3:
                referencedItem = await Video.findByPk(referenceId);
                break;
            case 4:
                referencedItem = await Message.findByPk(referenceId);
                break;
            default:
                break;
        }
        
        if (!referencedItem) {
            return res.status(400).json({ message: "Referenced item not found" });
        }
        
        if ((referenceType === 1 && userId === referencedItem.id) ||
            (referenceType === 2 && userId === referencedItem.userId) ||
            (referenceType === 3 && userId == referencedItem.creatorId) ||
            (referenceType === 4 && userId == referencedItem.senderId)) {
            return res.status(400).json({ message: "You can't report yourself" });
        }

        const report = await Report.create({
            title,
            description,
            referenceId,
            referenceType,
            userId
        });

        res.status(200).json(report);
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
        const { userId } = req.user;
        const { title, description } = req.body;
        const reportId = req.params.id;
        if (!title && !description)
            return res.status(400).json({ message: "At least one field is required" });

        const report = await Report.findByPk(reportId);
        if (!report)
            return res.status(404).json({ message: "Report not found" });
            
        if (userId !== report.userId)
            return res.status(400).json({ message: "Unauthorized" });

        if (report.title === title && report.description === description)
            return res.status(400).json({ message: "No changes detected" });

        await report.update({ title, description });
        return res.status(200).json({ message: 'Report updated' });
    } catch (err) {
       return res.status(500).json({ message: err.message });
    }
};


const deleteReport = async (req, res) => {
    try {
        // if (!user.isAdmin)
        //     return res.status(400).json({ message: "Unauthorized" });

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