module.exports = (sequelize, DataTypes) => {
    const Reviews = sequelize.define("Reviews", {
        id: {
            type: DataTypes.UUID,
            primaryKey: true,
            defaultValue: DataTypes.UUIDV4,
          },
        username: {
            type: DataTypes.STRING,
            allowNull: false,
            validate: { notEmpty: true },
        },
        review_text: {
            type: DataTypes.TEXT,
            allowNull: false,
            validate: { notEmpty: true },
        },
        rating: {
            type: DataTypes.INTEGER,
            allowNull: false,
            validate: { min: 1, max: 5 },
        },
        sentiment: {  
            type: DataTypes.STRING,
            allowNull: true, 
        },
        admin_response: {
            type: DataTypes.TEXT,
            allowNull: true, 
        }
    }, { timestamps: true });

    Reviews.associate = (models) => {
        Reviews.belongsTo(models.Events, {
            foreignKey: "EventId",  // ✅ Match SQL script
            onDelete: "CASCADE",
        });
        // Reviews.belongsTo(models.Users, {
        //     foreignKey: "UserId",  // ✅ Match SQL script
        //     onDelete: "CASCADE",
        // });
    };

    return Reviews;
};
