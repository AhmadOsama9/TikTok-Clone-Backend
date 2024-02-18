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
      description: DataTypes.STRING,
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
      isTrending: DataTypes.BOOLEAN,
      videoSize: DataTypes.INTEGER,
      videoName: DataTypes.STRING,
    });
};
