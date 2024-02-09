const User = require("../config/db").User;
const Video = require("../config/db").Video;

const nsfwjs = require("nsfwjs");
const tf = require("@tensorflow/tfjs-node");

const fs = require("fs");
const util = require("util");

const storage = require("../config/cloudStorage");

const bucketName = "kn_story_app";


const checkVideoContent = async (buffer) => {
    try {
        const model = await nsfwjs.load();
        const tensor = tf.node.decodeImage(buffer);

        const predictions = await model.classify(tensor);

        const pornThreshold = 0.65;
            const sexyThreshold = 0.75;
            const hentaiThreshold = 0.75;

            const pornProbability = predictions.find(prediction => prediction.className === "Porn").probability;
            const sexyProbability = predictions.find(prediction => prediction.className === "Sexy").probability;
            const hentaiProbability = predictions.find(prediction => prediction.className === "Hentai").probability;

            if (pornProbability > pornThreshold || sexyProbability > sexyThreshold || hentaiProbability > hentaiThreshold) {
                return res.status(400).
                json({ error: "Inappropriate content",
                message: "pornProability is " + pornProbability + " sexyProbability is " + sexyProbability + " hentaiProbability is " + hentaiProbability + " and the threshold is " + pornThreshold + " " + sexyThreshold + " " + hentaiThreshold + " respectively."
                });
            }

        return predictions;

    } catch (error) {
        return res.status(500).json({error : error.message});
    }

}

const checkAndUploadThumbnail = async (buffer, videoId) => { 
    try {
        const { fileTypeFromBuffer } = await import('file-type');
        const fileType = await fileTypeFromBuffer(buffer);

        if (!fileType || (fileType.ext !== "png" && fileType.ext !== "jpg" && fileType.ext !== "jpeg")) {
            return res.status(400).json({ error: "Invalid image format" });
        }

        const video = await Video.findOne({ where: { id: videoId } });
        if (!video) {
            return res.status(404).json({ error: "Video not found" });
        }

        const imageTensor = tf.node.decodeImage(buffer);


        const model = await nsfwjs.load();
        const predictions = await model.classify(imageTensor);

        const pornThreshold = 0.65;
        const sexyThreshold = 0.75;
        const hentaiThreshold = 0.75;

        const pornProbability = predictions.find(prediction => prediction.className === "Porn").probability;
        const sexyProbability = predictions.find(prediction => prediction.className === "Sexy").probability;
        const hentaiProbability = predictions.find(prediction => prediction.className === "Hentai").probability;

        if (pornProbability > pornThreshold || sexyProbability > sexyThreshold || hentaiProbability > hentaiThreshold) {
            return res.status(400).
            json({ error: "Inappropriate content",
            message: "pornProability is " + pornProbability + " sexyProbability is " + sexyProbability + " hentaiProbability is " + hentaiProbability + " and the threshold is " + pornThreshold + " " + sexyThreshold + " " + hentaiThreshold + " respectively."
            });
        }

        const bucket = storage.bucket(bucketName);
        const fileName = `thumbnail/${videoId}/${Date.now()}.${fileType.ext}`;
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
            video.thumbnailFileName = fileName;

            try {
                await video.save();
                res.status(200).
                json({ 
                    message1: "Thumbnail added successfully", 
                    message2: "pornProability is " + pornProbability + " sexyProbability is " + sexyProbability + " hentaiProbability is " + hentaiProbability + " and the threshold is " + pornThreshold + " " + sexyThreshold + " " + hentaiThreshold + " respectively.",
                });
            } catch (error) {
                console.log("Failed to update Video, deleting image from cloud storage...");
                file.delete().then(() => {
                    console.log("Image deleted from cloud storage");
                }).catch(err => {
                    console.log("Failed to delete image from cloud storage", err);
                });
                res.status(500).json({ error: "Failed to update Video" });
            }
        });

        stream.end(buffer);

    } catch (error) {
        console.log("error", error);
        res.status(500).json({ error: error.message });
    }
}


const readFile = util.promisify(fs.readFile);
const unlink = util.promisify(fs.unlink);

const uploadVideo = async (req, res) => {
    try {
        const { userId } = req.user;

        const videoPath = req.files["video"][0].path;
        const imagePath = req.files["thumbnail"][0].path;

        if (!videoPath || !imagePath) {
            return res.status(400).json({ message: "Please upload a video and a thumbnail" });
        }

        const videoBuffer = await readFile(videoPath);
        const imageBuffer = await readFile(imagePath);

        if (!videoBuffer || !imageBuffer) {
            await unlink(videoPath);
            await unlink(imagePath);
            return res.status(500).json({ message: "Failed to read video or image" });
        }

        const user = await User.findOne({ where: { id: userId } });
        if (!user) {
            await unlink(videoPath);
            await unlink(imagePath);
            return res.status(404).json({ message: "User not found" });
        }

        const maxSize = 10 * 1024 * 1024;
        if (videoBuffer.length > maxSize) {
            await unlink(videoPath);
            await unlink(imagePath);
            return res.status(400).json({ message: "File size too large. Please upload a video less than 10MB." });
        }

        const validMimeTypes = ["video/mp4", "video/quicktime", "video/mpeg"];
        const { fileTypeFromBuffer } = await import('file-type');
        const fileType = await fileTypeFromBuffer(videoBuffer);
        if (!fileType || !validMimeTypes.includes(fileType.mime)) {
            await unlink(videoPath);
            await unlink(imagePath);
            return res.status(400).json({ message: "Invalid file type. Please upload a video file." });
        }

        await checkVideoContent(videoBuffer);

        
        
        const bucket = storage.bucket(bucketName);
        const fileName = `videos/${userId}/${Date.now()}.${fileType.ext}`;
        const file = bucket.file(fileName);

        const stream = file.createWriteStream({ 
            metadata: {
                contentType: `video/${fileType.ext}`
            }
        });

        stream.on("error", (error) => { 
            console.log("error: ", error);
            res.status(500).json({ error: error.message });
        });

        stream.on("finish", async () => { 
            try {
                const video = await Video.create({
                    creatorId: userId,
                    fileName: fileName,
                    videoSize: videoBuffer.length,
                    videoName: req.files["video"][0].originalname,
                    description: req.body.description,
                    category: req.body.category,
                });

                const thumbnail = imageBuffer;
                await checkAndUploadThumbnail(thumbnail, video.id);

                await unlink(videoPath);
                await unlink(imagePath);

            } catch (error) {
                console.log("Failed to create Video, deleting video from cloud storage...");
                file.delete().then(() => {
                    console.log("Video deleted from cloud storage");
                }).catch(err => {
                    console.log("Failed to delete video from cloud storage", err);
                });
                await unlink(videoPath);
                await unlink(imagePath);
                return res.status(500).json({ error: error.message });
            }

            res.status(200).json({ message: "Video uploaded successfully", videoId: video.id });
        });

    } catch (error) {
        await unlink(videoPath);
        await unlink(imagePath);
        return res.status(500).json({error : error.message});
    }
}

module.exports = {
    uploadVideo,
}