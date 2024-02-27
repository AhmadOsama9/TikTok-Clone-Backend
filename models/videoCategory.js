module.exports = (sequelize, DataTypes) => {
    return sequelize.define('VideoCategory', {
      videoId: {
        type: DataTypes.INTEGER,
        references: {
          model: 'Videos',
          key: 'id',
        }
      },
      name: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: {
          isIn: {
            args: [
              [
                "الكل", "الرياضة", "التكنولوجيا", "السياسة", "الاقتصاد", "الفن", "الثقافة",
                "العلوم", "الدين", "التاريخ", "الطب", "البيئة", "الترفيه", "السفر", "الطبخ",
                "التعليم", "الأدب", "الأفلام", "الأخبار", "الأعمال", "التسويق", "التصميم",
                "التطوير", "التحفيز", "التنمية البشرية"
              ]
            ],
            msg: "Invalid category"
          }
        }
      }
    });
  };
  