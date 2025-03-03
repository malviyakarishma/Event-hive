module.exports = (sequelize, DataTypes) => {
    const Notifications = sequelize.define("Notifications", {
        userId: {
            type: DataTypes.INTEGER,
            allowNull: false,
        },
        type: {
            type: DataTypes.ENUM('event', 'review', 'update'),
            allowNull: false,
        },
        message: {
            type: DataTypes.STRING,
            allowNull: true,
        },
        relatedId: {
            type: DataTypes.INTEGER,
            allowNull: true,
        },
        isRead: {
            type: DataTypes.BOOLEAN,
            defaultValue: false,
        },
        isAdminNotification: {
            type: DataTypes.BOOLEAN,
            defaultValue: false,
        },
        createdAt: {
            type: DataTypes.DATE,
            defaultValue: sequelize.fn('NOW'),
        },
    });

    // ✅ Association with Users
    Notifications.associate = (models) => {
        Notifications.belongsTo(models.Users, {  // Changed User to Users
            foreignKey: "userId",  // Reference to the Users model
            onDelete: "CASCADE",
        });
    };

    return Notifications;
};
