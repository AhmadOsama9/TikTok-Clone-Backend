const User = require("../config/db").User;
const UserAuth = require("../config/db").UserAuth;
const UserStatus = require("../config/db").UserStatus;
const Profile = require("../config/db").Profile;
const Follow = require("../config/db").Follow;
const Video = require("../config/db").Video;
const VideoMetadata = require("../config/db").VideoMetadata;
const Comment = require("../config/db").Comment;
const SavedVideo = require("../config/db").SavedVideo;

const nodemailer = require("nodemailer");
const randomstring = require('randomstring');
const bcrypt = require("bcrypt");
const Jimp = require("jimp");
const { Op } = require('sequelize');
const validator = require('validator');

//will be importing the tfjs inside the functions
//cause it causes a problem in the tests when being imported here
//const tf = require("@tensorflow/tfjs-node");


const storage = require("../config/cloudStorage");
const bucketName = process.env.IMAGE_BUCKET_NAME || "kn_story_app";

const fetchVideoData = require("../helper/fetchVideoData");
const { getModel } = require("../helper/initializeAndGetModel");
const getSignedUrl = require("../cloudFunctions/getSignedUrl");

async function listFiles() {
    const [files] = await storage.bucket(bucketName).getFiles();

    console.log('Files:');
    files.forEach(file => {
        console.log(file.name);
    });
}


async function deleteUnUsedFiles() {
    const [files] = await storage.bucket(bucketName).getFiles();

    console.log('Files:');
    for (const file of files) {
        console.log(file.name);

        // Check if there's a profile with the same imageFileName
        const profile = await Profile.findOne({ where: { imageFileName: file.name } });

        // If not, delete the file from the bucket
        if (!profile) {
            console.log(`Deleting file ${file.name}...`);
            await file.delete();
            console.log(`File ${file.name} deleted.`);
        }
    }
}

async function deleteAllFiles() {
    const [files] = await storage.bucket(bucketName).getFiles();

    console.log('Deleting all files...');
    for (const file of files) {
        console.log(`Deleting file ${file.name}...`);
        await file.delete();
        console.log(`File ${file.name} deleted.`);
    }
    console.log('All files deleted.');
}

//deleteAllFiles();

// deleteUnUsedFiles().catch(console.error);

//listFiles();



async function getFollowersUsingPagination(userId, offset = 0) {
    const followers = await Follow.findAll({ 
        where: { followingId: userId },
        limit: 7,
        offset: offset,
        include: [{
            model: User, as: 'followers',
            include: [{
                model: Profile, as: 'profile',
                attributes: ['imageFileName'],
            }]
        }]
    });

    const followersData = await Promise.all(followers.map(async follower => { 
        let imageUrl = null;
        if (follower.followers.profile.imageFileName) 
            imageUrl = await getSignedUrl(follower.followers.profile.imageFileName);

        return {
            id: follower.followers.id,
            username: follower.followers.username,
            imageUrl: imageUrl,
        }
    }));

    return followersData;
}

const getFollowingsUsingPagination = async (req, res) => {
    try {
        const { userId } = req.user;
        let { offset } = req.query;

        offset = offset || 0; // If offset is not provided, set it to 0

        const followings = await Follow.findAll({
            where: { followerId: userId },
            limit: 7,
            offset: offset,
            include: [{
                model: User, as: 'following',
                include: [{
                    model: Profile, as: 'profile',
                    attributes: ['imageFileName'],
                }]
            }]
        });

        const followingsData = await Promise.all(followings.map(async following => {
            let imageUrl = null;
            if (following.following.profile.imageFileName)
                imageUrl = await getSignedUrl(following.following.profile.imageFileName);

            return {
                id: following.following.id,
                username: following.following.username,
                imageUrl: imageUrl,
            }
        }));

        return res.status(200).json(followingsData);

    } catch (error) {
        return res.status(500).json({ error: error.message });
    }
}


async function getVideosUsingPagination(userId, offset = 0) {
    console.log("userId: ", userId);
    const videos = await Video.findAll({ 
        where: { creatorId: userId },
        limit: process.env.PROFILE_VIDEOS_LIMIT || 5,
        offset: offset,
        attributes: ['id']
    });

    console.log("videos", videos);
    const videoIds = videos.map(video => video.id);

    const videoData = await fetchVideoData(videoIds, userId);

    return videoData;
}


const getUserProfile = async (req, res) => {
    try {
        const { userId } = req.user;

        const user = await User.findOne({ 
            where: { id: userId },
            include: [
                { model: Profile, as: 'profile' },
                { 
                    model: UserStatus, 
                    as: 'userStatus',
                    attributes: ['isVerified']
                }
            ],
            attributes: ['id']
        });

        let imageUrl = null;
        if (user.profile.imageFileName) 
            imageUrl = await getSignedUrl(user.profile.imageFileName);

        const followingsCount = await Follow.count({ where: { followerId: userId } });
        const followersCount = await Follow.count({ where: { followingId: userId } });

        const videoData = await getVideosUsingPagination(userId);

        const totalLikes = videoData.reduce((sum, video) => sum + video.likes, 0);
        
        const userProfile = {
            bio: user.profile.bio,
            followersCount,
            followingsCount,
            videos: videoData,
            photoUrl: imageUrl,
            numberOfVideos: videoData.length,
            isverified: user.userStatus.isVerified,
            referrals: user.referrals || 0, 
            totalLikes
        };

        res.status(200).json(userProfile);
    } catch (error) {
        res.status(500).json({error: error.message});
    }
}



const getOtherUserProfile = async (req, res) => {
    try {
        const { otherUserId } = req.params;

        console.log("otherUserId: ", otherUserId);
        console.log("It enters here so yeah that's it");

        const user = await User.findOne({
            where: { id: otherUserId },
            include: [
                { model: Profile, as: 'profile' },
                { 
                    model: UserStatus, 
                    as: 'userStatus',
                    attributes: ['isVerified']
                }
            ],
            attributes: ['id']
        });

        let imageUrl = null;
        if (user.profile.imageFileName)
            imageUrl = await getSignedUrl(user.profile.imageFileName);

        const followingsCount = await Follow.count({ where: { followerId: otherUserId } });
        const followersCount = await Follow.count({ where: { followingId: otherUserId } });

        const videoData = await getVideosUsingPagination(otherUserId);
        
        const userProfile = {
            bio: user.profile.bio,
            followersCount,
            followingsCount,
            videos: videoData,
            photoUrl: imageUrl,
            numberOfVideos: videoData.length,
            isverified: user.userStatus.isVerified
        };

        res.status(200).json(userProfile);
    } catch (error) {
        res.status(500).json({error: error.message});
    }
}


const getUserProfileImage = async (req, res) => {
    try {

        const { userId  } = req.user;

        const userProfile = await Profile.findOne({ 
            where: { userId: userId },
            attributes: ['imageFileName']
        });
        if (!userProfile) {
            return res.status(404).json({ error: "Profile not found" });
        }

        if (!userProfile.imageFileName) { 
            return res.status(404).json({ error: "Profile Image not found" });
        }

        const imageUrl = await getSignedUrl(userProfile.imageFileName);

        return res.status(200).json({ userImageUrl: imageUrl });

    } catch (error) {
        return res.status(500).json({ error: error.message });
    }
}


const getOtherUserProfileImage = async (req, res) => {
    try {

        const { otherUserId  } = req.params;

        const otherUserProfile = await Profile.findOne({ 
            where: { userId: otherUserId },
            attributes: ['imageFileName']
        });
        if (!otherUserProfile) {
            return res.status(404).json({ error: "Profile not found" });
        }

        if (!otherUserProfile.imageFileName) { 
            return res.status(404).json({ error: "Profile Image not found" });
        }
        const otherUserImageUrl = await getSignedUrl(otherUserProfile.imageFileName);

        return res.status(200).json({ otherUserImageUrl: otherUserImageUrl });

    } catch (error) {
        return res.status(500).json({ error: error.message });
    }
}


//I think it's not much of a duplication
//even though I use it in the thumbnail
//but the thumbnail is using files and not buffers
//so I think it's okay

const validateImage = async (buffer) => {
    const MAX_IMAGE_SIZE = parseFloat(process.env.MAX_IMAGE_SIZE);

    if (buffer.length > MAX_IMAGE_SIZE) {
        throw new Error(`Image size should be less than ${MAX_IMAGE_SIZE} bytes`);
    }


    try {
        await Jimp.read(buffer);
    } catch (error) {
        console.log("error", error);
        throw new Error("Invalid image file");
    }
};

const pornThreshold = process.env.PORN_THRESHOLD || 0.8;
const sexyThreshold = process.env.SEXY_THRESHOLD || 0.85;
const hentaiThreshold = process.env.HENTAI_THRESHOLD || 0.9;


const classifyImage = async (buffer) => {
    const tf = require("@tensorflow/tfjs-node");

    const imageTensor = tf.node.decodeImage(buffer);
    const model = getModel();

    const predictions = await model.classify(imageTensor);

    const pornProbability = predictions.find(prediction => prediction.className === "Porn").probability;
    const sexyProbability = predictions.find(prediction => prediction.className === "Sexy").probability;
    const hentaiProbability = predictions.find(prediction => prediction.className === "Hentai").probability;

    if (pornProbability > pornThreshold || sexyProbability > sexyThreshold || hentaiProbability > hentaiThreshold) {
        throw new Error("Inappropriate content");
    }

};


const uploadImageToCloudStorage = async (buffer, userId, profile) => {
    const bucket = storage.bucket(bucketName);
    const fileName = `profileImages/${userId}/${Date.now()}.jpeg`;
    const file = bucket.file(fileName);

    const stream = file.createWriteStream({ 
        metadata: {
            contentType: `image/jpeg`
        }
    });

    return new Promise((resolve, reject) => {
        stream.on("error", (error) => { 
            reject(error);
        });

        stream.on("finish", async () => { 
            if (profile.imageFileName) { 
                const oldFile = bucket.file(profile.imageFileName);
                try {
                    await oldFile.delete();
                } catch (err) {
                    console.log("Failed to delete old image from cloud storage", err);
                    throw new Error("Failed to delete old image from cloud storage");
                }
            }
        
            profile.imageFileName = fileName;
            try {
                await profile.save();
                resolve(fileName);
            } catch (error) {
                file.delete().catch(err => {
                    console.log("Failed to delete image from cloud storage", err);
                });
                reject(new Error("Failed to update profile picture"));
            }
        });

        stream.end(buffer);
    });
};

const changeProfileImage = async (req, res) => { 
    try {
        const { userId } = req.user;

        if (!req.file) {
            return res.status(400).json({ error: "Please provide an image" });
        }

        if (!req.file.buffer || !(req.file.buffer instanceof Buffer)) {
            return res.status(400).json({ error: "Invalid file upload" });
        }

        const buffer = req.file.buffer;

        await validateImage(buffer);
        await classifyImage(buffer);

        const profile = await Profile.findOne({ 
            where: { userId },
            attributes: ['id', 'imageFileName'] 
        });
        if (!profile) {
            return res.status(404).json({ error: "Profile not found" });
        }

        const fileName = await uploadImageToCloudStorage(buffer, userId, profile);

        res.status(200).json({ 
            message1: "Profile picture changed successfully", 
            message2: "Image classified successfully",
        });
    } catch (error) {
        console.log("error", error);
        res.status(500).json({ error: error.message });
    }
};


const changeProfilePassword = async (req, res) => {
    try {
        const { userId } = req.user;
        const { oldPassword, newPassword } = req.body;

        if (oldPassword === newPassword)
            return res.status(400).json({ error: "they are the same password"});


        const user = await User.findOne({ 
            where: { id: userId }, 
            attributes: ['id', 'password']
        });
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

const changeProfileName = async (req, res) => { 
    try {
        const { userId } = req.user;
        let { newName } = req.body;
        
        newName = newName.toLowerCase();

        const user = await User.findOne({ 
            where: { id: userId },
            attributes: ['id', 'name']
        });
        if (!user) {
            return res.status(404).json({ error: "User not found" });
        }

        if (user.name === newName)
            return res.status(400).json({ error: "they are the same name"});

        user.name = newName;
        await user.save();

        res.status(200).json({ message: "Profile name changed successfully" });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
}   

const sendVerificationToNewEmail = async (req, res) => { 
    try {
        const { userId } = req.user;
        let { newEmail, password } = req.body;
        newEmail = newEmail.toLowerCase();

        if (!validator.isEmail(newEmail)) {
            return res.status(400).json({ error: 'Invalid email address' });
        }

        const userAuth = await UserAuth.findOne({ 
            where: { userId },
            attributes: ['id', 'authCode', 'authCodeExpiry']
        });
        if (!userAuth) {
            return res.status(404).json({ error: "User authentication not found" });
        }

        const user = await User.findOne({ 
            where: { id: userId },
            attributes: ['id', 'email', 'password'] 
        });
        if (!user) {
            return res.status(404).json({ error: "User not found" });
        }

        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) { 
            return res.status(400).json({ error: "Invalid password" });
        }

        const emailExists = await User.findOne({ 
            where: { email: newEmail },
            attributes: ['id']
        });
        if (emailExists) {
            return res.status(400).json({ error: "Email already exists" });
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

        userAuth.authCode = verificationCode;
        userAuth.authCodeExpiry = new Date(Date.now() + 600000);
        await userAuth.save();

        return res.status(200).json({ message: "Verification code sent successfully" });

    } catch (error) {
        res.status(500).json({ error: error.message });
    }
}

const verificationAndSetNewEmail = async (req, res) => { 
    try {
        const { userId } = req.user;
        const { verificationCode, newEmail } = req.body;
        let lowercasedEmail = newEmail.toLowerCase();

        const userAuth = await UserAuth.findOne({ where: { userId }, attributes: ['id', 'authCode', 'authCodeExpiry'] });
        const user = await User.findOne({ where: { id: userId }, attributes: ['id', 'email'] });

        if (!userAuth || !user) {
            return res.status(404).json({ error: "User or authentication not found" });
        }

        if (userAuth.authCode !== verificationCode || userAuth.authCodeExpiry < Date.now()) {
            return res.status(400).json({ error: "Invalid verification code or expired" });
        }

        user.email = lowercasedEmail;
        await user.save();

        userAuth.authCode = null;
        userAuth.authCodeExpiry = null;
        await userAuth.save();

        res.status(200).json({ message: "Email changed successfully" });

    } catch (error) {
        res.status(500).json({ error: error.message });
    }
}


const changeProfilePhone = async (req, res) => {
    try {
        const { userId } = req.user;
        const { newPhone } = req.body;

        const user = await User.findOne({
            where: { id: userId },
            attributes: ['id', 'phone']
        });

        const phoneExists = await User.findOne({ 
            where: { phone: newPhone },
            attributes: ['id'] 
        });
        if (phoneExists) { 
            return res.status(400).json({ error: "Phone already exists" });
        }

        await User.update({ phone: newPhone }, { where: { id: userId } });

        return res.status(200).json({ message: "Phone changed successfully" });

    } catch (error) {
        res.status(500).json({ error: error.message });
    }
}

const changeProfileUsername = async (req, res) => { 
    try {
        const { userId } = req.user;
        let { newUsername } = req.body;

        newUsername = newUsername.toLowerCase();

        const user = await User.findOne({ 
            where: { id: userId },
            attributes: ['id', 'username']
        });
        if (!user) {
            return res.status(404).json({ error: "User not found" });
        }

        newUsername = newUsername.toLowerCase();

        const usernameExists = await User.findOne({ 
            where: { username: newUsername },
            attributes: ['id']
        });
        if (usernameExists) {
            return res.status(400).json({ error: "Username already exists" });
        }

        await User.update({ username: newUsername }, { where: { id: userId } });

        return res.status(200).json({ message: "Username changed successfully" });

    } catch (error) {
        return res.status(500).json({ error: error.message });
    }
}

const changeProfileBio = async (req, res) => { 
    try {
        const { userId } = req.user;
        const { newBio } = req.body;

        const profile = await Profile.findOne({ 
            where: { userId }, 
            attributes: ['id', 'bio']
        });
        if (!profile) {
            return res.status(404).json({ error: "Profile not found" });
        }

        await Profile.update({ bio: newBio }, { where: { userId } });

        res.status(200).json({ message: "Profile bio changed successfully" });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
}


const saveVideo = async (req, res) => {
    try {
        const { userId } = req.user;
        const { videoId } = req.params;

        if (!videoId)
            return res.status(400).json({ error: "Please provide a videoId" });

        const video = await Video.findByPk(videoId, {
            attributes: ['id']
        });
        if (!video) {
            return res.status(404).json({ error: "Video not found" });
        }

        const savedVideo = await SavedVideo.findOne({ where: { userId, videoId } });
        if (savedVideo) {
            return res.status(400).json({ error: "Video already saved" });
        }

        await SavedVideo.create({ userId, videoId });
        res.status(200).json({ message: "Video saved successfully" });

    } catch (error) {
        return res.status(500).json({ error: error.message });
    }
}

const unsaveVideo = async (req, res) => {
    try {
        const { userId } = req.user;
        const { videoId } = req.params;

        if (!videoId)
            return res.status(400).json({ error: "Please provide a videoId" });

        const savedVideo = await SavedVideo.findOne({ where: { userId, videoId } });
        if (!savedVideo) {
            return res.status(404).json({ error: "Video not saved" });
        }

        await savedVideo.destroy();
        res.status(200).json({ message: "Video unsaved successfully" });

    } catch (error) {
        return res.status(500).json({ error: error.message });
    }
}


const getSavedVideosUsingPagination = async (req, res) => {
    try {
        const { userId } = req.user;
        const { offset = 0} = req.query;

        const savedVideos = await SavedVideo.findAll({
            where: { userId },
            include: [{
                model: Video,
                as: 'Video',
                attributes: ['id', 'thumbnailFileName'],
                include: [{
                    model: VideoMetadata,
                    as: 'metadata',
                    attributes: ['viewCount']
                }]
            }],
            limit: process.env.SAVED_VIDEOS_LIMIT || 5,
            offset: offset, 
            attributes: ['videoId']
        });

        const formattedVideos = await Promise.all(savedVideos.map(async savedVideo => {
            const signedUrl = await getSignedUrl(savedVideo.Video.thumbnailFileName);
            return {
                videoId: savedVideo.videoId,
                thumbnailUrl: signedUrl,
                views: savedVideo.Video.metadata.viewCount
            };
        }));

        res.status(200).json(formattedVideos);
    } catch (error) {
        return res.status(500).json({ error: error.message });
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
    getUserProfileImage,
    getOtherUserProfileImage,
    getVideosUsingPagination,
    getFollowersUsingPagination,
    getFollowingsUsingPagination,
    saveVideo,
    unsaveVideo,
    getSavedVideosUsingPagination,
}