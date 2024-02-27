const bucketName = process.env.VIDEO_BUCKET_NAME || "kn_story_app";
const storage = require("../config/cloudStorage");

async function getSignedUrl(fileName) {
    const options = {
        version: 'v4',
        action: 'read',
        expires: Date.now() + 35 * 60 * 1000,
    };

    try {
        const [url] = await storage.bucket(bucketName).file(fileName).getSignedUrl(options);
        return url;
    } catch (error) {
        if (error.code !== 404) {  // Ignore "Not Found" errors
            throw error;
        }
    }
}

module.exports = getSignedUrl;