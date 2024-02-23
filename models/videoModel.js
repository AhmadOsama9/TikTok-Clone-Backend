module.exports = (sequelize, DataTypes) => {
    return sequelize.define('Video', {
      creatorId: {
        type: DataTypes.INTEGER,
        references: {
          model: 'Users',
          key: 'id',
        }
      },
      fileName: DataTypes.STRING,
      thumbnailFileName: DataTypes.STRING,
      viewsCount: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
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
      shareCount: {
        type: DataTypes.INTEGER,
        defaultValue: 0
      },
      likes: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
      },
      description: {
        type: DataTypes.STRING,
        validate: {
            len: {
                args: [5, 30],
                msg: "Description must be between 5 and 30 characters long"
            }
        }
      },
      totalRating: {
        type: DataTypes.DOUBLE,
        defaultValue: 0,
      },
      totalRatings: {
          type: DataTypes.INTEGER,
          defaultValue: 0,
      },
      averageRating: {
          type: DataTypes.DOUBLE,
          defaultValue: 0,
      },
      popularityScore: {
        type: DataTypes.DOUBLE,
        defaultValue: 0,
      },
      isTrending: DataTypes.BOOLEAN,
    });
};
