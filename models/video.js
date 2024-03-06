module.exports = (sequelize, DataTypes) => {
  return sequelize.define('Video', {
    creatorId: {
      type: DataTypes.INTEGER,
      references: {
        model: 'Users',
        key: 'id',
      }
    },
    fileName: DataTypes.STRING,
    thumbnailFileName: DataTypes.STRING,
    description: {
      type: DataTypes.STRING,
      validate: {
        len: {
          args: [5, 30],
          msg: "Description must be between 5 and 30 characters long"
        }
      }
    },
  }, {
    indexes: [
      {
        fields: ['creatorId', 'fileName', 'thumbnailFileName', 'description']
      }
    ]
  });
};
