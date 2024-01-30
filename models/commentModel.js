module.exports = (sequelize, DataTypes) => {
    return sequelize.define('Comment', {
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
      commentDetails: DataTypes.STRING,
    });
};