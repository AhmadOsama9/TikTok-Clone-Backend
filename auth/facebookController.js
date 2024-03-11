const User = require("../config/db").User;
const UserStatus = require("../config/db").UserStatus;
const UserAuth = require("../config/db").UserAuth;
const Profile = require("../config/db").Profile;
const sequelize = require("../config/db").sequelize;

const axios = require("axios");
const crypto = require("crypto");
const CryptoJS = require("crypto-js");
const jwt = require("jsonwebtoken");
const randomstring = require("randomstring");


const facebookController = async (req, res) => {
    try {
        const { profile, accessToken } = req.user;
        
        if (!req.user || !req.user.accessToken || !req.user.profile || !req.user.profile.emails || !req.user.profile.emails[0].value) { 
            return res.status(400).json({ message: "Facebook login failed" });
        }

        const isValidToken = await validateFacebookToken(accessToken);
        if (!isValidToken)
            return res.status(400).json({ message: "Facebook login failed" });

        const email = req.user.profile.emails[0].value;

        const existingUser = await User.findOne({ where: { email } });
        let userData = null;

        if (existingUser) {
            const userAuth = await UserAuth.findOne({ where: { userId: existingUser.id, authType: 2 } });
            if (userAuth.authType === 1)
                return res.status(400).json({ message: "That email has been used as a normal email please login using your normal email" });

            if (userAuth.authType !== 2)
                return res.status(400).json({ message: "Facebook login failed" });

            if (userAuth.authVerified === false) //that shouldn't happen ever but how knows
                return res.status(400).json({ message: "Facebook login failed" });

            const token = jwt.sign({ userId: existingUser.id }, process.env.JWT_SECRET);

            userData = {
                uid: existingUser.id,
                name: existingUser.name,
                email: existingUser.email,
                token,
                isVerified: userAuth.authVerified,
                referralCode: existingUser.referralCode,
                username: existingUser.username,
            }

        } else {
            userData = await createNewFacebookUser(email, profile);
        }

        const cipherText = CryptoJS.AES.encrypt(JSON.stringify(userData), process.env.CRYPTO_SECRET).toString();

        res.redirect(`${process.env.FLUTTER_AUTH_FACEBOOK_LOGIN_URL}?data=${encodeURIComponent(cipherText)}`);

    } catch (error) {
        console.error('Error in facebookController:', error);
        return res.status(500).json({ message: "Internal server error" });
    }
}


async function validateFacebookToken(token) {
    const debugTokenUrl = `https://graph.facebook.com/debug_token?input_token=${token}&access_token=${process.env.FACEBOOK_APP_ID}|${process.env.FACEBOOK_APP_SECRET}`;

    try {
        const response = await axios.get(debugTokenUrl);
        if (response.data && response.data.data && response.data.data.is_valid) {
            return true;
        } else {
            return false;
        }
    } catch (error) {
        console.error('Error validating token', error);
        return false;
    }
}

async function createNewFacebookUser (email, profile) {
    let transaction;
    try {
        transaction = await sequelize.transaction();

        const randomString = crypto.randomBytes(3).toString('hex');

        const user = await User.create({
            name: profile.name, 
            email: email, 
            username: 'user' + randomString,
        }, { transaction });
        await UserStatus.create({ userId: user.id }, { transaction });
        const userAuth = await UserAuth.create({ userId: user.id, authType: 2, authVerified: true }, { transaction });
        const profile = await Profile.create({ userId: user.id } , { transaction });

        const idLength = user.id.toString().length;
        const referralCodeLength = idLength < 4 ? 6 : idLength + 3;

        user.referralCode = user.id + randomstring.generate({
            length: referralCodeLength - idLength,
            charset: 'alphanumeric',
            capitalization: 'lowercase'
        });

        await user.save({ transaction });

        await transaction.commit();

        const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET);

        const userData = {
            uid: user.id,
            name: user.name,
            email: user.email,
            token,
            isVerified: userAuth.authVerified,
            referralCode: user.referralCode,
            username: user.username,
        }

        return userData;
    } catch (error) {
        if (transaction) await transaction.rollback();
        console.error('Error in createNewFacebookUser:', error);
        return false;
    }
}

module.exports = facebookController;