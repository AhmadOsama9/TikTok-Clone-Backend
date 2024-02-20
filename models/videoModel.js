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
      viewsCount: DataTypes.INTEGER,
      category: DataTypes.STRING,
      shareCount: DataTypes.INTEGER,
      likes: DataTypes.INTEGER,
      description: {
        type: DataTypes.STRING,
        validate: {
            len: {
                args: [20],
                msg: "Description must be at least 20 characters long"
            }
        }
    },
      totalRating: {
        type: DataTypes.DOUBLE,
        defaultValue: 0,
      },
      totalRatings: {
          type: DataTypes.INTEGER,
          defaultValue: 0,
      },
      averageRating: {
          type: DataTypes.DOUBLE,
          defaultValue: 0,
      },
      videoPopularityScore: {
        type: DataTypes.DOUBLE,
        defaultValue: 0,
      },
      isTrending: DataTypes.BOOLEAN,
      videoSize: DataTypes.INTEGER,
      videoName: DataTypes.STRING,
    });
};
