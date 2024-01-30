const { Sequelize, DataTypes } = require('sequelize');
const userModel = require('./models/userModel');
const profileModel = require('./models/profileModel');
const videoModel = require('./models/videoModel');
const commentModel = require('./models/commentModel');
const videoLikeModel = require('./models/videoLikeModel');
const followModel = require('./models/followModel');


config = {
    host    : "127.0.0.1",
    port    : "5432",
    dialect: 'postgres'
}

const DB_USER = process.env.DB_USER || "me";
const DB_NAME = process.env.DB_NAME || "mydatabase";
const DB_PASS = process.env.DB_PASS || "12345";
//postgres://me:lsPSfleqDzppRgD5W4KLRtknBz64VQEi@dpg-cmsecdacn0vc73bgrilg-a.oregon-postgres.render.com/db_lne3
//dialect://username:password@host:port/database
const sequelize = new Sequelize('postgresql://ahmedahmedhamedahmed0:aTz8debUZcJ1@ep-royal-breeze-a54m0erd.us-east-2.aws.neon.tech/db?sslmode=require');

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

sequelize.sync({ alter: true });

module.exports = {
    User,
    Profile,
    Video,
    Comment,
    VideoLike,
    Follow
}

