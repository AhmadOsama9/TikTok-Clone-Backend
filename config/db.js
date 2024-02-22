const { Sequelize, DataTypes } = require('sequelize');
const userModel = require('../models/userModel');
const profileModel = require('../models/profileModel');
const videoModel = require('../models/videoModel');
const commentModel = require('../models/commentModel');
const followModel = require('../models/followModel');
const transactionModel = require('../models/transactionModel');
const savedVideoModel = require('../models/savedVideoModel');
const reportModel = require("../models/reportModel");
const chatModel = require("../models/chatModel");
const messageModel = require("../models/messageModel");
const rateModel = require("../models/rateModel");
const userPopularityModel = require("../models/userPopularityModel");
const userPersonalizationModel = require("../models/userPersonalizationModel");
const recentInteractionModel = require("../models/recentInteractionModel");
const watchedVideoModel = require("../models/watchedVideoModel");
const videoLikeModel = require("../models/videoLikeModel");

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


const sequelize = new Sequelize('postgresql://ahmedahmedhamedahmed0:aTz8debUZcJ1@ep-royal-breeze-a54m0erd.us-east-2.aws.neon.tech/db?sslmode=require');

const User = userModel(sequelize, DataTypes);
const Profile = profileModel(sequelize, DataTypes);
const Video = videoModel(sequelize, DataTypes);
const Comment = commentModel(sequelize, DataTypes);
const Follow = followModel(sequelize, DataTypes);
const Transaction = transactionModel(sequelize, DataTypes);
const SavedVideo = savedVideoModel(sequelize, DataTypes);
const Report = reportModel(sequelize, DataTypes);
const Chat = chatModel(sequelize, DataTypes);
const Message = messageModel(sequelize, DataTypes);
const Rate = rateModel(sequelize, DataTypes);
const UserPopularity = userPopularityModel(sequelize, DataTypes);
const UserPersonalization = userPersonalizationModel(sequelize, DataTypes);
const RecentInteraction = recentInteractionModel(sequelize, DataTypes);
const WatchedVideo = watchedVideoModel(sequelize, DataTypes);
const VideoLike = videoLikeModel(sequelize, DataTypes);

//Relations between tables

// User and Profile
User.hasOne(Profile, {
    foreignKey: 'userId',
    as: 'profile',
});
  
// User and Video
User.hasMany(Video, {
    foreignKey: 'userId',
    as: 'videos',
});
  
// Video and Comment
Video.hasMany(Comment, {
    foreignKey: 'videoId',
    as: 'comments',
});
  
// User and Comment
User.hasMany(Comment, {
    foreignKey: 'userId',
    as: 'comments',
});
  
Comment.belongsTo(User, {
    foreignKey: 'userId',
    as: 'user',
});

// User and Follow (following and followers)
User.hasMany(Follow, {
    foreignKey: 'followerId',
    as: 'following',
});
  
User.hasMany(Follow, {
    foreignKey: 'followingId',
    as: 'followers',
});

Follow.belongsTo(User, {
    foreignKey: 'followingId',
    as: 'followers',
});

User.belongsToMany(Video, 
    { through: SavedVideo, as: 'savedVideos' 
});

Video.belongsToMany(User, 
    { through: SavedVideo, as: 'savedByUsers' 
});

User.hasMany(Report, {
    foreignKey: 'userId',
    as: 'reports',
});

Report.belongsTo(User, {
    foreignKey: 'userId',
    as: 'user',
});

Comment.belongsTo(Comment, {
    foreignKey: 'parentId',
    as: 'parent',
});

Comment.hasMany(Comment, {
    foreignKey: 'parentId',
    as: 'replies',
});

User.hasMany(Chat, { foreignKey: 'user1Id', as: 'user1Chats' });
User.hasMany(Chat, { foreignKey: 'user2Id', as: 'user2Chats' });

Chat.belongsTo(User, { foreignKey: 'user1Id', as: 'user1' });
Chat.belongsTo(User, { foreignKey: 'user2Id', as: 'user2' });

Chat.hasMany(Message, {
    foreignKey: 'chatId',
    as: 'messages',
});
  
Message.belongsTo(Chat, {
    foreignKey: 'chatId',
    as: 'chat',
});

User.hasMany(Message, {
    foreignKey: 'senderId',
    as: 'messages',
});
  
Message.belongsTo(User, {
    foreignKey: 'senderId',
    as: 'sender',
});


User.hasMany(Rate, {
    foreignKey: 'userId',
    as: 'ratings',
});

Rate.belongsTo(User, {
    foreignKey: 'userId',
    as: 'user',
});

Video.hasMany(Rate, {
    foreignKey: 'videoId',
    as: 'ratings',
});

Rate.belongsTo(Video, {
    foreignKey: 'videoId',
    as: 'video',
});

User.hasOne(UserPopularity, {
    foreignKey: 'userId',
    as: 'popularity',
});

UserPopularity.belongsTo(User, {
    foreignKey: 'userId',
});

User.hasMany(UserPersonalization, {
    foreignKey: 'userId',
    as: 'personalizations',
});

UserPersonalization.belongsTo(User, {
    foreignKey: 'userId',
    as: 'user',
});

Video.hasMany(UserPersonalization, {
    foreignKey: 'videoId',
    as: 'personalizations',
});

UserPersonalization.belongsTo(Video, {
    foreignKey: 'videoId',
    as: 'video',
});

User.hasMany(RecentInteraction, {
    foreignKey: 'userId',
    as: 'recentInteractions',
});

RecentInteraction.belongsTo(User, {
    foreignKey: 'userId',
    as: 'user',
});

Video.hasMany(RecentInteraction, {
    foreignKey: 'videoId',
    as: 'recentInteractions',
});

RecentInteraction.belongsTo(Video, {
    foreignKey: 'videoId',
    as: 'video',
});

User.hasMany(WatchedVideo, {
    foreignKey: 'userId',
    as: 'watchedVideos',
});

WatchedVideo.belongsTo(User, {
    foreignKey: 'userId',
    as: 'user',
});

Video.hasMany(WatchedVideo, {
    foreignKey: 'videoId',
    as: 'watchedInstances',
});

WatchedVideo.belongsTo(Video, {
    foreignKey: 'videoId',
    as: 'video',
});

Message.belongsTo(Message, { 
    as: 'replyToMessage', 
    foreignKey: 'replyTo' 
});

User.hasMany(VideoLike, {
    foreignKey: 'userId',
    as: 'videoLikes',
});

VideoLike.belongsTo(User, {
    foreignKey: 'userId',
    as: 'user',
});

Video.hasMany(VideoLike, {
    foreignKey: 'videoId',
    as: 'videoLikes',
});

VideoLike.belongsTo(Video, {
    foreignKey: 'videoId',
    as: 'video',
});


async function syncModels() {
    await User.sync({alter: true});
    await Video.sync({alter: true});
    await VideoLike.sync({alter: true});
    await RecentInteraction.sync({alter: true});
    await UserPersonalization.sync({alter: true});
    await Profile.sync({alter: true});
    await Comment.sync({alter: true});
    await Follow.sync({alter: true});
    await Transaction.sync({alter: true});
    await SavedVideo.sync({alter: true});
    await Report.sync({alter: true});
    await Chat.sync({alter: true});
    await Message.sync({alter: true});
    await Rate.sync({alter: true});
    await UserPopularity.sync({alter: true});
    await WatchedVideo.sync({alter: true});
}

async function dropModels() {
    await VideoLike.drop();
    await WatchedVideo.drop();
    await RecentInteraction.drop();
    await UserPersonalization.drop();
    await UserPopularity.drop();
    await Rate.drop();
    await Message.drop();
    await Chat.drop();
    await Report.drop();
    await Comment.drop();
    await Follow.drop();
    await Profile.drop();
    await SavedVideo.drop();
    await Video.drop();
    await Transaction.drop();
    await User.drop();
}

function getAllUserAssociation() {
    console.log("It enters in the, ", getAllUserAssociation);
    const userInstance = User.build();
console.log(Object.keys(userInstance.constructor.associations));
}

//getAllUserAssociation();

//dropModels().catch(console.error);
//syncModels().catch(console.error);

async function drop() {
    await Transaction.drop();
}

sequelize.authenticate()
    .then(() => console.log('Database connection has been established successfully.'))
    .catch(error => console.error('Unable to connect to the database:', error));

module.exports = {
    User,
    Profile,
    Video,
    Comment,
    Follow,
    Transaction,
    SavedVideo,
    Report,
    Chat,
    Message,
    Rate,
    UserPopularity,
    UserPersonalization,
    RecentInteraction,
    WatchedVideo,
    VideoLike,
    sequelize
}

