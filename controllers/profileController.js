const User = require("../db").User;
const Profile = require("../db").Profile;
const Follow = require("../db").Follow;
const Video = require("../db").Video;
const VideoLike = require("../db").VideoLike;
const Comment = require("../db").Comment;
const nodemailer = require("nodemailer");
const randomstring = require('randomstring');
const bcrypt = require("bcrypt")

/*
10- Get Profile Data (me)
        Description: This api is used to get the profile data of the user.
        It will return:
            - Profile followers count
            - Profile following count
            - Profile bio
            - Videos thumbnails
            - Videos count
            - is popular
            - Followers list(ids)
            - Total likes count
            - referral code

        1-followersListIds (people that follow me):
            -return username and the profilePhotoUrl



*/
const getUserProfile = async (req, res) => {
    try {
        const { userId } = req.user;

        const user = await User.findOne({ where: { id: userId } });
        const profile = await Profile.findOne({ where: { userId: userId } });

        const followers = await Follow.findAll({ where: { followingId: userId } });
        const following = await Follow.findAll({ where: { followerId: userId } });

        const followersCount = followers.length;
        const followingCount = following.length;

        const followersIds = followers.map(follower => follower.followerId);
        const followingIds = following.map(follow => follow.followingId);

        const videos = await Video.findAll({ where: { userId: userId } });
        const videosCount = videos.length;

        const videoData = await Promise.all(videos.map(async video => {
            const likesOnTheVideo = await VideoLike.count({ where: { videoId: video.id } });
            const commentsOnTheVideo = await Comment.count({ where: { videoId: video.id } });

            return {
                id: video.id,
                thumbnailUrl: video.thumbnailUrl,
                likesOnTheVideo,
                commentsOnTheVideo,
                sharesCountOfVideo: video.shareCount,
                viewsOnTheVideo: video.viewsCount
            };
        }));

        const userProfile = {
            bio: profile.bio,
            followersCount,
            followingCount,
            followersIds,
            followingIds,
            videos: videoData,
            profilePicture: profile.imageUrl,
            numberOfVideos: videosCount,
            isPopular: user.isPopular,
            balance: user.balance
        };

        res.status(200).json(userProfile);
    } catch (error) {
        res.status(500).json({error: error.message});
    }
}

/*
9- Get Profile Data (another user)
        Description: This api is used to get the profile data of the user.
        It will return:
            - Profile Name
            - Profile Username
            - Profile photo(URL)
            - Profile followers count
            - Profile following count
            - Profile bio
            - Videos thumbnails
            - Videos count
            - is popular
            - Followers list
            - Total likes count
            - referral code
*/
const getOtherUserProfile = async (req, res) => {
    try {
        const { profileId } = req.params;

        const user = await User.findOne({ where: { id: profileId } });
        const profile = await Profile.findOne({ where: { userId: profileId } });

        const followers = await Follow.findAll({ where: { followingId: profileId } });
        const following = await Follow.findAll({ where: { followerId: profileId } });

        const followersCount = followers.length;
        const followingCount = following.length;

        const followersIds = followers.map(follower => follower.followerId);
        const followingIds = following.map(follow => follow.followingId);

        const videos = await Video.findAll({ where: { userId: profileId } });
        const videosCount = videos.length;

        const videoData = await Promise.all(videos.map(async video => {
            const likesOnTheVideo = await VideoLike.count({ where: { videoId: video.id } });
            const commentsOnTheVideo = await Comment.count({ where: { videoId: video.id } });

            return {
                id: video.id,
                thumbnailUrl: video.thumbnailUrl,
                likesOnTheVideo,
                commentsOnTheVideo,
                sharesCountOfVideo: video.shareCount,
                viewsOnTheVideo: video.viewsCount
            };
        }));

        const userProfile = {
            bio: profile.bio,
            followersCount,
            followingCount,
            followersIds,
            followingIds,
            videos: videoData,
            profilePicture: profile.imageUrl,
            numberOfVideos: videosCount,
            isPopular: user.isPopular
        };

        res.status(200).json(userProfile);
    } catch (error) {
        res.status(500).json({error: error.message});
    }
}


/*    1- Change Profile Picture
        Description: This api is used to change the profile picture of the user (no need to send the old picture or the password, He's already logged in).
        Parameters:
            - new photoUrl */

const changeProfilePhoto = async (req, res) => { 
    try {
        const { userId } = req.user;
        const { photoUrl } = req.body;

        const user = await User.findONe({ where: { id: userId } });
        if (!user) {
            return res.status(404).json({ error: "User not found" });
        }

        const profile = await Profile.findOne({ where: { userId } });
        //Here I should connect to the cloud storage and store it
        //then I take the url and set it here
        profile.photoUrl = photoUrl;
        await profile.save();

        res.status(200).json({ message: "Profile picture changed successfully" });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
}   

/*
2- Change Profile Password
        Description: This api is used to change the profile password of the user.
        The user must send the old password and the new password.
        Parameters:
            - old password
            - new password
*/

const changeProfilePassword = async (req, res) => {
    try {
        const { userId } = req.user;
        const { oldPassword, newPassword } = req.body;

        const user = await User.findOne({ where: { id: userId } });
        if (!user) {
            return res.status(404).json({ error: "User not found" });
        }

        const isPasswordValid = await bcrypt.compare(oldPassword, user.password);
        if (!isPasswordValid) {
            return res.status(400).json({ error: 'Invalid password' });
        }

        const hashedPassword = await bcrypt.hash(newPassword, 10);

        user.password = hashedPassword;
        await user.save();

        res.status(200).json({ message: "Password changed successfully" });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
}

/* 3- Change Profile Name
        Description: This api is used to change the profile name of the user.
        The user must send the new name.
        Parameters:
            - new name */

const changeProfileName = async (req, res) => { 
    try {
        const { userId } = req.user;
        const { newName } = req.body;

        const user = await User.findOne({ where: { id: userId } });
        if (!user) {
            return res.status(404).json({ error: "User not found" });
        }

        user.name = newName;
        await user.save();

        res.status(200).json({ message: "Profile name changed successfully" });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
}   


/*
4- Change Profile Email
        Description: This api is used to change the profile email of the user.
        The user must send the new email. An email verification will be sent to the new email. The user must verify the new email to complete the process.
        Parameters:
            - new email

        1-send verification newEmail
        2-verification and the newEmail
*/

//send verification to the newEmail
const sendVerificationToNewEmail = async (req, res) => { 
    try {
        const { userId } = req.user;
        let { newEmail } = req.body;
        newEmail = newEmail.toLowerCase();

        const user = await User.findOne({ where: { id: userId } });
        if (!user) {
            return res.status(404).json({ error: "User not found" });
        }

        const emailExists = await User.findOne({ where: { email: newEmail } });
        if (emailExists) {
            return res.status(400).json({ error: "Email already exists" });
        }

        const newEmailRegex = /^[\w-]+(\.[\w-]+)*@(gmail\.com|yahoo\.com|outlook\.com)$/;
        if (!newEmailRegex.test(newEmail)) {
            return res.status(400).json({ error: 'Invalid email format' });
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
            from: 'Story App <no-reply@storyapp.com>',//process.env.EMAIL_ADDRESS, can't use this because of gmail security
            to: newEmail,
            subject: 'Verification Code',
            text: `Your Code for verification is: ${verificationCode}`,
            html: `
                <h1>Verify your new email Address</h1>
                <p>please use the following code:</p>
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
        await user.save();

    } catch (error) {
        res.status(500).json({ error: error.message });
    }
}

//verification and set the newEmail
const verificationAndSetNewEmail = async (req, res) => { 
    try {
        const { userId } = req.user;
        const { verificationCode } = req.body;
        let { newEmail } = req.body;
        newEmail = newEmail.toLowerCase();


        const user = await User.findOne({ where: { id: userId } });
        if (!user) {
            return res.status(404).json({ error: "User not found" });
        }

        if (user.verificationCode !== verificationCode) {
            return res.status(400).json({ error: "Invalid verification code" });
        }

        if (user.verificationCodeExpiry < Date.now()) {
            return res.status(400).json({ error: "Verification code expired" });
        }

        user.email = newEmail;
        user.verificationCode = null;
        user.verificationCodeExpiry = null;
        await user.save();

        res.status(200).json({ message: "Email changed successfully" });

    } catch (error) {
        res.status(500).json({ error: error.message });
    }
}



/*
5- Change Profile Phone
        Description: This api is used to change the profile phone of the user.
        The user must send the new phone.
        Parameters:
            - new phone
*/

const changeProfilePhone = async (req, res) => {
    try {
        const { userId } = req.user;
        const { newPhone } = req.body;

        const user = await User.findOne({ where: { id: userId } });
        if (!user) {
            res.status(404).json({ error: "User not found" });
        }

        const phoneExists = await User.findOne({ where: { phone: newPhone } });
        if (phoneExists) { 
            return res.status(400).json({ error: "Phone already exists" });
        }

        user.phone = newPhone;
        await user.save();

    } catch (error) {
        res.status(500).json({ error: error.message });
    }
}

/* 
6- Change Profile Username
        Description: This api is used to change the profile username of the user.
        The user must send the new username. The username must be unique.
        Parameters:
            - new userName
*/

const changeProfileUsername = async (req, res) => { 
    try {
        const { userId } = req.user;
        const { newUsername } = req.body;

        const user = await User.findOne({ where: { id: userId } });
        if (!user) {
            return res.status(404).json({ error: "User not found" });
        }

        newUsername = newUsername.toLowerCase();

        const usernameExists = await User.findOne({ where: { username: newUsername } });
        if (usernameExists) {
            return res.status(400).json({ error: "Username already exists" });
        }

        user.username = newUsername;
        await user.save();

    } catch (error) {
        res.status(500).json({ error: error.message });
    }


}


/*
7- Change Profile Bio
        Description: This api is used to change the profile bio of the user.
        The user must send the new bio.
        Parameters:
            - new bio
*/

const changeProfileBio = async (req, res) => { 
    try {
        const { userId } = req.user;
        const { newBio } = req.body;

        const profile = await Profile.findOne({ where: { userId } });
        if (!profile) {
            return res.status(404).json({ error: "Profile not found" });
        }

        profile.bio = newBio;
        await profile.save();

        res.status(200).json({ message: "Profile bio changed successfully" });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
}




module.exports = {
    getUserProfile,
    getOtherUserProfile,
    changeProfilePhoto,
    changeProfilePassword,
    changeProfileName,
    sendVerificationToNewEmail,
    verificationAndSetNewEmail,
    changeProfilePhone,
    changeProfileUsername,
    changeProfileBio
}