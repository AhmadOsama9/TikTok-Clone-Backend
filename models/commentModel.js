module.exports = (sequelize, DataTypes) => {
    return sequelize.define('Comment', {
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
      content: DataTypes.STRING,
      parentId: {
        type: DataTypes.INTEGER,
        references: {
          model: 'Comments',
          key: 'id',
        }
      },
      giftTYPE: {
        type: DataTypes.INTEGER,
        validate: {
          canHaveGift(value) {
            if (this.parentId && value) {
              throw new Error('Replies cannot have gifts');
            }
          },
          isPositive(value) {
            if (value < 1 || value > 5)
              throw new Error("Gift type must be a positive number between 1 and 5");
          }
        }
      },
    });
};