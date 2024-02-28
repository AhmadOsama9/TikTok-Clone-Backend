const Notification = require("../config/db").Notification;
const User = require("../config/db").User;
const Video = require("../config/db").Video;
const Comment = require("../config/db").Comment;


async function addNotification (userId, videoId, commentId, otherUserId, notificationType, title, transaction ) {
    try {
        if (userId === otherUserId) {
            console.log("You can't notify yourself");
            return;
        }

        if ((!videoId || !commentId) && !otherUserId)
            throw new Error('Invalid notification');

        if (notificationType < 1 || notificationType > 5)
            throw new Error('Invalid notification type');

        if (videoId) {
            const video = await Video.findByPk(videoId);
            if (!video)
                throw new Error('Video not found');
        }

        if (commentId) {
            const comment = await Comment.findByPk(commentId, { transaction });
            if (!comment)
                throw new Error('Comment not found');
        }

        if (otherUserId) {
            const user = await User.findByPk(otherUserId);
            if (!user)
                throw new Error('User not found');
        }

        const notificationsCount = await Notification.count({ where: { userId } });
        if (notificationsCount >= 20) {
            const oldestNotification = await Notification.findOne({
                where: { userId },
                order: [['createdAt', 'ASC']]
            });
            if (oldestNotification) {
                await oldestNotification.destroy({ transaction });
            }
        }

        const similarNotification = await Notification.findOne({
            where: { 
                userId, 
                notificationType,
                ...(notificationType === 3 || notificationType === 2 || notificationType === 5 || notificationType === 4 ? { videoId } : { videoId, commentId, otherUserId })
            }
        });

        if (similarNotification) {
            similarNotification.count += 1;

            switch (notificationType) {
                case 1:
                    similarNotification.body = `Your video has been liked ${similarNotification.count} times.`;
                    break;
                case 2:
                    similarNotification.body = `Your video has received ${similarNotification.count} comments.`;
                    break;
                case 3:
                    similarNotification.body = `You have ${similarNotification.count} new followers.`;
                    break;
                case 4:
                    similarNotification.body = `You have been mentioned ${similarNotification.count} times.`;
                    break;
                case 5:
                    similarNotification.body = `Your video has received ${similarNotification.count} gift comments.`;
                    break;
            }

            await similarNotification.save({ transaction });
        } else {
            let body;
            switch (notificationType) {
                case 1:
                    body = 'Your video has been liked.';
                    break;
                case 2:
                    body = 'Your video has received a comment.';
                    break;
                case 3:
                    body = 'You have a new follower.';
                    break;
                case 4:
                    body = 'You have been mentioned.';
                    break;
                case 5:
                    body = 'Your video has received a gift comment.';
                    break;
            }

            await Notification.create({ userId, videoId, commentId, otherUserId, notificationType, count: 1, title, body, isRead: false }, { transaction });
        }

    } catch (error) {
        throw new Error(error);
    }
}


const getNotifications = async (req, res) => { 
    try {
        const { userId } = req.user;
        //return the creator username
        //if the count is 1

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
            }
        });
        if (!notification) {
            return res.status(400).json({ error: "Notification not found" });
        }

        await notification.update({ isRead: true });
        
        return res.status(200).json({ message: "Notification marked as read" });

    } catch (error) {

    }
}


const markAllNotificationsAsRead = async (req, res) => {
    try {
        const { userId } = req.user;

        await Notification.update({ isRead: true }, { where: { userId: userId } });
        
        return res.status(200).json({ message: "All notifications marked as read" });

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
            }
        });
        if (!notification) {
            return res.status(400).json({ error: "Notification not found" });
        }

        await notification.destroy();

        return res.status(200).json({ message: "Notification deleted" });
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
