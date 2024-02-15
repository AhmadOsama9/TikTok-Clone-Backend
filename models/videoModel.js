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
      rating: DataTypes.DOUBLE,
      isTrending: DataTypes.BOOLEAN,
      videoSize: DataTypes.INTEGER,
      videoName: DataTypes.STRING,
    });
};
