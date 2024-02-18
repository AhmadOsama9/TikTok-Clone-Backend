const Rate = require("../config/db").Rate;
const Video = require("../config/db").Video;
const User = require("../config/db").User;
const sequelize = require("../config/db").sequelize;


const addRate = async (req, res) => {
    const t = await sequelize.transaction();

    try {
        const { userId } = req.user;
        const { videoId, rating } = req.body;

        if (!videoId || !rating) {
            return res.status(400).json({ message: "videoId and rating are required" });
        }

        if (rating < 1 || rating > 5) {
            return res.status(400).json({ message: "Rating should be between 1 and 5" });
        }

        const video = await Video.findOne({ where: { id: videoId } }, { transaction: t });
        if (!video)
            return res.status(404).json({ message: "Video not found" });

        const rate = await Rate.findOne({ where: { userId, videoId } }, { transaction: t });
        if (rate)
            return res.status(400).json({ message: "You already rated this video" });

        await Rate.create({ userId, videoId, rating }, { transaction: t });

        video.totalRating += rating;
        video.totalRatings += 1;
        video.averageRating = video.totalRating / video.totalRatings;
        await video.save({ transaction: t });

        await t.commit();

        return res.status(200).json({ message: "Rating added successfully" });
    } catch (error) {
        await t.rollback();
        return res.status(500).json({ error: error.message });
    }
}

module.exports = {
    addRate,
}