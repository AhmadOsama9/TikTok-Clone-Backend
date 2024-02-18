module.exports = (sequelize, DataTypes) => {
    return sequelize.define('Message', {
      chatId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: 'Chats',
          key: 'id',
        }, 
      },
      senderId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: 'Users',
            key: 'id',
          },
      },
      content: {
        type: DataTypes.STRING,
        allowNull: false,
      },
    });
};