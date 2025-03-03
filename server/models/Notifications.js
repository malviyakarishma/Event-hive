module.exports = (sequelize, DataTypes) => {
    const Notifications = sequelize.define("Notifications", {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      userId: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      message: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      type: {
        type: DataTypes.STRING, // 'event', 'review', 'review_response'
        allowNull: false,
      },
      eventId: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      reviewId: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      read: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
      },
      createdAt: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW,
      },
    })
  
    Notifications.associate = (models) => {
      Notifications.belongsTo(models.Users, {
        foreignKey: "userId",
      })
  
      Notifications.belongsTo(models.Events, {
        foreignKey: "eventId",
      })
    }
  
    return Notifications
  }
    