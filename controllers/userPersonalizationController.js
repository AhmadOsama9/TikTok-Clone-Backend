const UserPersonalization = require("../config/db").UserPersonalization;


const createUserPersonalization = async (req, res) => {
    try {
        const { userId } = req.user;
        const { videoIe, liked, viewed, shared, commented } = req.body;

        const userPersonalization = await UserPersonalization.create({
            userId,
            videoId,
            liked,
            views,
            shares,
            comments
        });

    } catch (error) {
        return res.status(500).json({ error: error.message });
    }


}