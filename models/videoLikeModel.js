module.exports = (sequelize, DataTypes) => {
    return sequelize.define('VideoLike', {
      userId: {
        type: DataTypes.INTEGER,
        references: {
          model: 'users',
          key: 'id',
        }
      },
      videoId: {
        type: DataTypes.INTEGER,
        references: {
          model: 'videos',
          key: 'id',
        }
      },
    });
};