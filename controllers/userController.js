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



const { getSignedUrl } = require("./profileController");



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
            return res.status(400).json({ error: 'Invalid email address' });
        }
        
        const existingEmailUser = await User.findOne({ where: { email } });
        if (existingEmailUser) {
            return res.status(400).json({ error: 'User with this email already exists' });
        }

        const existingPhoneUser = await User.findOne({ where: { phone } });
        if (existingPhoneUser) {
            return res.status(400).json({ error: 'User with this phone number already exists' });
        }

        const existingUsernameUser = await User.findOne({ where: { username } });
        if (existingUsernameUser) {
            return res.status(400).json({ error: 'User with this username already exists' });
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

        await UserAuth.update({ authCode: verificationCode, authCodeExpiry: Date.now() + 600000 }, { where: { userId: user.id }, transaction });
    
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

        user.verificationCode = verificationCode;
        user.verificationCodeExpiry = Date.now() + 600000;
        await user.save({ transaction });

        const sendMail = await transporter.sendMail(mailOptions);
        if (!sendMail) {
            throw Error("Couldn't send the code to the email");
        }

        await transaction.commit();

        return res.status(200).json({ message: "Sent The Code to that email" });
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
            return res.status(400).json({ error: 'Invalid email address' });
        }

        const user = await User.findOne({ where: { email } }, { transaction });
        if (!user) {
            await transaction.rollback();
            return res.status(400).json({ error: 'User with this email does not exist' });
        }

        const userAuth = await UserAuth.findOne({ where: { userId: user.id, authType: 1 } }, { transaction });
        if (!userAuth || !userAuth.authCode) {
            await transaction.rollback();
            return res.status(400).json({ error: 'No verification code sent' });
        }

        if (code !== userAuth.authCode) {
            await transaction.rollback();
            return res.status(400).json({ error: 'Invalid verification code' });
        }

        if (userAuth.authCodeExpiry < Date.now()) {
            await transaction.rollback();
            return res.status(400).json({ error: 'Verification code expired' });
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

        const user = await User.findOne({ where: { email } });
        if (!user) {
            return res.status(400).json({ error: 'User with this email does not exist' });
        }

        const userStatus = await UserStatus.findOne({ where: { userId: user.id } });
        if (userStatus.isBanned) {
            return res.status(400).json({ error: 'This user is banned' });
        }

        const userAuth = await UserAuth.findOne({ where: { userId: user.id, authType: 1 } });
        if (!userAuth.authVerified) {
            return res.status(400).json({ error: 'Email not verified' });
        }

        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) {
            return res.status(400).json({ error: 'Invalid password' });
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

/*
8-  Profile Password
        Description: This api is used to reset the profile password of the user.
        An email verification will be sent to the email. The user must verify the email to complete the process. The system will redirect the user to change the password.
        Parameters:
            - email
        A new request needed to get the OTP. If the OTP is correct, the user will be redirected to change the password.

        1-send otp to the email
        2-verify otp and set New password 
*/


//1-send otp to the email
const sendOtp = async (req, res) => {
    try {
        let { email } = req.body;

        email = email.toLowerCase();

        if (!validator.isEmail(email)) {
            return res.status(400).json({ error: 'Invalid email address' });
        }

        const user = await User.findOne({ where: { email } });
        if (!user) {
            return res.status(400).json({ error: 'User with this email does not exist' });
        }

        const otp = randomstring.generate({
            length: 6,
            charset: 'numeric',
        });

        const userAuth = await UserAuth.findOne({ where: { userId: user.id, authType: 1 } });
        userAuth.authCode = otp;
        userAuth.authCodeExpiry = Date.now() + 3600000; // 3600000 milliseconds = 1 hour
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

        return res.status(200).json({ message: 'OTP has been sent to your email' });
    } catch (error) {
        return res.status(500).json({ error: error.message });
    }
};


//2-verify otp and set New password
const verifyOtpAndSetNewPassword = async (req, res) => {
    const transaction = await sequelize.transaction();
    try {
        const { email, otp, newPassword } = req.body;

        const user = await User.findOne({ where: { email } });
        if (!user) {
            return res.status(400).json({ error: 'User with this email does not exist' });
        }

        const userAuth = await UserAuth.findOne({ where: { userId: user.id, authType: 1 } });
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

        return res.status(200).json({ message: 'Password has been changed successfully' });

    } catch (error) {
        await transaction.rollback();
        return res.status(500).json({ error: error.message });
    }
};


const sendVerificationCode = async (req, res) => {
    try {
        const { email } = req.body;

        const user = await User.findOne({ where: { email } });
        if (!user) {
            return res.status(400).json({ error: 'User with this email does not exist' });
        }

        const userAuth = await UserAuth.findOne({ where: { userId: user.id, authType: 1 } });
        if (userAuth.authVerified) {
            return res.status(400).json({ error: 'Email already verified' });
        }

        const verificationCode = randomstring.generate({
            length: 6,
            charset: 'numeric',
        });

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


        userAuth.authCode = verificationCode;
        userAuth.authCodeExpiry = Date.now() + 600000; // 600000 milliseconds = 10 minutes
        await userAuth.save();

        await transporter.sendMail(mailOptions);


        return res.status(200).json({ message: 'Verification code sent to your email' });

    } catch (error) {
        return res.status(500).json({ error: error.message });
    }
};

const checkBanStatus = async (req, res) => {
    try {
        const { userId } = req.user;

        if (!userId) 
            return res.status(400).json({ error: 'User id is required' });

        const userStatus = await UserStatus.findOne({ where: { userId } });
        if (!userStatus) {
            return res.status(400).json({ error: 'User status for this id does not exist' });
        }

        if (userStatus.isBanned) {
            return res.status(403).json({error: "You are banned"});
        }

        return res.status(200).json({ message: "You are not banned" });

    } catch (error) {
        return res.status(500).json({ error: error.message });
    }
}

const referredUser = async (req, res) => {
    let transaction;
    try {
        const { userId } = req.user;
        const { referralCode } = req.body;

        if (!referralCode)
            return res.status(400).json({ error: 'Referral code is required' });

        const referredUser = await User.findByPk(userId);
        if (!referredUser)
            return res.status(400).json({ error: 'User with this id does not exist' });

        const referralUser = await User.findOne({ where: { referralCode } });
        if (!referralUser)
            return res.status(400).json({ error: 'User with this referral code does not exist' });

        if (referralUser.id === userId)
            return res.status(400).json({ error: 'You cannot refer yourself' });

        if (referralUser.id > referredUser.id)
            return res.status(400).json({ error: 'You cannot refer a user who has a lower id than you' });

        if (referredUser.referred)
            return res.status(400).json({ error: 'You have already been referred' });

        transaction = await sequelize.transaction();

        referredUser.referred = true;
        await referredUser.save({ transaction });
        referralUser.referrals += 1;
        await referralUser.save({ transaction });

        await transaction.commit();

        return res.status(200).json({ message: "You have been referred successfully" });

    } catch (error) {
        if (transaction) await transaction.rollback();
        return res.status(500).json({ error: error.message });
    }
};
 

const searchUsersUsingPagination = async (req, res) => {
    try {
        let { username } = req.query;
        const { offset = 0 } = req.query;

        username = username.toLowerCase();
        
        if (!username)
            return res.status(400).json({ error: 'Username is required' });

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
            }],
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
            return res.status(400).json({ error: 'Username is required' });

        const users = await User.findAll({
            where: {
                username: {
                    [Op.like]: username + '%'
                }
            },
            attributes: ['id', 'username'],
            limit: process.env.AUTO_COMPLETE_LIMIT || 5,
            include: [{
                model: Profile,
                as: 'profile',
                attributes: ['imageFileName'],
            }, {
                model: UserPopularity,
                as: 'popularity',
                attributes: ['popularityScore'],
            }],
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

        if (!toBeBannedUserId)
            return res.status(400).json({ error: 'User id is required' });

        if (userId === toBeBannedUserId)
            return res.status(400).json({ error: 'You cannot ban yourself' });

        const userStatus = await UserStatus.findOne({ where: { userId } });
        if (!userStatus || !userStatus.isAdmin)
            return res.status(403).json({ error: 'You are not an admin' });

        const toBeBannedUserStatus = await UserStatus.findOne({ where: { userId: toBeBannedUserId } });
        if (!toBeBannedUserStatus)
            return res.status(400).json({ error: 'User status for this id does not exist' });

        toBeBannedUserStatus.isBanned = true;
        await toBeBannedUserStatus.save();

        return res.status(200).json({ message: "User has been banned successfully" });

    } catch (error) {
        return res.status(500).json({ error: error.message });
    }
}

const unbanUser = async (req, res) => {
    try {
        const { userId } = req.user;
        const toBeUnbannedUserId = req.params.toBeUnbannedUserId;

        if (!toBeUnbannedUserId)
            return res.status(400).json({ error: 'User id is required' });

        if (userId === toBeUnbannedUserId)
            return res.status(400).json({ error: 'You cannot unban yourself' });

        const userStatus = await UserStatus.findOne({ where: { userId } });
        if (!userStatus || !userStatus.isAdmin)
            return res.status(403).json({ error: 'You are not an admin' });

        const toBeUnbannedUserStatus = await UserStatus.findOne({ where: { userId: toBeUnbannedUserId } });
        if (!toBeUnbannedUserStatus)
            return res.status(400).json({ error: 'User status for this id does not exist' });

        toBeUnbannedUserStatus.isBanned = false;
        await toBeUnbannedUserStatus.save();

        return res.status(200).json({ message: "User has been unbanned successfully" });

    } catch (error) {
        return res.status(500).json({ error: error.message });
    }
}


const getUserInfo = async (req, res) => {
    try {
        const { userId } = req.user;

        const user = await User.findByPk(userId);
        if (!user)
            return res.status(400).json({ error: 'User with this id does not exist' });

        const userStatus = await UserStatus.findOne({ where: { userId } });
        if (!userStatus)
            return res.status(400).json({ error: 'User status for this id does not exist' });

        return res.status(200).json({
            uid: user.id,
            name: user.name,
            email: user.email,
            phone: user.phone,
            isverified: userStatus.isVerified,
            referralCode: user.referralCode,
            userName: user.userName
        });

    } catch (error) {
        return res.status(500).json({ error: error.message});
    }
};

const setUserIsVerified = async (req, res) => {
    try {
        const { userId } = req.user;
        const toBeVerifiedUserId = req.params.toBeVerifiedUserId;

        if (!toBeVerifiedUserId)
            return res.status(400).json({ error: 'User id is required' });

        const userStatus = await UserStatus.findOne({ where: { userId } });
        if (!userStatus || !userStatus.isAdmin)
            return res.status(403).json({ error: 'You are not an admin' });

        const toBeVerifiedUserStatus = await UserStatus.findOne({ where: { userId: toBeVerifiedUserId } });
        if (!toBeVerifiedUserStatus)
            return res.status(400).json({ error: 'User status for this id does not exist' });

        toBeVerifiedUserStatus.isVerified = true;
        await toBeVerifiedUserStatus.save();

        return res.status(200).json({ message: "User has been verified successfully" });
    } catch (error) {
        return res.status(500).json({ error: error.message });
    }
}

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
