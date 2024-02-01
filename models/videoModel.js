module.exports = (sequelize, DataTypes) => {
    return sequelize.define('Video', {
      userId: {
        type: DataTypes.INTEGER,
        references: {
          model: 'Users',
          key: 'id',
        }
      },
      url: DataTypes.STRING,
      thumbnailUrl: DataTypes.STRING,
      viewsCount: DataTypes.INTEGER,
      category: DataTypes.STRING,
      shareCount: DataTypes.INTEGER,
      smalldescription: DataTypes.STRING,
      rating: DataTypes.DOUBLE,
      isTrending: DataTypes.BOOLEAN,
    });
};