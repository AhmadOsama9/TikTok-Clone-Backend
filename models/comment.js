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
      giftType: {
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
      likeCount: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
      },
      isUserVerified: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
      },
    });
};

//1 5$
//2 20$
//3 50$
//4 100$
//5 1000$
