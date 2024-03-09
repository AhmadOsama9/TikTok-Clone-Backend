const cron = require("node-cron");
const User = require("../config/db").User;
const Video = require("../config/db").Video;
const Comment = require("../config/db").Comment;
const Follow = require("../config/db").Follow;
const UserPopularity = require("../config/db").UserPopularity;
const UserStatus = require("../config/db").UserStatus;
const VideoMetadata = require("../config/db").VideoMetadata;

const { Op } = require("sequelize");



const BATCH_SIZE = process.env.BATCH_SIZE || 100; // Adjust this value based on your system's capacity
const PARALLEL_JOBS = process.env.PARALLEL_JOBS || 5; // Adjust this value based on your system's capacity

const updateUserPopularityScores = async () => {
    try {
        let offset = 0;
        while (true) {
            const users = await User.findAll({
                limit: BATCH_SIZE,
                offset: offset * BATCH_SIZE,
                attributes: ['id'],
                include: [{
                    model: UserStatus,
                    as: 'userStatus',
                    attributes: ['isVerified']
                }]
            });

            if (users.length === 0) {
                break;
            }

            await Promise.all(users.map((user, index) => {
                if (index % PARALLEL_JOBS === 0) {
                    return new Promise(resolve => setTimeout(resolve, 0));
                }

                return updateUserPopularityScore(user);
            }));

            offset++;
        }
    } catch (error) {
        console.error("Error updating popularity scores:", error);
    }
};


const updateUserPopularityScore = async (user) => {
    let popularity = await UserPopularity.findOne({ where: { userId: user.id } });

    if (!popularity) {
        popularity = await UserPopularity.create({ userId: user.id, popularityScore: 0, updatedAt: new Date(0) });
    }

    const [newVideos, newComments, newFollowers] = await Promise.all([
        Video.findAll({
            where: { 
                creatorId: user.id,
                createdAt: { [Op.gt]: popularity.updatedAt }
            },
            attributes: ['id'],
            include: [{
                model: VideoMetadata,
                as: 'metadata',
                attributes: ['likeCount', 'shareCount', 'viewCount']
            }]
        }),
        Comment.count({ 
            where: { 
                videoId: { [Op.in]: newVideos.map(video => video.id) },
                createdAt: { [Op.gt]: popularity.updatedAt }
            } 
        }),
        Follow.count({ 
            where: { 
                followingId: user.id,
                createdAt: { [Op.gt]: popularity.updatedAt }
            } 
        })
    ]);

    const newLikes = newVideos.reduce((sum, video) => sum + video.metadata.likeCount, 0);
    const newShares = newVideos.reduce((sum, video) => sum + video.metadata.shareCount, 0);
    const newViews = newVideos.reduce((sum, video) => sum + video.metadata.viewCount, 0);

    let score = popularity.popularityScore;
    score += newVideos.length * 5;
    score += newViews;
    score += newLikes * 2;
    score += newComments * 2;
    score += newShares * 3;
    score += newFollowers * 5;

    await popularity.update({ popularityScore: score, updatedAt: new Date() });
};
//In the context of databases, most databases can handle large integers. 
//For example, in MySQL, the BIGINT type can store integers up to 9223372036854775807.
//So yeah I won't scale it down

const scheduleUserPopularityUpdate = () => {
    cron.schedule("0 4 */2 * *", updateUserPopularityScores);
};

module.exports = {
    scheduleUserPopularityUpdate,
}

// updateUserPopularityScores().then(() => {
//     console.log('Popularity scores updated');
// }).catch((error) => {
//     console.error('Error updating popularity scores:', error);
// });
