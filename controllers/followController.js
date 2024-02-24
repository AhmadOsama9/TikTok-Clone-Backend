const Follow = require("../config/db").Follow;
const User = require("../config/db").User;
const { addNotification } = require("./notificationsController");

const { Op } = require("sequelize");

const followUser = async (req, res) => {
    try {
        const { userId } = req.user;
        const { followId } = req.body;

        if (userId === followId)
            return res.status(400).json({ message: "You can't follow yourself" });

        if (!followId) {
            return res.status(400).json({ message: "followId is required" });
        }

        const user = await User.findOne({ where: { id: followId } });
        if (!user)
            return res.status(404).json({ message: "User not found" });

        const follow = await Follow.findOne({ 
            where: { 
                [Op.or]: [
                    { followerId: userId, followingId: followId },
                    { followerId: followId, followingId: userId }
                ]
            } 
        });
        if (follow)
            return res.status(400).json({ message: "You already follow this user" });

            await Follow.create({ followerId: userId, followingId: followId });
            
            await addNotification(followId, null, null, userId, 3, 'New Follower');

        return res.status(200).json({ message: "User followed successfully" });

    } catch (error) {
        return res.status(500).json({ error: error.message });
    }
}

const unFollowUser = async (req, res) => {
    try {
        const { userId } = req.user;
        const { followId } = req.body;

        if (!followId) {
            return res.status(400).json({ message: "followId is required" });
        }

        const user = await User.findOne({ where: { id: followId } });
        if (!user)
            return res.status(404).json({ message: "User not found" });

        const follow = await Follow.findOne({ 
            where: { 
                followerId: userId, 
                followingId: followId 
            } 
        });
        if (!follow)
            return res.status(400).json({ message: "You don't follow this user" });

        await follow.destroy();

        return res.status(200).json({ message: "User unfollowed successfully" });

    } catch (error) {
        return res.status(500).json({ error: error.message });
    }
}

module.exports = {
    followUser,
    unFollowUser,
}