module.exports = (sequelize, DataTypes) => {
    return sequelize.define('Comment', {
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
      commentDetails: DataTypes.STRING,
    });
};