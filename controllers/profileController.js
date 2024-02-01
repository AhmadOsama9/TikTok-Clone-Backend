const User = require("../db").User;
const Profile = require("../db").Profile;
const Follow = require("../db").Follow;
const Video = require("../db").Video;
const VideoLike = require("../db").VideoLike;
const Comment = require("../db").Comment;

const getUserProfile = async (req, res) => {
    try {
        const { userId } = req.user;

        const user = await User.findOne({ where: { id: userId } });
        const profile = await Profile.findOne({ where: { userId: userId } });

        const followers = await Follow.findAll({ where: { followingId: userId } });
        const following = await Follow.findAll({ where: { followerId: userId } });

        const followersCount = followers.length;
        const followingCount = following.length;

        const followersIds = followers.map(follower => follower.followerId);
        const followingIds = following.map(follow => follow.followingId);

        const videos = await Video.findAll({ where: { userId: userId } });
        const videosCount = videos.length;

        const videoData = await Promise.all(videos.map(async video => {
            const likesOnTheVideo = await VideoLike.count({ where: { videoId: video.id } });
            const commentsOnTheVideo = await Comment.count({ where: { videoId: video.id } });

            return {
                id: video.id,
                thumbnailUrl: video.thumbnailUrl,
                likesOnTheVideo,
                commentsOnTheVideo,
                sharesCountOfVideo: video.shareCount,
                viewsOnTheVideo: video.viewsCount
            };
        }));

        const userProfile = {
            bio: profile.bio,
            followersCount,
            followingCount,
            followersIds,
            followingIds,
            videos: videoData,
            profilePicture: profile.imageUrl,
            numberOfVideos: videosCount,
            isPopular: user.isPopular,
            balance: user.balance
        };

        res.status(200).json(userProfile);
    } catch (error) {
        res.status(500).json({error: error.message});
    }
}

const getOtherUserProfile = async (req, res) => {
    try {
        const { profileId } = req.params;

        const user = await User.findOne({ where: { id: profileId } });
        const profile = await Profile.findOne({ where: { userId: profileId } });

        const followers = await Follow.findAll({ where: { followingId: profileId } });
        const following = await Follow.findAll({ where: { followerId: profileId } });

        const followersCount = followers.length;
        const followingCount = following.length;

        const followersIds = followers.map(follower => follower.followerId);
        const followingIds = following.map(follow => follow.followingId);

        const videos = await Video.findAll({ where: { userId: profileId } });
        const videosCount = videos.length;

        const videoData = await Promise.all(videos.map(async video => {
            const likesOnTheVideo = await VideoLike.count({ where: { videoId: video.id } });
            const commentsOnTheVideo = await Comment.count({ where: { videoId: video.id } });

            return {
                id: video.id,
                thumbnailUrl: video.thumbnailUrl,
                likesOnTheVideo,
                commentsOnTheVideo,
                sharesCountOfVideo: video.shareCount,
                viewsOnTheVideo: video.viewsCount
            };
        }));

        const userProfile = {
            bio: profile.bio,
            followersCount,
            followingCount,
            followersIds,
            followingIds,
            videos: videoData,
            profilePicture: profile.imageUrl,
            numberOfVideos: videosCount,
            isPopular: user.isPopular
        };

        res.status(200).json(userProfile);
    } catch (error) {
        res.status(500).json({error: error.message});
    }
}


module.exports = {
    getUserProfile,
    getOtherUserProfile,
}