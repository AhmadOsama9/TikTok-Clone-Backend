const User = require("../config/db").User;
const Video = require("../config/db").Video;
const Comment = require("../config/db").Comment;
const Profile = require("../config/db").Profile;
const Follow = require("../config/db").Follow;
const UserStatus = require("../config/db").UserStatus;
const VideoLike = require("../config/db").VideoLike;
const VideoMetadata = require("../config/db").VideoMetadata;
const VideoCategory = require("../config/db").VideoCategory;
const VideoView = require("../config/db").VideoView;
const Rate = require("../config/db").Rate;
const Report = require("../config/db").Report;
const { Op } = require("sequelize");
const Sequelize = require("sequelize");
const { addNotification } = require("./notificationsController");

const nsfwjs = require("nsfwjs");
const tf = require("@tensorflow/tfjs-node");
const Jimp = require("jimp");
const ffmpeg = require("fluent-ffmpeg");
const stream = require("stream");
const { Readable, PassThrough } = require('stream');
const fs = require("fs");
const path = require("path");

const { sequelize } = require("../config/db");
const getSignedUrl = require("../cloudFunctions/getSignedUrl");
const uploadToCloudStorage = require("../cloudFunctions/uploadFiles");
const deleteFromCloudStorage = require("../cloudFunctions/deleteFiles");
const fetchVideoData = require("../helper/fetchVideoData");

//I plan on finding the best algorithm
//for the detection of the inappropriate content
//like checking multiple repetative frames and if they 
//have the same or soo near ratio then mostly true
//also I need to the best way for the getting the frames
//Also I need to check the audio if there's anything free
//like NSFW audio or something like that




const getVideoInfo = (videoPath) => {
    return new Promise((resolve, reject) => {
      ffmpeg.ffprobe(videoPath, function(err, metadata) {
        if (err) {
          reject(err);
        } else {
          const { format, streams } = metadata;
          const videoStream = streams.find(stream => stream.codec_type === 'video');
          resolve({
            bitrate: format.bit_rate,
            fps: videoStream.avg_frame_rate,
            resolution: `${videoStream.width}x${videoStream.height}`
          });
        }
      });
    });
};

const compressVideo = (req, videoPath, { bitrate, fps, resolution }) => {
    return new Promise((resolve, reject) => {
        let targetBitrate = null;
        let targetFps = fps;
        let targetResolution = resolution;

        const tempPath = path.format({
            dir: path.dirname(videoPath),
            name: path.basename(videoPath, path.extname(videoPath)),
            ext: '.tmp' + path.extname(videoPath)
        });

        const BITRATE_FACTORS = {
            '2500000': parseFloat(process.env.BITRATE_FACTOR_2500000 || '0.55'),
            '2000000': parseFloat(process.env.BITRATE_FACTOR_2000000 || '0.6'),
            '1500000': parseFloat(process.env.BITRATE_FACTOR_1500000 || '0.65'),
            '1000000': parseFloat(process.env.BITRATE_FACTOR_1000000 || '0.7'),
            '500000': parseFloat(process.env.BITRATE_FACTOR_500000 || '0.75'),
            'default': parseFloat(process.env.BITRATE_FACTOR_DEFAULT || '0.8'),
        };

        if (bitrate > 2500000) { 
            targetBitrate = bitrate * BITRATE_FACTORS['2500000'];
        } else if (bitrate > 2000000) {
            targetBitrate = bitrate * BITRATE_FACTORS['2000000'];
        } else if (bitrate > 1500000) {
            targetBitrate = bitrate * BITRATE_FACTORS['1500000'];
        } else if (bitrate > 1000000) {
            targetBitrate = bitrate * BITRATE_FACTORS['1000000'];
        } else if (bitrate > 500000) {
            targetBitrate = bitrate * BITRATE_FACTORS['500000'];
        } else {
            targetBitrate = bitrate * BITRATE_FACTORS['default'];
        }
        
        targetBitrate = Math.round(targetBitrate / 1000) + 'k'; // Convert the bitrate to a string with 'k' at the end

        if (parseInt(fps) > 30) {
            targetFps = '30';
        }

        // If the original height is greater than 480, set the target resolution to 480p
        const originalHeight = parseInt(resolution.split('x')[1]);
        if (originalHeight > 480) {
            targetResolution = '852x480';
        }

        const command = ffmpeg(videoPath)
            .outputOptions('-b:v', targetBitrate)
            .outputOptions('-r', targetFps)
            .outputOptions('-s', targetResolution)
            .output(tempPath) // Write to the temporary file
            .on('error', error => {
                console.error('Error:', error);
                reject(error);
            })
            .on('end', async () => {
                console.log('FFmpeg process ended');
                await fs.promises.rename(tempPath, videoPath); // Replace the original file
                resolve('Successful');
            })
            .run();

        req.on('close', () => {
            console.log('Request cancelled, stopping FFmpeg process');
            command.kill(); // Stop the FFmpeg process
        });
    });
};

const extractFramesFromVideo = (videoPath) => {
    let fps =  process.env.FPS_TO_CHECK || 1;
    return new Promise((resolve, reject) => {
        let frames = [];
        let frameBuffer = Buffer.alloc(0);

        ffmpeg(videoPath)
            .outputOptions('-vf', `fps=${fps}`)
            .outputOptions('-f', 'image2pipe')
            .outputOptions('-vcodec', 'mjpeg')
            .on('error', error => {
                console.error('Error:', error);
                reject(error);
            })
            .on('end', () => {
                console.log('FFmpeg process ended');
                resolve(frames);
            })
            .pipe(new PassThrough().on('data', chunk => {
                frameBuffer = Buffer.concat([frameBuffer, chunk]);
                const frameEnd = frameBuffer.indexOf(Buffer.from([0xFF, 0xD9])); // Check for end of frame marker
                if (frameEnd !== -1) {
                    frames.push(frameBuffer.slice(0, frameEnd + 2)); // Include end marker
                    frameBuffer = frameBuffer.slice(frameEnd + 2); // Remove processed frame from buffer
                }
            }), { end: true });
    });
};

const checkVideoContent = async (videoPath ,res) => {
    try {
        console.log("checkVideoContent function called")
        const model = await nsfwjs.load();

        const pornThreshold = process.env.PORN_THRESHOLD || 0.8;
        const sexyThreshold = process.env.SEXY_THRESHOLD || 0.85;
        const hentaiThreshold = process.env.HENTAI_THRESHOLD || 0.9;

        console.log("Before extracting frames from video");
        const framesStream = await extractFramesFromVideo(videoPath);
        console.log("After extracting frames from video");

        console.log("Frames size is : ", framesStream.length);

        let successfulFrames = 0;
        for (const frame of framesStream) {
            try {
                const tensor = tf.node.decodeImage(frame);
                const predictions = await model.classify(tensor);

                const pornProbability = predictions.find(prediction => prediction.className === "Porn").probability;
                const sexyProbability = predictions.find(prediction => prediction.className === "Sexy").probability;
                const hentaiProbability = predictions.find(prediction => prediction.className === "Hentai").probability

                if (pornProbability > pornThreshold || sexyProbability > sexyThreshold || hentaiProbability > hentaiThreshold) {
                    console.log("pornProbability: ", pornProbability);
                    console.log("sexyProbability: ", sexyProbability);
                    console.log("hentaiProbability: ", hentaiProbability);
                    throw new Error("Inappropriate content");
                } else {
                    console.log("No inappropriate content found");
                    successfulFrames++;
                }
            } catch (error) {
                console.log("Error decoding frame: ", error);
            }
        }

        const successfulFramePercentage = (successfulFrames / framesStream.length) * 100;
        console.log("Percentage of successful frames: ", successfulFramePercentage);

        if (successfulFramePercentage < 50) {
            throw new Error("Less than 50% of frames were successfully processed");
        }

    } catch (error) {
        console.log("Error in checkVideoContent: ", error);
        throw Error(error);
    }
}

const validateAndCompressThumbnail = async (imagePath) => {
    const tempPath = `${imagePath}.tmp`;
    const quality = parseInt(process.env.JPEG_QUALITY || '70', 10);

    try {
        const image = await Jimp.read(imagePath);
        image.quality(quality);
        await image.writeAsync(tempPath);

        await fs.promises.rename(tempPath, imagePath);
    } catch (error) {
        throw new Error(error);
    }

    try {
        const buffer = await fs.promises.readFile(imagePath);
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
        return true;
    } catch (error) {
        throw new Error(error);
    }
};


const uploadVideo = async (req, res) => {
    let responseSent = false;
    try {
        let categories = req.body.categories;
        let description = req.body.description;

        if (!description || !categories)
            return res.status(400).json({ message: "Description and categories are required" });

        if (typeof categories === 'string')
            categories = [categories];
        
        if (!Array.isArray(categories))
            return res.status(400).json({ message: "Categories should be an array" });

        description = description.toLowerCase();

        console.log("UploadVideo function called");
        const { userId } = req.user;

        const videoFile = req.files.video[0];
        const imageFile = req.files.image[0];

        if (!videoFile || !imageFile) {
            throw new Error("Please upload a video and a thumbnail");
        }

        const videoPath = videoFile.path;
        const imagePath = imageFile.path;

        if (!videoPath || !imagePath ) {
            throw new Error("Failed to read video or image");
        }

        const maxSize = process.env.MAX_VIDEO_SIZE || 60 * 1024 * 1024;
        if (videoFile.size > maxSize) {
            throw new Error("File size too large. Please upload a video less than 60MB.");
        }

        const validMimeTypes = ["video/mp4"];
        if (!validMimeTypes.includes(videoFile.mimetype)) {
            throw new Error("Invalid file type. Please upload a video file.");
        }

        const user = await User.findOne({ where: { id: userId } });
        if (!user) {
            throw new Error("User not found");
        }

        //also I need to use the fileType or something to verify it's a real video
        //or I might depend on ffmpeg cause I think it's considered as process the video
        //so if it was not a video it will through an error

        const isThumbnailValid = await validateAndCompressThumbnail(imagePath);
        if (!isThumbnailValid) {
            throw new Error("Invalid thumbnail");
        }

        const videoInfo = await getVideoInfo(videoPath);
        console.log('Video Info:', videoInfo);

        console.log("Before checking video content");

        // Assuming checkVideoContent is updated to work with videoPath
        await checkVideoContent(videoPath, res);    
        
        console.log("After checking video content");
        console.log("Before compressing video, videoSize: ", videoFile.size, " videoInfo: ", videoInfo);

        const compressionResult = await compressVideo(req, videoPath, videoInfo);

        console.log("Compression Result: ", compressionResult);
        const newVideoInfo = await getVideoInfo(videoPath);
        const stats = await fs.promises.stat(videoPath);
        const newSize = stats.size;
    
        console.log("After compressing video, newSize: ", newSize, " newVideoInfo: ", newVideoInfo);
    
        const fileName = await uploadToCloudStorage(videoPath, `videos/${userId}/${Date.now()}.mp4`);

        const thumbnailFileName = await uploadToCloudStorage(imagePath, `thumbnails/${userId}/${Date.now()}.jpg`);
        let video = null;
        try {
            await sequelize.transaction(async (transaction) => {
                video = await Video.create({
                creatorId: userId,
                fileName: fileName,
                thumbnailFileName: thumbnailFileName,
                description: description,
                }, { transaction });
        
                const videoCategories = categories.map(name => ({ name, videoId: video.id }));
                await VideoCategory.bulkCreate(videoCategories, { transaction });
        
                await VideoMetadata.create({ videoId: video.id }, { transaction });
            });
        } catch (error) {
            await deleteFromCloudStorage(fileName);
            await deleteFromCloudStorage(thumbnailFileName);
            throw new Error(error);
        }

        return res.status(200).json({message: "Video uploaded successfully", videoId: video.id});
    } catch (error) {
        if (!responseSent) {
            responseSent = true;
            console.log("Error in upload video: ", error);
            console.log("Error.message: ", error.message);
            return res.status(500).json({error : error.message});
        }  
    } finally {
        try {
            if (req.files) {
                if (req.files.video && req.files.video[0]) {
                    await fs.promises.unlink(req.files.video[0].path);
                }
                if (req.files.image && req.files.image[0]) {
                    await fs.promises.unlink(req.files.image[0].path);
                }
            }
        } catch (error) {
            console.log("Error in finally block couldn't delete the video and thumbnail: ", error);
        }
    }
}

const getVideoThumbnail = async (req, res) => {
    try {
        const { userId } = req.user;

        const videoId = req.params.videoId;
        const video = await Video.findOne({ where: { id: videoId } });
        if (!video) {
            return res.status(404).json({ message: "Video not found" });
        }

        if (!video.thumbnailFileName) {
            return res.status(404).json({ message: "Thumbnail not found cause filename is missing" });
        }

        const url = await getSignedUrl(video.thumbnailFileName);

        return res.status(200).json({ thumbnailUrl: url });

    } catch (error) {
        return res.status(500).json({ error: error.message });
    }
}

async function getReplies(commentId) {
    const replies = await Comment.findAll({
        where: { parentId: commentId },
        include: [
            {
            model: User,
            as: 'user',
            attributes: ['username'], 
            include: [{
                model: Profile,
                as: 'profile',
                attributes: ['imageFileName'], 
            }]
        },
            { model: Comment, as: 'replies' } 
        ],
        order: [['createdAt', 'DESC']] 
    });

    return await Promise.all(replies.map(async reply => {
        let imageUrl = null;
        if (reply.user.profile.imageFileName)
            imageUrl = await getSignedUrl(reply.user.profile.imageFileName);

        return {
            id: reply.id,
            videoId: reply.videoId,
            userId: reply.userId,
            content: reply.content,
            gift: reply.gift,
            repliesCount: reply.replies.length,
            replies: await getReplies(reply.id), // Recursive call
            createdAt: reply.createdAt,
            imageUrl: imageUrl,
            username: reply.user.username
        };
    }));
}

const getCommentsUsingPagination = async (req, res) =>{ 
    try {
        const { userId } = req.user;
        const { videoId } = req.params;
        const { offset = 0} = req.query;

        if (!videoId )
            return res.status(400).json({ message: "Video ID is required" });

        const video = await Video.findByPk(videoId);
        if (!video) 
            return res.status(404).json({ message: "Video not found" });

        const videoCreatorId = video.creatorId;

        const comments = await Comment.findAll({ 
            where: { 
                videoId: videoId, 
                parentId: null,
                userId: {
                    [Op.ne]: videoCreatorId
                }
            },
            limit: process.env.COMMENTS_LIMIT || 5,
            offset: offset,
            include: [
                {
                    model: User,
                    as: 'user',
                    attributes: ['username'], // Only fetch username from User
                    include: [
                        {
                            model: Profile,
                            as: 'profile',
                            attributes: ['imageFileName'], // Only fetch imageFileName from Profile
                        },
                        {
                            model: UserStatus,
                            as: 'userStatus',
                            attributes: ['isVerified'], // Only fetch isVerified from UserStatus
                        }
                    ]
                },
                { 
                    model: Comment, 
                    as: 'replies'
                }
            ],
            order: [
                [sequelize.literal('"Comment"."giftType" IS NOT NULL'), 'DESC'],
                ['giftType', 'DESC'],
                [sequelize.literal('"user->userStatus"."isVerified" DESC')], // Order by isVerified field
                ['createdAt', 'DESC']
            ]
        });
        const commentsData = await Promise.all(comments.map(async comment => {
            let imageUrl = null;
            if (comment.user.profile.imageFileName)
                imageUrl = await getSignedUrl(comment.user.profile.imageFileName);

            return {
                id: comment.id,
                videoId: comment.videoId,
                userId: comment.userId,
                content: comment.content,
                giftType: comment.giftType,
                repliesCount: comment.replies.length,
                replies: await getReplies(comment.id),
                createdAt: comment.createdAt,
                imageUrl: imageUrl,
                username: comment.user.username
            };
        }));

        return res.status(200).json({ comments: commentsData });
    } catch (error) {
        return res.status(500).json({ error: error.message });
    }
}

const getCreatorComments = async (req, res) => {
    try {
        const { userId } = req.user;
        const { videoId } = req.params;

        if (!videoId)
            return res.status(400).json({ message: "Video ID is required" });

        const video = await Video.findByPk(videoId);
        if (!video)
            return res.status(404).json({ message: "Video not found" });

        const videoCreatorId = video.creatorId;

        const comments = await Comment.findAll({
            where: {
                videoId: videoId,
                parentId: null,
                userId: videoCreatorId
            },
            include: [
                {
                    model: User,
                    as: 'user',
                    attributes: ['username'],
                    include: [{
                        model: Profile,
                        as: 'profile',
                        attributes: ['imageFileName'],
                    }]
                },
                { model: Comment, as: 'replies' }
            ],
            order: [['createdAt', 'DESC']]
        });

        const commentsData = await Promise.all(comments.map(async comment => {
            let imageUrl = null;
            console.log("user: ", comment.user);
            console.log("user.profile", comment.user.profile);
            if (comment.user && comment.user.profile && comment.user.profile.imageFileName)
                imageUrl = await getSignedUrl(comment.user.profile.imageFileName);

            return {
                id: comment.id,
                videoId: comment.videoId,
                userId: comment.userId,
                content: comment.content,
                giftType: comment.giftType,
                repliesCount: comment.replies.length,
                replies: await getReplies(comment.id),
                createdAt: comment.createdAt,
                imageUrl: imageUrl,
                username: comment.user.username
            };
        }));

        return res.status(200).json({ comments: commentsData });

    } catch (error) {
        return res.status(500).json({ error: error.message });
    }
}


const updateVideoDescription = async (req, res) => {
    try {
        const { userId } = req.user;

        const videoId = req.params.id;

        if (!req.body.description) {
            return res.status(400).json({ message: "Description is required" });
        }

        const video = await Video.findOne({ where: { id: videoId } });
        if (!video) {
            return res.status(404).json({ message: "Video not found" });
        }

        if (video.creatorId !== userId) {
            return res.status(403).json({ message: "You are not authorized to update this video" });
        }

        await video.update({ description: req.body.description });
        
        return res.status(200).json({ message: "Video description updated successfully" });

    } catch (error) {
        return res.status(500).json({ error: error.message });
    }

}

const likeVideo = async (userId, videoId, transaction) => {
    const video = await Video.findByPk(videoId);
    if (!video)
        throw new Error('Video not found');

    await VideoLike.create({ userId, videoId }, { transaction });

    const videoMetadata = await VideoMetadata.findOne({ where: { videoId } });
    videoMetadata.likeCount += 1;
    await videoMetadata.save({ transaction });

    await addNotification(video.creatorId, videoId, null, userId, 1, 'New Like', transaction);
};

const unlikeVideo = async (userId, videoId, transaction) => {
    const video = await Video.findByPk(videoId);
    if (!video)
        throw new Error('Video not found');

    const like = await VideoLike.findOne({ where: { userId, videoId } });
    if (like) {
        await like.destroy({ transaction });

        const videoMetadata = await VideoMetadata.findOne({ where: { videoId } });
        videoMetadata.likeCount -= 1;
        await videoMetadata.save({ transaction });
    }
};

const likeAndUnlikeVideo = async (req, res) => {
    const { userId } = req.user;
    const { videoId } = req.body;

    if (!videoId) {
        return res.status(400).json({ message: "Video ID is required" });
    }

    const like = await VideoLike.findOne({ where: { userId, videoId } });

    try {
        if (like) {
            await unlikeVideo(userId, videoId);
            return res.status(200).json({ message: "Video unliked successfully" });
        } else {
            await likeVideo(userId, videoId);
            return res.status(200).json({ message: "Video liked successfully" });
        }
    } catch (error) {
        return res.status(500).json({ error: error.message });
    }
};

const shareVideo = async (req, res) => {
    try {
        const { userId } = req.user;
        const { videoId } = req.body;

        if (!videoId) {
            return res.status(400).json({ message: "Video ID is required" });
        }
        const video = await Video.findOne({ where: { id: videoId } });
        if (!video)
            return res.status(404).json({ message: "Video not found" });

        const videoMetadata = await VideoMetadata.findOne({ where: { videoId } });
        videoMetadata.shareCount += 1;
        await videoMetadata.save();

        return res.status(200).json({ message: "Video shared successfully" });

    } catch (error) {
        return res.status(500).json({ error: error.message });
    }
};

const searchVideosUsingPagination = async (req, res) => {
    try {
        let { description } = req.query;
        const { offset = 0 } = req.query;

        description = description.toLowerCase();
        
        if (!description)
            return res.status(400).json({ error: 'description is required' });

        const videos = await Video.findAll({
            where: {
                description: {
                    [Op.like]: '%' + description + '%'
                }
            },
            attributes: ['id', 'description', 'createdAt'],
            limit: process.env.SEARCH_VIDEO_LIMIT || 5,
            offset: offset,
            include: [
                {
                    model: User,
                    as: 'creator',
                    attributes: ['username'],
                    include: [
                        {
                            model: Profile,
                            as: 'profile',
                            attributes: ['imageFileName'],
                        }
                    ],
                },
                {
                    model: VideoMetadata,
                    as: 'metadata',
                    attributes: ['likes', 'shareCount'],
                }
            ],
            order: [['popularityScore', 'DESC']]
        });

        for (let video of videos) {
            if (video.creator && video.creator.profile && video.creator.profile.imageFileName) {
                const imageURL = await getSignedUrl(video.creator.profile.imageFileName);
                const creator = {
                    username: video.creator.username,
                    imageURL: imageURL
                };
                video.setDataValue('creator', creator);
            }
        }

        return res.status(200).json({ videos });

    } catch (error) {
        return res.status(500).json({ error: error.message });
    }
};

const autocompleteVideos = async (req, res) => {
    try {
        let { description } = req.query;
        description = description.toLowerCase();
        
        if (!description)
            return res.status(400).json({ error: 'description is required' });

        const videos = await Video.findAll({
            where: {
                description: {
                    [Op.like]: description + '%'
                }
            },
            attributes: ['id', 'description', 'createdAt'],
            limit: process.env.AUTO_COMPLETE_LIMIT || 5,
            include: [
                {
                    model: User,
                    as: 'creator',
                    attributes: ['username'],
                    include: [
                        {
                            model: Profile,
                            as: 'profile',
                            attributes: ['imageFileName'],
                        }
                    ],
                },
                {
                    model: VideoMetadata,
                    as: 'metadata',
                    attributes: ['likes', 'shareCount'],
                }
            ],
            order: [['popularityScore', 'DESC']]
        });

        for (let video of videos) {
            if (video.creator && video.creator.profile && video.creator.profile.imageFileName) {
                const imageURL = await getSignedUrl(video.creator.profile.imageFileName);
                const creator = {
                    username: video.creator.username,
                    imageURL: imageURL
                };
                video.setDataValue('creator', creator);
            }
        }

        return res.status(200).json({ videos });

    } catch (error) {
        return res.status(500).json({ error: error.message });
    }
};
const viewVideo = async (req, res) => {
    try {
        const { userId } = req.user;
        const { videoId } = req.params;
        const { viewStrength } = req.body;

        if (!viewStrength)
            return res.status(400).json({ message: "View strength is required" });

        if (viewStrength < 1 || viewStrength > 3)
            return res.status(400).json({ message: "Invalid view strength" });

        if (!videoId)
            return res.status(400).json({ message: "Video ID is required" });

        const video = await Video.findByPk(videoId);
        if (!video)
            return res.status(404).json({ message: "Video not found" });

        const videoMetadata = await VideoMetadata.findOne({ where: { videoId } });
        if (!videoMetadata)
            return res.status(404).json({ message: "Video metadata not found" });

        const transaction = await sequelize.transaction();

        videoMetadata.viewCount += 1;
        await videoMetadata.save({ transaction });

        await VideoView.create({ userId, videoId, viewStrength }, { transaction });

        await transaction.commit();
        return res.status(200).json({ message: "Video viewed successfully" });

    } catch (error) {
        if (transaction) await transaction.rollback();
        return res.status(500).json({ error: error.message });
    }
}


const getVideo = async (req, res) => {
    try {
      const { userId } = req.user;
      const videoId = req.params.videoId;
      const videoData = await fetchVideoData(videoId, userId);
      if (!videoData) {
        return res.status(404).json({ message: 'Video not found' });
      }
      res.json({ videos: [videoData] });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
};

const getFollowingsVideos = async (req, res) => {
    try {
      const { userId } = req.user;
      const { offset = 0 } = req.query;
  
      const followings = await Follow.findAll({
        where: { followerId: userId },
        attributes: ['followingId']
      });
  
      const followingIds = followings.map(follow => follow.followingId);
  
      const videos = await Video.findAll({
        where: { creatorId: followingIds },
        limit: process.env.FOLLOWINGS_VIDEOS_LIMIT || 6,
        offset,
        order: [['createdAt', 'DESC']], // Order by creation date, newest first
      });
  
      const videoResponses = await Promise.all(videos.map(video => fetchVideoData(video.id, userId)));
  
      return res.status(200).json({ videos: videoResponses });        
       
    } catch (error) {
      return res.status(500).json({ error: error.message});
    }
  }
  
  const getFollowersVideos = async (req, res) => {
    try {
      const { userId } = req.user;
      const { offset = 0 } = req.query;
  
      const followers = await Follow.findAll({
        where: { followingId: userId },
        attributes: ['followerId']
      });
  
      const followersIds = followers.map(follow => follow.followerId);
  
      const videos = await Video.findAll({
        where: { creatorId: followersIds },
        limit: process.env.FOLLOWERS_VIDEOS_LIMIT || 6,
        offset,
        order: [['createdAt', 'DESC']], // Order by creation date, newest first
      });
  
      const videoResponses = await Promise.all(videos.map(video => fetchVideoData(video.id, userId)));
  
      return res.status(200).json({ videos: videoResponses });        
       
    } catch (error) {
      return res.status(500).json({ error: error.message});
    }
}

const deleteVideo = async (req, res) => {
    // Start a transaction
    const t = await sequelize.transaction();

    try {
        const { userId } = req.user;
        const videoId = req.params.videoId;
        // Find the video
        const video = await Video.findByPk(videoId, { transaction: t });

        if (!video) {
            throw new Error('Video not found');
        }
        const userStatus = await UserStatus.findOne({ where: { userId } });

        if (video.creatorId !== userId && (!userStatus || !userStatus.isAdmin))
            throw new Error('You are not authorized to delete this video');


        // Delete associated records
        await VideoCategory.destroy({ where: { videoId }, transaction: t });
        await VideoLike.destroy({ where: { videoId }, transaction: t });
        await VideoMetadata.destroy({ where: { videoId }, transaction: t });
        await VideoView.destroy({ where: { videoId }, transaction: t });
        await Rate.destroy({ where: { videoId }, transaction: t }); // delete associated ratings
        await Report.destroy({ where: { referenceId: videoId, referenceType: 1 }, transaction: t }); // delete associated reports

        // Delete the comments and their child comments
        const comments = await Comment.findAll({ where: { videoId }, transaction: t });
        for (let comment of comments) {
            await Comment.destroy({ where: { parentId: comment.id }, transaction: t });
        }
        await Comment.destroy({ where: { videoId }, transaction: t });

        // Delete the video record
        await Video.destroy({ where: { id: videoId }, transaction: t });

        // Delete the video file from cloud storage
        await deleteFromCloudStorage(video.fileName);
        await deleteFromCloudStorage(video.thumbnailFileName);

        // Commit the transaction
        await t.commit();

        return res.status(200).json({ message: 'Video deleted successfully' });
    } catch (error) {
        // If there's an error, rollback the transaction
        await t.rollback();
        return res.status(500).json({ message: error.message });
    }
}


module.exports = {
    uploadVideo,
    getVideoThumbnail,
    getVideo,
    getCommentsUsingPagination,
    updateVideoDescription,
    getCommentsUsingPagination,
    getCreatorComments,
    likeAndUnlikeVideo,
    shareVideo,
    searchVideosUsingPagination,
    autocompleteVideos,
    getFollowingsVideos,
    getFollowersVideos,
    viewVideo,
    deleteVideo,
}