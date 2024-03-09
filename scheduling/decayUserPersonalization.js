const cron = require("node-cron");
const { Op } = require("sequelize");
const User = require("../config/db").User;
const WatchedVideo = require("../config/db").WatchedVideo;
const VideoCategory = require("../config/db").VideoCategory;
const UserPersonalization = require("../config/db").UserPersonalization;
const sequelize = require("../config/db").sequelize;

const decayUserPersonalization = async (userId, transaction) => {
    // Fetch the last 20 videos for this user
    const recentVideos = await WatchedVideo.findAll({
        where: { userId },
        order: [['createdAt', 'DESC']],
        limit: 20,
    }, { transaction });

    // Fetch the categories for all videos in a single query
    const videoCategories = await VideoCategory.findAll({ 
        where: { videoId: recentVideos.map(video => video.videoId) },
        attributes: ['name', 'videoId']
    });

    // Count the number of interactions for each category
    const categoryCounts = {};
    for (const category of videoCategories) {
        if (!categoryCounts[category.name]) {
            categoryCounts[category.name] = 0;
        }
        categoryCounts[category.name]++;
    }

    // Fetch the user's personalizations
    const userPersonalizations = await UserPersonalization.findAll({
        where: { userId },
    }, { transaction });

    // Apply the decay factor to categories with a small proportion of interactions
    for (const personalization of userPersonalizations) {
        const categoryCount = categoryCounts[personalization.category] || 0;
        const proportion = categoryCount / recentVideos.length;

        if (proportion < 0.05) { // Adjust this threshold as needed
            personalization.currentInterest *= 0.97; // Adjust this decay factor as needed
            await personalization.save({ transaction });
        }
    }
};


const decayAllUserPersonalization = async () => {
    const users = await User.findAll({ attributes: ['id'] });
    const batchSize = 100;
    for (let i = 0; i < users.length; i += batchSize) {
        const batchUsers = users.slice(i, i + batchSize);
        const transaction = await sequelize.transaction();
        try {
            await Promise.all(batchUsers.map(user => decayUserPersonalization(user.id, transaction)));
            await transaction.commit();
        } catch (error) {
            await transaction.rollback();
            throw error;
        }
    }
};

const scheduleDecayUserPersonalization = () => {
    cron.schedule("0 3 */2 * *", decayAllUserPersonalization);
}

module.exports = {
    scheduleDecayUserPersonalization,
}