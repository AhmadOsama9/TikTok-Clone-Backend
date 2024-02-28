module.exports = (sequelize, DataTypes) => {
    return sequelize.define('CommentLike', {
        userId: {
            type: DataTypes.INTEGER,
            references: {
                model: 'Users',
                key: 'id',
            }
        },
        commentId: {
            type: DataTypes.INTEGER,
            references: {
                model: 'Comments',
                key: 'id',
            }
        }
    }, {
        indexes: [
            {
                unique: true,
                fields: ['userId', 'commentId']
            }
        ]
    });
};