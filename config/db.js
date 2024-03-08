const { Sequelize, DataTypes } = require('sequelize');

const userModel = require('../models/user');
const userStatusModel = require('../models/userStatus');
const userAuth = require('../models/userAuth');
const userPopularityModel = require("../models/userPopularity");
const userPersonalizationModel = require("../models/userPersonalization");
const profileModel = require('../models/profile');
const followModel = require('../models/follow');


const videoModel = require('../models/video');
const videoLikeModel = require("../models/videoLike");
const videoMetadataModel = require('../models/videoMetadata');
const videoViewModel = require('../models/videoView');
const videoCategoryModel = require('../models/videoCategory');
const watchedVideoModel = require("../models/watchedVideo");
const rateModel = require("../models/rate");
const commentModel = require('../models/comment');
const commentLikeModel = require("../models/commentLike");


const chatModel = require("../models/chat");
const messageModel = require("../models/message");

const notificationModel = require("../models/notification");
const transactionModel = require('../models/transaction');
const savedVideoModel = require('../models/savedVideo');
const reportModel = require("../models/report");

// config = {
//     host    : "127.0.0.1",
//     port    : "5432",
//     dialect: 'postgres'
// }

// const DB_USER = process.env.DB_USER || "me";
// const DB_NAME = process.env.DB_NAME || "mydatabase";
// const DB_PASS = process.env.DB_PASS || "12345";
// //postgres://me:lsPSfleqDzppRgD5W4KLRtknBz64VQEi@dpg-cmsecdacn0vc73bgrilg-a.oregon-postgres.render.com/db_lne3
// //dialect://username:password@host:port/database

let sequelize;

if (process.env.NODE_ENV === 'test') {
  sequelize = new Sequelize(process.env.TEST_DATABASE_URL, {
    logging: console.log,
  });
} else {
  sequelize = new Sequelize(process.env.DATABASE_URL, {
    logging: console.log,
  });
}


const User = userModel(sequelize, DataTypes);
const UserStatus = userStatusModel(sequelize, DataTypes);
const UserAuth = userAuth(sequelize, DataTypes);
const UserPopularity = userPopularityModel(sequelize, DataTypes);
const UserPersonalization = userPersonalizationModel(sequelize, DataTypes);
const Profile = profileModel(sequelize, DataTypes);
const Follow = followModel(sequelize, DataTypes);

const Video = videoModel(sequelize, DataTypes);
const VideoLike = videoLikeModel(sequelize, DataTypes);
const VideoMetadata = videoMetadataModel(sequelize, DataTypes);
const VideoView = videoViewModel(sequelize, DataTypes);
const VideoCategory = videoCategoryModel(sequelize, DataTypes);
const WatchedVideo = watchedVideoModel(sequelize, DataTypes);
const Rate = rateModel(sequelize, DataTypes);
const Comment = commentModel(sequelize, DataTypes);
const CommentLike = commentLikeModel(sequelize, DataTypes);

const Chat = chatModel(sequelize, DataTypes);
const Message = messageModel(sequelize, DataTypes);

const Notification = notificationModel(sequelize, DataTypes);
const Transaction = transactionModel(sequelize, DataTypes);
const SavedVideo = savedVideoModel(sequelize, DataTypes);
const Report = reportModel(sequelize, DataTypes);


async function syncModels() {
  await sequelize.sync({alter: true});
}

async function dropModels() {
  await sequelize.drop();
}

//syncModels().catch(console.error);

    
module.exports = {
    User,
    UserStatus,
    UserAuth,
    UserPopularity,
    UserPersonalization,
    Profile,
    Follow,

    Video,
    VideoLike,
    VideoMetadata,
    VideoView,
    VideoCategory,
    WatchedVideo,
    Rate,
    Comment,
    CommentLike,

    Chat,
    Message,

    Notification,
    Transaction,
    SavedVideo,
    Report,

    sequelize,
    connect,
    close,
}


require("../models/associations");


//dropModels().catch(console.error);
//syncModels().catch(console.error);


async function connect() {
  try {
    await sequelize.authenticate();
    console.log('Database connection has been established successfully.');
  } catch (error) {
    console.error('Unable to connect to the database:', error);
  }
}

async function close() {
  console.log('Closing connection...');
  try {
    await sequelize.close();
    console.log('Connection closed');
  } catch (error) {
    console.error('Unable to close the connection:', error);
  }
}

