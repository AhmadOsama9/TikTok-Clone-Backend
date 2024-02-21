const cron = require("node-cron");
const Video = require("../config/db").Video;
const Comment = require("../config/db").Comment;

cron.schedule("0 0 * * *", async () => { // run every day at midnight
    try {
        const videos = await Video.findAll({ attributes: ['id', 'likes', 'shareCount'] });

        for (const video of videos) {
            const totalComments = await Comment.count({ where: { videoId: video.id } });
            const score = Math.log(video.viewsCount + 1) + video.likes + totalComments * 2 + video.shareCount * 3;
            await video.update({ popularityScore: score });
        }
    } catch (error) {
        console.error("Error updating video popularity scores:", error);
    }
});