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
                    args: [[
                        "الكل",
                        "الرياضة",
                        "التكنولوجيا",
                        "السياسة",
                        "الاقتصاد",
                        "الفن",
                        "الثقافة",
                        "العلوم",
                        "الدين",
                        "التاريخ",
                        "الطب",
                        "البيئة",
                        "الترفيه",
                        "السفر",
                        "الطبخ",
                        "التعليم",
                        "الأدب",
                        "الأفلام",
                        "الأخبار",
                        "الأعمال",
                        "التسويق",
                        "التصميم",
                        "التطوير",
                        "التحفيز",
                        "التنمية البشرية",
                    ]],
                    msg: "Invalid category"
                }
            }
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
    });
};