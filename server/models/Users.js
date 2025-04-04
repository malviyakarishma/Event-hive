module.exports = (sequelize, DataTypes) => {
    const Users = sequelize.define("Users", {
        username: {
            type: DataTypes.STRING,
            allowNull: false,
            unique: true,
        },
        email: {
            type: DataTypes.STRING,
            allowNull: false,
            unique: true,
            validate: {
                isEmail: true,
            },
        },
        password: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        isAdmin: {
            type: DataTypes.BOOLEAN,
            allowNull: false,
            defaultValue: false,
        },
        resetPasswordToken: {
            type: DataTypes.STRING,
            allowNull: true,
        },
        resetPasswordExpires: {
            type: DataTypes.DATE,
            allowNull: true,
        }

    
    });

    Users.associate = (models) => {
        // Association with Events (if needed)
        Users.belongsTo(models.Events, {
            foreignKey: "eventId",
            onDelete: "CASCADE",
            allowNull: true,
        });

        // Association with Reviews
        Users.hasMany(models.Reviews, {
            foreignKey: "userId",
            onDelete: "CASCADE",
        });
    };

    return Users;
};