module.exports = (sequelize, DataTypes) => {
    return sequelize.define('Follow', {
      userId: {
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