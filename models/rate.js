module.exports = (sequelize, DataTypes) => {
    return sequelize.define('Rating', {
        userId: {
            type: DataTypes.INTEGER,
            references: {
                model: 'Users',
                key: 'id',
            }
        },
        videoId: {
            type: DataTypes.INTEGER,
            references: {
                model: 'Videos',
                key: 'id',
            }
        },
        rate: DataTypes.DOUBLE,
    });
};