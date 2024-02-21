const UserPersonalization = require("../config/db").UserPersonalization;
const Video = require("../config/db").Video;
const RecentInteraction = require("../config/db").RecentInteraction;
const WatchedVideo = require("../config/db").WatchedVideo;
const sequelize = require("../config/db").sequelize;
const { Op } = require("sequelize");
const { getSignedUrl } = require("../controllers/profileController");

const createUserPersonalization = async (req, res) => {
    const transaction = await sequelize.transaction();
    try {
        const { userId } = req.user;
        const { videoId, liked, viewed, shared, commented } = req.body;

        if (!videoId)
            return res.status(400).json({ message: 'Video ID is required' });

        const video = await Video.findOne({ 
            where: { id: videoId },
            attributes: ['category']
        });

        if (!video)
            return res.status(404).json({ message: 'Video not found' });

        let category = video.category;

        let userPersonalization = await UserPersonalization.findOne({
            where: { userId, category }
        });

        if (!userPersonalization) {
            userPersonalization = await UserPersonalization.create({
                userId, category, topVideoIds: [videoId]
            }, { transaction });
        }

        let interactionCount = 0;
        if (viewed) interactionCount += 5;
        if (liked) interactionCount += 10;
        if (commented) interactionCount += 20;
        if (shared) interactionCount += 30;
        
        if (userPersonalization.currentInterest < userPersonalization.peakInterest) {
            const difference = userPersonalization.peakInterest - userPersonalization.currentInterest;
            let boost = 0;
        
            if (difference > 1) {
                boost = 10;
            } else if(difference > 0.5) {
                boost = 5;
            } else if (difference > 0.25) {
                boost = 3;
            } else if (difference > 0.15) {
                boost = 2;
            } else if (difference > 0.05) {
                boost = 1;
            }
        
            interactionCount += boost;
        }

        interactionCount = (interactionCount / 65) * 5;

        userPersonalization.totalInteractions += 1;
        userPersonalization.currentInterest = (userPersonalization.currentInterest * (userPersonalization.totalInteractions - 1) + interactionCount) / userPersonalization.totalInteractions;

        if (userPersonalization.currentInterest > userPersonalization.peakInterest) {
            userPersonalization.peakInterest = userPersonalization.currentInterest;
        }

        if (!userPersonalization.topVideoIds.includes(videoId)) {
            if (userPersonalization.topVideoIds.length < 10) {
                userPersonalization.topVideoIds.push(videoId);
            } else {
                // Replace the oldest video ID with the new one
                userPersonalization.topVideoIds.shift();
                userPersonalization.topVideoIds.push(videoId);
            }
        }

        const watchedVideos = await WatchedVideo.findAll({
            where: { userId },
            order: [['createdAt', 'ASC']],
        }, { transaction });
        
        if (watchedVideos.length > 50) {
            await watchedVideos[0].destroy({ transaction });
        }

        await WatchedVideo.create({
            userId,
            videoId,
        }, { transaction });

        await RecentInteraction.create({
            userId,
            videoId,
            category,
        }, { transaction });

        // If there are more than 20 RecentInteractions for this user, delete the oldest one
        const recentInteractions = await RecentInteraction.findAll({
            where: { userId },
            order: [['createdAt', 'ASC']],
        }, { transaction });

        if (recentInteractions.length > 20) {
            await recentInteractions[0].destroy( { transaction });
        }

        await userPersonalization.save({ transaction });

        await transaction.commit();

        return res.status(200).json({ message: 'User personalization updated' });

    } catch (error) {
        await transaction.rollback();
        return res.status(500).json({ error: error.message });
    }
}

const decayUserPersonalization = async (userId) => {
    const transaction = await sequelize.transaction();
    try {
        // Fetch the last 20 interactions for this user
        const recentInteractions = await RecentInteraction.findAll({
            where: { userId },
            order: [['createdAt', 'DESC']],
            limit: 20,
        }, { transaction });

        // Count the number of interactions for each category
        const categoryCounts = {};
        for (const interaction of recentInteractions) {
            if (!categoryCounts[interaction.category]) {
                categoryCounts[interaction.category] = 0;
            }
            categoryCounts[interaction.category]++;
        }

        // Fetch the user's personalizations
        const userPersonalizations = await UserPersonalization.findAll({
            where: { userId },
        }, { transaction });

        // Apply the decay factor to categories with a small proportion of interactions
        for (const personalization of userPersonalizations) {
            const categoryCount = categoryCounts[personalization.category] || 0;
            const proportion = categoryCount / recentInteractions.length;

            if (proportion < 0.05) { // Adjust this threshold as needed
                personalization.currentInterest *= 0.9; // Adjust this decay factor as needed
                await personalization.save({ transaction });
            }
        }

        await transaction.commit();
    } catch (error) {
        await transaction.rollback();
        throw error;
    }
};

// Fetch user personalizations
const fetchUserPersonalizations = async (userId) => {
    let userPersonalizations = await UserPersonalization.findAll({
        where: { userId },
    });
    if (!userPersonalizations) {
        throw new Error('User personalization not found');
    }

    // Sort userPersonalizations in descending order based on currentInterest
    userPersonalizations.sort((a, b) => b.currentInterest - a.currentInterest);

    return userPersonalizations;
};

// Fetch popular videos
const fetchPopularVideos = async (category, limit, watchedVideoIds) => {
    return await Video.findAll({
        where: { 
            category,
            videoId: { [Op.notIn]: watchedVideoIds }
        },
        order: [['videoPopularityScore', 'DESC']],
        limit,
    });
};

// Fetch new videos
const fetchNewVideos = async (category, limit, watchedVideoIds) => {
    return await Video.findAll({
        where: { 
            category,
            videoId: { [Op.notIn]: watchedVideoIds }
        },
        order: [['createdAt', 'DESC']],
        limit,
    });
};

// Fetch videos without excluding watched ones
const fetchVideosWithoutExcludingWatched = async (category, limit) => {
    const popularLimit = Math.round(limit * 0.7);
    const newLimit = limit - popularLimit;

    const popularVideos = await Video.findAll({
        where: { category },
        order: [['videoPopularityScore', 'DESC']],
        limit: popularLimit,
    });

    const newVideos = await Video.findAll({
        where: { category },
        order: [['createdAt', 'DESC']],
        limit: newLimit,
    });

    return [...popularVideos, ...newVideos];
};

// Main function
const getRecommendedVideos = async (req, res) => {
    try {
        const { userId } = req.user;

        const userPersonalizations = await fetchUserPersonalizations(userId);
        const totalInterest = userPersonalizations.reduce((total, personalization) => total + personalization.currentInterest, 0);

        const recommendedVideos = [];
        let remainingVideos = 10; // Total number of videos to fetch

        // Fetch popular and new videos
        for (const personalization of userPersonalizations) {
            let limit = Math.round((personalization.currentInterest / totalInterest) * remainingVideos * 0.7);
            limit = Math.min(limit, remainingVideos); // Ensure we don't fetch more videos than remaining

            const popularVideos = await fetchPopularVideos(personalization.category, limit, watchedVideoIds);
            recommendedVideos.push(...popularVideos);
            remainingVideos -= popularVideos.length; // Update the number of remaining videos

            if (remainingVideos <= 0) break; // If we've fetched enough videos, stop looping

            limit = Math.round((personalization.currentInterest / totalInterest) * remainingVideos);
            limit = Math.min(limit, remainingVideos); // Ensure we don't fetch more videos than remaining

            const newVideos = await fetchNewVideos(personalization.category, limit, watchedVideoIds);
            recommendedVideos.push(...newVideos);
            remainingVideos -= newVideos.length; // Update the number of remaining videos

            if (remainingVideos <= 0) break; // If we've fetched enough videos, stop looping
        }

        // Fetch more videos without excluding watched ones if necessary
        if (recommendedVideos.length < 10) {
            for (const personalization of userPersonalizations) {
                if (recommendedVideos.length >= 10) break; // If we've fetched enough videos, stop looping

                let limit = Math.round((personalization.currentInterest / totalInterest) * (10 - recommendedVideos.length));
                limit = Math.min(limit, 10 - recommendedVideos.length); // Ensure we don't fetch more videos than remaining

                const videos = await fetchVideosWithoutExcludingWatched(personalization.category, limit);
                recommendedVideos.push(...videos);
            }
        }

        if (recommendedVideos.length === 0) {
            const trendingVideos = await getTrendingVideos(userId);
            return res.status(200).json({ recommendedVideos: trendingVideos });
        }


        const recommendedVideosWithSignedUrls = await Promise.all(recommendedVideos.map(async (video) => {
            const videoUrl = await getSignedUrl(video.fileName);
            const videoThumbnailUrl = await getSignedUrl(video.thumbnailFileName);
        
            return {
                videoId: video.videoId,
                description: video.description,
                category: video.category,
                videoUrl,
                videoThumbnailUrl,
            };
        }));

        return res.status(200).json({ recommendedVideosWithSignedUrls });



    } catch (error) {
        return res.status(500).json({ error: error.message });
    }
};


async function getTrendingVideos(userId) {
    try {
        const totalVideos = 10; // Total number of videos to fetch
        const explorationLimit = Math.round(totalVideos * 0.7); // 70% of totalVideos

        const watchedVideos = await WatchedVideo.findAll({ where: { userId } });
        const watchedVideoIds = watchedVideos.map(video => video.videoId);

        let explorationVideos = await Video.findAll({
            where: { videoId: { [Op.notIn]: watchedVideoIds } },
            order: [['videoPopularityScore', 'DESC']],
            limit: explorationLimit,
        });

        let exploitationRemaining = totalVideos - explorationVideos.length;
        let exploitationVideos = await Video.findAll({
            where: { videoId: { [Op.notIn]: watchedVideoIds } },
            order: [['createdAt', 'DESC']],
            limit: exploitationRemaining,
        });

        if (explorationVideos.length + exploitationVideos.length < totalVideos) {
            const remainingVideos = totalVideos - explorationVideos.length - exploitationVideos.length;
            const popularLimit = Math.round(remainingVideos * 0.7);
            const newLimit = remainingVideos - popularLimit;

            const popularVideos = await Video.findAll({
                where: { category },
                order: [['videoPopularityScore', 'DESC']],
                limit: popularLimit,
            });

            const newVideos = await Video.findAll({
                where: { category },
                order: [['createdAt', 'DESC']],
                limit: newLimit,
            });

            explorationVideos = [...explorationVideos, ...popularVideos];
            exploitationVideos = [...exploitationVideos, ...newVideos];
        }

        const trendingVideos = [...explorationVideos, ...exploitationVideos];

        const trendingVideosWithSignedUrls = await Promise.all(trendingVideos.map(async (video) => {
            const videoUrl = await getSignedUrl(video.fileName);
            const videoThumbnailUrl = await getSignedUrl(video.thumbnailFileName);
        
            return {
                videoId: video.videoId,
                description: video.description,
                category: video.category,
                videoUrl,
                videoThumbnailUrl,
            };
        }));

        return trendingVideosWithSignedUrls;
    } catch (error) {
        console.error(error);
        return [];
    }
}

const usingGetTrendingVideos = async (req, res) => {
    try {

        const trendingVideos = await getTrendingVideos(userId);

        return res.status(200).json({ trendingVideos });

    } catch (error) {
        return res.status(500).json({ error: error.message })
    }
}

module.exports = {
    createUserPersonalization,
    decayUserPersonalization,
    getRecommendedVideos,
    usingGetTrendingVideos,
};

//So we will assume that there's no user that will keep on missing with the algorithm
//like keep on saying he liked and commented that video and so on.
//I mean the worst case is that his recommendation system will be missed up
