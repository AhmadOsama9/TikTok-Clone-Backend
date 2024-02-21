module.exports = (sequelize, DataTypes) => {
    return sequelize.define('RecentInteraction', {
        userId: {
            type: DataTypes.INTEGER,
            allowNull: false,
        },
        videoId: {
            type: DataTypes.INTEGER,
            allowNull: false,
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
    });
};