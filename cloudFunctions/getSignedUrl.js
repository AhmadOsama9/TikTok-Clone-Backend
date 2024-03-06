const bucketName = process.env.VIDEO_BUCKET_NAME || "kn_story_app";
const storage = require("../config/cloudStorage");

//I get a stupid error when I try to use the env
//I just don't feel it's worth it to solve it
//maybe if I've time, but yeah I think I should either 
//make them milliseconds all or in seconds but
//using the env results in some bullshit
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
        if (error.code !== 404) {
            throw error;
        }
    }
}

module.exports = getSignedUrl;