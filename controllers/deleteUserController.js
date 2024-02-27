const User = require('../config/db').User;
const UserStatus = require('../config/db').UserStatus;
const UserAuth = require('../config/db').UserAuth;
const UserPersonalization = require('../config/db').UserPersonalization;
const UserPopularity = require('../config/db').UserPopularity;
const Profile = require('../config/db').Profile;
const Video = require('../config/db').Video;
const VideoMetadata = require('../config/db').VideoMetadata;
const VideoCategory = require('../config/db').VideoCategory;
const VideoLike = require('../config/db').VideoLike;
const VideoView = require('../config/db').VideoView;
const Comment = require('../config/db').Comment;
const WatchedVideo = require('../config/db').WatchedVideo;
const Transaction = require('../config/db').Transaction;
const SavedVideo = require('../config/db').SavedVideo;
const Report = require('../config/db').Report;
const Rate = require('../config/db').Rate;
const Notification = require('../config/db').Notification;
const Chat = require('../config/db').Chat;
const Message = require('../config/db').Message;
const Follow = require('../config/db').Follow;
const sequelize = require('../config/db').sequelize;
const { Op } = require('sequelize'); 

const bucketName = process.env.VIDEO_BUCKET_NAME || "kn_story_app";
const storage = require("../config/cloudStorage");


const deleteUserController = async (req, res) => {
    try {
        const { userId } = req.user;
        const { userToBeDeletedId } = req.params.userToBeDeletedId;


        const userStatus = await UserStatus.findByPk(userId);
        if (!userStatus || !userStatus.isAdmin)
            return res.status(403).json({ message: 'You are not authorized to perform this action' });

        const transaction = await sequelize.transaction();

        const profile = await Profile.findOne({
            where: {
                userId: userToBeDeletedId,
            },
        });

        const videos = await Video.findAll({
            where: {
                userId: userToBeDeletedId,
            },
        });

        await User.destroy({
            where: {
                id: userToBeDeletedId,
            },
            transaction,
        });

        await UserStatus.destroy({
            where: {
                userId: userToBeDeletedId,
            },
            transaction,
        });

        await UserAuth.destroy({
            where: {
                userId: userToBeDeletedId,
            },
            transaction,
        });

        await UserPersonalization.destroy({
            where: {
                userId: userToBeDeletedId,
            },
            transaction,
        });

        await UserPopularity.destroy({
            where: {
                userId: userToBeDeletedId,
            },
            transaction,
        });

        await Profile.destroy({
            where: {
                userId: userToBeDeletedId,
            },
            transaction,
        });

        await Video.destroy({
            where: {
                userId: userToBeDeletedId,
            },
            transaction,
        });

        await VideoMetadata.destroy({
            where: {
                userId: userToBeDeletedId,
            },
            transaction,
        });

        await VideoCategory.destroy({
            where: {
                userId: userToBeDeletedId,
            },
            transaction,
        });

        await VideoLike.destroy({
            where: {
                userId: userToBeDeletedId,
            },
            transaction,
        });

        await VideoView.destroy({
            where: {
                userId: userToBeDeletedId,
            },
            transaction,
        });

        await Comment.destroy({
            where: {
                userId: userToBeDeletedId,
            },
            transaction,
        });

        await WatchedVideo.destroy({
            where: {
                userId: userToBeDeletedId,
            },
            transaction,
        });

        await Transaction.destroy({
            where: {
                userId: userToBeDeletedId,
            },
            transaction,
        });

        await SavedVideo.destroy({
            where: {
                userId: userToBeDeletedId,
            },
            transaction,
        });

        await Report.destroy({
            where: {
                userId: userToBeDeletedId,
            },
            transaction,
        });

        await Rate.destroy({
            where: {
                userId: userToBeDeletedId,
            },
            transaction,
        });

        await Notification.destroy({
            where: {
                userId: userToBeDeletedId,
            },
            transaction,
        });

        await Chat.destroy({
            where: {
                [Op.or]: [
                    { user1Id: userToBeDeletedId },
                    { user2Id: userToBeDeletedId }
                ]
            },
            transaction,
        });

        await Message.destroy({
            where: {
                userId: userToBeDeletedId,
            },
            transaction,
        });

        await Follow.destroy({
            where: {
                userId: userToBeDeletedId,
            },
            transaction,
        });

        await transaction.commit();

        for (const video of videos) {
            await deleteFromCloudStorage(video.fileName);
            await deleteFromCloudStorage(video.thumbnailName);
        }

        if (profile && profile.imageName) {
            await deleteFromCloudStorage(profile.imageName);
        }

        return res.status(200).json({ message: 'User has been deleted' });

    } catch (error) {
        await transaction.rollback();
        return res.status(500).json({ error: error.message });
    }
}


async function deleteFromCloudStorage(fileName) {
    const bucket = storage.bucket(bucketName);
    const file = bucket.file(fileName);
  
    try {
      await file.delete();
    } catch (error) {
      if (error.code !== 404) { 
        throw error;
      }
    }
}


module.exports = deleteUserController;

