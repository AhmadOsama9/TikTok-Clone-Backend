module.exports = (sequelize, DataTypes) => {
    return sequelize.define('UserPersonalization', {
        userId: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: {
                model: 'Users',
                key: 'id',
            },
            primaryKey: true,
        },
        videoId: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: {
                model: 'Videos',
                key: 'id',
            },
            primaryKey: true,
        },
        views: {
            type: DataTypes.INTEGER,
            allowNull: false,
            defaultValue: 0,
        },
        liked: {
            type: DataTypes.BOOLEAN,
            allowNull: false,
            defaultValue: false,
        },
        comments: {
            type: DataTypes.INTEGER,
            allowNull: false,
            defaultValue: 0,
        },
        shares: {
            type: DataTypes.INTEGER,
            allowNull: false,
            defaultValue: 0,
        },
    });
};