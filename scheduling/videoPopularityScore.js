const cron = require("node-cron");
const Video = require("../config/db").Video;
const Comment = require("../config/db").Comment;
const VideoMetadata = require("../config/db").VideoMetadata;


//so now it should be decaying the score at the same time
const updateVideoPopularityScore = async () => { 
    try {
        const videos = await Video.findAll({ 
            attributes: ['id', 'createdAt'],
            include: [{
                model: VideoMetadata,
                as: 'metadata',
                attributes: ['viewCount', 'likeCount', 'shareCount', 'averageRating', 'popularityScore', 'highestPopularityScore']
            }]
        });

        for (const video of videos) {
            const totalComments = await Comment.count({ where: { videoId: video.id } });
            const daysSinceCreation = Math.ceil((new Date() - new Date(video.createdAt)) / (1000 * 60 * 60 * 24));
            const decayFactor = Math.max(0, 1 - daysSinceCreation * 0.03); // Decrease by 3% each day
            let score = (Math.log(video.metadata.viewCount + 1) + video.metadata.likeCount + totalComments * 2 + video.metadata.shareCount * 3 + video.metadata.averageRating * 5) * decayFactor;
            score = Math.max(score, video.metadata.highestPopularityScore * 0.65); // Set a minimum limit to 65% of the highest popularity score
            if (score > video.metadata.highestPopularityScore) {
                await video.metadata.update({ popularityScore: score, highestPopularityScore: score });
            } else {
                await video.metadata.update({ popularityScore: score });
            }
        }
    } catch (error) {
        console.error("Error updating video popularity scores:", error);
    }
};

cron.schedule("0 5 */3 * *", updateVideoPopularityScore);
//we can use a decay for the video popularity score
//maybe after one day or two

// updateVideoPopularityScore().then(() => { 
//     console.log('Video popularity scores updated');
// }).catch((error) => {
//     console.error('Error updating video popularity scores:', error);
// });
