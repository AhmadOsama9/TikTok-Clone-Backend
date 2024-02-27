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


const sequelize = new Sequelize('postgresql://ahmedahmedhamedahmed0:aTz8debUZcJ1@ep-royal-breeze-a54m0erd.us-east-2.aws.neon.tech/db?sslmode=require');

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

const Chat = chatModel(sequelize, DataTypes);
const Message = messageModel(sequelize, DataTypes);

const Notification = notificationModel(sequelize, DataTypes);
const Transaction = transactionModel(sequelize, DataTypes);
const SavedVideo = savedVideoModel(sequelize, DataTypes);
const Report = reportModel(sequelize, DataTypes);


//Relations between tables

//User Relation
User.hasOne(Profile, {
    foreignKey: 'userId',
    as: 'profile',
});

User.hasMany(Comment, {
    foreignKey: 'userId',
    as: 'comments',
});
  
User.hasMany(Video, {
    foreignKey: 'userId',
    as: 'videos',
});

User.hasMany(Follow, {
    foreignKey: 'followerId',
    as: 'following',
});
  
User.hasMany(Follow, {
    foreignKey: 'followingId',
    as: 'followers',
});

User.belongsToMany(Video, { 
    through: SavedVideo,
    foreignKey:'userId' , 
    as: 'savedVideos' 
});

User.hasMany(Video, { 
    foreignKey: 'creatorId', 
    as: 'createdVideos' 
});

User.hasMany(Report, {
    foreignKey: 'userId',
    as: 'reports',
});

User.hasMany(Chat, { 
    foreignKey: 'user1Id',
     as: 'user1Chats' 
});
User.hasMany(Chat, { 
    foreignKey: 'user2Id', 
    as: 'user2Chats'
});

User.hasMany(Message, {
    foreignKey: 'senderId',
    as: 'messages',
});

User.hasMany(Rate, {
    foreignKey: 'userId',
    as: 'ratings',
});


User.hasOne(UserPopularity, {
    foreignKey: 'userId',
    as: 'popularity',
});

User.hasMany(WatchedVideo, {
    foreignKey: 'userId',
    as: 'watchedVideos',
});

User.hasMany(UserPersonalization, {
    foreignKey: 'userId',
    as: 'personalizations',
});

User.hasMany(VideoLike, {
    foreignKey: 'userId',
    as: 'videoLikes',
});

User.hasMany(Notification, {
    foreignKey: 'userId',
    as: 'notifications',
});

User.hasOne(UserStatus, { 
    foreignKey: 'userId', 
    as: 'userStatus' 
});

User.hasMany(UserAuth, { 
    foreignKey: 'userId', 
    as: 'authMethods' 
});

User.hasMany(VideoView, { 
    foreignKey: 'userId', 
    as: 'videoViews' 
});


//UserPersonlization Relations
UserPersonalization.belongsTo(Video, {
    foreignKey: 'videoId',
    as: 'video',
});

UserPersonalization.belongsTo(User, {
    foreignKey: 'userId',
    as: 'user',
});


//UserPopularity Relations
UserPopularity.belongsTo(User, {
    foreignKey: 'userId',
});


//UserStatus Relations
UserStatus.belongsTo(User, { 
    foreignKey: 'userId', 
    as: 'user' 
});


//UserAuth Relations
UserAuth.belongsTo(User, { 
    foreignKey: 'userId', 
    as: 'user' 
});


//Follow Relations
Follow.belongsTo(User, {
    foreignKey: 'followingId',
    as: 'followers',
});


//Notification Relations
Notification.belongsTo(User, {
    foreignKey: 'userId',
    as: 'user',
});


//Message Relations
Message.belongsTo(Message, { 
    as: 'replyToMessage', 
    foreignKey: 'replyTo' 
});

Message.belongsTo(Chat, {
    foreignKey: 'chatId',
    as: 'chat',
});
  
Message.belongsTo(User, {
    foreignKey: 'senderId',
    as: 'sender',
});


//Chat Relations
Chat.belongsTo(User, { 
    foreignKey: 'user1Id', 
    as: 'user1' 
});

Chat.belongsTo(User, { 
    foreignKey: 'user2Id', 
    as: 'user2' 
});

Chat.hasMany(Message, {
    foreignKey: 'chatId',
    as: 'messages',
});


//Comment Relations
Comment.belongsTo(Comment, {
    foreignKey: 'parentId',
    as: 'parent',
});

Comment.hasMany(Comment, {
    foreignKey: 'parentId',
    as: 'replies',
});

  
Comment.belongsTo(User, {
    foreignKey: 'userId',
    as: 'user',
});


//Report Relations
Report.belongsTo(User, {
    foreignKey: 'userId',
    as: 'user',
});


//SavedVideos Relations
SavedVideo.belongsTo(User, { 
    foreignKey: 'userId' 
});

SavedVideo.belongsTo(Video, { 
    foreignKey: 'videoId' 
});



//WatchedVideos Relations
WatchedVideo.belongsTo(Video, {
    foreignKey: 'videoId',
    as: 'video',
});

WatchedVideo.belongsTo(User, {
    foreignKey: 'userId',
    as: 'user',
});


//VideoLike Relations
VideoLike.belongsTo(Video, {
    foreignKey: 'videoId',
    as: 'video',
});

VideoLike.belongsTo(User, {
    foreignKey: 'userId',
    as: 'user',
});



//VideoMetadata Relations
VideoMetadata.belongsTo(Video, { 
    foreignKey: 'videoId', 
    as: 'video' 
});


//VideoCategory Relations
VideoCategory.belongsTo(Video, { 
    foreignKey: 'videoId', 
    as: 'video' 
});


//VideoRate Relations
Rate.belongsTo(Video, {
    foreignKey: 'videoId',
    as: 'video',
});

Rate.belongsTo(User, {
    foreignKey: 'userId',
    as: 'user',
});


//VideoView Relations
VideoView.belongsTo(User, { 
    foreignKey: 'userId', 
    as: 'user' 
});



//Video Relations
Video.belongsToMany(User, {
    through: SavedVideo,
    foreignKey: 'videoId' ,
    as: 'savedByUsers' 
});

Video.belongsTo(User, { 
    foreignKey: 'creatorId', 
    as: 'creator' 
});

Video.hasMany(Rate, {
    foreignKey: 'videoId',
    as: 'ratings',
});

Video.hasMany(UserPersonalization, {
    foreignKey: 'videoId',
    as: 'personalizations',
});

Video.hasMany(WatchedVideo, {
    foreignKey: 'videoId',
    as: 'watchedInstances',
});

Video.hasMany(VideoLike, {
    foreignKey: 'videoId',
    as: 'videoLikes',
});

Video.hasOne(VideoMetadata, { 
    foreignKey: 'videoId', 
    as: 'metadata' 
});

VideoView.belongsTo(Video, { 
    foreignKey: 'videoId', 
    as: 'video' 
});

Video.hasMany(VideoView, { 
    foreignKey: 'videoId', 
    as: 'viewInstances' 
});

Video.hasMany(VideoCategory, { 
    foreignKey: 'videoId', 
    as: 'categories' 
});

Video.hasMany(Comment, {
    foreignKey: 'videoId',
    as: 'comments',
});
  


async function syncModels() {
    await User.sync({alter: true});
    await Video.sync({alter: true});

    await UserStatus.sync({alter: true});
    await UserAuth.sync({alter: true});
    await UserPopularity.sync({alter: true});
    await UserPersonalization.sync({alter: true});
    await Profile.sync({alter: true});
    await Follow.sync({alter: true});


    await VideoLike.sync({alter: true});
    await VideoMetadata.sync({alter: true});
    await VideoView.sync({alter: true});
    await VideoCategory.sync({alter: true});
    await WatchedVideo.sync({alter: true});
    await Rate.sync({alter: true});
    await Comment.sync({alter: true});


    await Chat.sync({alter: true});
    await Message.sync({alter: true});

    await Notification.sync({alter: true});
    await Transaction.sync({alter: true});
    await SavedVideo.sync({alter: true});
    await Report.sync({alter: true});
}

async function dropModels() {
    await UserStatus.drop();
    await UserAuth.drop();
    await UserPopularity.drop();
    await UserPersonalization.drop();
    await Profile.drop();
    await Follow.drop();


    await VideoLike.drop();
    await VideoMetadata.drop();
    await VideoView.drop();
    await VideoCategory.drop();
    await WatchedVideo.drop();
    await Rate.drop();


    await Message.drop();
    await Chat.drop();
    

    await Notification.drop();
    await Transaction.drop();
    await SavedVideo.drop();
    await Report.drop();

    await Comment.drop();
    await Video.drop();
    await User.drop();
}

// async function dropTable() {
//     try {
//         // Replace 'tableName' with the name of the table you want to drop
//         await sequelize.query('DROP TABLE IF EXISTS RecentInteractions');
//         console.log("Table has been dropped.");
//     } catch (error) {
//         console.error("Failed to drop table:", error);
//         throw error;
//     }
// }

//dropTable().catch(console.error);

function getAllUserAssociation() {
    console.log("It enters in the, ", getAllUserAssociation);
    const userInstance = User.build();
console.log(Object.keys(userInstance.constructor.associations));
}


const deleteAllVideos = async (req, res) => {
    try {
        await Video.destroy({ where: {} });
        console.log("All videos deleted");
    } catch (error) {
        console.log("Error in deleteAllVideos: ", error);
    }
}

// async function dropVideo() {
//     await sequelize.query('DROP TABLE IF EXISTS "Videos" CASCADE');
// }

// dropVideo().catch(console.error);

// async function dropUser() {
//     await sequelize.query('DROP TABLE IF EXISTS "Users" CASCADE');
// }

// dropUser().catch(console.error);

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

    Chat,
    Message,

    Notification,
    Transaction,
    SavedVideo,
    Report,

    sequelize
}

