const Notification = require("../config/db").Notification;
const User = require("../config/db").User;
const Video = require("../config/db").Video;
const Comment = require("../config/db").Comment;
const Sequelize = require("sequelize");

const { Op } = require("sequelize");


//I'm thinking of removing the checking for the vidoe, comment and otherUser
//I mean since my code is the one responsible for that I think making sure in the other functions is better
//thinking about it, I'm not really sure I think the time will be the near but yeah it can be considered
async function addNotification (userId, videoId, commentId, otherUserId, notificationType, title, transaction) {
    try {
        if (userId === otherUserId) {
            console.log("لا يمكنك اضافة اشعار لنفسك");
            return;
        }

        if ((!videoId || !commentId) && !otherUserId)
            throw new Error('اشعار غير صالح');

        if (notificationType < 1 || notificationType > 5)
            throw new Error('نوع الاشعار غير صالح');

        if (videoId) {
            const video = await Video.findByPk(videoId, {
                attributes: ['id']
            });
            if (!video)
                throw new Error('الفيديو غير موجود');
        }

        if (commentId) {
            const comment = await Comment.findByPk(commentId, {
                attributes: ['id'],
                transaction
            });
            if (!comment)
                throw new Error('التعليق غير موجود');
        }

        if (otherUserId) {
            const user = await User.findByPk(otherUserId, {
                attributes: ['id']
            });
            if (!user)
                throw new Error('المستخدم غير موجود');
        }

        const similarNotification = await Notification.findOne({
            where: {
                userId,
                notificationType,
                [Op.or]: [
                    { videoId: videoId, commentId: commentId, otherUserId: otherUserId },
                    { [Op.and]: [{ videoId: videoId }, { commentId: null, otherUserId: null }] }
                ]
            }
        });

        let body;
        switch (notificationType) {
            case 1:
                body = 'تم اعجاب بفيديوك.';
                break;
            case 2:
                body = 'تم تعليق على فيديوك.';
                break;
            case 3:
                body = 'لديك متابع جديد.';
                break;
            case 4:
                body = 'لديك منشن في تعليق.';
                break;
            case 5:
                body = 'مبروك! استقبلت هدية علي فيديوك.';
                break;
        }

        if (similarNotification) {
            await Notification.update(
                { count: Sequelize.literal('count + 1'), body },
                { where: { id: similarNotification.id }, transaction }
            );
        } else {
            await Notification.create({ userId, videoId, commentId, otherUserId, notificationType, count: 1, title, body, isRead: false }, { transaction });
        }

    } catch (error) {
        throw error;
    }
}


const getNotifications = async (req, res) => { 
    try {
        const { userId } = req.user;

        const notifications = await Notification.findAll({ where : { userId }, order: [['createdAt', 'DESC']] });

        return res.status(200).json({ notifications });
    } catch (error) {
        return res.status(500).json({ error: error.message });
    }
}

const markNotificationAsRead = async (req, res) => {
    try {
        const { userId } = req.user;
        const { notificationId } = req.params;

        const notification = await Notification.findOne({ 
            where: { 
                id: notificationId,
                userId: userId
            },
            attributes: ['id', 'isRead']
        });
        if (!notification) {
            return res.status(400).json({ error: "اشعار غير موجود" });
        }

        if (notification.isRead)
            return res.status(400).json({ error: "الاشعار مقروء بالفعل" });

        await notification.update({ isRead: true });
        
        return res.status(200).json({ message: "الاشعار اصبح مقروء" });

    } catch (error) {

    }
}


const markAllNotificationsAsRead = async (req, res) => {
    try {
        const { userId } = req.user;

        await Notification.update({ isRead: true }, { where: { userId: userId } });
        
        return res.status(200).json({ message: "كل الاشعارات اصبحت مقروءة" });

    } catch (error) {
        return res.status(500).json({ error: error.message })
    }

}

const deleteNotification = async (req, res) => {
    try {
        const { userId } = req.user;
        const { notificationId } = req.params;

        const notification = await Notification.findOne({
            where: {
                id: notificationId,
                userId: userId
            },
            attributes: ['id']
        });
        if (!notification) {
            return res.status(400).json({ error: "الاشعار غير موجود" });
        }

        await notification.destroy();

        return res.status(200).json({ message: "تم حذف الاشعار بنجاح" });
    } catch (error) {
        return res.status(500).json({ error: error.message })
    }
}

module.exports = {
    addNotification,
    getNotifications,
    markNotificationAsRead,
    markAllNotificationsAsRead,
    deleteNotification
}
