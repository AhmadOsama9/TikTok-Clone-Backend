module.exports = (sequelize, DataTypes) => {
    return sequelize.define('Notification', {
        userId: {
            type: DataTypes.INTEGER,
            allowNull: false,
        },
        videoId: {
            type: DataTypes.INTEGER,
            allowNull: true,
        },
        commentId: {
            type: DataTypes.INTEGER,
            allowNull: true,
        },
        otherUserId: {
            type: DataTypes.INTEGER,
            allowNull: true,
        },
        notificationType: {
            type: DataTypes.INTEGER,
            allowNull: false,
            validate: {
                min: 1,
                max: 5
            }
        },
        count: {
            type: DataTypes.INTEGER,
            allowNull: false,
        },
        title: DataTypes.STRING,
        body: DataTypes.STRING,
        isRead: DataTypes.BOOLEAN,
    });
};

//1 Like
//2 Comment
//3 Follow
//4 Mention
//5 Gift Comment