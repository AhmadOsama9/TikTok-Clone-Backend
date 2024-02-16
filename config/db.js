const { Sequelize, DataTypes } = require('sequelize');
const userModel = require('../models/userModel');
const profileModel = require('../models/profileModel');
const videoModel = require('../models/videoModel');
const commentModel = require('../models/commentModel');
const followModel = require('../models/followModel');
const transactionModel = require('../models/transactionModel');
const savedVideoModel = require('../models/savedVideoModel');

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

async function syncModels() {
    await User.sync({alter: true});
    await Video.sync({alter: true});
    await Profile.sync({alter: true});
    await Comment.sync({alter: true});
    await Follow.sync({alter: true});
    await Transaction.sync({alter: true});
    await SavedVideo.sync({alter: true});
}

async function dropModels() {
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
    sequelize
}

