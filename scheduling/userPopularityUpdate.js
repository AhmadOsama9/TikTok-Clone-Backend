const cron = require("node-cron");
const User = require("../config/db").User;
const Video = require("../config/db").Video;
const Comment = require("../config/db").Comment;
const Follow = require("../config/db").Follow;
const UserPopularity = require("../config/db").UserPopularity;
const UserStatus = require("../config/db").UserStatus;
const VideoMetadata = require("../config/db").VideoMetadata;


const { Op } = require("sequelize");

const updateUserPopularityScores = async () => {
    try {
        const users = await User.findAll({ 
            attributes: ['id'],
            include: [{
                model: UserStatus,
                as: 'userStatus',
                attributes: ['isVerified']
            }]
        });

        for (const user of users) {
            let popularity = await UserPopularity.findOne({ where: { userId: user.id } });

            if (!popularity) {
                popularity = await UserPopularity.create({ userId: user.id, popularityScore: 0 });
            }

            const videos = await Video.findAll({ 
                where: { creatorId: user.id },
                attributes: ['id'],
                include: [{
                    model: VideoMetadata,
                    as: 'metadata',
                    attributes: ['likeCount', 'shareCount', 'viewCount']
                }]
            });

            const totalViews = videos.reduce((sum, video) => sum + video.metadata.viewCount, 0);
            const totalLikes = videos.reduce((sum, video) => sum + video.metadata.likeCount, 0);
            const totalShares = videos.reduce((sum, video) => sum + video.metadata.shareCount, 0);
            const totalComments = await Comment.count({ where: { videoId: { [Op.in]: videos.map(video => video.id) } } });
            const followersCount = await Follow.count({ where: { followingId: user.id } });

            let score = 0;
            if (user.userStatus.isVerified) {
                score += 100; // Give a boost for verified users
            }
            score += videos.length * 5; // 10 points for each video
            score += totalViews; // 1 point for each view
            score += totalLikes * 2; // 1 point for each like
            score += totalComments * 2; // 2 points for each comment
            score += totalShares * 3; // 3 points for each share
            score += followersCount * 5; // 5 points for each follower

            await popularity.update({ popularityScore: score });
        }
    } catch (error) {
        console.error("Error updating popularity scores:", error);
    }
};

//In the context of databases, most databases can handle large integers. 
//For example, in MySQL, the BIGINT type can store integers up to 9223372036854775807.
//So yeah I won't scale it down

cron.schedule("0 4 */2 * *", updateUserPopularityScores);

// updateUserPopularityScores().then(() => {
//     console.log('Popularity scores updated');
// }).catch((error) => {
//     console.error('Error updating popularity scores:', error);
// });
