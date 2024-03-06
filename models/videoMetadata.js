module.exports = (sequelize, DataTypes) => {
    return sequelize.define('VideoMetadata', {
      videoId: {
        type: DataTypes.INTEGER,
        references: {
          model: 'Videos',
          key: 'id',
        }
      },
      viewCount: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
      },
      likeCount: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
      },
      shareCount: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
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
      popularityScore: {
        type: DataTypes.DOUBLE,
        defaultValue: 0,
      },
      highestPopularityScore: {
        type: DataTypes.DOUBLE,
        defaultValue: 0,
      },
    }, {
      indexes: [
        {
          fields: ['videoId', 'viewCount', 'likeCount', 'shareCount', 'totalRating', 'totalRatings', 'averageRating', 'popularityScore', 'highestPopularityScore']
        }
      ]
    });
};