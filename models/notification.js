module.exports = (sequelize, DataTypes) => {
    return sequelize.define('Notification', {
        userId: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: {
                model: 'Users',
                key: 'id',
            },
        },
        videoId: {
            type: DataTypes.INTEGER,
            allowNull: true,
            references: {
                model: 'Videos',
                key: 'id',
            },
        },
        commentId: {
            type: DataTypes.INTEGER,
            allowNull: true,
            references: {
                model: 'Comments',
                key: 'id',
            },
        },
        otherUserId: {
            type: DataTypes.INTEGER,
            allowNull: true,
            references: {
                model: 'Users',
                key: 'id',
            },
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
    }, {
        indexes: [
            {
                fields: ['userId', 'videoId', 'commentId', 'otherUserId', 'notificationType']
            }
        ]
    });
};

//1 like
//2 comment
//3 follower
//4 mention
//5 gift comment