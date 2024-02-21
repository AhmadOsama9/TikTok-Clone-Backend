const cron = require('node-cron');
const { Op } = require('sequelize');
const WatchedVideo = require('../config/db').WatchedVideo;

// Schedule a task to run every 3 days at 3:00 AM
cron.schedule('0 3 */3 * *', async function() {
    const threeDaysAgo = new Date();
    threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);

    await WatchedVideo.destroy({
        where: {
            createdAt: {
                [Op.lt]: threeDaysAgo
            }
        }
    });
});