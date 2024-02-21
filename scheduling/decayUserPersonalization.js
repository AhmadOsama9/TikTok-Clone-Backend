const cron = require("node-cron");
const User = require("../config/db").User;
const { decayUserPersonalization } = require("../controllers/userPersonalizationController");


cron.schedule("0 0 * * *", async () => { // run every day at midnight
    try {
        const users = await User.findAll({ attributes: ['id'] });
        for (const user of users) {
            await decayUserPersonalization(user.id);
        }
    } catch (error) {
        console.log("error decaying user personalization: ", error);
    }
});