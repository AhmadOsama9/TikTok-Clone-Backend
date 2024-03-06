module.exports = (sequelize, DataTypes) => {
    return sequelize.define('Chat', {
      user1Id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: 'Users',
          key: 'id',
        },
      },
      user2Id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: 'Users',
          key: 'id',
        },
      },
    },
    {
      indexes: [
        {
          unique: true,
          fields: ['user1Id', 'user2Id'],
        },
      ],
    });
};