const cron = require("node-cron");
const fs = require('fs');
const path = require('path');
const util = require('util');
const readdir = util.promisify(fs.readdir);
const unlink = util.promisify(fs.unlink);

const directory = path.join(__dirname, '..', 'uploads');

async function cleanupOrphanedFiles() {
    const files = await readdir(directory);
    for (const file of files) {
        const filePath = path.join(directory, file);
        await unlink(filePath);
    }
}

const scheduleCleanUp = () => {
    cron.schedule("0 0 */2 * *", cleanupOrphanedFiles);
}

module.exports = {
    scheduleCleanUp
}

// cleanupOrphanedFiles().then(() => {
//     console.log('Orphaned files cleaned up');
// }).catch((error) => {
//     console.error('Error cleaning up orphaned files:', error);
// });