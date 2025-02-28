module.exports = (sequelize, DataTypes) => {
    const Users = sequelize.define("Users", {
        username: {
            type: DataTypes.STRING,
            allowNull: false,
            unique: true,
        },
        password: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        isAdmin: {
            type: DataTypes.BOOLEAN,
            allowNull: false,
            defaultValue: false,  // Default to false for regular users
        },
    });

    Users.associate = (models) => {
        // Association with Events (if needed)
        Users.belongsTo(models.Events, {
            foreignKey: "eventId",  // Ensure this matches your actual column name in Users
            onDelete: "CASCADE",
            allowNull: true,  // ✅ Ensure users can be created without an event
        });

        // Association with Reviews
        Users.hasMany(models.Reviews, {
            foreignKey: "userId",  // Correct foreign key in the Reviews model
            onDelete: "CASCADE",
        });
    };

    return Users;
};
