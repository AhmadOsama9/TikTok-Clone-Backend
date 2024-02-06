const User = require("../config/db").User;
const Profile = require("../config/db").Profile;
const Follow = require("../config/db").Follow;
const Video = require("../config/db").Video;
const VideoLike = require("../config/db").VideoLike;
const Comment = require("../config/db").Comment;
const nodemailer = require("nodemailer");
const randomstring = require('randomstring');
const bcrypt = require("bcrypt")

const nsfwjs = require("nsfwjs");
const fetch = require("node-fetch");
const fs = require("fs");
const tf = require("@tensorflow/tfjs-node");
const mmmagic = require("mmmagic");
const Magic = mmmagic.Magic;
const multer = require("multer");
const sharp = require("sharp");

const storage = require("../config/cloudStorage");

const bucketName = "kn_story_app";


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
//They said it's the best practice to not let other users
//play with the profile picture of other users or the bucket in general
const changeProfileImage = async (req, res) => { 
    try {
        const { userId } = req.user;
        const { image } = req.body;

        const user = await User.findOne({ where: { id: userId } });
        if (!user) {
            return res.status(404).json({ error: "User not found" });
        }

        const profile = await Profile.findOne({ where: { userId } });
        if (!profile) {
            return res.status(404).json({ error: "Profile not found" });
        }

        if (!req.file.buffer || typeof req.file.buffer !== 'object' || !(req.file.buffer.buffer instanceof Buffer)) {
            return res.status(400).json({ error: "Invalid file upload" });
        }

        const imageBuffer = await sharp(req.file.buffer)
            .resize(500, 500) // Resize to 500x500 pixels
            .toBuffer();

        const FileType = (await import('file-type')).default;
        const fileType = await FileType.fromBuffer(imageBuffer);
        if (!fileType || (fileType.ext !== "png" && fileType.ext !== "jpg" && fileType.ext !== "jpeg")) {
            return res.status(400).json({ error: "Invalid image format" });
        }

        const model = await nsfwjs.load();
        const predictions = await model.classify(imageBuffer);

        const pornThreshold = 0.7;
        const sexyThreshold = 0.7;
        const hentaiThreshold = 0.7;

        const pornProbability = predictions.find(prediction => prediction.className === "Porn").probability;
        const sexyProbability = predictions.find(prediction => prediction.className === "Sexy").probability;
        const hentaiProbability = predictions.find(prediction => prediction.className === "Hentai").probability;

        if (pornProbability > pornThreshold || sexyProbability > sexyThreshold || hentaiProbability > hentaiThreshold) {
            return res.status(400).json({ error: "Inappropriate content" });
        }

        const bucket = storage.bucket(bucketName);
        const fileName = `profileImages/${userId}/${Date.now()}.${fileType.ext}`;
        const file = bucket.file(fileName);

        const stream = file.createWriteStream({ 
            metadata: {
                contentType: `image/${fileType.ext}`
            }
        });

        stream.on("error", (error) => { 
            console.log("error: ", error);
            res.status(500).json({ error: error.message });
        });

        stream.on("finish", async () => { 
            console.log("imageFileName: ", fileName);
        
            profile.imageFileName = fileName;
            try {
                await profile.save();
                res.status(200).json({ message: "Profile picture changed successfully" });
            } catch (error) {
                console.log("Failed to update profile, deleting image from cloud storage...");
                file.delete().then(() => {
                    console.log("Image deleted from cloud storage");
                }).catch(err => {
                    console.log("Failed to delete image from cloud storage", err);
                });
                res.status(500).json({ error: "Failed to update profile picture" });
            }
        });

        stream.end(imageBuffer);

    } catch (error) {
        res.status(500).json({ error: error.message });
    }
}

const getProfileImage = async (req, res) => {
    try {

        const { userId } = req.user;

        const user = await User.findOne({ where: { id: userId } });
        if (!user) {
            return res.status(404).json({ error: "User not found" });
        }

        const profile = await Profile.findOne({ where: { userId } });
        if (!profile) {
            return res.status(404).json({ error: "Profile not found" });
        }

        if (!profile.imageFileName) {
            return res.status(404).json({ error: "Profile Image not found" });
        }

        const bucket = storage.bucket(bucketName);
        const file = bucket.file(profile.imageFileName);

        const options = {
            version: "v4",
            action: "read",
            expires: Date.now() + 15 * 60 * 1000 // 15 minutes
        };

        const [url] = file.getSignedUrl(options);

        return res.status(200).json({ imageUrl: url });

    } catch (error) {
        return res.status(500).json({ error: error.message });
    }
}

const getOtherUserProfileImage = async (req, res) => {
    try {

        const { userId } = req.user;
        const { otherUserId  } = req.params;

        const user = await User.findOne({ where: { id: userId } });
        if (!user) {
            return res.status(404).json({ error: "User not found" });
        }

        const otherUser =  await User.findOne({ where: { id: otherUserId } });
        if (!otherUser) {
            return res.status(404).json({ error: "User not found" });
        }

        const otherUserProfile = await Profile.findOne({ where: { userId: otherUserId } });
        if (!otherUserProfile) {
            return res.status(404).json({ error: "Profile not found" });
        }

        if (!otherUserProfile.imageFileName) { 
            return res.status(404).json({ error: "Profile Image not found" });
        }

        const bucket = storage.bucket(bucketName);
        const file = bucket.file(otherUserProfile.imageFileName);

        const options = {
            version: "v4",
            action: "read",
            expires: Date.now() + 15 * 60 * 1000 // 15 minutes
        };

        const [url] = file.getSignedUrl(options);

        return res.status(200).json({ otherUserImageUrl: url });

    } catch (error) {
        return res.status(500).json({ error: error.message });
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
    changeProfileImage,
    changeProfilePassword,
    changeProfileName,
    sendVerificationToNewEmail,
    verificationAndSetNewEmail,
    changeProfilePhone,
    changeProfileUsername,
    changeProfileBio,
    getProfileImage,
    getOtherUserProfileImage,
}