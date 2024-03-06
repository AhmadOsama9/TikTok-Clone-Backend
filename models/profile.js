module.exports = (sequelize, DataTypes) => {
    return sequelize.define('Profile', {
      userId: {
        type: DataTypes.INTEGER,
        references: {
          model: 'Users',
          key: 'id',
        }
      },
      imageFileName: DataTypes.STRING,
      bio: DataTypes.STRING,
    }, {
      indexes: [
        {
          fields: ['userId', 'bio', 'imageFileName']
        }
      ]
    });
};
