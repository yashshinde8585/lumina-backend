const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const User = sequelize.define('User', {
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true
    },
    name: {
        type: DataTypes.STRING,
        allowNull: false
    },
    email: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
        validate: {
            isEmail: true
        }
    },
    password: {
        type: DataTypes.STRING,
        allowNull: false
    },
    credits: {
        type: DataTypes.INTEGER,
        defaultValue: 5
    },
    role: {
        type: DataTypes.STRING,
        defaultValue: 'user'
    },
    // authResponse: {
    //     type: DataTypes.JSON,
    //     allowNull: true
    // },
    jobBoardData: {
        type: DataTypes.JSON,
        allowNull: true
    }
}, {
    timestamps: true
});

module.exports = User;
