const bucketName = process.env.VIDEO_BUCKET_NAME || "kn_story_app";
const storage = require("../config/cloudStorage");


async function uploadToCloudStorage(filePath, fileName) {
    const bucket = storage.bucket(bucketName);
    const file = bucket.file(fileName);

    try {
        await bucket.upload(filePath, {
            destination: fileName,
        })
        return fileName;
    } catch (error) {
        console.error(`Failed to upload file: ${error}`);
        throw error;
    }
}


module.exports = uploadToCloudStorage;