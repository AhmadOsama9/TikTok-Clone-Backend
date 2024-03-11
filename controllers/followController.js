const Follow = require("../config/db").Follow;
const User = require("../config/db").User;
const { addNotification } = require("./notificationsController");

const { sequelize } = require('../config/db');


const followUser = async (req, res) => {
    const transaction = await sequelize.transaction();

    try {
        const { userId } = req.user;
        const { followId } = req.body;

        if (userId === followId)
            return res.status(400).json({ message: "لا يمكنك متابعة نفسك" });

        if (!followId) {
            return res.status(400).json({ message: "يجب ادخال رقم المستخدم" });
        }

        const user = await User.findOne({ where: { id: followId } });
        if (!user)
            return res.status(404).json({ message: "المستخدم غير موجود" });

        const follow = await Follow.findOne({ 
            where: { 
                followerId: userId, 
                followingId: followId
            } 
        });
        if (follow)
            return res.status(400).json({ message: "انت بالفعل تتابع هذا المستخدم" });

        await Follow.create({ followerId: userId, followingId: followId }, { transaction });
            
        await addNotification(followId, null, null, userId, 3, 'New Follower', transaction);

        await transaction.commit();

        return res.status(200).json({ message: "تم متابعة المستخدم بنجاح" });

    } catch (error) {
        await transaction.rollback();
        return res.status(500).json({ error: error.message });
    }
}

const unFollowUser = async (req, res) => {
    try {
        const { userId } = req.user;
        const { followId } = req.body;

        if (!followId) {
            return res.status(400).json({ message: "يجب ادخال رقم المستخدم" });
        }

        const user = await User.findOne({ where: { id: followId } });
        if (!user)
            return res.status(404).json({ message: "المستخدم غير موجود" });

        const follow = await Follow.findOne({ 
            where: { 
                followerId: userId, 
                followingId: followId 
            } 
        });
        if (!follow)
            return res.status(400).json({ message: "انت لا تتابع هذا المستخدم" });

        await follow.destroy();

        return res.status(200).json({ message: "تم الغاء المتابعة بنجاح" });

    } catch (error) {
        return res.status(500).json({ error: error.message });
    }
}

module.exports = {
    followUser,
    unFollowUser,
}