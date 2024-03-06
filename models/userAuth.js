module.exports = (sequelize, DataTypes) => {
    return sequelize.define('UserAuth', {
      userId: {
        type: DataTypes.INTEGER,
        references: {
          model: 'Users',
          key: 'id',
        }
      },
      authType: DataTypes.INTEGER,
      authVerified: DataTypes.BOOLEAN,
      authCode: DataTypes.STRING,
      authCodeExpiry: DataTypes.DATE,
    }, {
      indexes: [
        {
          fields: ['userId']
        }
      ]
    
    });
  };

  //1 normal email
  //2 facebook
  