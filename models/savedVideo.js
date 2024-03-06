module.exports = (sequelize, DataTypes) => {
    return sequelize.define('SavedVideo', {
        userId: {
            type: DataTypes.INTEGER,
            references: {
                model: 'Users',
                key: 'id',
            },
            allowNull: false,
        },
        videoId: {
            type: DataTypes.INTEGER,
            references: {
                model: 'Videos',
                key: 'id',
            },
            allowNull: false,
        },
    }, {
        indexes: [
            {
                fields: ['userId', 'videoId']
            }
        ]
    });
};