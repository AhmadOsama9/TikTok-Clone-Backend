const Video = require("../config/db").Video;
const VideoMetadata = require("../config/db").VideoMetadata;
const VideoCategory = require("../config/db").VideoCategory;
const VideoLike = require("../config/db").VideoLike;
const Rate = require("../config/db").Rate;
const Comment = require("../config/db").Comment;
const getSignedUrl = require("../cloudFunctions/getSignedUrl");


const fetchVideoData = async (videoId, userId) => {
    const video = await Video.findOne({
      where: { id: videoId },
      include: [
        {
          model: VideoMetadata,
          as: 'metadata',
          attributes: ['viewCount', 'likeCount', 'averageRating', 'shareCount'],
        },
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
      ],
    });

    if (!video)
      return null;
  
    const userLike = await VideoLike.findOne({
      where: { userId, videoId }
    });
  
    const userRating = await Rate.findOne({
      where: { userId, videoId }
    });
  
    let videoUrl = null, thumbnailUrl = null;
  
    if (video.fileName)
      videoUrl = await getSignedUrl(video.fileName);
  
    if (video.thumbnailFileName)
      thumbnailUrl = await getSignedUrl(video.thumbnailFileName);
  
    const commentsCount = await Comment.count({ where: { videoId } });
  
    return {
      id: video.id,
      description: video.description,
      videoUrl,
      thumbnailUrl,
      publisherId: video.creatorId,
      categories: video.categories.map(category => category.name),
      likes: video.metadata.likeCount,
      rating: video.metadata.averageRating,
      views: video.metadata.viewCount,
      commentsCount,
      sharesCount: video.metadata.shareCount,
      userLike: userLike ? true : false,
      userRating: userRating ? userRating.rating : null,
      createdAt: video.createdAt,
    };
};

module.exports = fetchVideoData;