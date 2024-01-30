module.exports = (sequelize, DataTypes) => {
    return sequelize.define('Profile', {
      userId: {
        type: DataTypes.INTEGER,
        references: {
          model: 'users',
          key: 'id',
        }
      },
      imageUrl: DataTypes.STRING,
      bio: DataTypes.STRING,
    });
};