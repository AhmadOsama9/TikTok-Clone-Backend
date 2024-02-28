const UserPersonalization = require("../config/db").UserPersonalization;
const Video = require("../config/db").Video;
const Rate = require("../config/db").Rate;
const WatchedVideo = require("../config/db").WatchedVideo;
const VideoCategory = require("../config/db").VideoCategory;
const VideoMetadata = require("../config/db").VideoMetadata;
const sequelize = require("../config/db").sequelize;
const { Op } = require("sequelize");
const { getSignedUrl } = require("../controllers/profileController");
const fetchVideoData = require("../helper/fetchVideoData")

//Should use rate for the recommendation

// Create user personalization
// This function is called whenever a user interacts with a video
// The function updates the user's personalization based on the interaction
// The function also updates the user's watched videos
// The function also updates the video's views count
const createUserPersonalization = async (req, res) => {
    const transaction = await sequelize.transaction();
    try {
        const { userId } = req.user;
        const { videoId, liked, viewed, shared, commented, rated } = req.body;

        if (!videoId)
            return res.status(400).json({ message: 'Video ID is required' });

        const video = await Video.findOne({ 
            where: { id: videoId },
            attributes: ['id']
        });

        if (!video)
            return res.status(404).json({ message: 'Video not found' });

        const videoCategories = await VideoCategory.findAll({ 
            where: { videoId },
            attributes: ['name']
        });

        if (!videoCategories.length)
            return res.status(404).json({ message: 'Video not found' });

        const rating = await Rate.findOne({
            where: {
                userId: userId,
                videoId: videoId
            }
        });

        for (let i = 0; i < videoCategories.length; i++) {
            let category = videoCategories[i].name;

            let userPersonalization = await UserPersonalization.findOne({
                where: { userId, category }
            });

            if (!userPersonalization) {
                userPersonalization = await UserPersonalization.create({
                    userId, category
                }, { transaction });
            }

        

            let interactionCount = 0;
            if (viewed) interactionCount += 5;
            if (liked) interactionCount += 10;
            if (commented) interactionCount += 20;
            if (shared) interactionCount += 30;
            if (rating) {
                switch (true) {
                    case (rating.rate >= 1 && rating.rate < 2):
                        interactionCount -= 5;
                        break;
                    case (rating.rate >= 2 && rating.rate < 3):
                        interactionCount -= 10;
                        break;
                    case (rating.rate >= 3 && rating.rate < 4):
                        interactionCount += 15;
                        break;
                    case (rating.rate >= 4 && rating.rate < 5):
                        interactionCount += 30;
                        break;
                    case (rating.rate == 5):
                        interactionCount += 40;
                        break;
                    default:
                        interactionCount--;
                        break;
                }
            }
            
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

            //also will be higher if we use the gift comment  
            interactionCount = Math.min((interactionCount / 105) * 5, 5);

            userPersonalization.totalInteractions += 1;
            userPersonalization.currentInterest = Math.round((userPersonalization.currentInterest * (userPersonalization.totalInteractions - 1) + interactionCount) / userPersonalization.totalInteractions);

            //I think I should find a better way than the rouding down

            if (userPersonalization.currentInterest > userPersonalization.peakInterest) {
                userPersonalization.peakInterest = userPersonalization.currentInterest;
            }

            const watchedVideos = await WatchedVideo.findAll({
                where: { userId },
                order: [['createdAt', 'ASC']],
            }, { transaction });
            
            if (watchedVideos.length > 30) {
                await watchedVideos[0].destroy({ transaction });
            }

            await userPersonalization.save({ transaction });
        }

        await WatchedVideo.create({
            userId,
            videoId,
        }, { transaction });


        await transaction.commit();

        return res.status(200).json({ message: 'User personalization updated' });

    } catch (error) {
        await transaction.rollback();
        console.log("the error: ", error);
        return res.status(500).json({ error: error.message });
    }
}



// Fetch user personalizations
const fetchUserPersonalizations = async (userId) => {
    let userPersonalizations = await UserPersonalization.findAll({
        where: { userId },
    });

    // If no personalization data is found, return an empty array
    if (!userPersonalizations) {
        return [];
    }

    // Sort userPersonalizations in descending order based on currentInterest
    userPersonalizations.sort((a, b) => b.currentInterest - a.currentInterest);

    return userPersonalizations;
};


// Fetch popular videos
const fetchPopularVideos = async (category, limit, watchedVideoIds) => {
    console.log("Fetching the popular videos for the category", category)
    const includeOptions = [
        { 
            model: VideoMetadata, 
            as: 'metadata',
            order: [['popularityScore', 'DESC']],
        }
    ];

    if (category) {
        includeOptions.push({
            model: VideoCategory,
            as: 'categories', 
            where: { name: category }
        });
    }

    return await Video.findAll({
        include: includeOptions,
        where: { 
            id: { [Op.notIn]: watchedVideoIds }
        },
        limit,
    });
};

// Fetch new videos
const fetchNewVideos = async (category, limit, watchedVideoIds) => {
    console.log("Fetching the new videos for the category", category)
    const includeOptions = [
        { 
            model: VideoMetadata, 
            as: 'metadata',
            order: [['createdAt', 'DESC']],
        }
    ];

    if (category) {
        includeOptions.push({
            model: VideoCategory,
            as: 'categories', 
            where: { name: category }
        });
    }

    return await Video.findAll({
        include: includeOptions,
        where: { 
            id: { [Op.notIn]: watchedVideoIds }
        },
        limit,
    });
};

const fetchVideos = async (category, popularLimit, newLimit, watchedVideosIds) => {
    console.log("Fetching the popular and new videos for the category", category)
    const popularVideos = await fetchPopularVideos(category, popularLimit, watchedVideosIds);
    const newVideos = await fetchNewVideos(category, newLimit, watchedVideosIds);
    console.log("Fetched the popular and new videos for the category", category)
    return [...popularVideos, ...newVideos];
};

const fetchRecommendedVideos = async (userPersonalizations, totalInterest, remainingVideos, watchedVideosIds) => {
    const recommendedVideos = [];
    for (const personalization of userPersonalizations) {
        let limit = Math.round((personalization.currentInterest / totalInterest) * remainingVideos);
        let popularLimit = Math.round(limit * 0.6); // 60% popular
        let newLimit = limit - popularLimit; // 40% new

        console.log("Fetching teh videos for the category", personalization.category);
        const videos = await fetchVideos(personalization.category, popularLimit, newLimit, watchedVideosIds);
        recommendedVideos.push(...videos);
        remainingVideos -= videos.length; // Update the number of remaining videos

        // If there are fewer unwatched videos in a category than the user's interest in that category, 
        // fetch videos from other categories according to their highest interest
        if (videos.length < limit) {
            const remainingLimit = limit - videos.length;
            const otherCategories = userPersonalizations.filter(p => p.category !== personalization.category);
            const otherTotalInterest = otherCategories.reduce((total, p) => total + p.currentInterest, 0);
            const otherVideos = await fetchRecommendedVideos(otherCategories, otherTotalInterest, remainingLimit, watchedVideosIds);
            recommendedVideos.push(...otherVideos.recommendedVideos);
            remainingVideos -= otherVideos.recommendedVideos.length;
        }

        if (remainingVideos <= 0) break; // If we've fetched enough videos, stop looping
    }
    return { recommendedVideos, remainingVideos };
};

const fetchNonInteractedVideos = async (nonInteractedCategories, remainingVideos, watchedVideosIds) => {
    const recommendedVideos = [];
    for (const category of nonInteractedCategories) {
        let popularLimit = Math.round(remainingVideos * 0.6); // 60% popular
        let newLimit = remainingVideos - popularLimit; // 40% new

        console.log("It enters here in the nonInteractedVideos, fetching the videos for the category", category);
        const videos = await fetchVideos(category, popularLimit, newLimit, watchedVideosIds);
        recommendedVideos.push(...videos);
        remainingVideos -= videos.length; // Update the number of remaining videos

        if (remainingVideos <= 0) break; // If we've fetched enough videos, stop looping
    }
    return { recommendedVideos, remainingVideos };
};

const fetchWatchedVideos = async (userId, userPersonalizations, totalInterest, remainingVideos) => {
    const allWatchedVideos = await WatchedVideo.findAll({
        where: { userId },
        include: Video
    });

    const recommendedVideos = [];
    if (allWatchedVideos.length > 0) {
        if (userPersonalizations.every(personalization => personalization.currentInterest === userPersonalizations[0].currentInterest)) {
            // The interest value is evenly distributed across all categories, so we randomize the categories and scores
            const randomWatchedVideos = allWatchedVideos.sort(() => Math.random() - 0.5).slice(0, remainingVideos);
            recommendedVideos.push(...randomWatchedVideos);
        } else {
            // Fill the rest with a mix of the watched videos, using the same ratio of 60 to 40 for popular and new videos in the categories that the user is interested in
            for (const personalization of userPersonalizations) {
                let limit = Math.round((personalization.currentInterest / totalInterest) * remainingVideos);
                let popularLimit = Math.round(limit * 0.6); // 60% popular
                let newLimit = limit - popularLimit; // 40% new

                const categoryWatchedVideos = allWatchedVideos.filter(video => video.category === personalization.category);
                const popularWatchedVideos = categoryWatchedVideos.sort((a, b) => b.videoPopularityScore - a.videoPopularityScore).slice(0, popularLimit);
                recommendedVideos.push(...popularWatchedVideos);
                remainingVideos -= popularWatchedVideos.length; // Update the number of remaining videos

                if (remainingVideos <= 0) break; // If we've filled the rest, stop looping

                const newWatchedVideos = categoryWatchedVideos.sort((a, b) => b.createdAt - a.createdAt).slice(0, newLimit);
                recommendedVideos.push(...newWatchedVideos);
                remainingVideos -= newWatchedVideos.length; // Update the number of remaining videos

                if (remainingVideos <= 0) break; // If we've filled the rest, stop looping
            }
        }
    }
    return recommendedVideos;
};

const getRecommendedVideos = async (req, res) => {
    try {
        const { userId } = req.user;

        let userPersonalizations = await fetchUserPersonalizations(userId);
        let totalInterest = userPersonalizations.reduce((total, personalization) => total + personalization.currentInterest, 0);

        console.log("after fetching the userPersonalization");

        let remainingVideos = process.env.RECOMMENDED_VIDEOS_LIMIT || 10;

        const watchedVideos = await WatchedVideo.findAll({
            where: { userId },
            attributes: ['videoId']
        });
        let watchedVideosIds = watchedVideos.map(video => video.videoId);

        console.log("WatchedVideosIds", watchedVideosIds);
        // Fetch popular and new videos
        let result = await fetchRecommendedVideos(userPersonalizations, totalInterest, remainingVideos, watchedVideosIds);
        remainingVideos = result.remainingVideos;
        let recommendedVideos = result.recommendedVideos;

        console.log("After fetching the recommendedVideos");

        // If there are no more unwatched videos in the categories the user has interacted with, fetch videos from other categories
        if (remainingVideos > 0) {
            const allPossibleCategories = UserPersonalization.rawAttributes.category.validate.isIn.args[0];
            const interactedCategories = userPersonalizations.map(personalization => personalization.category);
            const nonInteractedCategories = allPossibleCategories.filter(category => !interactedCategories.includes(category));

            console.log("Fetching the nonInteractedVideos")
            console.log("NonInteractedCategories", nonInteractedCategories);
            console.log("allPossibleCategories", allPossibleCategories);
            console.log("interactedCategories", interactedCategories);

            const result = await fetchNonInteractedVideos(nonInteractedCategories, remainingVideos, watchedVideosIds);
            recommendedVideos.push(...result.recommendedVideos);
            remainingVideos = result.remainingVideos;
        }

        // If the number of recommended videos hasn't reached the limit, fill the rest with a mix of watched videos
        if (remainingVideos > 0) {
            const watchedVideos = await fetchWatchedVideos(userId, userPersonalizations, totalInterest, remainingVideos);
            recommendedVideos.push(...watchedVideos);
        }

        const recommendedVideosData = await Promise.all(recommendedVideos.map(video => fetchVideoData(video.id, userId)));

        return res.status(200).json({ recommendedVideosData });
    } catch (error) {
        return res.status(500).json({ error: error.message });
    }
};


module.exports = {
    createUserPersonalization,
    getRecommendedVideos,
};

//So we will assume that there's no user that will keep on missing with the algorithm
//like keep on saying he liked and commented that video and so on.
//I mean the worst case is that his recommendation system will be missed up
