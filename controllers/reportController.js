const Report = require("../config/db").Report;
const User = require("../config/db").User;
const UserStatus = require("../config/db").UserStatus;
const Video = require("../config/db").Video;
const Comment = require("../config/db").Comment;
const Message = require("../config/db").Message;


const createReport = async (req, res) => {
    try {
        const { title, description, referenceId, referenceType } = req.body;
        const { userId } = req.user;

        if (!title || !description || !referenceId || !referenceType)
            return res.status(400).json({ message: "يجب ملئ كل الخانات" });

        if (![1, 2, 3, 4].includes(referenceType)) {
            return res.status(400).json({ message: "نوع خاطئ" });
        }

        let referencedItem;
        let referencedItemId;

        switch (referenceType) {
            case 1:
                referencedItem = await User.findByPk(referenceId, { attributes: ['id'] });
                referencedItemId = referencedItem?.id;
                break;
            case 2:
                referencedItem = await Comment.findByPk(referenceId, { attributes: ['userId'] });
                referencedItemId = referencedItem?.userId;
                break;
            case 3:
                referencedItem = await Video.findByPk(referenceId, { attributes: ['creatorId'] });
                referencedItemId = referencedItem?.creatorId;
                break;
            case 4:
                referencedItem = await Message.findByPk(referenceId, { attributes: ['senderId'] });
                referencedItemId = referencedItem?.senderId;
                break;
            default:
                break;
        }

        if (!referencedItemId) {
            return res.status(400).json({ message: "رقم المبلغ عليه غير موجود" });
        }

        if (userId === referencedItemId) {
            return res.status(400).json({ message: "لا يمكنك الابلاغ علي نفسك" });
        }

        const report = await Report.create({
            title,
            description,
            referenceId,
            referenceType,
            userId,
            isViewed: false,
        });

        res.status(200).json(report);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

const getReportById = async (req, res) => {
    try {
        const { userId } = req.user;
        const userStatus = await UserStatus.findOne({ 
            where: { userId },
            attributes: ['isAdmin'],
        });
        if (!userStatus || !userStatus.isAdmin)
            return res.status(400).json({ message: "ليس لديك الصلاحية" });

        const report = await Report.findByPk(req.params.id);
        if (report) {
            res.status(200).json(report);
        } else {
            res.status(404).json({ message: 'البلاغ غير موجود' });
        }
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};


const getAllReports = async (req, res) => {
    try {
        const { userId } = req.user;

        const userStatus = await UserStatus.findOne({ 
            where: { userId },
            attributes: ['isAdmin']
        });

        if (!userStatus || !userStatus.isAdmin) {
            return res.status(403).json({ message: 'ليس لديك الصلاحية للقيم بهذا' });
        }
        
        const reports = await Report.findAll();
        res.status(200).json(reports);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};


const getUnviewedReports = async (req, res) => {
    try {
        const { userId } = req.user;
        const userStatus = await UserStatus.findOne({ 
            where: { userId },
            attributes: ['isAdmin']
        });

        if (!userStatus || !userStatus.isAdmin) {
            return res.status(403).json({ message: 'ليس لديك الصلاحية للقيم بهذا' });
        }

        const reports = await Report.findAll({
            where: { isViewed: false },
        });

        res.json({ reports });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};


const updateReport = async (req, res) => {
    try {
        const { userId } = req.user;
        const { title, description } = req.body;
        const reportId = req.params.id;
        if (!title && !description)
            return res.status(400).json({ message: "يجب ارسال خانة واحدة علي الاقل" });

        const report = await Report.findByPk(reportId, {
            attributes: ['id', 'userId']
        });
        if (!report)
            return res.status(404).json({ message: 'البلاغ غير موجود' });
            
        if (userId !== report.userId)
            return res.status(400).json({ message: "ليس لديك الصلاحية" });

        if (title && (title.trim() === '' || title.trim() === report.title))
        return res.status(400).json({ message: "تأكد من انك كتبت العنوان المحدث" });
    
        if (description && (description.trim() === '' || description.trim() === report.description))
            return res.status(400).json({ message: "تأكد من انك كتبت الوصف المحدث" });

        await report.update({ title, description });
        return res.status(200).json({ message: 'تم تحديث البلاغ' });
    } catch (err) {
       return res.status(500).json({ message: err.message });
    }
};

const deleteReport = async (req, res) => {
    const { userId } = req.user; 
    const reportId = req.params.id;

    try {
        const report = await Report.findByPk(reportId, {
            attributes: ['id']
        });

        if (!report) {
            return res.status(404).json({ message: "البلاغ غير موجود" });
        }

        const userStatus = await UserStatus.findOne({ 
            where: { userId },
            attributes: ['isAdmin'],
        });

        if (userId !== report.userId && (!userStatus || !userStatus.isAdmin)) {
            return res.status(403).json({ message: 'ليس لديك الصلاحية للقيم بهذا' });
        }

        await report.destroy();

        return res.status(200).json({ message: 'تم حذف البلاغ بنجاح' });
    } catch (error) {
        return res.status(500).json({ error: error.message });
    }
};


//I think I should use the upate here instead of the save
const setReportIsViewed = async (req, res) => {
    try {
        const { userId } = req.user;
        const userStatus = await UserStatus.findOne({ 
            where: { userId },
            attributes: ['isAdmin'],
        });
        if (!userStatus || !userStatus.isAdmin)
            return res.status(400).json({ message: "ليس لديك الصلاحية" });

        const reportId = req.params.id;
        const report = await Report.findByPk(reportId, {
            attributes: ['id', 'isViewed']
        });
        if (!report) {
            return res.status(404).json({ message: "البلاغ غير موجود" });
        }

        if (report.isViewed) 
            return res.status(400).json({ message: "البلاغ مقروء بالفعل" });
        
        report.isViewed = true;
        await report.save();
        res.status(200).json({ message: "تم قراءة البلاغ بنجاح" });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
}


module.exports = {
    createReport,
    getReportById,
    getAllReports,
    getUnviewedReports,
    updateReport,
    deleteReport,
    setReportIsViewed,
}