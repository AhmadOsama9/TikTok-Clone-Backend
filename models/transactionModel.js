module.exports = (sequelize, DataTypes) => {
    return sequelize.define('Transaction', {
      amount: {
        type: DataTypes.DOUBLE,
        allowNull: false,
        validate: {
          isPositive(value) {
            if (value < 0)
              throw new Error("Transaction amount must be a positive number");
          }
        }
      },
      senderId: {
        type: DataTypes.INTEGER,
        references: {
          model: 'Users',
          key: 'id'
        },
        allowNull: false
      },
      receiverId: {
        type: DataTypes.INTEGER,
        references: {
          model: 'Users',
          key: 'id'
        },
        allowNull: false
      },
      senderUsername: {
        type: DataTypes.STRING,
        allowNull: false
      },
      receiverUsername: {
        type: DataTypes.STRING,
        allowNull: false
      }
    });
  };