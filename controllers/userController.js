const User = require("../config/db").User;
const Profile = require("../config/db").Profile;
const UserStatus = require("../config/db").UserStatus;
const UserAuth = require("../config/db").UserAuth;
const UserPopularity = require("../config/db").UserPopularity;
const bcrypt = require("bcrypt");
const crypto = require("crypto");
const jwt = require("jsonwebtoken");
const nodemailer = require("nodemailer");
const sequelize = require("../config/db").sequelize;
const randomstring = require('randomstring');
const validator = require('validator');
const { Op } = require("sequelize");


const getSignedUrl = require("../cloudFunctions/getSignedUrl");


const signup = async (req, res) => {
    let transaction;
    try {
        let { name, phone, email, password, username } = req.body;

        if (!name || !phone || !email || !password || !username) {
            return res.status(400).json({ error: 'Please fill all fields' });
        }

        email = email.toLowerCase();
        username = username.toLowerCase();
        name = name.toLowerCase();

        if (!validator.isEmail(email)) {
            return res.status(400).json({ error: "بريد الكتروني خاطئ" });
        }

        const existingUser = await User.findOne({
            where: {
                [Op.or]: [
                    { email },
                    { phone },
                    { username }
                ]
            }
        });
        
        if (existingUser) {
            return res.status(400).json({ error: "مستخدم بهذا البريد الاكتروني, رقم الهاتف, اسم المستخدم موجود بالفعل" });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        transaction = await sequelize.transaction();

        const user = await User.create({ name, phone, email, password: hashedPassword, username }, { transaction });

        await UserStatus.create({ userId: user.id, isBanned: false, isAdmin: false, isVerified: false }, { transaction });

        await UserAuth.create({ userId: user.id, authType: 1, authVerified: false }, { transaction });

        await Profile.create({ userId: user.id }, { transaction });

        const verificationCode = randomstring.generate({
            length: 6,
            charset: 'numeric',
        });

        await UserAuth.update({ authCode: verificationCode, authCodeExpiry: Date.now() + Number(process.env.AUTH_CODE_EXPIRY) }, { where: { userId: user.id }, transaction });
    
        const transporter = nodemailer.createTransport({
            service: 'Gmail',
            auth: {
                user: process.env.EMAIL_ADDRESS,
                pass: process.env.EMAIL_PASSWORD,
            },
        });

        const mailOptions = {
            from: 'Story App <no-reply@storyapp.com>',//process.env.EMAIL_ADDRESS, can't use this because of gmail security
            to: email,
            subject: 'Verification Code',
            text: `Your Code for verification is: ${verificationCode}`,
            html: `
                <h1>Welcome to Story App!</h1>
                <p>Thanks for signing up. To verify your email address, please use the following code:</p>
                <h2>${verificationCode}</h2>
                <p>If you didn't request this, you can safely ignore this email.</p>
                <p>Best,</p>
                <p>The Story App Team</p>
            `,
        };

        const sendMail = await transporter.sendMail(mailOptions);
        if (!sendMail) {
            throw Error("Couldn't send the code to the email");
        }

        await transaction.commit();

        return res.status(200).json({ message: "تم ارسال كود التفعيل بنجاح" });
    } catch (error) {
        if (transaction) 
            await transaction.rollback();
        console.log("error", error);
        return res.status(500).json({ error: error.message });
    }
};

const verifyEmailCode = async (req, res) => {
    const transaction = await sequelize.transaction();
    try {
        let { email, code } = req.body;

        email = email.toLowerCase();

        if (!validator.isEmail(email)) {
            return res.status(400).json({ error: "بريد الكتروني خاطئ" });
        }

        const user = await User.findOne({ 
            where: { email },
            attributes: ['id', 'name', 'email', 'phone', 'referralCode', 'username']}, 
            { transaction },
        );
        if (!user) {
            await transaction.rollback();
            return res.status(400).json({ error: "مستخدم بهذا البريد الالكتروني موجود بالفعل" });
        }

        const userAuth = await UserAuth.findOne({ 
            where: { userId: user.id, authType: 1 },
            attributes: ['id', 'authCode', 'authCodeExpiry', 'authVerified'],},
            { transaction });
        if (!userAuth || !userAuth.authCode) {
            await transaction.rollback();
            return res.status(400).json({ error: "يجب ارسال كود التفعيل" });
        }

        if (code !== userAuth.authCode) {
            await transaction.rollback();
            return res.status(400).json({ error: "كود التفعيل خاطئ" });
        }

        if (userAuth.authCodeExpiry < Date.now()) {
            await transaction.rollback();
            return res.status(400).json({ error: "انتهت صلاحية كود التفعيل" });
        }

        userAuth.authVerified = true;
        userAuth.authCode = null;
        userAuth.authCodeExpiry = null;

        const idLength = user.id.toString().length;
        const referralCodeLength = idLength < 4 ? 6 : idLength + 3;

        user.referralCode = user.id + randomstring.generate({
            length: referralCodeLength - idLength,
            charset: 'alphanumeric',
            capitalization: 'lowercase'
        });

        await user.save({ transaction });
        await userAuth.save({ transaction });

        const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET);

        await transaction.commit();

        return res.status(200).json({
            uid: user.id,
            name: user.name,
            email: user.email,
            token: token,
            phone: user.phone,
            isverified: userAuth.authVerified,
            referralCode: user.referralCode,
            userName: user.userName,
        });

    } catch (error) {
        await transaction.rollback();
        return res.status(500).json({ error: error.message });
    }
};

const login = async (req, res) => {
    try {
        let { email, password } = req.body;

        email = email.toLowerCase();

        const user = await User.findOne({ 
            where: { email },
            attributes: ['id', 'name', 'email', 'password', 'phone', 'referralCode', 'username'],
        });

        if (!user) {
            return res.status(400).json({ error: "لا يوجد مستخدم بهذا البريد الالكتروني" });
        }

        const [userStatus, userAuth] = await Promise.all([
            UserStatus.findOne({ 
                where: { userId: user.id },
                attributes: ['isBanned', 'isVerified'] 
            }),
            UserAuth.findOne({ where: { userId: user.id, authType: 1 } }),
        ]);

        if (userStatus.isBanned) {
            return res.status(400).json({ error: "هذا المستخدم محظور" });
        }

        if (!userAuth.authVerified) {
            return res.status(400).json({ error: "يجب تفعيل البريد الالكتروني" });
        }

        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) {
            return res.status(400).json({ error: "كلمة المرور خاطئة" });
        }

        const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET);

        return res.status(200).json({
            uid: user.id,
            name: user.name,
            email: user.email,
            token: token,
            phone: user.phone,
            isverified: userStatus.isVerified,
            referralCode: user.referralCode,
            userName: user.userName,
        });

    } catch (error) {
        return res.status(500).json({ error: error.message });
    }
};


//1-send otp to the email
const sendOtp = async (req, res) => {
    try {
        let { email } = req.body;

        email = email.toLowerCase();

        if (!validator.isEmail(email)) {
            return res.status(400).json({ error: "البريد الالكتروني خاطئ" });
        }

        const user = await User.findOne({ 
            where: { email },
            include: [{ 
                model: UserAuth, 
                as: 'userAuth', 
                where: { authType: 1 },
                attributes: ['id', 'authCode', 'authCodeExpiry'],
                required: true,
            }],
            attributes: ['id', 'email'],
        });

        if (!user) {
            return res.status(400).json({ error: "لا يوجد مستخدم بهذا البريد الالكتروني" });
        }

        const userAuth = user.userAuth;

        if (userAuth.authCode && Date.now() < userAuth.authCodeExpiry) {
            return res.status(200).json({ message: "تم ارسال كود التفعيل مسبقاً. يرجى التحقق من بريدك الالكتروني" });
        }

        const otp = randomstring.generate({
            length: 6,
            charset: 'numeric',
        });

        userAuth.authCode = otp;
        userAuth.authCodeExpiry = Date.now() + Number(process.env.AUTH_CODE_EXPIRY);
        await userAuth.save();

        const transporter = nodemailer.createTransport({
            service: 'Gmail',
            auth: {
                user: process.env.EMAIL_ADDRESS,
                pass: process.env.EMAIL_PASSWORD,
            },
        });

        const mailOptions = {
            from: 'Story App',
            to: email,
            subject: 'Your OTP',
            html: `<h3>Your OTP is: <strong>${otp}</strong></h3>`,
        };

        await transporter.sendMail(mailOptions);

        return res.status(200).json({ message: "تم ارسال كود التفعيل الي بريدك الالكتروني" });
    } catch (error) {
        return res.status(500).json({ error: error.message });
    }
};


//2-verify otp and set New password
const verifyOtpAndSetNewPassword = async (req, res) => {
    const transaction = await sequelize.transaction();
    try {
        const { email, otp, newPassword } = req.body;

        const user = await User.findOne({ 
            where: { email },
            attributes: ['id', 'password'], 
        });
        if (!user) {
            return res.status(400).json({ error: "لا يوجد مستخدم بهذا البريد الالكتروني" });
        }

        const userAuth = await UserAuth.findOne({ 
            where: { userId: user.id, authType: 1 },
            attributes: ['id', 'authCode', 'authCodeExpiry'], 
        });
        if (!userAuth || userAuth.authCode !== otp) {
            return res.status(400).json({ error: 'Invalid OTP' });
        }

        if (userAuth.authCodeExpiry < Date.now()) {
            return res.status(400).json({ error: 'OTP expired' });
        }

        const hashedPassword = await bcrypt.hash(newPassword, 10);
        user.password = hashedPassword;
        await user.save({ transaction });

        userAuth.authCode = null;
        userAuth.authCodeExpiry = null;
        await userAuth.save({ transaction });

        await transaction.commit();

        return res.status(200).json({ message: "تم تغيير كلمة المرور بنجاح" });

    } catch (error) {
        await transaction.rollback();
        return res.status(500).json({ error: error.message });
    }
};


const sendVerificationCode = async (req, res) => {
    try {
        const { email } = req.body;

        const user = await User.findOne({ 
            where: { email },
            attributes: ['id'], 
        });
        if (!user) {
            return res.status(400).json({ error: "لا يوجد مستخدم بهذا البريد الالكتروني" });
        }

        const userAuth = await UserAuth.findOne({ 
            where: { userId: user.id, authType: 1 },
            attributes: ['id', 'authCode', 'authCodeExpiry'],
        });
        if (!userAuth) {
            return res.status(400).json({ error: "تفعيل الحساب غير موجود" });
        }
        if (userAuth.authVerified) {
            return res.status(400).json({ error: "البريد الالكتروني مفعل بالفعل" });
        }

        if (userAuth.authCode && Date.now() < userAuth.authCodeExpiry) {
            return res.status(200).json({ message: "تم ارسال كود التفعيل مسبقاً. يرجى التحقق من بريدك الالكتروني" });
        }

        const verificationCode = randomstring.generate({
            length: 6,
            charset: 'numeric',
        });

        userAuth.authCode = verificationCode;
        userAuth.authCodeExpiry = Date.now() + Number(process.env.AUTH_CODE_EXPIRY);
        await userAuth.save();

        const transporter = nodemailer.createTransport({
            service: 'Gmail',
            auth: {
                user: process.env.EMAIL_ADDRESS,
                pass: process.env.EMAIL_PASSWORD,
            },
        });

        const mailOptions = {
            from: 'Story App',
            to: email,
            subject: 'Verification Code',
            text: `Your Code for verification is: ${verificationCode}`,
            html: `
                <h1>Welcome to Story App!</h1>
                <p>Thanks for signing up. To verify your email address, please use the following code:</p>
                <h2>${verificationCode}</h2>
                <p>If you didn't request this, you can safely ignore this email.</p>
                <p>Best,</p>
                <p>The Story App Team</p>
            `,
        };

        await transporter.sendMail(mailOptions);

        return res.status(200).json({ message: "تم ارسال كود التفعيل الي بريدك الالكتروني" });

    } catch (error) {
        return res.status(500).json({ error: error.message });
    }
};


const checkBanStatus = async (req, res) => {
    try {
        const { userId } = req.user;

        if (!userId) 
            return res.status(400).json({ error: "يجب ارسال رقم المستخدم" });

        const userStatus = await UserStatus.findOne({ 
            where: { userId },
            attributes: ['isBanned'],
        });
        if (!userStatus) {
            return res.status(400).json({ error: "حالة المستخدم غير موجودة"});
        }

        if (userStatus.isBanned) {
            return res.status(403).json({error: "لقد تم حظرك"});
        }

        return res.status(200).json({ message: "لقد تم التحقق من حالة المستخدم"});

    } catch (error) {
        return res.status(500).json({ error: error.message });
    }
}

const referredUser = async (req, res) => {
    let transaction;
    try {
        const { userId } = req.user;
        const { referralCode } = req.body;

        if (!referralCode) {
            return res.status(400).json({ error: "يجب ادخال كود الاحالة" });
        }

        const referredUser = await User.findByPk(userId);
        if (!referredUser) {
            return res.status(400).json({ error: "المستخدم غير موجود" });
        }

        const referralUser = await User.findOne({ where: { referralCode } });
        if (!referralUser) {
            return res.status(400).json({ error: "كود الاحالة غير صحيح"});
        }

        if (referralUser.id === userId) {
            return res.status(400).json({ error: "لا يمكنك احالة نفسك"});
        }

        if (referralUser.id > referredUser.id) {
            return res.status(400).json({ error: "لا يمكنك احالة مستخدم اقدم منك"});
        }

        if (referredUser.referred) {
            return res.status(400).json({ error: "لقد تم احالتك بالفعل"});
        }

        transaction = await sequelize.transaction();

        await User.update({ referred: true }, { where: { id: userId }, transaction });

        await User.increment('referrals', { where: { id: referralUser.id }, transaction });

        await transaction.commit();

        return res.status(200).json({ message: "تم احالتك بنجاح" });

    } catch (error) {
        if (transaction) {
            await transaction.rollback();
        }
        return res.status(500).json({ error: error.message });
    }
};


const searchUsersUsingPagination = async (req, res) => {
    try {
        let { username } = req.query;
        const { offset = 0 } = req.query;

        username = username.toLowerCase();
        
        if (!username)
            return res.status(400).json({ error: "يجب ادخال اسم المستخدم" });

        const users = await User.findAll({
            where: {
                username: {
                    [Op.like]: '%' + username + '%'
                }
            },
            attributes: ['id', 'username'],
            limit: process.env.SEARCH_USER_LIMIT || 5,
            offset: offset,
            include: [{
                model: Profile,
                as: 'profile',
                attributes: ['imageFileName'],
            }, {
                model: UserPopularity,
                as: 'popularity',
                attributes: ['popularityScore'],
            },
            {
                model: UserStatus,
                as: 'userStatus',
                attributes: ['isVerified']
            }
        ],
            order: [[{ model: UserPopularity, as: 'popularity' }, 'popularityScore', 'DESC']]
        });


        for (let user of users) {
            if (user.profile && user.profile.imageFileName) {
                const imageURL = await getSignedUrl(user.profile.imageFileName);
                user.setDataValue('profile', imageURL);
            }
        }

        return res.status(200).json({ users });

    } catch (error) {
        return res.status(500).json({ error: error.message });
    }
}

const autocompleteUsers = async (req, res) => {
    try {
        let { username } = req.query;
        username = username.toLowerCase();
        
        if (!username)
            return res.status(400).json({ error: "يجب ادخال اسم المستخدم" });

        const users = await User.findAll({
            where: {
                username: {
                    [Op.like]: username + '%'
                }
            },
            attributes: ['id', 'username'],
            limit: process.env.AUTO_COMPLETE_USER_LIMIT || 5,
            include: [{
                model: Profile,
                as: 'profile',
                attributes: ['imageFileName'],
            }, {
                model: UserPopularity,
                as: 'popularity',
                attributes: ['popularityScore'],
            },
            {
                model: UserStatus,
                as: 'userStatus',
                attributes: ['isVerified']
            }
        ],
            order: [[{ model: UserPopularity, as: 'popularity' }, 'popularityScore', 'DESC']]
        });

        for (let user of users) {
            if (user.profile && user.profile.imageFileName) {
                const imageURL = await getSignedUrl(user.profile.imageFileName);
                user.setDataValue('profile', imageURL);
            }
        }

        return res.status(200).json({ users });

    } catch (error) {
        return res.status(500).json({ error: error.message });
    }
}

const banUser = async (req, res) => {
    try {
        const { userId } = req.user;
        const toBeBannedUserId = req.params.toBeBannedUserId;

        if (!toBeBannedUserId) {
            return res.status(400).json({ error: "يجب ادخال رقم المستخدم" });
        }

        if (userId === toBeBannedUserId) {
            return res.status(400).json({ error: 'لا يمكنك حظر نفسك'});
        }

        const userStatus = await UserStatus.findOne({ where: { userId, isAdmin: true } });
        if (!userStatus) {
            return res.status(403).json({ error: 'You are not an admin' });
        }

        await UserStatus.update({ isBanned: true }, { where: { userId: toBeBannedUserId } });

        return res.status(200).json({ message: "تم حظر المستخدم بنجاح"});

    } catch (error) {
        return res.status(500).json({ error: error.message });
    }
};

const unbanUser = async (req, res) => {
    try {
        const { userId } = req.user;
        const toBeUnbannedUserId = req.params.toBeUnbannedUserId;

        if (!toBeUnbannedUserId) {
            return res.status(400).json({ error: "يجب ادخال رقم المستخدم" });
        }

        if (userId === toBeUnbannedUserId) {
            return res.status(400).json({ error: 'لا يمكنك رفع الحظر عن نفسك'});
        }

        const userStatus = await UserStatus.findOne({ where: { userId, isAdmin: true } });
        if (!userStatus) {
            return res.status(403).json({ error: 'You are not an admin' });
        }

        await UserStatus.update({ isBanned: false }, { where: { userId: toBeUnbannedUserId } });

        return res.status(200).json({ message: "تم رفع الحظر عن المستخدم بنجاح"});

    } catch (error) {
        return res.status(500).json({ error: error.message });
    }
};



const getUserInfo = async (req, res) => {
    try {
        const { userId } = req.user;
        const otherUserId = req.params.otherUserId;

        const userStatus = await UserStatus.findOne({ where: { userId }, attributes: ['isAdmin'] });
        if (!userStatus || !userStatus.isAdmin) {
            return res.status(403).json({ error: 'You are not an admin' });
        }

        const otherUser = await User.findByPk(otherUserId, {
            attributes: ['id', 'name', 'email', 'phone', 'referralCode', 'username'],
        });
        if (!otherUser) {
            return res.status(400).json({ error: "لا يوجد مستخدم بهذا الرقم" });
        }

        const otherUserStatus = await UserStatus.findOne({ where: { userId: otherUserId }, attributes: ['isVerified'] });
        if (!otherUserStatus) {
            return res.status(400).json({ error: "حالة المستخدم غير موجودة"});
        }

        return res.status(200).json({
            uid: otherUser.id,
            name: otherUser.name,
            email: otherUser.email,
            phone: otherUser.phone,
            isverified: otherUserStatus.isVerified,
            referralCode: otherUser.referralCode,
            userName: otherUser.userName
        });

    } catch (error) {
        return res.status(500).json({ error: error.message });
    }
};

const setUserIsVerified = async (req, res) => {
    try {
        const { userId } = req.user;
        const toBeVerifiedUserId = req.params.toBeVerifiedUserId;

        if (!toBeVerifiedUserId) {
            return res.status(400).json({ error: "يجب ادخال رقم المستخدم"});
        }

        const userStatus = await UserStatus.findOne({ where: { userId }, attributes: ['isAdmin'] });
        if (!userStatus || !userStatus.isAdmin) {
            return res.status(403).json({ error: 'You are not an admin' });
        }

        const toBeVerifiedUserStatus = await UserStatus.findOne({ where: { userId: toBeVerifiedUserId }, attributes: ['id', 'isVerified'] });
        if (!toBeVerifiedUserStatus) {
            return res.status(400).json({ error: "حالة المستخدم غير موجودة"});
        }

        if (toBeVerifiedUserStatus.isVerified) {
            return res.status(400).json({ error: "المستخدم موثق بالفعل"});
        }

        toBeVerifiedUserStatus.isVerified = true;
        await toBeVerifiedUserStatus.save();

        return res.status(200).json({ message: "تم توثيق المستخدم بنجاح"});
    } catch (error) {
        return res.status(500).json({ error: error.message });
    }
};


module.exports = {
    signup,
    verifyEmailCode,
    login,
    sendOtp,
    verifyOtpAndSetNewPassword,
    sendVerificationCode,
    checkBanStatus,
    referredUser,
    searchUsersUsingPagination,
    autocompleteUsers,
    banUser,
    unbanUser,
    setUserIsVerified,
    getUserInfo,
}
