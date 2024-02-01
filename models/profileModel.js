module.exports = (sequelize, DataTypes) => {
    return sequelize.define('Profile', {
      userId: {
        type: DataTypes.INTEGER,
        references: {
          model: 'Users',
          key: 'id',
        }
      },
      photoUrl: DataTypes.STRING,
      bio: DataTypes.STRING,
    });
};