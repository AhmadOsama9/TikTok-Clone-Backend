const User = require("../config/db").User;
const Video = require("../config/db").Video;

const nsfwjs = require("nsfwjs");
const tf = require("@tensorflow/tfjs-node");
const sharp = require("sharp");
const ffmpeg = require("fluent-ffmpeg");
const stream = require("stream");
const { Readable, PassThrough } = require('stream');

const storage = require("../config/cloudStorage");

const bucketName = "kn_story_app";

//I plan on finding the best algorithm
//for the detection of the inappropriate content
//like checking multiple repetative frames and if they 
//have the same or soo near ratio then mostly true
//also I need to the best way for the getting the frames
//Also I need to check the audio if there's anything free
//like NSFW audio or something like that

const mm = require('music-metadata');

const getVideoBitrate = async (videoBuffer) => {
    try {
      const metadata = await mm.parseBuffer(videoBuffer, 'video/mp4', { duration: true });
      return metadata.format.bitrate;
    } catch (err) {
      console.error('Error in music-metadata:', err);
      console.error('Error details:', err.message, err.stack);
      throw err;
    }
};

const compressVideo = (req, videoBuffer, bitrate) => {
    return new Promise((resolve, reject) => {
        const input = new stream.PassThrough();
        input.end(videoBuffer);

        const output = new PassThrough();

        let targetBitrate = '1000k';

        if (bitrate > 2500000) { 
            targetBitrate = '2000k'; 
        } else if (bitrate > 2000000) {
            targetBitrate = '1500k';
        } else if (bitrate > 1500000) {
            targetBitrate = '1000k';
        }

        ffmpeg(input)
            .outputOptions('-f', 'matroska')
        .on('error', error => {
            console.error('Error:', error);
            reject(error);
        })
        .on('end', () => {
            console.log('FFmpeg process ended');
            resolve(output);
        })
        .on('stderr', stderrLine => {
            console.log('Stderr output:', stderrLine);
        })
        .pipe(output, { end: true });

        req.on('close', () => {
            console.log('Request cancelled, stopping FFmpeg process');
            ffmpegProcess.kill(); // Stop the FFmpeg process
        });

    });
};

const extractFramesFromVideo = (videoBuffer, fps = 1) => {
    return new Promise((resolve, reject) => {
        const videoStream = new PassThrough();
        videoStream.end(videoBuffer);

        let frames = [];
        const output = new PassThrough();

        console.log("Starting FFmpeg process");

        ffmpeg(videoStream)
            .outputOptions('-vf', `fps=${fps}`) // Extract fps frames per second
            .outputOptions('-f', 'image2pipe') // Force output format to image2pipe
            .on('error', error => {
                console.error('Error:', error);
                reject(error);
            })
            .on('end', () => {
                console.log('FFmpeg process ended');
                resolve(frames);
            })
            .pipe(output, { end: true }); // Pipe the output to the PassThrough stream

        output.on('data', chunk => {
            console.log('Received frame chunk');
            frames.push(chunk);
        });

    });
};




const checkVideoContent = async (videoBuffer ,res) => {
    try {
        console.log("checkVideoContent function called")
        const model = await nsfwjs.load();

        const pornThreshold = 0.8;
        const sexyThreshold = 0.85;
        const hentaiThreshold = 0.9;

        console.log("Before extracting frames from video");
        const framesStream = await extractFramesFromVideo(videoBuffer, 2);
        console.log("After extracting frames from video");

        console.log("Frames size is : ", framesStream.length);

        for (const frame of framesStream) {
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
            }
        }

        

    } catch (error) {
        console.log("Error in checkVideoContent: ", error);
        throw Error(error);
    }
}

const checkAndUploadThumbnail = async (buffer) => { 

    if (buffer.length > 0.2 * 1024 * 1024) {
        throw new Error("File size too large. Please upload a thumbnail less than 200KB.");
    }

    const { fileTypeFromBuffer } = await import('file-type');
    const fileType = await fileTypeFromBuffer(buffer);

    if (!fileType || (fileType.ext !== "png" && fileType.ext !== "jpg" && fileType.ext !== "jpeg")) {
        throw new Error("Invalid file type. Please upload a png, jpg, or jpeg file");
    }

    try {
        await sharp(buffer).metadata();
    } catch (error) {
        throw new Error("Invalid image file");
    }

    const imageTensor = tf.node.decodeImage(buffer);


    const model = await nsfwjs.load();
    const predictions = await model.classify(imageTensor);

    const pornThreshold = 0.75;
    const sexyThreshold = 0.85;
    const hentaiThreshold = 0.85;

    const pornProbability = predictions.find(prediction => prediction.className === "Porn").probability;
    const sexyProbability = predictions.find(prediction => prediction.className === "Sexy").probability;
    const hentaiProbability = predictions.find(prediction => prediction.className === "Hentai").probability;

    if (pornProbability > pornThreshold || sexyProbability > sexyThreshold || hentaiProbability > hentaiThreshold) {
        throw new Error("Inappropriate content");
    }

    const bucket = storage.bucket(bucketName);
    const fileName = `thumbnail/${Date.now()}.${fileType.ext}`;
    const file = bucket.file(fileName);

    stream.on("error", (error) => { 
        console.log("error: ", error);
        reject(error);
    });

    return new Promise((resolve, reject) => {
        const stream = file.createWriteStream({ 
            metadata: {
                contentType: `image/${fileType.ext}`
            }
        });

        stream.on("finish", async () => { 
            resolve(fileName);
        });
        stream.on("error", (error) => { 
            console.log("error: ", error);
            reject(error);
        });
        
        stream.end(buffer);
    })
}

const getBuffer = (stream) => {
    return new Promise((resolve, reject) => {
      const chunks = [];
      stream.on('data', chunk => chunks.push(chunk));
      stream.on('end', () => resolve(Buffer.concat(chunks)));
      stream.on('error', reject);
    });
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

        const videoBuffer = req.files.video[0].buffer;
        const imageBuffer = req.files.image[0].buffer;

        if (!videoBuffer || !imageBuffer || (!req.files.video[0].buffer instanceof Buffer) || (!req.files.image[0].buffer instanceof Buffer)) {
            throw new Error("Failed to read video or image");
        }

        const maxSize = 60 * 1024 * 1024; // 60MB
        if (videoBuffer.length > maxSize) {
            throw new Error("File size too large. Please upload a video less than 60MB.");
        }

        const validMimeTypes = ["video/mp4"];
        const { fileTypeFromBuffer } = await import('file-type');
        const fileType = await fileTypeFromBuffer(videoBuffer);
        if (!fileType || !validMimeTypes.includes(fileType.mime)) {
            throw new Error("Invalid file type. Please upload a video file.");
        }

        const user = await User.findOne({ where: { id: userId } });
        if (!user) {
            throw new Error("User not found");
        }

        const bitrate = await getVideoBitrate(videoBuffer);
        console.log('Bitrate:', bitrate);

        console.log("Before checking video content");

        try {
            //await checkVideoContent(videoBuffer, res);
        } catch (error) {
            console.log("Error in checkVideoContent: ", error);
            throw error;
        }      
        
        console.log("After checking video content");
        console.log("Before compressing video, videoSize: ", videoBuffer.length, " bitrate: ", bitrate);

        const compressedVideoStream = await compressVideo(req, videoBuffer, bitrate);

        console.log("ComressedVideoStream: ", compressedVideoStream);

        const compressedVideoBuffer = await getBuffer(compressedVideoStream);

        console.log("After compressing video, videoSize: ", compressedVideoBuffer.length);
        
        const bucket = storage.bucket(bucketName);
        const fileName = `videos/${userId}/${Date.now()}.mkv`;
        const file = bucket.file(fileName);

        const stream = file.createWriteStream({ 
            metadata: {
                contentType: `video/x-matroska`
            }
        });

        stream.on("error", (error) => { 
            console.log("error: ", error);
            throw error;
        });

        let thumbnailFile = null;

        console.log("before stream finish");
        stream.on("finish", async () => { 
            try {
                const thumbnail = imageBuffer;
                console.log("Before checking and uploading thumbnail");
                const thumbnailFileName = await checkAndUploadThumbnail(thumbnail);
                console.log("After checking and uploading thumbnail");
                thumbnailFile = bucket.file(thumbnailFileName);

                const video = await Video.create({
                    creatorId: userId,
                    fileName: fileName,
                    thumbnailFileName: thumbnailFileName,
                    videoSize: videoBuffer.length,
                    videoName: req.files["video"][0].originalname,
                    description: req.body.description,
                    category: req.body.category,
                });

                if (!responseSent) {
                    responseSent = true;
                    return res.status(200).json({message: "Video uploaded successfully", videoId: video.id});
                }
            } catch (error) {   
                console.log("Failed to create Video, deleting video and thumbnail from cloud storage...");
                file.delete().then(() => {
                    console.log("Video deleted from cloud storage");
                }).catch(err => {
                    console.log("Failed to delete video from cloud storage", err);
                });
                if (thumbnailFile) {
                    thumbnailFile.delete().then(() => {
                        console.log("Thumbnail deleted from cloud storage");
                    }).catch(err => {
                        console.log("Failed to delete thumbnail from cloud storage", err);
                    });
                }
                if (!responseSent) {
                    responseSent = true;
                    console.log("Error in upload video: ", error);
                    console.log("Error.message: ", error.message);
                    return res.status(500).json({error : error.message});
                }
            }
        });

        stream.end(compressedVideoBuffer);

    } catch (error) {
        if (!responseSent) {
            responseSent = true;
            console.log("Error in upload video: ", error);
            console.log("Error.message: ", error.message);
            return res.status(500).json({error : error.message});
        }  
    }
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


async function getCommentsUsingPagination(videoId, limit = 5, offset = 0) { 
    const comments = await Comment.findAll({ 
        where: { videoId: videoId },
        limit: limit,
        offset: offset,
        include: [{
            model: User, as: 'user',
            include: [{
                model: Profile, as: 'profile'
            }]
        }]
    });

    const commentsData = await Promise.all(comments.map( async comment => {
        let imageUrl = null;
        if (comment.user.profile.imageFileName) 
            imageUrl = await getSignedUrl(comment.user.profile.imageFileName);

        return {
            id: comment.id,
            userId: comment.userId,
            username: comment.user.username,
            commentDetails: comment.commentDetails,
            imageUrl: imageUrl,
        }
    
    }));
        return commentsData;
}


module.exports = {
    uploadVideo,
    getVideoThumbnail,
    getVideo,
    getCommentsUsingPagination,
}