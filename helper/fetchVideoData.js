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
  
    const videosData = await Promise.all(videos.map(async (video) => {
        const userLike = await VideoLike.findOne({
            where: { userId, videoId: video.id }
        });
  
        const userRating = await Rate.findOne({
            where: { userId, videoId: video.id }
        });
  
        let videoUrl = null, thumbnailUrl = null;
  
        if (video.fileName)
            videoUrl = await getSignedUrl(video.fileName);
  
        if (video.thumbnailFileName)
            thumbnailUrl = await getSignedUrl(video.thumbnailFileName);
  
        const commentsCount = await Comment.count({ where: { videoId: video.id } });
  
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

module.exports = fetchVideoData;