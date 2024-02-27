module.exports = (sequelize, DataTypes) => {
    return sequelize.define('Report', {
      title: DataTypes.STRING,
      description: DataTypes.STRING,
      referenceId: DataTypes.INTEGER,
      referenceType: { 
        type: DataTypes.INTEGER,
        validate: {
          isIn: {
            args: [[1, 2, 3, 4]],
            msg: "Reference type must be 1, 2, 3 or 4"
          }
        }
      },
      userId: {
        type: DataTypes.INTEGER,
        references: {
          model: 'Users',
          key: 'id',
        },
      },
      isViewed: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
      },
    });
};

//1 for users
//2 for comments
//3 for videos
//4 for messages