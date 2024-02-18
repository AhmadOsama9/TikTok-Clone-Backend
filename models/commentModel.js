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
          model: 'Comments', // self-reference
          key: 'id',
        }
      },
      giftType: {
        type: DataTypes.STRING,
        validate: {
          canHaveGift(value) {
            if (this.parentId && value) {
              throw new Error('Replies cannot have gifts');
            }
          }
        }
      },
      giftPrice: {
        type: DataTypes.INTEGER,
        validate: {
          canHaveGift(value) {
            if (this.parentId && value) {
              throw new Error('Replies cannot have gifts');
            }
          },
          isPositive(value) {
            if (value < 0)
              throw new Error("Gift price must be a positive number");
          }
        }
      },
    });
};