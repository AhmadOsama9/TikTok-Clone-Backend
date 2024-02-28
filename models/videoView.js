module.exports = (sequelize, DataTypes) => {
    return sequelize.define('VideoView', {
        userId: {
            type: DataTypes.INTEGER,
            references: {
                model: 'Users',
                key: 'id',
            }
        },
        videoId: {
            type: DataTypes.INTEGER,
            references: {
                model: 'Videos',
                key: 'id',
            }
        },
        viewStrength: {
            type: DataTypes.INTEGER,
            allowNull: false,
            validate: {
                min: 1,
                max: 4
            }
        }
    }, {
        indexes: [
            {
                unique: true,
                fields: ['userId', 'videoId']
            }
        ]
    });
};

//1 weak
//2 medium
//3 strong
//4 ultra as if he watched it again or something

///generally the app shouldn't be supporting the 
//view thing nor the multiple category thing
//but I believe the in the future we will need them