const User = require('../config/db').User;
const UserStatus = require('../config/db').UserStatus;
const Video = require('../config/db').Video;
const Profile = require('../config/db').Profile;
const sequelize = require('../config/db').sequelize;

const bucketName = process.env.VIDEO_BUCKET_NAME || "kn_story_app";
const storage = require("../config/cloudStorage");

const deleteUserController = async (req, res) => {
    let transaction;
    try {
        const { userId } = req.user;
        const userToBeDeletedId = req.params.userToBeDeletedId;

        const userStatus = await UserStatus.findByPk(userId, {
            attributes: ['isAdmin'],
        });
        if (!userStatus || !userStatus.isAdmin)
            return res.status(403).json({ message: 'You are not authorized to perform this action' });

        transaction = await sequelize.transaction();

        const profile = await Profile.findOne({
            where: {
                userId: userToBeDeletedId,
            },
            attributes: ['imageName'],
        });

        const videos = await Video.findAll({
            where: {
                userId: userToBeDeletedId,
            },
            attributes: ['id', 'fileName', 'thumbnailName'],
        });

        // Delete the user and all associated records
        await User.destroy({
            where: {
                id: userToBeDeletedId,
            },
            transaction,
        });

        // Delete all video and profile images from cloud storage
        for (const video of videos) {
            await deleteFromCloudStorage(video.fileName);
            await deleteFromCloudStorage(video.thumbnailName);
        }

        if (profile && profile.imageName) {
            await deleteFromCloudStorage(profile.imageName);
        }

        await transaction.commit();

        return res.status(200).json({ message: 'User has been deleted' });

    } catch (error) {
        if (transaction) await transaction.rollback();
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