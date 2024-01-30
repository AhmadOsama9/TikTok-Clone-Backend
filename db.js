const { Sequelize, DataTypes } = require('sequelize');
const userModel = require('./models/userModel');
const profileModel = require('./models/profileModel');
const videoModel = require('./models/videoModel');
const commentModel = require('./models/commentModel');
const videoLikeModel = require('./models/videoLikeModel');
const followModel = require('./models/followModel');

config = {
    host    : "localhost",
    port    : "5432",
    dialect: 'postgres'

}

const DB_USER = process.env.DB_USER || "me";
const DB_NAME = process.env.DB_NAME || "db";
const DB_PASS = process.env.DB_PASS || "12345";

const sequelize = new Sequelize(DB_NAME, DB_USER, DB_PASS, config);

const User = userModel(sequelize, DataTypes);
const Profile = profileModel(sequelize, DataTypes);
const Video = videoModel(sequelize, DataTypes);
const Comment = commentModel(sequelize, DataTypes);
const VideoLike = videoLikeModel(sequelize, DataTypes);
const Follow = followModel(sequelize, DataTypes);

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
  
// User and VideoLike
User.hasMany(VideoLike, {
    foreignKey: 'userId',
    as: 'likes',
});
  
// Video and VideoLike
Video.hasMany(VideoLike, {
    foreignKey: 'videoId',
    as: 'likes',
});
  
// User and Follow (following and followers)
User.hasMany(Follow, {
    foreignKey: 'userId',
    as: 'following',
});
  
User.hasMany(Follow, {
    foreignKey: 'followingId',
    as: 'followers',
});

//handle the creation of user before the profile
// await User.sync();
// await Profile.sync();

async function syncModels() {
    await User.sync({alter: true});
    await Profile.sync({alter: true});
    await Video.sync({alter: true});
    await Comment.sync({alter: true});
    await VideoLike.sync({alter: true});
    await Follow.sync({alter: true});
}

syncModels().catch(console.error);

module.exports = {
    User,
    Profile,
    Video,
    Comment,
    VideoLike,
    Follow
}

