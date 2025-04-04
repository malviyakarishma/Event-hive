module.exports = (sequelize, DataTypes) => {
  const Notifications = sequelize.define("Notifications", {
    id: {
      type: DataTypes.UUID,
      primaryKey: true,
      defaultValue: DataTypes.UUIDV4,
    },
    message: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    type: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    relatedId: {
      type: DataTypes.UUID,
      allowNull: true,
    },
    isAdminNotification: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
    isRead: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
  });

  Notifications.associate = (models) => {
    Notifications.belongsTo(models.Users, {
      foreignKey: "userId",
      as: "user",
    });
  };

  return Notifications;
};