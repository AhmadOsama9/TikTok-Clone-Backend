module.exports = (sequelize, DataTypes) => {
    return sequelize.define('WatchedVideo', {
        userId: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: {
                model: 'Users',
                key: 'id',
            }
        },
        videoId: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: {
                model: 'Videos',
                key: 'id',
            }
        },
    }, {
        indexes: [
            {
                unique: true,
                fields: ['userId', 'videoId']
            }
        ]
    });
};