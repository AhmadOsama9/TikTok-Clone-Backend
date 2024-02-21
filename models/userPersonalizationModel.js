module.exports = (sequelize, DataTypes) => {
    return sequelize.define('UserPersonalization', {
        userId: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: {
                model: 'Users',
                key: 'id',
            },
            primaryKey: true,
        },
        category: {
            type: DataTypes.STRING,
            allowNull: false,
            validate: {
                isIn: {
                    args: [['category1', 'category2', 'category3']],  // Replace with your actual categories
                    msg: "Invalid category"
                }
            }
        },
        topVideoIds: {
            type: DataTypes.ARRAY(DataTypes.INTEGER),
            allowNull: false,
            defaultValue: [],
        },
        peakInterest: {
            type: DataTypes.INTEGER,
            allowNull: false,
            defaultValue: 0,
        },
        currentInterest: {
            type: DataTypes.INTEGER,
            allowNull: false,
            defaultValue: 0,
        },
        totalInteractions: {
            type: DataTypes.INTEGER,
            allowNull: false,
            defaultValue: 0,
        },
        lastUpdated: {
            type: DataTypes.DATE,
            allowNull: false,
            defaultValue: DataTypes.NOW,
        },
    });
};