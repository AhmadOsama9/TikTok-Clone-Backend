const User = require("../config/db").User;
const Profile = require("../config/db").Profile;
const Comment = require("../config/db").Comment;
const CommentLike = require("../config/db").CommentLike;
const getSignedUrl = require("../cloudFunctions/getSignedUrl");
const user = require("../models/user");

async function getReplies(commentId) {
    const replies = await Comment.findAll({
        where: { parentId: commentId },
        include: [
            {
            model: User,
            as: 'user',
            attributes: ['username'], 
            include: [
              {
                model: Profile,
                as: 'profile',
                attributes: ['imageFileName'], 
              }
            ]
        },
            { model: Comment, as: 'replies' } 
        ],
        order: [
            ['isUserVerified', 'DESC'],
            ['likeCount', 'DESC'],
            ['createdAt', 'DESC']
        ] 
    });

    return await mapCommentsData(replies);
}



const mapCommentsData = async (comments) => {
    return await Promise.all(comments.map(async comment => {
        let imageUrl = null;
        if (comment.user.profile.imageFileName)
            imageUrl = await getSignedUrl(comment.user.profile.imageFileName);

        const userLikedComment = await CommentLike.findOne({
            where: {
                commentId: comment.id,
                userId: comment.userId
            }
        });



        return {
            id: comment.id,
            videoId: comment.videoId,
            userId: comment.userId,
            content: comment.content,
            giftType: comment.giftType,
            repliesCount: comment.replies.length,
            replies: await getReplies(comment.id),
            createdAt: comment.createdAt,
            imageUrl: imageUrl,
            username: comment.user.username,
            isVerified: comment.isUserVerified,
            likeCount: comment.likeCount,
            userLikedComment: userLikedComment ? true : false
        };
    }));
}

module.exports = mapCommentsData;