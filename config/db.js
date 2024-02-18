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

User.belongsToMany(Chat, {
    through: 'UserChat',
    foreignKey: 'userId',
    otherKey: 'chatId',
    as: 'chats',
});
  
Chat.belongsToMany(User, {
    through: 'UserChat',
    foreignKey: 'chatId',
    otherKey: 'userId',
    as: 'users',
});

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

async function syncModels() {
    await User.sync({alter: true});
    await Video.sync({alter: true});
    await Profile.sync({alter: true});
    await Comment.sync({alter: true});
    await Follow.sync({alter: true});
    await Transaction.sync({alter: true});
    await SavedVideo.sync({alter: true});
    await Report.sync({alter: true});
    await Chat.sync({alter: true});
    await Message.sync({alter: true});
    await Rate.sync({alter: true});
}

async function dropModels() {
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



//dropModels().catch(console.error);
//syncModels().catch(console.error);

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
    sequelize
}

