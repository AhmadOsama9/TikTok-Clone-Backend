const User = require("../config/db").User;
const Profile = require("../config/db").Profile;
const Video = require("../config/db").Video;
const VideoLike = require("../config/db").VideoLike;
const Follow = require("../config/db").Follow;
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

        await Profile.create({ userId: user.id }, { transaction });

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

        user.verificationCode = verificationCode;
        user.verificationCodeExpiry = Date.now() + 600000;
        await user.save({ transaction });

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
    try {
        let { email, code } = req.body;

        email = email.toLowerCase();

        if (!validator.isEmail(email)) {
            return res.status(400).json({ error: 'Invalid email address' });
        }

        const user = await User.findOne({ where: { email } });
        if (!user) {
            return res.status(400).json({ error: 'User with this email does not exist' });
        }

        if (!user.verificationCode) {
            return res.status(400).json({ error: 'No verification code sent' });
        }

        if (code !== user.verificationCode) {
            return res.status(400).json({ error: 'Invalid verification code' });
        }

        if (user.verificationCodeExpiry < Date.now()) {
            return res.status(400).json({ error: 'Verification code expired' });
        }

        user.verifiedEmail = true;
        user.verificationCode = null;
        user.verificationCodeExpiry = null;

        const idLength = user.id.toString().length;
        const referralCodeLength = idLength < 4 ? 6 : idLength + 3;

        user.referralCode = user.id + randomstring.generate({
            length: referralCodeLength - idLength,
            charset: 'alphanumeric',
            capitalization: 'lowercase'
        });

        await user.save();

        const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET);

        return res.status(200).json({
            uid: user.id,
            name: user.name,
            email: user.email,
            token: token,
            phone: user.phone,
            isverified: user.isVerified,
            referralCode: user.referralCode,
            userName: user.userName,
        });

    } catch (error) {
        return res.status(500).json({ error: error.message });
    }
}

const login = async (req, res) => {
    try {
        let { email, password } = req.body;

        email = email.toLowerCase();

        if (!validator.isEmail(email)) {
            return res.status(400).json({ error: 'Invalid email address' });
        }

        const user = await User.findOne({ where: { email } });
        if (!user) {
            return res.status(400).json({ error: 'User with this email does not exist' });
        }

        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) {
            return res.status(400).json({ error: 'Invalid password' });
        }

        if (user.isBanned) {
            return res.status(403).json({error: "You are banned"});
        }

        if (!user.verifiedEmail) {
            return res.status(400).json({error: "Your email is not verified"});
        }

        const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET);

        return res.status(200).json({
            uid: user.id,
            name: user.name,
            email: user.email,
            token: token,
            phone: user.phone,
            isverified: user.isVerified,
            referralCode: user.referralCode,
            userName: user.userName,
        });

    } catch (error) {
        return res.status(500).json({ error: error.message });
    }
}


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

        user.otp = otp;
        user.otpExpiry = Date.now() + 3600000; // 3600000 milliseconds = 1 hour
        await user.save();

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
            subject: 'Your temporary password',
            html: `<h3>Your temporary password is: <strong>${otp}</strong></h3>`,
        };

        await transporter.sendMail(mailOptions);

        return res.status(200).json({ message: 'Temporary password has been sent to your email' });
    } catch (error) {
        return res.status(500).json({ error: error.message });
    }
}

//2-verify otp and set New password
const verifyOtpAndSetNewPassword = async (req, res) => {
    try {
        const { email, otp, newPassword } = req.body;

        const user = await User.findOne({ where: { email } });
        if (!user) {
            return res.status(400).json({ error: 'User with this email does not exist' });
        }

        if (user.otp !== otp) {
            return res.status(400).json({ error: 'Invalid OTP' });
        }

        if (user.otpExpiry < Date.now()) {
            return res.status(400).json({ error: 'OTP expired' });
        }

        const hashedPassword = await bcrypt.hash(newPassword, 10);
        user.password = hashedPassword;
        user.otp = null;
        user.otpExpiry = null;
        await user.save();

        return res.status(200).json({ message: 'Password has been changed successfully' });

    } catch (error) {
        return res.status(500).json({ error: error.message });
    }
}


const sendVerificationCode = async (req, res) => {
    try {
        const { email } = req.body;

        const user = await User.findOne({ where: { email } });
        if (!user) {
            return res.status(400).json({ error: 'User with this email does not exist' });
        }

        if (user.verifiedEmail) {
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

        await transporter.sendMail(mailOptions);

        user.verificationCode = verificationCode;
        user.verificationCodeExpiry = Date.now() + 600000;
        await user.save();

        return res.status(200).json({ message: 'Verification code sent to your email' });

    } catch (error) {
        return res.status(500).json({ error: error.message });
    }
}

const checkBanStatus = async (req, res) => {
    try {
        const { userId } = req.user;

        if (!userId) 
            return res.status(400).json({ error: 'User id is required' });

        const user = await User.findOne({ where: { id: userId } });
        if (!user) {
            return res.status(400).json({ error: 'User with this id does not exist' });
        }

        if (user.isBanned) {
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
        const { username, offset = 0 } = req.query;
        
        if (!username)
            return res.status(400).json({ error: 'Username is required' });

        const result = await User.findAndCountAll({
            where: {
                username: {
                    [Op.like]: '%' + username + '%'
                }
            },
            attributes: ['id', 'username'],
            offset: offset,
            limit: 5,
            include: [{
                model: Profile,
                attributes: ['imageFileName'],
            }]
        });

        for (let user of result.rows) {
            if (user.Profile && user.Profile.imageFileName) {
                user.Profile.imageURL = await getSignedUrl(user.Profile.imageFileName);
            }
        }

        return res.status(200).json({ users: result.rows });

    } catch (error) {
        return res.status(500).json({ error: error.message });
    }
}

const autocompleteUsers = async (req, res) => {
    try {
        const { username } = req.query;
        
        if (!username)
            return res.status(400).json({ error: 'Username is required' });

        const result = await User.findAndCountAll({
            where: {
                username: {
                    [Op.like]: username + '%'
                }
            },
            attributes: ['id', 'username'],
            limit: 5,
            include: [{
                model: Profile,
                attributes: ['imageFileName'],
            }]
        });

        for (let user of result.rows) {
            if (user.Profile && user.Profile.imageFileName) {
                user.Profile.imageURL = await getSignedUrl(user.Profile.imageFileName);
            }
        }

        return res.status(200).json({ users: result.rows });

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
}
