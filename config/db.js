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


const sequelize = new Sequelize('postgresql://ahmedosamaa975:tekbn8rfMu3w@ep-morning-mode-a5elkccd.us-east-2.aws.neon.tech/StoryAppDB?sslmode=require', {
    logging: console.log,
    
});

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


//Relations between tables

//User Relation
User.hasOne(Profile, {
    foreignKey: 'userId',
    as: 'profile',
    onDelete: 'CASCADE',
});

User.hasMany(Comment, {
    foreignKey: 'userId',
    as: 'comments',
    onDelete: 'CASCADE',
});
  
User.hasMany(Video, {
    foreignKey: 'userId',
    as: 'videos',
    onDelete: 'CASCADE',
});

User.hasMany(Follow, {
    foreignKey: 'followerId',
    as: 'following',
    onDelete: 'CASCADE',
});
  
User.hasMany(Follow, {
    foreignKey: 'followingId',
    as: 'followers',
    onDelete: 'CASCADE',
});

User.belongsToMany(Video, { 
    through: SavedVideo,
    foreignKey:'userId' , 
    as: 'savedVideos',
    onDelete: 'CASCADE',
});

User.hasMany(Video, { 
    foreignKey: 'creatorId', 
    as: 'createdVideos',
    onDelete: 'CASCADE',
});

User.hasMany(Report, {
    foreignKey: 'userId',
    as: 'reports',
    onDelete: 'CASCADE',
});

User.hasMany(Chat, { 
    foreignKey: 'user1Id',
     as: 'user1Chats',
     onDelete: 'CASCADE',
});
User.hasMany(Chat, { 
    foreignKey: 'user2Id', 
    as: 'user2Chats',
    onDelete: 'CASCADE',
});

User.hasMany(Message, {
    foreignKey: 'senderId',
    as: 'messages',
    onDelete: 'CASCADE',
});

User.hasMany(Rate, {
    foreignKey: 'userId',
    as: 'ratings',
    onDelete: 'CASCADE',
});


User.hasOne(UserPopularity, {
    foreignKey: 'userId',
    as: 'popularity',
    onDelete: 'CASCADE',
});

User.hasMany(WatchedVideo, {
    foreignKey: 'userId',
    as: 'watchedVideos',
    onDelete: 'CASCADE',
});

User.hasMany(UserPersonalization, {
    foreignKey: 'userId',
    as: 'personalizations',
    onDelete: 'CASCADE',
});

User.hasMany(VideoLike, {
    foreignKey: 'userId',
    as: 'videoLikes',
    onDelete: 'CASCADE',
});

User.hasMany(Notification, {
    foreignKey: 'userId',
    as: 'notifications',
    onDelete: 'CASCADE',
});

User.hasOne(UserStatus, { 
    foreignKey: 'userId', 
    as: 'userStatus',
    onDelete: 'CASCADE',
});

User.hasOne(UserAuth, { 
    foreignKey: 'userId', 
    as: 'userAuth',
    onDelete: 'CASCADE',
});

User.hasMany(VideoView, { 
    foreignKey: 'userId', 
    as: 'videoViews',
    onDelete: 'CASCADE',
});

User.hasMany(Transaction, {
    as: 'sentTransactions', 
    foreignKey: 'senderId',
    onDelete: 'CASCADE',
});

User.hasMany(Transaction, { 
    as: 'receivedTransactions', 
    foreignKey: 'receiverId',
    onDelete: 'CASCADE',
});

//Transaction Relations
Transaction.belongsTo(User, { 
    as: 'sender', 
    foreignKey: 'senderId',
    onDelete: 'CASCADE',
});

Transaction.belongsTo(User, { 
    as: 'receiver', 
    foreignKey: 'receiverId',
    onDelete: 'CASCADE',
});


//UserPersonlization Relations
UserPersonalization.belongsTo(Video, {
    foreignKey: 'videoId',
    as: 'video',
    onDelete: 'CASCADE',
});

UserPersonalization.belongsTo(User, {
    foreignKey: 'userId',
    as: 'user',
    onDelete: 'CASCADE',
});


//UserPopularity Relations
UserPopularity.belongsTo(User, {
    foreignKey: 'userId',
    onDelete: 'CASCADE',
});


//UserStatus Relations
UserStatus.belongsTo(User, { 
    foreignKey: 'userId', 
    as: 'user',
    onDelete: 'CASCADE',
});


//UserAuth Relations
UserAuth.belongsTo(User, { 
    foreignKey: 'userId', 
    as: 'user',
    onDelete: 'CASCADE',
});


//Follow Relations
Follow.belongsTo(User, {
    foreignKey: 'followingId',
    as: 'followers',
    onDelete: 'CASCADE',
});


//Notification Relations
Notification.belongsTo(User, {
    foreignKey: 'userId',
    as: 'user',
    onDelete: 'CASCADE',
});


//Message Relations
Message.belongsTo(Message, { 
    as: 'replyToMessage', 
    foreignKey: 'replyTo' 
});

Message.belongsTo(Chat, {
    foreignKey: 'chatId',
    as: 'chat',
    onDelete: 'CASCADE',
});
  
Message.belongsTo(User, {
    foreignKey: 'senderId',
    as: 'sender',
    onDelete: 'CASCADE',
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
    onDelete: 'CASCADE',
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
    onDelete: 'CASCADE',
});

Comment.hasMany(CommentLike, {
    foreignKey: 'commentId',
    as: 'likes',
    onDelete: 'CASCADE',
});

CommentLike.belongsTo(Comment, {
    foreignKey: 'commentId',
    as: 'comment',
    onDelete: 'CASCADE',
});

//CommentLike Relations
CommentLike.belongsTo(User, { 
    foreignKey: 'userId', 
    onDelete: 'CASCADE' 
});

CommentLike.belongsTo(Comment, { 
    foreignKey: 'commentId', 
    onDelete: 'CASCADE' 
});


//Report Relations
Report.belongsTo(User, {
    foreignKey: 'userId',
    as: 'user',
    onDelete: 'CASCADE',
});


//SavedVideos Relations
SavedVideo.belongsTo(User, { 
    foreignKey: 'userId',
    onDelete: 'CASCADE',
});

SavedVideo.belongsTo(Video, { 
    foreignKey: 'videoId',
    onDelete: 'CASCADE',
});



//WatchedVideos Relations
WatchedVideo.belongsTo(Video, {
    foreignKey: 'videoId',
    as: 'video',
    onDelete: 'CASCADE',
});

WatchedVideo.belongsTo(User, {
    foreignKey: 'userId',
    as: 'user',
    onDelete: 'CASCADE',
});


//VideoLike Relations
VideoLike.belongsTo(Video, {
    foreignKey: 'videoId',
    as: 'video',
    onDelete: 'CASCADE',
});

VideoLike.belongsTo(User, {
    foreignKey: 'userId',
    as: 'user',
    onDelete: 'CASCADE',
});



//VideoMetadata Relations
VideoMetadata.belongsTo(Video, { 
    foreignKey: 'videoId', 
    as: 'video',
    onDelete: 'CASCADE',
});


//VideoCategory Relations
VideoCategory.belongsTo(Video, { 
    foreignKey: 'videoId', 
    as: 'video',
    onDelete: 'CASCADE',
});


//VideoRate Relations
Rate.belongsTo(Video, {
    foreignKey: 'videoId',
    as: 'video',
    onDelete: 'CASCADE',
});

Rate.belongsTo(User, {
    foreignKey: 'userId',
    as: 'user',
    onDelete: 'CASCADE',
});


//VideoView Relations
VideoView.belongsTo(User, { 
    foreignKey: 'userId', 
    as: 'user',
    onDelete: 'CASCADE',
});

VideoView.belongsTo(Video, { 
    foreignKey: 'videoId', 
    as: 'video',
    onDelete: 'CASCADE',
});



//Video Relations
Video.belongsToMany(User, {
    through: SavedVideo,
    foreignKey: 'videoId' ,
    as: 'savedByUsers',
    onDelete: 'CASCADE',
});

Video.belongsTo(User, { 
    foreignKey: 'creatorId', 
    as: 'creator',
    onDelete: 'CASCADE',
});

Video.hasMany(Rate, {
    foreignKey: 'videoId',
    as: 'ratings',
    onDelete: 'CASCADE',
});

Video.hasMany(UserPersonalization, {
    foreignKey: 'videoId',
    as: 'personalizations',
    onDelete: 'CASCADE',
});

Video.hasMany(WatchedVideo, {
    foreignKey: 'videoId',
    as: 'watchedInstances',
    onDelete: 'CASCADE',
});

Video.hasMany(VideoLike, {
    foreignKey: 'videoId',
    as: 'videoLikes',
    onDelete: 'CASCADE',
});

Video.hasOne(VideoMetadata, { 
    foreignKey: 'videoId', 
    as: 'metadata',
    onDelete: 'CASCADE',
});

Video.hasMany(VideoView, { 
    foreignKey: 'videoId', 
    as: 'viewInstances',
    onDelete: 'CASCADE',
});

Video.hasMany(VideoCategory, { 
    foreignKey: 'videoId', 
    as: 'categories',
    onDelete: 'CASCADE',
});

Video.hasMany(Comment, {
    foreignKey: 'videoId',
    as: 'comments',
    onDelete: 'CASCADE',
});

//related to notifications
Video.hasMany(Notification, {
    foreignKey: 'videoId',
    as: 'videoNotifications',
    onDelete: 'CASCADE',
})

User.hasMany(Notification, {
    foreignKey: 'userId',
    as: 'userNotifications',
    onDelete: 'CASCADE',
})

Comment.hasMany(Notification, {
    foreignKey: 'commentId',
    as: 'commentNotifications',
    onDelete: 'CASCADE',
})


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
    await CommentLike.sync({alter: true});

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

    await CommentLike.drop();
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

async function dropUserPersonalization() {
    await UserPersonalization.drop();
}

// dropVideo().catch(console.error);

// async function dropUser() {
//     await sequelize.query('DROP TABLE IF EXISTS "Users" CASCADE');
// }

//dropUserPersonalization().catch(console.error);

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
    CommentLike,

    Chat,
    Message,

    Notification,
    Transaction,
    SavedVideo,
    Report,

    sequelize
}

