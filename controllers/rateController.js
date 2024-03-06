const Rate = require("../config/db").Rate;
const Video = require("../config/db").Video;
const VideoMetadata = require("../config/db").VideoMetadata;
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

        const videoMetadata = await VideoMetadata.findByPk(videoId, {
            attributes: ['id', "totalRatings", "totalRating", "averageRating"],
            transaction: t
        });
        if (!videoMetadata)
            return res.status(404).json({ message: "Video not found" });
        
        const rate = await Rate.findOne({ where: { userId, videoId } }, { transaction: t });
        if (rate)
            return res.status(400).json({ message: "You already rated this video" });

        await Rate.create({ userId, videoId, rating }, { transaction: t });

        const newTotalRatings = videoMetadata.totalRatings + 1;
        const newTotalRating = videoMetadata.totalRating + rating;
        const newAverageRating = newTotalRating / newTotalRatings;

        await videoMetadata.update({
            totalRatings: newTotalRatings,
            totalRating: newTotalRating,
            averageRating: newAverageRating
        }, { transaction: t });

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