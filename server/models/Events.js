module.exports = (sequelize, DataTypes) => {
    const Events = sequelize.define("Events", {
        title: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        location: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        description: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        date: {
            type: DataTypes.DATEONLY,
            allowNull: false,
        },
        time: {  // Time column (for event's start time)
            type: DataTypes.TIME,
            allowNull: false,  // Make time required for each event
        },
        username: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        category: {  // Category column (for event's category)
            type: DataTypes.STRING,
            allowNull: false,  // Make category required
        },
        image: {  // Image column (to store the path/URL to the event's image)
            type: DataTypes.STRING,
            allowNull: true,  // Image is optional for each event
        }
    });

    // Association with Reviews (optional, if you have Reviews model)
    Events.associate = (models) => {
        Events.hasMany(models.Reviews, {
            foreignKey: "eventId",  // Match Reviews model's eventId field
            onDelete: "CASCADE",
        });

        Events.hasOne(models.EventAnalytics, {
            foreignKey: 'event_id',
            onDelete: 'CASCADE'
          });
    };


    return Events;
};
