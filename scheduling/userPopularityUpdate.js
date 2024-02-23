const cron = require("node-cron");
const User = require("../config/db").User;
const Video = require("../config/db").Video;
const Comment = require("../config/db").Comment;
const Follow = require("../config/db").Follow;
const UserPopularity = require("../config/db").UserPopularity;
const { Op } = require("sequelize");

const updateUserPopularityScores = async () => { // run every day at midnight
    try {
        const users = await User.findAll({ attributes: ['id', 'isVerified'] });
        for (const user of users) {
            let popularity = await user.getPopularity();

            if (!popularity) {
                popularity = await UserPopularity.create({ userId: user.id, popularityScore: 0 });
            }

            const videos = await Video.findAll({ 
                where: { creatorId: user.id },
                attributes: ['id', 'likes', 'shareCount']
            });

            let totalLikes = 0;
            let totalShares = 0;
            for (let video of videos) {
                totalLikes += video.likes;
                totalShares += video.shareCount;
            }

            const totalComments = await Comment.count({ 
                where: { videoId: { [Op.in]: videos.map(video => video.id) } } 
            });

            const followersCount = await Follow.count({ where: { followingId: user.id } });

            let score = 0;
            if (user.isVerified) {
                score += 100; // Give a boost for verified users
            }
            score += videos.length * 5; // 10 points for each video
            score += totalLikes; // 1 point for each like
            score += totalComments * 2; // 2 points for each comment
            score += totalShares * 3; // 3 points for each share
            score += followersCount * 5; // 5 points for each follower

            
            await popularity.update({ popularityScore: score });
        }
    } catch (error) {
        console.error("Error updating popularity scores:", error);
    }
};

cron.schedule("0 0 * * *", updateUserPopularityScores);

// updateUserPopularityScores().then(() => {
//     console.log('Popularity scores updated');
// }).catch((error) => {
//     console.error('Error updating popularity scores:', error);
// });
