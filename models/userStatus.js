module.exports = (sequelize, DataTypes) => {
  return sequelize.define('UserStatus', {
    userId: {
      type: DataTypes.INTEGER,
      references: {
        model: 'Users',
        key: 'id',
      }
    },
    isBanned: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    isAdmin: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    isVerified: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
  }, {
    indexes: [
      {
        fields: ['userId', 'isBanned', 'isAdmin', 'isVerified']
      }
    ]
  });
};