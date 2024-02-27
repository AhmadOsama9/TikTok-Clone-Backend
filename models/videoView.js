module.exports = (sequelize, DataTypes) => {
  return sequelize.define('VideoView', {
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
      viewStrength: {
          type: DataTypes.INTEGER,
          allowNull: false,
          validate: {
              min: 1,
              max: 3
          }
      }
  });
};

//1 weak view
//2 medium view
//3 strong view