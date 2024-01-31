const User = require("../db").User;
const Profile = require("../db").Profile;
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const nodemailer = require("nodemailer");
const sequelize = require("../db").sequelize;
const randomstring = require('randomstring')



const signup = async (req, res) => {
    let transaction;
    try {
        let { name, phone, email, password } = req.body;

        if (!name || !phone || !email || !password) {
            return res.status(400).json({ error: 'Please fill all fields' });
        }

        email = email.toLowerCase();

        const emailRegex = /^[\w-]+(\.[\w-]+)*@([\w-]+\.)+[a-zA-Z]{2,7}$/;
        if (!emailRegex.test(email)) {
            return res.status(400).json({ error: 'Invalid email format' });
        }
        
        const existingEmailUser = await User.findOne({ where: { email } });
        if (existingEmailUser) {
            return res.status(400).json({ error: 'User with this email already exists' });
        }

        const existingNameUser = await User.findOne({ where: { name } });
        if (existingNameUser) {
            return res.status(400).json({ error: 'User with this name already exists' });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        transaction = await sequelize.transaction();

        const user = await User.create({ name, phone, email, password: hashedPassword }, { transaction });

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
            subject: 'Verification OTP',
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

        user.otp = verificationCode;
        user.otp_expiry = Date.now() + 600000;
        await user.save({ transaction });

        await transaction.commit();

        res.status(200).json({ message: "Sent The Code to that email" });
    } catch (error) {
        if (transaction) await transaction.rollback();
        res.status(500).json({ error: error.message });
    }
};

const verifyEmailCode = async (req, res) => {
    try {
        const { email, code } = req.body;

        const user = await User.findOne({ where: { email } });
        if (!user) {
            return res.status(400).json({ error: 'User with this email does not exist' });
        }

        if (code !== user.otp) {
            return res.status(400).json({ error: 'Invalid verification code' });
        }

        if (user.otp_expiry < Date.now()) {
            return res.status(400).json({ error: 'Verification code expired' });
        }

        user.verifiedEmail = true;
        user.otp = null;
        user.otp_expiry = null;
        await user.save();

        const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET, { expiresIn: '3d' });

        res.status(200).json({ token });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
}

const login = async (req, res) => {
    try {
        const { email, password } = req.body;

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

        const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET, { expiresIn: '3d' });

        res.status(200).json({ token });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
}

const forgotPassword = async (req, res) => {
    try {
        const { email } = req.body;

        const user = await User.findOne({ where: { email } });
        if (!user) {
            return res.status(400).json({ error: 'User with this email does not exist' });
        }

        const otp = randomstring.generate({
            length: 6,
            charset: 'numeric',
        });

        const hashedOtp = await bcrypt.hash(otp, 10);
        user.password = hashedOtp;
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

        res.status(200).json({ message: 'Temporary password has been sent to your email' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
}

const changePassword = async (req, res) => {
    try {
        const { newPassword } = req.body;
        const { userId } = req.user;

        const user = await User.findOne({ where: { id: userId } });
        if (!user) {
            return res.status(400).json({ error: 'User does not exist' });
        }

        const hashedPassword = await bcrypt.hash(newPassword, 10);
        user.password = hashedPassword;
        await user.save();

        res.status(200).json({ message: 'Password has been changed successfully' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
}

module.exports = {
    signup,
    verifyEmailCode,
    login,
    forgotPassword,
    changePassword,
}
