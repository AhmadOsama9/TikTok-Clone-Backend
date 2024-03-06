module.exports = (sequelize, DataTypes) => {
    return sequelize.define('UserPopularity', {
      userId: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        allowNull: false,
        references: {
          model: 'Users',
          key: 'id'
        }
      },
      popularityScore: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0
      }
    }, {
      indexes: [
        {
          fields: ['userId', 'popularityScore']
        }
      ]
    });
  };