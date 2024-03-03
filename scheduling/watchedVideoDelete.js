const cron = require('node-cron');
const { Op } = require('sequelize');
const WatchedVideo = require('../config/db').WatchedVideo;
//I don't think that I will need this here
//since I only store up to the last 30, so yeah mostly I remove this


const watchedVideoDelete = async function() {
    try {
        const fiveDaysAgo = new Date();
        fiveDaysAgo.setDate(fiveDaysAgo.getDate() - 5);

        await WatchedVideo.destroy({
            where: {
                createdAt: {
                    [Op.lt]: fiveDaysAgo
                }
            }
        });
    } catch (error) {
        console.error('Error deleting watched videos:', error);
   }
}

cron.schedule('0 3 */5 * *', watchedVideoDelete);

// watchedVideoDelete().then(() => {
//     console.log('Watched videos deleted');
// }).catch((error) => {
//     console.error('Error deleting watched videos:', error);
// })