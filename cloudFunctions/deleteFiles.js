const bucketName = process.env.VIDEO_BUCKET_NAME || "kn_story_app";
const storage = require("../config/cloudStorage");


async function deleteFromCloudStorage(fileName) {
    const bucket = storage.bucket(bucketName);
    const file = bucket.file(fileName);
  
    try {
      await file.delete();
    } catch (error) {
      if (error.code !== 404) {  // Ignore "Not Found" errors
        throw error;
      }
    }
}


module.exports = deleteFromCloudStorage;