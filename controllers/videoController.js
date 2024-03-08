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


//will be importing the tfjs inside the functions
//cause it causes a problem in the tests when being imported here
//const nsfwjs = require("nsfwjs");

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
const mapCommentsData = require("../helper/mapCommentsData");

const { getModel } = require("../helper/initializeAndGetModel");



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

const BITRATE_FACTORS = {
    '2500000': parseFloat(process.env.BITRATE_FACTOR_2500000 || '0.55'),
    '2000000': parseFloat(process.env.BITRATE_FACTOR_2000000 || '0.6'),
    '1500000': parseFloat(process.env.BITRATE_FACTOR_1500000 || '0.65'),
    '1000000': parseFloat(process.env.BITRATE_FACTOR_1000000 || '0.7'),
    '500000': parseFloat(process.env.BITRATE_FACTOR_500000 || '0.75'),
    'default': parseFloat(process.env.BITRATE_FACTOR_DEFAULT || '0.8'),
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

const pornThreshold = process.env.PORN_THRESHOLD || 0.8;
const sexyThreshold = process.env.SEXY_THRESHOLD || 0.85;
const hentaiThreshold = process.env.HENTAI_THRESHOLD || 0.9;


//if any pornability then crash
const checkVideoContent = async (videoPath ,res) => {

    const tf = require("@tensorflow/tfjs-node");

    try {
        console.log("checkVideoContent function called")
        const model = getModel();

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
                const hentaiProbability = predictions.find(prediction => prediction.className === "Hentai").probability;

                if (pornProbability > pornThreshold) {
                    console.log("pornProbability: ", pornProbability);
                    throw new Error("Inappropriate content found");
                } else if (sexyProbability <= sexyThreshold && hentaiProbability <= hentaiThreshold) {
                    console.log("No inappropriate content found");
                    successfulFrames++;
                }
            } catch (error) {
                console.log("Error decoding frame: ", error);
                throw error; // Stop processing further frames
            }
        }

        const successfulFramePercentage = (successfulFrames / framesStream.length) * 100;
        console.log("Percentage of successful frames: ", successfulFramePercentage);

        if (successfulFramePercentage < 90) {
            throw new Error("Less than 90% of frames were successfully processed");
        }

    } catch (error) {
        console.log("Error in checkVideoContent: ", error);
        throw Error(error);
    }
}

const validateThumbnail = async (imagePath) => {
    const tf = require("@tensorflow/tfjs-node");
    try {
        let buffer = await fs.promises.readFile(imagePath);
        if (!buffer)
            throw new Error("Failed to read image file");

        const MAX_IMAGE_SIZE = parseFloat(process.env.MAX_IMAGE_SIZE);

        if (buffer.length > MAX_IMAGE_SIZE) {
            throw new Error(`Image size should be less than ${MAX_IMAGE_SIZE} bytes`);
        }

        const imageTensor = tf.node.decodeImage(buffer);

        const model = getModel();

        const predictions = await model.classify(imageTensor);

        const pornProbability = predictions.find(prediction => prediction.className === "Porn").probability;
        const sexyProbability = predictions.find(prediction => prediction.className === "Sexy").probability;
        const hentaiProbability = predictions.find(prediction => prediction.className === "Hentai").probability;

        if (pornProbability > pornThreshold || sexyProbability > sexyThreshold || hentaiProbability > hentaiThreshold) {
            throw new Error("Inappropriate content");
        }
        return true;

    } catch (error) {
        console.log("error", error);
        throw new Error("Failed to read image file");
    }      
};

const validCategories = [
    "الكل", "الرياضة", "التكنولوجيا", "السياسة", "الاقتصاد", "الفن", "الثقافة",
    "العلوم", "الدين", "التاريخ", "الطب", "البيئة", "الترفيه", "السفر", "الطبخ",
    "التعليم", "الأدب", "الأفلام", "الأخبار", "الأعمال", "التسويق", "التصميم",
    "التطوير", "التحفيز", "التنمية البشرية"
];

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

        // Check if categories are valid
        for (const category of categories) {
            if (!validCategories.includes(category)) {
            throw new Error(`Invalid category: ${category}`);
            }
        }

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

        const MAX_VIDEO_SIZE = parseFloat(process.env.MAX_VIDEO_SIZE);
        if (videoFile.size > MAX_VIDEO_SIZE) {
            throw new Error(`File size too large. Please upload a video less than ${MAX_VIDEO_SIZE} bytes.`);
        }

        const user = await User.findOne({ 
            where: { id: userId },
            attributes: ['id']
        });
        if (!user) {
            throw new Error("User not found");
        }

        //also I need to use the fileType or something to verify it's a real video
        //or I might depend on ffmpeg cause I think it's considered as process the video
        //so if it was not a video it will through an error

        const isThumbnailValid = await validateThumbnail(imagePath);
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

        await compressVideo(req, videoPath, videoInfo);

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
                    attributes: ['username'], 
                    include: [
                        {
                            model: Profile,
                            as: 'profile',
                            attributes: ['imageFileName'],
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
                ['isUserVerified', 'DESC'],
                ['likeCount', 'DESC'],
                ['createdAt', 'DESC']
            ]
        });

        const commentsData = await mapCommentsData(comments, userId, videoCreatorId);

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

        const commentsData = await mapCommentsData(comments);

        return res.status(200).json({ comments: commentsData });

    } catch (error) {
        return res.status(500).json({ error: error.message });
    }
}

const updateVideoDescription = async (req, res) => {
    try {
        const { userId } = req.user;

        const videoId = req.params.videoId;

        if (!req.body.description) {
            return res.status(400).json({ message: "Description is required" });
        }

        const video = await Video.findOne({ 
            where: { id: videoId },
            attributes: ['id', 'creatorId', 'description'],
        });
        if (!video) {
            return res.status(404).json({ message: "Video not found" });
        }

        if (video.creatorId !== userId) {
            return res.status(403).json({ message: "You are not authorized to update this video" });
        }

        if (video.description === req.body.description)
            return res.status(200).json({ message: "Video description is already up to date" });

        await video.update({ description: req.body.description });
        
        return res.status(200).json({ message: "Video description updated successfully" });

    } catch (error) {
        return res.status(500).json({ error: error.message });
    }

}

const likeVideo = async (userId, videoId, transaction) => {
    const video = await Video.findByPk(videoId, { attributes: ['id', 'creatorId'] });
    if (!video)
        throw new Error('Video not found');

    await VideoLike.create({ userId, videoId }, { transaction });

    const videoMetadata = await VideoMetadata.findOne({ 
        where: { videoId },
        attributes: ['id'],
    });
    // Increment the likeCount atomically
    await videoMetadata.increment('likeCount', { transaction });

    await addNotification(video.creatorId, videoId, null, userId, 1, 'New Like', transaction);
};

const unlikeVideo = async (userId, videoId, transaction, like = null) => {
    const video = await Video.findByPk(videoId, { attributes: ['id'] });
    if (!video)
        throw new Error('Video not found');

    if (!like) {
        like = await VideoLike.findOne({ where: { userId, videoId } });
    }

    if (like) {
        await like.destroy({ transaction });

        const videoMetadata = await VideoMetadata.findOne({ 
            where: { videoId },
            attributes: ['id'],
        });
        // Decrement the likeCount atomically
        await videoMetadata.decrement('likeCount', { transaction });
    }
};

const likeAndUnlikeVideo = async (req, res) => {
    const { userId } = req.user;
    const { videoId } = req.body;

    if (!videoId) {
        return res.status(400).json({ message: "Video ID is required" });
    }

    const like = await VideoLike.findOne({ where: { userId, videoId } });

    const transaction = await sequelize.transaction();
    try {
        if (like) {
            await unlikeVideo(userId, videoId, transaction);
            await transaction.commit();
            return res.status(200).json({ message: "Video unliked successfully" });
        } else {
            await likeVideo(userId, videoId, transaction, like);
            await transaction.commit();
            return res.status(200).json({ message: "Video liked successfully" });
        }
    } catch (error) {
        await transaction.rollback();
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

        const videoMetadata = await VideoMetadata.findOne({ 
            where: { videoId },
            attributes: ['id'],
        });
        if (!videoMetadata)
            return res.status(404).json({ message: "Video metadata not found" });

        // Increment the shareCount atomically
        await videoMetadata.increment('shareCount');

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
                    attributes: ['likeCount', 'shareCount', 'popularityScore'],
                }
            ],
            order: [[{ model: VideoMetadata, as: 'metadata' }, 'popularityScore', 'DESC']]
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
                    attributes: ['likeCount', 'shareCount', 'popularityScore'],
                }
            ],
            order: [[{ model: VideoMetadata, as: 'metadata' }, 'popularityScore', 'DESC']]
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
    let transaction;
    try {
        const { userId } = req.user;
        const { videoId, viewStrength } = req.body;

        if (!viewStrength || viewStrength < 1 || viewStrength > 4)
            return res.status(400).json({ message: "Invalid view strength" });

        if (!videoId)
            return res.status(400).json({ message: "Video ID is required" });

        const video = await Video.findByPk(videoId, {
            attributes: ['id', 'creatorId']
        });
        if (!video)
            return res.status(404).json({ message: "Video not found" });

        transaction = await sequelize.transaction();

        const videoMetadata = await VideoMetadata.findOne({ 
            where: { videoId },
            attributes: ['id'],
            transaction,
        });
        if (!videoMetadata)
            return res.status(404).json({ message: "Video metadata not found" });

        await videoMetadata.increment('viewCount', { transaction });

        const existingView = await VideoView.findOne({ where: { userId, videoId }, transaction });

        if (existingView) {
            if (existingView.viewStrength < 4) {
                await existingView.increment('viewStrength', { by: 1, transaction });
            }
        } else {
            await VideoView.create({ userId, videoId, viewStrength }, { transaction });
        }

        await transaction.commit();
        return res.status(200).json({ message: "Video viewed successfully" });

    } catch (error) {
        if (transaction) await transaction.rollback();
        return res.status(500).json({ error: error.message });
    }
};


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
        include: [
            {
                model: VideoMetadata,
                as: 'metadata',
                attributes: ['likeCount', 'shareCount', 'popularityScore', 'averageRating', 'viewCount'],
            },
        ],
        order: [[{ model: VideoMetadata, as: 'metadata' }, 'popularityScore', 'DESC']],
      });
  
      const videosData = await Promise.all(videos.map(video => fetchVideoData(video.id, userId, video.metadata)));

      return res.status(200).json({ videos: videosData });        
       
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
        include:
        [
            {
                model: VideoMetadata,
                as: 'metadata',
                attributes: ['likeCount', 'shareCount', 'popularityScore'],
            },
        ],
        order: [[{ model: VideoMetadata, as: 'metadata' }, 'popularityScore', 'DESC']],
      });
  
      const videosData = await Promise.all(videos.map(video => fetchVideoData(video.id, userId, video.metadata)));

  
      return res.status(200).json({ videos: videosData });        
       
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

        // Delete the video record and all associated records
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
    updateVideoDescription,
    getCreatorComments,
    getCommentsUsingPagination,
    likeAndUnlikeVideo,
    shareVideo,
    searchVideosUsingPagination,
    autocompleteVideos,
    getFollowingsVideos,
    getFollowersVideos,
    viewVideo,
    deleteVideo,
}