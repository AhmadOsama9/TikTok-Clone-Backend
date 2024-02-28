const Comment = require("../config/db").Comment;
const CommentLike = require("../config/db").CommentLike;
const Video = require("../config/db").Video;
const User = require("../config/db").User;
const UserStatus = require("../config/db").UserStatus;
const sequelize = require('../config/db').sequelize;
const Transaction = require('../config/db').Transaction;
const { addNotification } = require("./notificationsController");


const addComment = async (req, res) => {
    const transaction = await sequelize.transaction();
    try {
        const { videoId, content } = req.body;
        const { userId } = req.user;

        const video = await Video.findByPk(videoId);
        if (!video) {
            return res.status(404).json({ message: 'Video not found' });
        }

        if (!content || content.trim() === '')
            return res.status(400).json({ message: 'Content is required' });

        const userStatus = await UserStatus.findOne({ where: { userId: userId } });
        const isUserVerified = userStatus ? userStatus.isVerified : false;

        const comment = await Comment.create({
            videoId,
            content,
            userId, 
            isUserVerified
        }, { transaction });

        await addNotification(video.creatorId, videoId, comment.id, userId, 2, 'New Comment', transaction);
        console.log("After the addNotification for the comment");

        const mentionRegex = /@(\w+)/g;
        let match;
        while ((match = mentionRegex.exec(content)) !== null) {
            const mentionedUsername = match[1];
            const mentionedUser = await User.findOne({ where: { username: mentionedUsername } });
            if (mentionedUser) {
                // Add a notification for the mentioned user
                await addNotification(mentionedUser.id, videoId, comment.id, userId, 4, 'Mentioned in Comment', transaction);
            }
        }

        await transaction.commit();

        return res.status(200).json(comment);
    } catch (err) {
        await transaction.rollback();
        return res.status(500).json({ message: err.message });
    }
};

const addGiftComment = async (req, res) => {
    let transaction;
    try {
        const { videoId, content, giftType } = req.body;
        const { userId } = req.user;

        if (!videoId || !giftType)
            return res.status(500).json({ message: "Invalid data" });

        const video = await Video.findByPk(videoId);
        if (!video) {
            return res.status(404).json({ message: 'Video not found' });
        }

        const user = await User.findByPk(userId);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        if (giftType < 1 || giftType > 5)
            return res.status(400).json({ message: "Invalid gift type" });

        const giftPrices = JSON.parse(process.env.GIFT_PRICES);
        const giftPrice = giftPrices[giftType.toString()];
        if (!giftPrice)
            return res.status(400).json({ message: "Invalid gift type" });

        if (giftPrice < 0)
            return res.status(400).json({ message: "Invalid gift price" });

        if (user.balance < giftPrice)
            return res.status(400).json({ message: "Insufficient balance" });

        transaction = await sequelize.transaction();

        user.balance -= giftPrice;
        await user.save({ transaction });

        const userStatus = await UserStatus.findOne({ where: { userId: userId } });
        const isUserVerified = userStatus ? userStatus.isVerified : false;

        const comment = await Comment.create({
            videoId,
            content,
            userId,
            giftType,
            isUserVerified
        }, { transaction });

        await addNotification(video.creatorId, videoId, comment.id, userId, 5, 'New Gift Comment', transaction);

        const mentionRegex = /@(\w+)/g;
        let match;
        while ((match = mentionRegex.exec(content)) !== null) {
            const mentionedUsername = match[1];
            console.log("enters the mentioning while loop");
            const mentionedUser = await User.findOne({ where: { username: mentionedUsername } });
            if (mentionedUser) {
                console.log("found the mentionedUser");
                await addNotification(mentionedUser.id, videoId, comment.id, userId, 4, 'Mentioned in Comment', transaction);
            }
        }

        const receiverId = video.creatorId;
        const receiver = await User.findByPk(receiverId, { transaction });
        if (!receiver)
            return res.status(404).json({ message: "Receiver not found" });

        receiver.balance += giftPrice;
        await receiver.save({ transaction });

        await Transaction.create({
            amount: giftPrice,
            senderId: userId,
            receiverId,
        }, { transaction });

        await transaction.commit();

        return res.status(200).json(comment);
    } catch (err) {
        if (transaction) await transaction.rollback();
        return res.status(500).json({ message: err.message });
    }
};


const replyToComment = async (req, res) => {
    const transaction = await sequelize.transaction();
    try {
        const { content } = req.body;
        const { userId } = req.user;
        let commentId = req.params.id;

        if (!content || content.trim() === '')
            return res.status(400).json({ message: 'Content is required' });

        if (!commentId)
            return res.status(400).json({ message: 'Comment id is required' });

        const comment = await Comment.findByPk(commentId);
        if (!comment)
            return res.status(500).json({ message: 'Comment not found' });

        const userStatus = await UserStatus.findOne({ where: { userId: userId } });
        const isUserVerified = userStatus ? userStatus.isVerified : false;

        const reply = await Comment.create({
            parentId: commentId,
            videoId: comment.videoId,
            content,
            userId,
            isUserVerified,
        }, { transaction });

        const mentionRegex = /@(\w+)/g;
        let match;
        while ((match = mentionRegex.exec(content)) !== null) {
            const mentionedUsername = match[1];
            const mentionedUser = await User.findOne({ where: { username: mentionedUsername } });
            if (mentionedUser) {
                // Add a notification for the mentioned user
                await addNotification(mentionedUser.id, comment.videoId, reply.id, userId, 4, 'Mentioned in Comment', transaction);
            }
        }

        await transaction.commit();

        return res.status(200).json(reply);
    } catch (err) {
        await transaction.rollback();
        return res.status(500).json({ message: err.message });
    }
};



const updateComment = async (req, res) => {
    try {
        const commentId = req.params.id;
        const { content } = req.body;
        const { userId } = req.user;
        
        const comment = await Comment.findByPk(commentId);
        if (!comment) {
            return res.status(404).json({ message: 'Comment not found' });
        }

        if (comment.userId !== userId) {
            return res.status(403).json({ message: 'You are not authorized to update this comment' });
        }

        if (!content || content.trim() === '')
            return res.status(400).json({ message: 'Content is required' });

        if (comment.content === content)
            return res.status(400).json({ message: 'Content is the same' });

        comment.content = content;
        await comment.save();

        return res.status(200).json(comment);

    } catch (error) {
        return res.status(500).json({ message: error.message });
    }
}

const getCommentUsingId = async (req, res) => {
    try {
        const { userId } = req.user;
        const commentId = req.params.id;

        if (!commentId)
            return res.status(400).json({ message: 'Comment id is required' });

        const userStatus = await UserStatus.findByPk(userId);
        if (!userStatus || !userStatus.isAdmin)
            return res.status(403).json({ message: 'You are not authorized to view this comment' });

        const comment = await Comment.findByPk(commentId);
        if (!comment) {
            return res.status(404).json({ message: 'Comment not found' });
        }
        return res.status(200).json(comment);
    } catch (error) {
       return res.status(500).json({ message: error.message });
    }
}


const deleteComment = async (req, res) => {
    try {
        const { userId } = req.user;
        const commentId = req.params.id;

        if (!commentId)
            return res.status(400).json({ message: 'Comment id is required' });

        const userStatus = await UserStatus.findByPk(userId);
        if (!userStatus) {
            return res.status(404).json({ message: 'UserStatus not found' });
        }

        const comment = await Comment.findByPk(commentId);
        if (!comment) {
            return res.status(404).json({ message: 'Comment not found' });
        }

        const video = await Video.findByPk(comment.videoId);
        if (!video) {
            return res.status(404).json({ message: 'Video not found' });
        }

        if (comment.userId !== userId && !userStatus.isAdmin && video.creatorId !== userId) {
            return res.status(403).json({ message: 'You are not authorized to delete this comment' });
        }

        await comment.destroy();
        return res.status(200).json({ message: 'Comment deleted' });
    } catch (err) {
        return res.status(500).json({ message: err.message });
    }
};

const likeAndUnlikeComment = async (req, res) => {
    let transaction;
    try {
        const { userId } = req.user;
        const { commentId } = req.params;

        if (!commentId)
            return res.status(400).json({ message: 'Comment id is required' });

        const comment = await Comment.findByPk(commentId);
        if (!comment)
            return res.status(404).json({ message: 'Comment not found' });

        transaction = await sequelize.transaction();

        const existingLike = await CommentLike.findOne({ where: { userId, commentId } });
        if (existingLike) {
            await existingLike.destroy({ transaction });
            await comment.decrement('likeCount', { transaction });
        } else {
            await CommentLike.create({ userId, commentId }, { transaction });
            await comment.increment('likeCount', { transaction });
        }

        await transaction.commit();

        // Reload the comment instance to get the updated likeCount
        await comment.reload();

        return res.status(200).json(comment);

    } catch (error) {
        if (transaction) await transaction.rollback();
        return res.status(500).json({ message: error.message });
    }
}


module.exports = {
    addComment,
    deleteComment,
    replyToComment,
    addGiftComment,
    updateComment,
    getCommentUsingId,
    likeAndUnlikeComment,
}