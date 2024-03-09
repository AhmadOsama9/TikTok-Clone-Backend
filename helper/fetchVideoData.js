const User = require("../config/db").User;
const Profile = require("../config/db").Profile;
const Video = require("../config/db").Video;
const VideoMetadata = require("../config/db").VideoMetadata;
const VideoCategory = require("../config/db").VideoCategory;
const VideoLike = require("../config/db").VideoLike;
const Rate = require("../config/db").Rate;
const Comment = require("../config/db").Comment;
const getSignedUrl = require("../cloudFunctions/getSignedUrl");

const fetchVideoData = async (videoId, userId, metadata = null) => {
    if (!Array.isArray(videoId)) {
        videoId = [videoId];
    }

    const includeArray = [
        {
            model: VideoCategory,
            as: 'categories',
            attributes: ['name'],
        },
        {
            model: VideoLike,
            as: 'videoLikes',
            attributes: ['userId'],
        },
        {
            model: User,
            as: 'creator',
            attributes: ['username'],
            include: [
                {
                    model: Profile,
                    as: 'profile',
                    attributes: ['imageFileName'],
                }
            ]
        }
    ];

    if (!metadata) {
        includeArray.push({
            model: VideoMetadata,
            as: 'metadata',
            attributes: ['viewCount', 'likeCount', 'averageRating', 'shareCount'],
        });
    }

    const videos = await Video.findAll({
        where: { id: videoId },
        include: includeArray,
    });

    if (!videos || videos.length === 0)
        return null;

    // Fetch all user likes, user ratings, and comment counts in batch operations
    const userLikes = await VideoLike.findAll({
        where: { userId, videoId }
    });

    const userRatings = await Rate.findAll({
        where: { userId, videoId }
    });

    const commentsCounts = await Comment.count({
        where: { videoId },
        group: ['videoId']
    });

    const videosData = await Promise.all(videos.map(async (video) => {
        // Find user like, user rating, and comment count from the fetched data
        const userLike = userLikes.find(like => like.videoId === video.id);
        const userRating = userRatings.find(rating => rating.videoId === video.id);
        const commentsCount = commentsCounts.find(count => count.videoId === video.id) || 0;

        let videoUrl = null, thumbnailUrl = null, profileImage = null;

        if (video.fileName)
            videoUrl = await getSignedUrl(video.fileName);

        if (video.thumbnailFileName)
            thumbnailUrl = await getSignedUrl(video.thumbnailFileName);
        
        if (video.creator.profile.imageFileName)
            profileImage = await getSignedUrl(video.creator.profile.imageFileName);

        const videoMetadata = metadata || video.metadata;

        return {
            id: video.id,
            description: video.description,
            videoUrl,
            thumbnailUrl,
            publisherId: video.creatorId,
            username: video.creator.username,
            profileImage,
            categories: video.categories.map(category => category.name),
            likes: videoMetadata.likeCount,
            rating: videoMetadata.averageRating,
            views: videoMetadata.viewCount,
            commentsCount,
            sharesCount: videoMetadata.shareCount,
            userLike: userLike ? true : false,
            userRating: userRating ? userRating.rating : null,
            createdAt: video.createdAt,
        };
    }));

    return videosData;
};
const fetchProfileVideoData = async (videoId, userId, metadata = null) => {
    if (!Array.isArray(videoId)) {
        videoId = [videoId];
    }

    const includeArray = [
        {
            model: VideoCategory,
            as: 'categories',
            attributes: ['name'],
        },
        {
            model: VideoLike,
            as: 'videoLikes',
            attributes: ['userId'],
        },
    ];

    if (!metadata) {
        includeArray.push({
            model: VideoMetadata,
            as: 'metadata',
            attributes: ['viewCount', 'likeCount', 'averageRating', 'shareCount'],
        });
    }

    const videos = await Video.findAll({
        where: { id: videoId },
        include: includeArray,
    });

    if (!videos || videos.length === 0)
        return null;

    // Fetch all user likes, user ratings, and comment counts in batch operations
    const userLikes = await VideoLike.findAll({
        where: { userId, videoId }
    });

    const userRatings = await Rate.findAll({
        where: { userId, videoId }
    });

    const commentsCounts = await Comment.count({
        where: { videoId },
        group: ['videoId']
    });

    const videosData = await Promise.all(videos.map(async (video) => {
        // Find user like, user rating, and comment count from the fetched data
        const userLike = userLikes.find(like => like.videoId === video.id);
        const userRating = userRatings.find(rating => rating.videoId === video.id);
        const commentsCount = commentsCounts.find(count => count.videoId === video.id) || 0;

        let videoUrl = null, thumbnailUrl = null;

        if (video.fileName)
            videoUrl = await getSignedUrl(video.fileName);

        if (video.thumbnailFileName)
            thumbnailUrl = await getSignedUrl(video.thumbnailFileName);

        const videoMetadata = metadata || video.metadata;

        return {
            id: video.id,
            description: video.description,
            videoUrl,
            thumbnailUrl,
            publisherId: video.creatorId,
            categories: video.categories.map(category => category.name),
            likes: videoMetadata.likeCount,
            rating: videoMetadata.averageRating,
            views: videoMetadata.viewCount,
            commentsCount,
            sharesCount: videoMetadata.shareCount,
            userLike: userLike ? true : false,
            userRating: userRating ? userRating.rating : null,
            createdAt: video.createdAt,
        };
    }));

    return videosData;
};

module.exports = {
    fetchVideoData,
    fetchProfileVideoData
}