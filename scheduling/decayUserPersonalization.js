const cron = require("node-cron");
const User = require("../config/db").User;
const WatchedVideo = require("../config/db").WatchedVideo;
const VideoCategory = require("../config/db").VideoCategory;
const UserPersonalization = require("../config/db").UserPersonalization;
const sequelize = require("../config/db").sequelize;

//if the user has not interacted with a category for a long time, we should decay the interest in that category
//This is to ensure that the user's interests are up to date
const decayUserPersonalization = async (userId) => {
    const transaction = await sequelize.transaction();
    try {
        // Fetch the last 20 videos for this user
        const recentVideos = await WatchedVideo.findAll({
            where: { userId },
            order: [['createdAt', 'DESC']],
            limit: 20,
        }, { transaction });

        // Count the number of interactions for each category
        const categoryCounts = {};
        for (const video of recentVideos) {
            const videoCategories = await VideoCategory.findAll({ 
                where: { videoId: video.videoId },
                attributes: ['name']
            });

            for (const category of videoCategories) {
                if (!categoryCounts[category.name]) {
                    categoryCounts[category.name] = 0;
                }
                categoryCounts[category.name]++;
            }
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

        await transaction.commit();
    } catch (error) {
        await transaction.rollback();
        throw error;
    }
};

const scheduleDecayUserPersonalization = () => {
    cron.schedule("0 3 */2 * *", async () => {
        try {
            const users = await User.findAll({ attributes: ['id'] });
            for (const user of users) {
                await decayUserPersonalization(user.id);
            }
        } catch (error) {
            console.log("error decaying user personalization: ", error);
        }
    });
};

module.exports = {
    scheduleDecayUserPersonalization,
}


// decayUserPersonalization().then(() => {
//     console.log('User personalization decayed');
// }).catch ((error) => {
//     console.log('Error decaying user personalization: ', error)
// })