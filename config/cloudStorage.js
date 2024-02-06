const { Storage } = require('@google-cloud/storage');

const storage = new Storage({ 
    keyFilename: 'config/decent-destiny-401601-a07ed0709654.json', 
    projectId: 'decent-destiny-401601'
});

module.exports = storage;