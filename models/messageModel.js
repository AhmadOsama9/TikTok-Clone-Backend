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
    reaction: {
      type: DataTypes.INTEGER,
      allowNull: true,
      validate: {
        min: 1,
        max: 4
      }
    },
    state: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: 'sent',
      validate: {
        isIn: [['sent', 'seen']],
      },
    },
    replyTo: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'Messages',
        key: 'id',
      },
    },
  });
};