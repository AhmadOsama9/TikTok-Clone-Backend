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
            return res.status(400).json({ message: "يجب ادخال رقم الفيديو والتقييم" });
        }

        if (rating < 1 || rating > 5) {
            return res.status(400).json({ message: "يجب ان يكون التقييم بين 1 و 5" });
        }

        const videoMetadata = await VideoMetadata.findByPk(videoId, {
            attributes: ['id', "totalRatings", "totalRating", "averageRating"],
            transaction: t
        });
        if (!videoMetadata)
            return res.status(404).json({ message: "الفيديو غير موجود" });
        
        const rate = await Rate.findOne({ where: { userId, videoId } }, { transaction: t });
        if (rate)
            return res.status(400).json({ message: "انت قيمت هذا الفيديو بالفعل" });

        await Rate.create({ userId, videoId, rate: rating }, { transaction: t });

        const newTotalRatings = videoMetadata.totalRatings + 1;
        const newTotalRating = videoMetadata.totalRating + rating;
        const newAverageRating = newTotalRating / newTotalRatings;

        await videoMetadata.update({
            totalRatings: newTotalRatings,
            totalRating: newTotalRating,
            averageRating: newAverageRating
        }, { transaction: t });

        await t.commit();

        return res.status(200).json({ message: "تم تقييم الفيديو بنجاح" });
    } catch (error) {
        await t.rollback();
        return res.status(500).json({ error: error.message });
    }
}

const updateRate = async (req, res) => {
    const t = await sequelize.transaction();

    try {
        const { userId } = req.user;
        const { videoId, rating } = req.body;

        if (!videoId || !rating) {
            return res.status(400).json({ message: "يجب ادخال رقم الفيديو والتقييم" });
        }

        if (rating < 1 || rating > 5) {
            return res.status(400).json({ message: "يجب ان يكون التقييم بين 1 و 5" });
        }

        const rate = await Rate.findOne({ where: { userId, videoId } }, { transaction: t });
        if (!rate)
            return res.status(404).json({ message: "التفييم غير موجود" });

        await rate.update({ rate: rating }, { transaction: t });

        await t.commit();

        return res.status(200).json({ message: "تم تعديل التقييم بنجاح" });
    } catch (error) {
        await t.rollback();
        return res.status(500).json({ error: error.message });
    }
}

const removeRate = async (req, res) => {
    const t = await sequelize.transaction();

    try {
        const { userId } = req.user;
        const { videoId } = req.body;

        if (!videoId) {
            return res.status(400).json({ message: "يجب ارسال رقم الفيديو" });
        }

        const rate = await Rate.findOne({ where: { userId, videoId } }, { transaction: t });
        if (!rate)
            return res.status(404).json({ message: "التقييم غير موجود" });

        await rate.destroy({ transaction: t });

        await t.commit();

        return res.status(200).json({ message: "تم حذف التقييم بنجاح" });
    } catch (error) {
        await t.rollback();
        return res.status(500).json({ error: error.message });
    }
}



module.exports = {
    addRate,
    updateRate,
    removeRate
}