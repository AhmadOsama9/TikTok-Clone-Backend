const User = require("../config/db").User;
const Profile = require("../config/db").Profile;
const Follow = require("../config/db").Follow;
const Video = require("../config/db").Video;
const Comment = require("../config/db").Comment;
const nodemailer = require("nodemailer");
const randomstring = require('randomstring');
const bcrypt = require("bcrypt");
const sharp = require("sharp");
const { Op } = require('sequelize');

const nsfwjs = require("nsfwjs");
const tf = require("@tensorflow/tfjs-node");
const mmmagic = require("mmmagic");
const Magic = mmmagic.Magic;

const storage = require("../config/cloudStorage");
const { isNullOrUndefined } = require("util");
const { get } = require("http");

const bucketName = process.env.IMAGE_BUCKET_NAME || "kn_story_app";

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

async function getSignedUrl(fileName) {
    const options = {
        version: 'v4',
        action: 'read',
        expires: Date.now() + 15 * 60 * 1000,
    };

    const [url] = await storage.bucket(bucketName).file(fileName).getSignedUrl(options);

    return url;
}


async function getFollowersUsingPagination(userId, offset = 0) {
    const followers = await Follow.findAll({ 
        where: { followingId: userId },
        limit: 5,
        offset: offset,
        include: [{
            model: User, as: 'followers',
            include: [{
                model: Profile, as: 'profile'
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


async function getVideosUsingPagination(userId, offset = 0) {
    console.log("userId: ", userId);
    const videos = await Video.findAll({ 
        where: { creatorId: userId },
        limit: 5,
        offset: offset,
    });

    console.log("videos", videos);
    const videoIds = videos.map(video => video.id);

    // Fetch all comments for the fetched videos in a single query
    const comments = await Comment.findAll({ where: { videoId: { [Op.in]: videoIds } } });

    // Group comments by videoId
    const commentsByVideoId = comments.reduce((groupedComments, comment) => {
        (groupedComments[comment.videoId] = groupedComments[comment.videoId] || []).push(comment);
        return groupedComments;
    }, {});

    const videoData = await Promise.all(videos.map(async video => {
    const commentsCount = await Comment.count({ where: { videoId: video.id } });

    if (!video.thumbnailFileName)
        console.log("Video thumbnail file not found");

    if (!video.fileName)
        console.log("Video file not found")

    let thumbnailUrl = null, videoUrl = null;
    if (video.thumbnailFileName) 
        thumbnailUrl = await getSignedUrl(video.thumbnailFileName);
    if (video.fileName)
        videoUrl = await getSignedUrl(video.fileName);

    return {
        id: video.id,
        videoUrl: videoUrl,
        thumbnailUrl: thumbnailUrl,
        likes: video.likes,
        commentsCount,
        sharesCount: video.shareCount,
        views: video.viewsCount,
        rating: video.rating 
    };
}));

    return videoData;
}

const getUserProfile = async (req, res) => {
    try {
        const { userId } = req.user;

        const user = await User.findOne({ 
            where: { id: userId },
            include: [
                { model: Profile, as: 'profile' },
            ]
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
            isverified: user.isVerified,
            referrals: user.referralCount || 0, 
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

        const user = await User.findOne({
            where: { id: otherUserId },
            include: [
                { model: Profile, as: 'profile' },
            ]
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
            isverified: user.isVerified
        };

        res.status(200).json(userProfile);
    } catch (error) {
        res.status(500).json({error: error.message});
    }
}



const getUserProfileImage = async (req, res) => {
    try {

        const { userId  } = req.user;

        const userProfile = await Profile.findOne({ where: { userId: userId } });
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

        const otherUserProfile = await Profile.findOne({ where: { userId: otherUserId } });
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

const validateAndCompressImage = async (buffer) => {
    if (buffer.length > 0.2 * 1024 * 1024) {
        throw new Error("Image size should be less than 200KB");
    }

    const fileType = await fileTypeFromBuffer(buffer);

    if (!fileType || (fileType.ext !== "png" && fileType.ext !== "jpg" && fileType.ext !== "jpeg")) {
        throw new Error("Invalid image format");
    }

    let compressedBuffer;
    try {
        compressedBuffer = await sharp(buffer)
            .jpeg({ quality: parseInt(process.env.JPEG_QUALITY || '70', 10) })
            .toBuffer();
    } catch (error) {
        throw new Error("Invalid image file");
    }

    return { fileType, compressedBuffer };
};

const classifyImage = async (buffer) => {
    const imageTensor = tf.node.decodeImage(buffer);
    const model = await nsfwjs.load();
    const predictions = await model.classify(imageTensor);

    const pornThreshold = process.env.PORN_THRESHOLD || 0.8;
    const sexyThreshold = process.env.SEXY_THRESHOLD || 0.85;
    const hentaiThreshold = process.env.HENTAI_THRESHOLD || 0.9;

    const pornProbability = predictions.find(prediction => prediction.className === "Porn").probability;
    const sexyProbability = predictions.find(prediction => prediction.className === "Sexy").probability;
    const hentaiProbability = predictions.find(prediction => prediction.className === "Hentai").probability;

    if (pornProbability > pornThreshold || sexyProbability > sexyThreshold || hentaiProbability > hentaiThreshold) {
        throw new Error("Inappropriate content");
    }

};

const uploadImageToCloudStorage = async (buffer, fileType, userId, profile) => {
    const bucket = storage.bucket(bucketName);
    const fileName = `profileImages/${userId}/${Date.now()}.${fileType.ext}`;
    const file = bucket.file(fileName);

    const stream = file.createWriteStream({ 
        metadata: {
            contentType: `image/${fileType.ext}`
        }
    });

    return new Promise((resolve, reject) => {
        stream.on("error", (error) => { 
            reject(error);
        });

        stream.on("finish", async () => { 
            if (profile.imageFileName) { 
                const oldFile = bucket.file(profile.imageFileName);
                oldFile.delete().catch(err => {
                    console.log("Failed to delete old image from cloud storage", err);
                });
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

        const { fileType, compressedBuffer } = await validateAndCompressImage(buffer);
        await classifyImage(compressedBuffer);

        const profile = await Profile.findOne({ where: { userId } });
        if (!profile) {
            return res.status(404).json({ error: "Profile not found" });
        }

        const fileName = await uploadImageToCloudStorage(compressedBuffer, fileType, userId, profile);

        res.status(200).json({ 
            message1: "Profile picture changed successfully", 
            message2: "Image classified successfully",
            fileName
        });
    } catch (error) {
        console.log("error", error);
        res.status(500).json({ error: error.message });
    }
};

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
        let { newEmail, password } = req.body;
        newEmail = newEmail.toLowerCase();

        const user = await User.findOne({ where: { id: userId } });
        if (!user) {
            return res.status(404).json({ error: "User not found" });
        }

        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) { 
            return res.status(400).json({ error: "Invalid password" });
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
        return res.status(500).json({ error: error.message });
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
    getUserProfileImage,
    getOtherUserProfileImage,
    getVideosUsingPagination,
    getFollowersUsingPagination
}