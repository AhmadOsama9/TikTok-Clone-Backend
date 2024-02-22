const User = require("../config/db").User;
const Video = require("../config/db").Video;
const Comment = require("../config/db").Comment;

const nsfwjs = require("nsfwjs");
const tf = require("@tensorflow/tfjs-node");
const Jimp = require("jimp");
const ffmpeg = require("fluent-ffmpeg");
const stream = require("stream");
const { Readable, PassThrough } = require('stream');
const fs = require("fs");
const path = require("path");

const storage = require("../config/cloudStorage");

const bucketName = process.env.VIDEO_BUCKET_NAME || "kn_story_app";

//I plan on finding the best algorithm
//for the detection of the inappropriate content
//like checking multiple repetative frames and if they 
//have the same or soo near ratio then mostly true
//also I need to the best way for the getting the frames
//Also I need to check the audio if there's anything free
//like NSFW audio or something like that

const deleteAllVideos = async (req, res) => {
    try {
        await Video.destroy({ where: {} });
        console.log("All videos deleted");
    } catch (error) {
        console.log("Error in deleteAllVideos: ", error);
    }
}

const getAllVideos = async (req, res) => {
    try {
        const videos = await Video.findAll();
        console.log("All videos: ", videos);
    } catch (error) {
        console.log("Error in getAllVideos: ", error);
    }
}

//getAllVideos();

//deleteAllVideos();

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

        const maxSize = 60 * 1024 * 1024; // 60MB
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

        const video = await Video.create({
            creatorId: userId,
            fileName: fileName,
            thumbnailFileName: thumbnailFileName,
            videoSize: newSize, //Before compression
            videoName: videoFile.originalname,
            description: req.body.description,
            category: req.body.category,
        });


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

async function uploadToCloudStorage(filePath, fileName) {
    const bucket = storage.bucket(bucketName);
    const file = bucket.file(fileName);

    await bucket.upload(filePath, {
        destination: fileName,
        metadata: {
            catcheControl: 'public, max-age=31536000',
        }
    })

    return fileName;
}

async function getSignedUrl(fileName) {
    const options = {
        version: 'v4',
        action: 'read',
        expires: Date.now() + 15 * 60 * 1000,
    };

    const [url] = await storage.bucket(bucketName).file(fileName).getSignedUrl(options);

    return url;
}


const getVideoThumbnail = async (req, res) => {
    try {
        const { userId } = req.user;

        //Think that I will remove the unnecessary checking
        //for the user, cause he passed the jwt token
        //so the checking is just making sure that
        //the user is not deleted or something like that
        //but maybe to check if the user is banned or not
        //I will add this checking later
        //But since that will be for all of them
        //I think I will just make a middleware for that

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

const getVideo = async (req, res) => { 
    try {
        const { userId } = req.user;

        const videoId = req.params.videoId;
        const video = await Video.findOne({ where: { id: videoId } });
        if (!video) {
            return res.status(404).json({ message: "Video not found" });
        }

        if (!video.fileName) {
            return res.status(404).json({ message: "Video not found cause fileName is missing" });
        }

        const url = await getSignedUrl(video.fileName);

        return res.status(200).json({ videoUrl: url });

    } catch (error) {
        return res.status(500).json({ error: error.message });
    }
}

async function getReplies(comment) {
    const replies = await Comment.findAll({
        where: { parentId: comment.id },
        include: [
            { model: User }, // Removed 'as: comments'
            { model: Comment, as: 'replies' } // Include replies
        ],
        order: [['createdAt', 'DESC']] // Order by 'createdAt' in descending order
    });

    return await Promise.all(replies.map(async reply => {
        let imageUrl = null;
        if (reply.User.profile.imageFileName) // Changed 'user' to 'User'
            imageUrl = await getSignedUrl(reply.User.profile.imageFileName); // Changed 'user' to 'User'

        return {
            id: reply.id,
            videoId: reply.videoId,
            userId: reply.userId,
            content: reply.content,
            gift: reply.gift,
            repliesCount: reply.replies.length,
            replies: await getReplies(reply), // Recursive call
            createdAt: reply.createdAt,
            imageUrl: imageUrl,
            username: reply.User.username // Changed 'user' to 'User'
        };
    }));
}

async function getCommentsUsingPagination(videoId, offset = 0) { 
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
            { model: User },
            { model: Comment, as: 'replies' }
        ],
        order: [['giftTYPE', 'DESC'], ['createdAt', 'DESC']] // Order by 'giftTYPE' and 'createdAt' in descending order
    });

    const commentsData = await Promise.all(comments.map(async comment => {
        let imageUrl = null;
        if (comment.User.profile.imageFileName)
            imageUrl = await getSignedUrl(comment.User.profile.imageFileName); // Changed 'user' to 'User'

        return {
            id: comment.id,
            videoId: comment.videoId,
            userId: comment.userId,
            content: comment.content,
            gift: comment.gift,
            repliesCount: comment.replies.length,
            replies: await getReplies(comment), // Fetch replies
            createdAt: comment.createdAt,
            imageUrl: imageUrl,
            username: comment.User.username // Changed 'user' to 'User'
        };
    }));

    return { comments: commentsData };
}

const getCreatorComments = async (req, res) => {
    try {
        const { userId } = req.user;
        const { videoId } = req.params;
        const { offset } = req.query;

        if (!videoId )
            return res.status(400).json({ message: "Video ID is required" });

        const video = await 

        const comments = await Comment.findAll({ 
            where: { 
                videoId: videoId, 
                parentId: null,
                userId: {
                    [Op.ne]: videoCreatorId // Exclude comments made by the video creator
                }
            },
            limit: 5,
            offset: offset,
            include: [
                { model: User },
                { model: Comment, as: 'replies' }
            ],
            order: [['createdAt', 'DESC']]
        });

        const commentsData = await Promise.all(comments.map(async comment => {
            let imageUrl = null;
            if (reply.User?.profile?.imageFileName)
                imageUrl = await getSignedUrl(reply.User.profile.imageFileName);
    
            return {
                id: comment.id,
                videoId: comment.videoId,
                userId: comment.userId,
                content: comment.content,
                gift: comment.gift,
                repliesCount: comment.replies.length,
                replies: await getReplies(comment), // Fetch replies
                createdAt: comment.createdAt,
                imageUrl: imageUrl,
                username: comment.User.username // Changed 'user' to 'User'
            };
        }));
    
        return { comments: commentsData };

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


module.exports = {
    uploadVideo,
    getVideoThumbnail,
    getVideo,
    getCommentsUsingPagination,
    updateVideoDescription,
}