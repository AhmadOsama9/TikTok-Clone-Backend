const Comment = require("../config/db").Comment;
const Video = require("../config/db").Video;
const User = require("../config/db").User;
const sequelize = require('../config/db').sequelize;
const Transaction = require('../config/db').Transaction;


const addComment = async (req, res) => {
    try {
        const { videoId, content } = req.body;
        const { userId } = req.user;

        const video = await Video.findByPk(videoId);
        if (!video) {
            return res.status(404).json({ message: 'Video not found' });
        }

        if (!content || content.trim() === '')
            return res.status(400).json({ message: 'Content is required' });

        const comment = await Comment.create({
            videoId,
            content,
            userId
        });

        res.status(200).json(comment);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

const deleteComment = async (req, res) => {
    try {
        const { userId } = req.user;
        const commentId = req.params.id;

        const comment = await Comment.findByPk(commentId);
        if (!comment) {
            return res.status(404).json({ message: 'Comment not found' });
        }

        if (comment.userId !== userId) {
            return res.status(403).json({ message: 'You are not authorized to delete this comment' });
        }

        await comment.destroy();
        return res.status(200).json({ message: 'Comment deleted' });
    } catch (err) {
        return res.status(500).json({ message: err.message });
    }
};


const replyToComment = async (req, res) => {
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

        const reply = await Comment.create({
            parentId: commentId,
            videoId: comment.videoId,
            content,
            userId
        });

        res.status(200).json(reply);
    } catch (err) {
        res.status(500).json({ message: err.message });
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

        const comment = await Comment.create({
            videoId,
            content,
            userId,
            giftType,
        }, { transaction });

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
            senderUsername: user.username,
            receiverUsername: receiver.username,
        }, { transaction });

        await transaction.commit();

        res.status(200).json(comment);
    } catch (err) {
        if (transaction) await transaction.rollback();
        res.status(500).json({ message: err.message });
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

        comment.content = content;
        await comment.save();

        res.status(200).json(comment);

    } catch (error) {
        res.status(500).json({ message: error.message });
    }
}


module.exports = {
    addComment,
    deleteComment,
    replyToComment,
    addGiftComment,
    updateComment
}