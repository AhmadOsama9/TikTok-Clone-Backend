module.exports = (sequelize, DataTypes) => {
    return sequelize.define('User', {
      name: {
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
      jwt: DataTypes.STRING,
      admin: DataTypes.BOOLEAN,
      isBanned: DataTypes.BOOLEAN,
      otp: DataTypes.STRING,
      otp_expiry: DataTypes.DATE,
      verifiedEmail: DataTypes.BOOLEAN,
      verifiedPhone: DataTypes.BOOLEAN,
      googleLoggedin: DataTypes.BOOLEAN,
      balance: DataTypes.DOUBLE,
      inviteCode: DataTypes.STRING,
      invitedPeopleCount: DataTypes.INTEGER,
      isPopular: DataTypes.BOOLEAN,
    });
};