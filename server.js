const app = require('./app');
const { connect } = require("./config/db");

const { scheduleDecayUserPersonalization } = require("./scheduling/decayUserPersonalization");
const { scheduleUserPopularityUpdate } = require("./scheduling/userPopularityUpdate");
const { scheduleVideoPopularityUpdate } = require("./scheduling/videoPopularityScore");
const { initializeModel } = require("./helper/initializeAndGetModel");

const port = process.env.PORT || 3000;

const server = app.listen(port, async () => {
    try {
        console.log(`Listening on port ${port}`);
        await connect();
        scheduleDecayUserPersonalization();
        scheduleUserPopularityUpdate();
        scheduleVideoPopularityUpdate();
        await initializeModel();
    } catch (error) {
        console.log("Error in server.js", error);
        server.close(() => {
            console.log('Server closed due to error.');
        });
    }
});