module.exports = (sequelize, DataTypes) => {
  return sequelize.define('User', {
    name: DataTypes.STRING,
    username: {
      type: DataTypes.STRING,
      unique: true,
    },
    phone: {
      type: DataTypes.STRING,
      unique: true,
    },
    email: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
      validate: {
        isEmail: true,
      },
    },
    password: DataTypes.STRING,
    balance: {
      type: DataTypes.DOUBLE,
      allowNull: false,
      defaultValue: 0,
      validate: {
        isPositive(value) {
          if (value < 0)
            throw new Error("Balance must be a positive number");
        }
      }
    },
    referralCode: DataTypes.STRING,
    referrals: DataTypes.INTEGER,
    referred: DataTypes.BOOLEAN,
  });
};
