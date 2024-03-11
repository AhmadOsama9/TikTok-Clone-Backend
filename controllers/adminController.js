const User = require("../config/db").User;
const UserStatus = require("../config/db").UserStatus;



async function makeAdmin (userId) {
    try {

        const user = await User.findByPk(userId);
        if (!user)
            throw Error('المستخدم غير موجود');

        const userStatus = await UserStatus.findOne({ 
            where: { userId },
            attributes: ['id', 'isAdmin']
        });
        if (!userStatus)
            throw Error('حالة المستخدم غير موجودة');

        userStatus.isAdmin = true;

        await userStatus.save();
        console.log("المستخدم أصبح مديراً");

    } catch (error) {
        console.log("خطأ في تحويل المستخدم الي مدير ", error);
        throw new Error(error.message);
    }
};

module.exports = makeAdmin;