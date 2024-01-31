module.exports = (sequelize, DataTypes) => {
    return sequelize.define('Profile', {
      userId: {
        type: DataTypes.INTEGER,
        references: {
          model: 'Users',
          key: 'id',
        }
      },
      imageUrl: DataTypes.STRING,
      bio: DataTypes.STRING,
    });
};