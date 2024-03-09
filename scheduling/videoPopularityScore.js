const cron = require("node-cron");
const { Op } = require("sequelize");
const Video = require("../config/db").Video;
const Comment = require("../config/db").Comment;
const VideoMetadata = require("../config/db").VideoMetadata;

const updateVideoPopularityScore = async (video) => {
    const totalComments = await Comment.count({ 
        where: { 
            videoId: video.id,
            createdAt: { [Op.gt]: video.metadata.updatedAt }
        } 
    });
    const daysSinceCreation = Math.ceil((new Date() - new Date(video.createdAt)) / (1000 * 60 * 60 * 24));
    const decayFactor = Math.max(0, 1 - daysSinceCreation * 0.03); // Decrease by 3% each day
    let score = (Math.log(video.metadata.viewCount + 1) + video.metadata.likeCount + totalComments * 2 + video.metadata.shareCount * 3 + video.metadata.averageRating * 5) * decayFactor;
    score = Math.max(score, video.metadata.highestPopularityScore * 0.65); // Set a minimum limit to 65% of the highest popularity score
    if (score > video.metadata.highestPopularityScore) {
        await video.metadata.update({ popularityScore: score, highestPopularityScore: score, updatedAt: new Date() });
    } else {
        await video.metadata.update({ popularityScore: score, updatedAt: new Date() });
    }
};

const allVideosPopularityUpdate = async () => {
    const videos = await Video.findAll({ 
        attributes: ['id', 'createdAt'],
        include: [{
            model: VideoMetadata,
            as: 'metadata',
            attributes: ['id', 'viewCount', 'likeCount', 'shareCount', 'averageRating', 'popularityScore', 'highestPopularityScore', 'updatedAt']
        }]
    });

    const batchSize = 100;
    for (let i = 0; i < videos.length; i += batchSize) {
        const batchVideos = videos.slice(i, i + batchSize);
        await Promise.all(batchVideos.map(video => updateVideoPopularityScore(video)));
    }
};

const scheduleVideoPopularityUpdate = () => {
    cron.schedule("0 5 */3 * *", allVideosPopularityUpdate);
}

module.exports = {
    scheduleVideoPopularityUpdate,
}