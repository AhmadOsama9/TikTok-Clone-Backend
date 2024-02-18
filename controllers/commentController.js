const Comment = require("../config/db").Comment;
const Video = require("../config/db").Video;
const User = require("../config/db").User;

const addComment = async (req, res) => {
    try {
        const { videoId, content } = req.body;
        const { userId } = req.user;

        // Check if the videoId exists
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
        const comment = await Comment.findByPk(req.params.id);
        if (!comment)
            res.status(404).json({ message: 'Comment not found' });
        if (comment.userId !== req.user.userId)
            res.status(403).json({ message: 'You are not authorized to delete this comment' });

        await comment.destroy();
        res.json({ message: 'Comment deleted' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};


const replyToComment = async (req, res) => {
    try {
        const { content } = req.body;
        const { userId } = req.user;
        let commentId = req.params.id;

        const comment = await Comment.findByPk(commentId);
        if (!comment)
            return res.status(500).json({ message: 'Comment not found' });

        if (!content || content.trim() === '')
            return res.status(400).json({ message: 'Content is required' });
        
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
    try {
        const { videoId, content, giftType, giftPrice } = req.body;
        const { userId } = req.user;

        const video = await Video.findByPk(videoId);
        if (!video) {
            return res.status(404).json({ message: 'Video not found' });
        }

        const user = await User.findByPk(userId);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        if (giftPrice < 0)
            return res.status(400).json({ message: 'Gift price must be a positive number' });

        if (giftPrice > user.balance)
            return res.status(400).json({ message: 'Insufficient balance' });

        user.balance -= giftPrice;
        await user.save();

        const comment = await Comment.create({
            videoId,
            content,
            userId,
            giftType,
            giftPrice
        });

        res.status(200).json(comment);
    } catch (err) {
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

