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
      admin: DataTypes.BOOLEAN,
      isBanned: DataTypes.BOOLEAN,
      otp: DataTypes.STRING,
      otpExpiry: DataTypes.DATE,
      verificationCode: DataTypes.STRING,
      verificationCodeExpiry: DataTypes.DATE,
      verifiedEmail: DataTypes.BOOLEAN,
      facebookId: DataTypes.STRING,
      facebookLoggedIn: DataTypes.BOOLEAN,
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
      isVerified: DataTypes.BOOLEAN,
      isAdmin: DataTypes.BOOLEAN,
    });
};
