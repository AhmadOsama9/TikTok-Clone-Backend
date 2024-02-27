const User = require("../config/db").User;
const UserStatus = require("../config/db").UserStatus;



async function makeAdmin (userId) {
    try {

        const user = await User.findByPk(userId);
        if (!user)
            throw Error('User not found');

        const userStatus = await UserStatus.findOne({ where: { userId } });
        if (!userStatus)
            throw Error('User status not found');

        userStatus.isAdmin = true;

        await userStatus.save();
        console.log("User is now an admin");

    } catch (error) {
        console.log("Error in making a user an admin ", error);
    }
};

module.exports = makeAdmin;