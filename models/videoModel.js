module.exports = (sequelize, DataTypes) => {
    return sequelize.define('Video', {
      userId: {
        type: DataTypes.INTEGER,
        references: {
          model: 'users',
          key: 'id',
        }
      },
      url: DataTypes.STRING,
      viewsCount: DataTypes.INTEGER,
      category: DataTypes.STRING,
      shareCount: DataTypes.INTEGER,
      smalldescription: DataTypes.STRING,
      rating: DataTypes.DOUBLE,
    });
};