const {
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
    
} = require("../config/db");


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