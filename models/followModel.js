module.exports = (sequelize, DataTypes) => {
  return sequelize.define('Follow', {
    followerId: {
      type: DataTypes.INTEGER,
      references: {
        model: 'Users',
        key: 'id',
      }
    },
    followingId: {
      type: DataTypes.INTEGER,
      references: {
        model: 'Users',
        key: 'id',
      }
    },
  });
};