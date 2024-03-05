const nsfwjs = require('nsfwjs');

let model;

const initializeModel = async () => {
    model = await nsfwjs.load();
};

const getModel = () => {
    if (!model) {
        throw new Error('Model is not initialized');
    }
    return model;
};

module.exports = { initializeModel, getModel };

