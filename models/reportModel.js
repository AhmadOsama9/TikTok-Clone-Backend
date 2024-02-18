module.exports = (sequelize, DataTypes) => {
    return sequelize.define('Report', {
      title: DataTypes.STRING,
      description: DataTypes.STRING,
      referenceId: DataTypes.INTEGER,
      referenceType: DataTypes.STRING,
      userId: {
        type: DataTypes.INTEGER,
        references: {
          model: 'Users',
          key: 'id',
        },
      },
    });
  };